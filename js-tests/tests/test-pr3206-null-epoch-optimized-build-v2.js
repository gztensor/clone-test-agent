import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Keyring} from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';
import {cryptoWaitReady,blake2AsHex} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const stage=process.env.OPTIMIZED_STAGE??'benchmark';
const logger=createTempLogger(`pr3206-optimized-v2-${stage}.log`);logger.captureConsole();
function stats(values){const a=[...values].sort((x,y)=>x-y);return {count:a.length,medianMs:(a[(a.length-1)>>1]+a[a.length>>1])/2,p95Ms:a[Math.floor((a.length-1)*.95)],maxMs:a.at(-1),meanMs:a.reduce((x,y)=>x+y,0)/a.length};}
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule;
 if(stage==='keys'){
 const keys={};for(const [name,field]of [['tempo','Tempo'],['pendingEpochAt','PendingEpochAt'],['blocksSinceLastStep','BlocksSinceLastStep']])keys['SubtensorModule.'+field]=q[name].keyPrefix();
 fs.writeFileSync(new URL('../temp/pr3206-optimized-freeze-keys.json',import.meta.url),JSON.stringify(keys));console.log('PASS freeze metadata captured');return;
 }
 const wasmPath=new URL('../../subtensor-reference/target/release/wbuild/node-subtensor-runtime/node_subtensor_runtime.compact.compressed.wasm',import.meta.url);
 const expected=blake2AsHex(fs.readFileSync(wasmPath));const actual=blake2AsHex(Buffer.from((await api.rpc.state.getStorage('0x3a636f6465')).unwrap().toHex().slice(2),'hex'));
 assert.equal(actual,expected,'running runtime must match newly built WASM bytes');console.log('WASM HASH',actual,'spec',api.runtimeVersion.specVersion.toString());
 const alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');assert.equal((await api.query.sudo.key()).unwrap().toString(),alice.address);
 const now=(await api.rpc.chain.getHeader()).number.toNumber(),pairs=[];const modeRows=[];
 function item(name,args,value){const f=q[name],m=f.creator.meta.type,id=api.registry.createLookupType(m.isMap?m.asMap.value:m.asPlain);pairs.push([f.key(...args),u8aToHex(api.createType(id,value).toU8a())]);}
 for(let n=1;n<=128;n++){
 const N=(await q.subnetworkN(n)).toNumber(),mode=(await q.subnetEpochConsensus(n)).toString();assert.equal(N,n<=64?2000:256);assert.equal(mode,n<=64?'Null':'Yuma');assert.equal((await q.mechanismCountCurrent(n)).toNumber(),1);
 if(n<=64){const permits=await q.validatorPermit(n),winner=permits.findIndex(x=>x.isTrue);assert.equal(permits.filter(x=>x.isTrue).length,1);assert.equal((await q.weights(n,winner)).length,1999,'winner must have full submitted row');}
 item('tempo',[n],360);item('lastEpochBlock',[n],now);item('blocksSinceLastStep',[n],0);item('pendingEpochAt',[n],now+2);item('lastUpdate',[n],Array(N).fill(now));item('pendingServerEmission',[n],1000000000);item('pendingValidatorEmission',[n],1000000000);item('pendingRootAlphaDivs',[n],0);item('pendingOwnerCut',[n],0);modeRows.push({n,N,mode});
 }
 item('tempo',[0],100);
 await new Promise((resolve,reject)=>{
 let unsub,done=false;const timer=setTimeout(()=>{if(!done){done=true;unsub?.();reject(Error('arming transaction timed out'));}},120000);
 api.tx.sudo.sudo(api.tx.system.setStorage(pairs)).signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{
 if(done||(!status.isInBlock&&!status.isFinalized))return;done=true;clearTimeout(timer);unsub?.();if(dispatchError)return reject(Error(dispatchError.toString()));for(const {event}of events)if(event.section==='sudo'&&event.method==='Sudid'&&event.data[0].isErr)return reject(Error(event.data[0].toString()));resolve();}).then(u=>{unsub=u;if(done)u();}).catch(e=>{clearTimeout(timer);reject(e);});
 });
 console.log('ARMED',JSON.stringify(modeRows));let processed=now,seen=new Set();const samples=[];const deadline=Date.now()+30*60*1000;let lastAdvance=Date.now();
 while(seen.size<64&&Date.now()<deadline){
 const head=(await api.rpc.chain.getHeader()).number.toNumber();if(head===processed){assert.ok(Date.now()-lastAdvance<180000,'block production stalled');await new Promise(r=>setTimeout(r,500));continue;}lastAdvance=Date.now();
 for(let block=processed+1;block<=head;block++){
 const hash=await api.rpc.chain.getBlockHash(block),events=await api.query.system.events.at(hash);const epochs=[];
 for(const {event}of events){if(event.section==='subtensorModule'&&event.method==='EpochSkipped')throw Error(`epoch skipped at block ${block}`);if(event.section!=='subtensorModule'||event.method!=='IncentiveAlphaEmittedToMiners')continue;const n=event.data[0].toNumber();if(n<1||n>64)continue;const values=event.data[1].map(x=>BigInt(x.toString()));assert.equal(values.length,2000);assert.ok(values.reduce((x,y)=>x+y,0n)>0n);const positive=values.filter(x=>x>0n).length;assert.ok(positive>=1999,'full winner row must yield nonzero miner incentives');assert.ok(!seen.has(n),'measure one first epoch per dense subnet');seen.add(n);epochs.push({netuid:n,positive});}
 if(epochs.length){assert.equal(epochs.length,1,'comparison requires one Null epoch per block');samples.push({block,hash:hash.toHex(),epochs,timestamp:(await api.query.timestamp.now.at(hash)).toNumber()});console.log('NULL EPOCH',JSON.stringify(samples.at(-1)),'covered',seen.size);}
 }
 processed=head;
 }
 assert.equal(seen.size,64,'all original 64 Null subnets must execute their fully populated funded epochs');
 const builderPath=new URL('../temp/pr3206-optimized-v2-node.log',import.meta.url);const prepared=new Map([...fs.readFileSync(builderPath,'utf8').matchAll(/Prepared block for proposing at (\d+) \((\d+) ms\)/g)].map(m=>[Number(m[1]),Number(m[2])]));
 const timings=samples.map(s=>{assert.ok(prepared.has(s.block),`missing builder time for block ${s.block}`);return prepared.get(s.block);});
 const old=[...fs.readFileSync(new URL('../temp/pr3206-stress-final-node.log',import.meta.url),'utf8').matchAll(/Prepared block for proposing at (\d+) \((\d+) ms\)/g)].filter(m=>Number(m[1])<=64).map(m=>Number(m[2]));assert.equal(old.length,64);
 const baseline=stats(old),optimized=stats(timings),previous=JSON.parse(fs.readFileSync(new URL('../temp/pr3206-optimized-comparison.json',import.meta.url),'utf8')).optimized;const missedSlots=samples.slice(1).reduce((sum,s,i)=>sum+Math.max(0,Math.floor(s.timestamp/12000)-Math.floor(samples[i].timestamp/12000)-1),0);
 const result={wasmHash:actual,specVersion:api.runtimeVersion.specVersion.toNumber(),baseline,previous,optimized,medianReductionVsPreviousPercent:100*(previous.medianMs-optimized.medianMs)/previous.medianMs,medianReductionPercent:100*(baseline.medianMs-optimized.medianMs)/baseline.medianMs,maxReductionPercent:100*(baseline.maxMs-optimized.maxMs)/baseline.maxMs,missedSlots,samples:samples.map((s,i)=>({...s,preparedMs:timings[i]}))};
 fs.writeFileSync(new URL('../temp/pr3206-optimized-v2-comparison.json',import.meta.url),JSON.stringify(result,null,2));console.log('PASS 64 funded one-Null/2000-UID epoch blocks; COMPARISON',JSON.stringify({baseline,previous,optimized,medianReductionVsPreviousPercent:result.medianReductionVsPreviousPercent,medianReductionPercent:result.medianReductionPercent,maxReductionPercent:result.maxReductionPercent,missedSlots}));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
