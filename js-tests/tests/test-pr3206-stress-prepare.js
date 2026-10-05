import fs from 'node:fs';
import { blake2AsU8a } from '@polkadot/util-crypto';
import assert from 'node:assert/strict';
import { Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { connectApi } from '../lib/api.js';
import { createTempLogger } from '../lib/file-log.js';
const logger=createTempLogger('pr3206-stress-prepare-'+(process.env.STRESS_PHASE??'baseline')+'.log');
logger.captureConsole();
let api, alice;
function errorName(e) { return e.isModule ? api.registry.findMetaError(e.asModule).name : e.toString(); }
async function submit(tx, signer=alice, expected) {
 console.log('CALL',tx.method.section,tx.method.method,expected??'success');
 const outcome=await new Promise((resolve,reject)=>{
 let unsub,done=false;
 const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);unsub?.();err?reject(err):resolve(value);};
 const timer=setTimeout(()=>finish(Error('transaction inclusion timeout')),120000);
 tx.signAndSend(signer,{nonce:-1},({status,events,dispatchError})=>{
 if(status.isInvalid||status.isDropped||status.isUsurped) return finish(Error(status.toString()));
 
 if(!status.isInBlock && !status.isFinalized)return;
 let error=dispatchError?errorName(dispatchError):null;
 for(const {event} of events) {
 if(event.section==='sudo' || event.method==='ExtrinsicFailed') console.log('EVENT',event.section,event.method,event.data.toString());
 if(event.section==='sudo' && ['Sudid','SudoAsDone'].includes(event.method) && event.data[0].isErr) error=errorName(event.data[0].asErr);
 }
 finish(null,{error,hash:(status.isInBlock?status.asInBlock:status.asFinalized).toHex()});
 }).then(u=>{unsub=u;if(done)u();}).catch(e=>finish(e));
 });
 if(expected) assert.equal(outcome.error,expected); else assert.equal(outcome.error,null);
 return outcome;
}
async function root(call,expected) {return submit(api.tx.sudo.sudo(call),alice,expected);}
const storageTypes=new Map();
async function store(items) {
 const pairs=[];
 for(const [name,args,value] of items) {
 const q=api.query.subtensorModule[name];assert.ok(q,`missing storage ${name}`);
 if(!storageTypes.has(name)){const meta=q.creator.meta.type;storageTypes.set(name,api.registry.createLookupType(meta.isMap?meta.asMap.value:meta.asPlain));}
 pairs.push([q.key(...args),u8aToHex(api.createType(storageTypes.get(name),value).toU8a())]);
 }
 return root(api.tx.system.setStorage(pairs));
}
async function epoch(netuid) {
 const before=(await api.query.subtensorModule.lastMechansimStepBlock(netuid)).toNumber();
 await submit(api.tx.subtensorModule.triggerEpoch(netuid));
 const deadline=Date.now()+120000;
 while(Date.now()<deadline) {
 const last=(await api.query.subtensorModule.lastMechansimStepBlock(netuid)).toNumber();
 if(last>before){const values=(await api.query.subtensorModule.emission(netuid)).map(x=>BigInt(x.toString()));console.log('EPOCH',last,JSON.stringify(values.map(String)));assert.ok(values.some(x=>x>0n),'epoch must produce nonzero emissions');return values;}
 await new Promise(r=>setTimeout(r,1000));
 }
 throw Error('forced epoch did not complete');
}
const originalNets=Array.from({length:128},(_,i)=>i+1);
const phase=process.env.STRESS_PHASE??'baseline';
async function chunkStore(items){for(let i=0;i<items.length;i+=8000)await store(items.slice(i,i+8000));}
async function fill(n,target,keyring){
 const q=api.query.subtensorModule,current=(await q.subnetworkN(n)).toNumber();
 assert.ok(current<=target,`subnet ${n} must be pruned before filling`);
 const items=[];
 for(let uid=current;uid<target;uid++){
 const hot=keyring.encodeAddress(blake2AsU8a(`PR3206-stress-hot-${n}-${uid}`));const nom=keyring.encodeAddress(blake2AsU8a(`PR3206-stress-nominator-${n}-${uid}`));
 // A coherent shared pool forces general reward accounting rather than the sole-owner shortcut.
 items.push(['keys',[n,uid],hot],['uids',[n,hot],uid],['blockAtRegistration',[n,uid],0],['isNetworkMember',[hot,n],true],['owner',[hot],hot],['ownedHotkeys',[hot],[hot]],['stakingHotkeys',[hot],[hot]],['stakingHotkeys',[nom],[hot]],['totalHotkeyAlpha',[hot,n],1000000000],['totalHotkeySharesV2',[hot,n],{mantissa:2,exponent:0}],['alphaV2',[hot,hot,n],{mantissa:1,exponent:0}],['alphaV2',[hot,nom,n],{mantissa:1,exponent:0}]);
 }
 await chunkStore(items);
 const currentBlock=(await api.rpc.chain.getHeader()).number.toNumber();
 const vectorItems=[];
 for(const name of ['active','emission','consensus','dividends','validatorTrust','validatorPermit','stakeWeight','incentive','lastUpdate']){
 const old=(await q[name](n)).toJSON();const fallback=['active','validatorPermit'].includes(name)?false:0;
 const extended=Array.from({length:target},(_,i)=>name==='lastUpdate'?currentBlock:(old[i]??fallback));vectorItems.push([name,[n],extended]);
 }
 const delta=BigInt(target-current)*1000000000n;
 vectorItems.push(['subnetworkN',[n],target],['totalAlphaStaked',[n],(BigInt((await q.totalAlphaStaked(n)).toString())+delta).toString()],['subnetAlphaOut',[n],(BigInt((await q.subnetAlphaOut(n)).toString())+delta).toString()]);
 await store(vectorItems);console.log('FILLED',n,current,'->',target,'shared pools',target-current);
}
async function weights(n){
 const q=api.query.subtensorModule,N=(await q.subnetworkN(n)).toNumber();let permits=await q.validatorPermit(n);
 let validators=[];for(let uid=0;uid<N;uid++)if(permits[uid]?.isTrue)validators.push(uid);
 assert.ok(validators.length>0,`no validator permits on subnet ${n}`);
 const version=(await q.weightsVersionKey(n)).toString();
 let packet=32;
 for(let offset=0;offset<validators.length;){
 const calls=[];
 for(const uid of validators.slice(offset,offset+packet)){
 const hot=(await q.keys(n,uid)).toString();const dest=Array.from({length:N},(_,i)=>i).filter(i=>i!==uid);
 calls.push(api.tx.sudo.sudoAs(hot,api.tx.subtensorModule.setWeights(n,dest,dest.map(()=>1),version)));
 }
 const batch=api.tx.utility.batchAll(calls);
 const info=await batch.paymentInfo(alice);const max=api.consts.system.blockWeights.perClass.normal.maxExtrinsic.unwrap().refTime.toBigInt();
 if(info.weight.refTime.toBigInt()>max && packet>1){packet=Math.max(1,Math.floor(packet/2));console.log('REDUCE weights batch',n,packet,'declared',info.weight.refTime.toString(),'limit',max.toString());continue;}
 await submit(batch);offset+=calls.length;
 }
 const now=(await api.rpc.chain.getHeader()).number.toNumber();await store([['lastUpdate',[n],Array(N).fill(now)]]);
 const sum=BigInt((await q.subnetAlphaOutEmission(n)).toString());
 console.log('WEIGHTS',n,'population',N,'validators',validators.length,'row destinations',N-1,'alpha/block',sum.toString());
 const first=validators[0];assert.equal((await q.weights(n,first)).length,N-1);
}
async function main(){
 await logger.start();await cryptoWaitReady();api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const keyring=new Keyring({type:'sr25519'});alice=keyring.addFromUri('//Alice');const q=api.query.subtensorModule,a=api.tx.adminUtils;
 assert.equal((await api.query.sudo.key()).unwrap().toString(),alice.address);assert.equal(api.runtimeVersion.specVersion.toNumber(),474);
 console.log('PHASE',phase,'128 original non-root subnets; saved clone fixture, not a registration throughput benchmark');
 if(phase==='baseline'){
 // Freeze epochs during fixture construction and exclude feature-only subnets.
 const freeze=[];for(const n of originalNets)freeze.push(['tempo',[n],65535],['pendingEpochAt',[n],0],['blocksSinceLastStep',[n],0],['immunityPeriod',[n],0],['commitRevealWeightsEnabled',[n],false],['weightsSetRateLimit',[n],0],['minAllowedWeights',[n],0],['maxWeightsLimit',[n],65535],['firstEmissionBlockNumber',[n],1],['subtokenEnabled',[n],true],['networkRegistrationAllowed',[n],true],['subnetEmissionEnabled',[n],true]);
 for(const [key,v] of await q.networksAdded.entries()){const n=key.args[0].toNumber();if(v.isTrue&&n>128)freeze.push(['tempo',[n],0],['subtokenEnabled',[n],false],['subnetEmissionEnabled',[n],false],['pendingEpochAt',[n],0]);}
 await chunkStore(freeze);
 // Clear inherited commit queues whose block heights belong to the mainnet snapshot.
 for(const name of ['timelockedWeightCommits','weightCommits']){
 const keys=await q[name].keys();for(let i=0;i<keys.length;i+=2000)await root(api.tx.system.killStorage(keys.slice(i,i+2000).map(k=>k.toHex())));console.log('CLEARED',name,keys.length);
 }
 for(const n of originalNets){
 if((await q.mechanismCountCurrent(n)).toNumber()!==1)await root(a.sudoSetMechanismCount(n,1));
 if((await q.subnetworkN(n)).toNumber()>256)await root(a.sudoTrimToMaxAllowedUids(n,256));
 await root(a.sudoSetEpochConsensus(n,'Yuma'));await root(a.sudoSetMaxAllowedUids(n,256));await fill(n,256,keyring);
 // Preserve existing validator population. Empty historical subnet permits get a real
 // epoch election once the completed fixture is scheduled below.
 const permits=(await q.validatorPermit(n)).toJSON();if(!permits.some(Boolean)){permits[0]=true;await store([['validatorPermit',[n],permits]]);}
 await weights(n);
 }
 }else if(phase==='stress'){
 for(const n of originalNets.slice(0,64)){
 await root(a.sudoSetEpochConsensus(n,'Null'));await root(a.sudoSetMaxAllowedUids(n,2000));await fill(n,2000,keyring);
 // Re-enter after adding positive-staked miners so the sole winner is elected from
 // the finished population; all original weights remain as historical dense rows.
 await root(a.sudoSetEpochConsensus(n,'Yuma'),'TooManyUIDsPerMechanism');
 // Runtime epochs recompute permits. A mode-preserving Null call does not. The
 // existing original winner remains above 1 alpha; verify sole permit and submit it.
 assert.equal((await q.validatorPermit(n)).filter(x=>x.isTrue).length,1);await weights(n);
 }
 }else throw Error('STRESS_PHASE must be baseline or stress');
 const final=[];const now=(await api.rpc.chain.getHeader()).number.toNumber();
 for(const n of originalNets)final.push(['tempo',[n],360],['lastEpochBlock',[n],now],['lastMechansimStepBlock',[n],now],['blocksSinceLastStep',[n],0],['pendingEpochAt',[n],now+2],['lastUpdate',[n],Array((await q.subnetworkN(n)).toNumber()).fill(now)],['activityCutoffFactorMilli',[n],10000],['pendingServerEmission',[n],1000000000],['pendingValidatorEmission',[n],1000000000]);
 await chunkStore(final);
 const rows=[];for(const n of originalNets){const N=(await q.subnetworkN(n)).toNumber(),mode=(await q.subnetEpochConsensus(n)).toString();assert.equal(N,phase==='stress'&&n<=64?2000:256);assert.equal((await q.mechanismCountCurrent(n)).toNumber(),1);assert.equal(mode,phase==='stress'&&n<=64?'Null':'Yuma');assert.ok(BigInt((await q.subnetAlphaOutEmission(n)).toString())>0n,`inactive alpha issuance on subnet ${n}`);rows.push({netuid:n,N,mode,validators:(await q.validatorPermit(n)).filter(x=>x.isTrue).length});}
 fs.writeFileSync(new URL(`../temp/pr3206-${phase}-manifest.json`,import.meta.url),JSON.stringify({phase,block:(await api.rpc.chain.getHeader()).number.toNumber(),rows},null,2));
 console.log('PASS preparation',phase,'every subnet has active alpha issuance and full validator weights');
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
