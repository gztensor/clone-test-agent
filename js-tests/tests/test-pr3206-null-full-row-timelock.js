import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {decodeAddress} from '@polkadot/util-crypto';
import fs from 'node:fs';
import { blake2AsU8a } from '@polkadot/util-crypto';
import assert from 'node:assert/strict';
import { Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { connectApi } from '../lib/api.js';
import { createTempLogger } from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-full-row-timelock.log');
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
async function main(){
 await logger.start();await cryptoWaitReady();api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const keyring=new Keyring({type:'sr25519'});alice=keyring.addFromUri('//Alice');const q=api.query.subtensorModule,a=api.tx.adminUtils,n=JSON.parse(fs.readFileSync(new URL('../temp/pr3206-feature-fixture.json',import.meta.url),'utf8')).netuid;
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);assert.ok([256,2000].includes((await q.subnetworkN(n)).toNumber()));
 if((await q.subnetEpochConsensus(n)).toString()==='Yuma')await root(a.sudoSetEpochConsensus(n,'Null'));
 assert.equal((await q.subnetEpochConsensus(n)).toString(),'Null');await root(a.sudoSetMaxAllowedUids(n,2000));await fill(n,2000,keyring);
 // Elect from the completed fixture in a zero-budget epoch before committing.
 const election=(await api.rpc.chain.getHeader()).number.toNumber();
 await store([['tempo',[n],360],['lastEpochBlock',[n],election],['blocksSinceLastStep',[n],0],['pendingEpochAt',[n],election+2],['pendingServerEmission',[n],0],['pendingValidatorEmission',[n],0],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0]]);
 const electionDeadline=Date.now()+180000;
 while((await q.lastMechansimStepBlock(n)).toNumber()<election+2){assert.ok(Date.now()<electionDeadline,'completed fixture election did not run');await new Promise(r=>setTimeout(r,500));}
 const permits=await q.validatorPermit(n);const winner=permits.findIndex(x=>x.isTrue);assert.ok(winner>=0);assert.equal(permits.filter(x=>x.isTrue).length,1);
 const hot=(await q.keys(n,winner)).toString();const version=(await q.weightsVersionKey(n)).toNumber();
 const original=(await q.weights(n,winner)).toJSON();const UIDs=Array.from({length:2000},(_,i)=>i).filter(i=>i!==winner);const values=UIDs.map((_,i)=>i===0?65534:1);
 const oldTempo=(await q.tempo(n)).toNumber();const oldReveal=(await q.revealPeriodEpochs(n)).toNumber();
 const now=(await api.rpc.chain.getHeader()).number.toNumber();
 await store([['tempo',[n],65535],['pendingEpochAt',[n],0],['blocksSinceLastStep',[n],0],['commitRevealWeightsEnabled',[n],true],['revealPeriodEpochs',[n],1],['maxWeightsLimit',[n],65535]]);
 const python=fileURLToPath(new URL('../../subtensor-reference/sdk/python/.venv/bin/python',import.meta.url));const helper=fileURLToPath(new URL('../scripts/pr3206-timelock-payload.py',import.meta.url));
 const payload=JSON.parse(execFileSync(python,[helper],{input:JSON.stringify({uids:UIDs,values,version,block:now,hotkey:Buffer.from(decodeAddress(hot)).toString('hex')}),encoding:'utf8',timeout:60000}));
 const cipher='0x'+payload.commit;assert.ok(payload.commit.length/2>5000,'full ciphertext exceeds the legacy Yuma size limit');assert.ok(payload.commit.length/2<=32768);
 const commitEpoch=(await q.subnetEpochIndex(n)).toNumber();const crVersion=(await q.commitRevealWeightsVersion()).toNumber();
 await submit(api.tx.sudo.sudoAs(hot,api.tx.subtensorModule.commitTimelockedWeights(n,cipher,payload.round,crVersion)));
 const entries=await q.timelockedWeightCommits(n,commitEpoch);assert.equal(entries.length,1);assert.equal(entries[0][0].toString(),hot);
 console.log('COMMITTED full raw row',UIDs.length,'ciphertext bytes',payload.commit.length/2,'epoch',commitEpoch,'round',payload.round);
 const pulse=q=>{const type=q.creator.meta.type;return api.registry.createLookupType(type.asMap.value);};
 const drand=api.query.drand.pulses;
 await root(api.tx.system.setStorage([[drand.key(payload.round),u8aToHex(api.createType(pulse(drand),{round:payload.round,randomness:'0x'+payload.randomness,signature:'0x'+payload.signature}).toU8a())]]));
 const trigger=(await api.rpc.chain.getHeader()).number.toNumber()+2;
 await store([['pendingEpochAt',[n],trigger],['pendingServerEmission',[n],1000000000],['pendingValidatorEmission',[n],1000000000]]);
 const deadline=Date.now()+120000;
 while(Date.now()<deadline){const row=(await q.weights(n,winner)).toJSON();if(JSON.stringify(row)===JSON.stringify(UIDs.map((u,i)=>[u,values[i]])))break;await new Promise(r=>setTimeout(r,500));}
 assert.deepEqual((await q.weights(n,winner)).toJSON(),UIDs.map((u,i)=>[u,values[i]]),'real full-row timelock reveal must preserve exact u16 values');assert.equal((await q.timelockedWeightCommits(n,commitEpoch)).length,0);
 console.log('PASS genuine native full-row encryption and quicknet cryptographic reveal preserve exact 65534:1 raw ratios');
 // Restore the performance fixture's uniform row and normal scheduling.
 await store([['commitRevealWeightsEnabled',[n],false],['revealPeriodEpochs',[n],oldReveal],['tempo',[n],0],['pendingEpochAt',[n],0]]);
 await submit(api.tx.sudo.sudoAs(hot,api.tx.subtensorModule.setWeights(n,original.map(x=>x[0]),original.map(x=>x[1]),version)));
 console.log('PASS isolated feature fixture disabled and its original row restored');
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
