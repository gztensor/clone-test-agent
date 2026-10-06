import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Keyring} from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';
import {cryptoWaitReady,blake2AsHex,blake2AsU8a} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('runtime-474-abc-mechanisms.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule,a=api.tx.adminUtils,n=1,keyring=new Keyring({type:'sr25519'}),alice=keyring.addFromUri('//Alice');
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);
 const wasmHash=blake2AsHex(fs.readFileSync(new URL('../../subtensor-reference/target/release/wbuild/node-subtensor-runtime/node_subtensor_runtime.compact.compressed.wasm',import.meta.url)));
 assert.equal(blake2AsHex(Buffer.from((await api.rpc.state.getStorage('0x3a636f6465')).unwrap().toHex().slice(2),'hex')),wasmHash);
 function decode(e){return e.isModule?api.registry.findMetaError(e.asModule).name:e.toString();}
 async function send(tx){console.log('CALL',tx.method.section,tx.method.method);return new Promise((resolve,reject)=>{
 let unsub,done=false;const finish=(err,result)=>{if(done)return;done=true;clearTimeout(timer);unsub?.();err?reject(err):resolve(result);};const timer=setTimeout(()=>finish(Error('inclusion timeout')),120000);
 tx.signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{if(status.isInvalid||status.isDropped||status.isUsurped)return finish(Error(status.toString()));if(!status.isInBlock&&!status.isFinalized)return;
 let error=dispatchError?decode(dispatchError):null;for(const {event}of events)if(event.section==='sudo'&&['Sudid','SudoAsDone'].includes(event.method)&&event.data[0].isErr)error=decode(event.data[0].asErr);
 finish(error?Error(error):null,(status.isInBlock?status.asInBlock:status.asFinalized).toHex());}).then(u=>{unsub=u;if(done)u();}).catch(e=>finish(e));});}
 const root=call=>send(api.tx.sudo.sudo(call));
 function item(name,args,value){const f=q[name],m=f.creator.meta.type,id=api.registry.createLookupType(m.isMap?m.asMap.value:m.asPlain);return [f.key(...args),u8aToHex(api.createType(id,value).toU8a())];}
 async function store(items){for(let i=0;i<items.length;i+=1500)await root(api.tx.system.setStorage(items.slice(i,i+1500).map(([name,args,value])=>item(name,args,value))));}
 async function config(){return {netuid:n,population:(await q.subnetworkN(n)).toNumber(),minimum:(await q.minAllowedUids(n)).toNumber(),maximum:(await q.maxAllowedUids(n)).toNumber(),mechanisms:(await q.mechanismCountCurrent(n)).toNumber(),consensus:(await q.subnetEpochConsensus(n)).toString()};}
 // These adjustments normalize clone chronology and enable ordinary validator
 // weight calls. Consensus/limits are changed only through public admin calls.
 await root(a.sudoSetAdminFreezeWindow(0));
 // Isolate target epochs without changing the other subnets' consensus,
 // population or weight state. Their normal coinbase work remains active.
 const schedule=[];for(const [key,enabled]of await q.networksAdded.entries())if(enabled.isTrue){const other=key.args[0].toNumber();if(other!==n&&other!==0)schedule.push(['tempo',[other],65535],['pendingEpochAt',[other],0],['lastEpochBlock',[other],(await api.rpc.chain.getHeader()).number.toNumber()],['blocksSinceLastStep',[other],0]);}await store(schedule);
 await store([['pendingEpochAt',[n],0],['lastEpochBlock',[n],(await api.rpc.chain.getHeader()).number.toNumber()],['blocksSinceLastStep',[n],0],['immunityPeriod',[n],0],['commitRevealWeightsEnabled',[n],false],['weightsSetRateLimit',[n],0],['minAllowedWeights',[n],0],['maxWeightsLimit',[n],65535]]);
 if((await q.minAllowedUids(n)).toNumber()!==16)await root(a.sudoSetMinAllowedUids(n,16));
 if((await q.subnetworkN(n)).toNumber()>16)await root(a.sudoTrimToMaxAllowedUids(n,16));await root(a.sudoSetMaxAllowedUids(n,16));await root(a.sudoSetMaxMechanismCount(16));await root(a.sudoSetMechanismCount(n,16));
 const survivors=await q.keys.entries(n);assert.equal(survivors.length,16);for(const [k,hot]of survivors)assert.equal((await q.uids(n,hot)).unwrap().toNumber(),k.args[1].toNumber());
 async function prepareWeights(N){
 const vectors=[];for(let m=0;m<16;m++){const index=n+4096*m;vectors.push(['lastUpdate',[index],Array(N).fill(0)],['incentive',[index],Array(N).fill(0)]);}
 for(let uid=0;uid<N;uid++)vectors.push(['blockAtRegistration',[n,uid],0]);await store(vectors);
 const permits=await q.validatorPermit(n),validators=[];for(let uid=0;uid<N;uid++)if(permits[uid]?.isTrue)validators.push(uid);assert.ok(validators.length,'validator permit required');
 const version=(await q.weightsVersionKey(n)).toString();
 for(let m=0;m<16;m++){
 const calls=[];for(const uid of validators){const hot=(await q.keys(n,uid)).toString(),dests=Array.from({length:N},(_,i)=>i).filter(i=>i!==uid);calls.push(api.tx.sudo.sudoAs(hot,api.tx.subtensorModule.setMechanismWeights(n,m,dests,dests.map(()=>1),version)));}
 await send(api.tx.utility.batchAll(calls));for(const uid of validators)assert.equal((await q.weights(n+4096*m,uid)).length,N-1);
 }
 console.log('WEIGHTS VERIFIED',JSON.stringify({N,mechanisms:16,validators,entriesPerRow:N-1}));
 }
 async function measure(label,N,consensus){
 const configuration=await config();assert.deepEqual(configuration,{netuid:n,population:N,minimum:16,maximum:N,mechanisms:16,consensus});console.log('CONFIGURATION',label,JSON.stringify(configuration));
 const samples=[];for(let repetition=0;repetition<10;repetition++){
 const now=(await api.rpc.chain.getHeader()).number.toNumber(),items=[['pendingEpochAt',[n],now+2],['lastEpochBlock',[n],now],['blocksSinceLastStep',[n],0],['pendingServerEmission',[n],1000000000],['pendingValidatorEmission',[n],1000000000],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0]];
 for(let m=0;m<16;m++)items.push(['lastUpdate',[n+4096*m],Array(N).fill(now)]);await store(items);
 let processed=now,found=false;const deadline=Date.now()+180000;
 while(!found&&Date.now()<deadline){const head=(await api.rpc.chain.getHeader()).number.toNumber();for(let block=processed+1;block<=head;block++){
 const bh=await api.rpc.chain.getBlockHash(block),events=await api.query.system.events.at(bh),epochs=[],target=[];
 for(const {event}of events){if(event.section!=='subtensorModule')continue;if(event.method==='EpochSkipped'&&event.data[0].toNumber()===n)throw Error('target epoch skipped');if(event.method!=='IncentiveAlphaEmittedToMiners')continue;const index=event.data[0].toNumber(),values=event.data[1].map(v=>BigInt(v.toString())),row={index,positive:values.filter(v=>v>0n).length,total:values.reduce((a,b)=>a+b,0n).toString()};epochs.push(row);if(index%4096===n){assert.equal(values.length,N);assert.ok(row.positive>=N-1,'dense submitted rows must produce nonzero rewards across the UID population');target.push(row);}}
 if(target.length){assert.equal(target.length,16,'all mechanisms must execute and emit');assert.equal(epochs.length,16,'measured block must exclude other subnet epochs');samples.push({repetition,block,epochs});console.log('EPOCH',label,JSON.stringify(samples.at(-1)));found=true;break;}}
 processed=head;if(!found)await new Promise(r=>setTimeout(r,500));}assert.ok(found,'epoch did not execute');}
 const text=fs.readFileSync(new URL('../temp/abc-474-bc-builder.log',import.meta.url),'utf8'),times=new Map([...text.matchAll(/Prepared block for proposing at (\d+) \((\d+) ms\)/g)].map(m=>[Number(m[1]),Number(m[2])]));for(const s of samples){assert.ok(times.has(s.block));s.preparedMs=times.get(s.block);}
 const values=samples.map(s=>s.preparedMs).sort((a,b)=>a-b),result={configuration,wasmHash,samples,medianMs:(values[4]+values[5])/2,minMs:values[0],maxMs:values.at(-1)};fs.writeFileSync(new URL(`../temp/runtime-474-abc-${label}.json`,import.meta.url),JSON.stringify(result,null,2));console.log('PASS',label,JSON.stringify({configuration,medianMs:result.medianMs,minMs:result.minMs,maxMs:result.maxMs}));return result;
 }
 await prepareWeights(16);const B=await measure('B',16,'Yuma');
 // Null mode change requires empty timelocked queues, including orphan keys.
 const clear=[];for(let m=0;m<16;m++)for(const k of await q.timelockedWeightCommits.keys(n+4096*m))clear.push(k.toHex());if(clear.length)await root(api.tx.system.killStorage(clear));
 await root(a.sudoSetEpochConsensus(n,'Null'));await root(a.sudoSetMaxAllowedUids(n,156));
 const additions=[];for(let uid=16;uid<156;uid++){
 const hot=keyring.encodeAddress(blake2AsU8a(`ABC474-hot-${n}-${uid}`)),nom=keyring.encodeAddress(blake2AsU8a(`ABC474-nom-${n}-${uid}`));
 // Separate synthetic coldkeys and a nominator exercise shared reward pools.
 additions.push(['keys',[n,uid],hot],['uids',[n,hot],uid],['blockAtRegistration',[n,uid],0],['isNetworkMember',[hot,n],true],['owner',[hot],hot],['ownedHotkeys',[hot],[hot]],['stakingHotkeys',[hot],[hot]],['stakingHotkeys',[nom],[hot]],['totalHotkeyAlpha',[hot,n],1000000000],['totalHotkeySharesV2',[hot,n],{mantissa:2,exponent:0}],['alphaV2',[hot,hot,n],{mantissa:1,exponent:0}],['alphaV2',[hot,nom,n],{mantissa:1,exponent:0}]);}
 await store(additions);const extended=[];for(const name of ['active','emission','consensus','dividends','validatorTrust','validatorPermit','stakeWeight']){const old=(await q[name](n)).toJSON(),fallback=['active','validatorPermit'].includes(name)?false:0;extended.push([name,[n],Array.from({length:156},(_,i)=>old[i]??fallback)]);}
 extended.push(['subnetworkN',[n],156],['totalAlphaStaked',[n],(BigInt((await q.totalAlphaStaked(n)).toString())+140000000000n).toString()],['subnetAlphaOut',[n],(BigInt((await q.subnetAlphaOut(n)).toString())+140000000000n).toString()]);await store(extended);
 assert.equal((await q.keys.entries(n)).length,156);assert.equal((await q.validatorPermit(n)).filter(v=>v.isTrue).length,1);await prepareWeights(156);const C=await measure('C',156,'Null');
 const A=JSON.parse(fs.readFileSync(new URL('../temp/runtime-474-abc-baseline.json',import.meta.url),'utf8'));assert.equal(A.configuration.wasmHash,wasmHash);fs.writeFileSync(new URL('../temp/runtime-474-abc-comparison.json',import.meta.url),JSON.stringify({A,B,C},null,2));console.log('PASS final saved B/C test complete',JSON.stringify({A:A.medianMs,B:B.medianMs,C:C.medianMs}));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
