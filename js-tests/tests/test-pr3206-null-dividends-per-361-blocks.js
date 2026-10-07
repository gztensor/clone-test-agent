import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Keyring} from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';
import {cryptoWaitReady,blake2AsHex} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-dividends-per-361-blocks.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule,a=api.tx.adminUtils,alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');
 const wasmHash=blake2AsHex(fs.readFileSync(new URL('../../subtensor-reference/target/release/wbuild/node-subtensor-runtime/node_subtensor_runtime.compact.compressed.wasm',import.meta.url)));assert.equal(blake2AsHex(Buffer.from((await api.rpc.state.getStorage('0x3a636f6465')).unwrap().toHex().slice(2),'hex')),wasmHash);assert.equal(api.runtimeVersion.specVersion.toNumber(),474);
 async function send(tx){return new Promise((resolve,reject)=>{let unsub,done=false;const finish=e=>{if(done)return;done=true;clearTimeout(timer);unsub?.();e?reject(e):resolve();},timer=setTimeout(()=>finish(Error('inclusion timeout')),120000);tx.signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{if(!status.isInBlock&&!status.isFinalized)return;let err=dispatchError;for(const {event}of events)if(event.section==='sudo'&&['Sudid','SudoAsDone'].includes(event.method)&&event.data[0].isErr)err=event.data[0].asErr;finish(err?Error(err.isModule?api.registry.findMetaError(err.asModule).name:err.toString()):null);}).then(u=>{unsub=u;if(done)u();}).catch(finish);});}
 const root=call=>send(api.tx.sudo.sudo(call));
 async function store(items){for(let i=0;i<items.length;i+=2000)await root(api.tx.system.setStorage(items.slice(i,i+2000).map(([name,args,value])=>{const f=q[name],m=f.creator.meta.type,id=api.registry.createLookupType(m.isMap?m.asMap.value:m.asPlain);return [f.key(...args),u8aToHex(api.createType(id,value).toU8a())];})));}
 const nets=[];for(const [k,v]of await q.networksAdded.entries())if(v.isTrue&&k.args[0].toNumber()){const n=k.args[0].toNumber(),N=(await q.subnetworkN(n)).toNumber(),M=(await q.mechanismCountCurrent(n)).toNumber();if(N)nets.push({n,N,M});}nets.sort((a,b)=>a.n-b.n);assert.equal(nets.length,128);
 const freeze=[],now=(await api.rpc.chain.getHeader()).number.toNumber();for(const {n,N,M}of nets){assert.equal((await q.subnetEpochConsensus(n)).toString(),'Yuma');freeze.push(['tempo',[n],65535],['pendingEpochAt',[n],0],['lastEpochBlock',[n],now],['blocksSinceLastStep',[n],0],['commitRevealWeightsEnabled',[n],false],['weightsSetRateLimit',[n],0],['minAllowedWeights',[n],0],['maxWeightsLimit',[n],65535]);for(let m=0;m<M;m++)freeze.push(['lastUpdate',[n+4096*m],Array(N).fill(now)]);}await store(freeze);await root(a.sudoSetAdminFreezeWindow(0));
 const regs=[];for(const {n,N}of nets)for(let uid=0;uid<N;uid++)regs.push(['blockAtRegistration',[n,uid],0]);await store(regs);
 for(const name of ['timelockedWeightCommits','weightCommits']){const keys=await q[name].keys();for(let i=0;i<keys.length;i+=2000)await root(api.tx.system.killStorage(keys.slice(i,i+2000).map(k=>k.toHex())));}
 async function epochs(label,previous=null){
 const start=(await api.rpc.chain.getHeader()).number.toNumber(),items=[];for(const {n}of nets){items.push(['pendingEpochAt',[n],previous?Math.max(previous.get(n).block+361,start+3):start+3]);if(!previous)items.push(['pendingServerEmission',[n],1000000000],['pendingValidatorEmission',[n],1000000000],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0]);}await store(items);
 const states=new Map();let processed=start,lastProgress=start;const deadline=Date.now()+1800000;
 while(states.size<nets.length&&Date.now()<deadline){const head=(await api.rpc.chain.getHeader()).number.toNumber();for(let block=processed+1;block<=head;block++){
 const hash=await api.rpc.chain.getBlockHash(block),events=await api.query.system.events.at(hash),seen=new Set();for(const {event}of events){if(event.section!=='subtensorModule')continue;if(event.method==='EpochSkipped')throw Error('epoch skipped');if(event.method==='IncentiveAlphaEmittedToMiners')seen.add(event.data[0].toNumber()%4096);}
 for(const n of seen)if(n&&nets.some(s=>s.n===n)&&!states.has(n)){
 const at=await api.at(hash),s=at.query.subtensorModule,prev=await api.at(await api.rpc.chain.getBlockHash(block-1)),last=(await prev.query.subtensorModule.lastMechansimStepBlock(n)).toNumber();if(previous)assert.equal(last,previous.get(n).block,'elapsed interval must start at the previous actual epoch');
 const state={block,previousEpoch:last,elapsed:previous?block-last:null,permits:(await s.validatorPermit(n)).toJSON(),dividends:(await s.dividends(n)).toJSON(),alphaDividends:Object.fromEntries((await s.alphaDividendsPerSubnet.entries(n)).map(([k,v])=>[k.args[1].toString(),v.toString()])),priceRaoPerAlpha:(await at.call.swapRuntimeApi.currentAlphaPrice(n)).toString()};if(previous)assert.ok(state.elapsed>=361);states.set(n,state);console.log('EPOCH',label,n,block,'elapsed',state.elapsed);
 }}processed=head;if(head-lastProgress>=60){console.log('WAIT',label,'block',head,'completed',states.size);lastProgress=head;}if(states.size<nets.length)await new Promise(r=>setTimeout(r,250));}assert.equal(states.size,nets.length);return states;
 }
 // Warm-up establishes local previous-epoch blocks and drains inherited budgets.
 // No pending budgets, epoch anchors or chronology are reset after this point.
 const warm=await epochs('WARMUP'),before=await epochs('YUMA',warm);
 for(const {n,N,M}of nets){await root(a.sudoSetEpochConsensus(n,'Null'));const permits=await q.validatorPermit(n),winner=permits.findIndex(v=>v.isTrue);assert.equal(permits.filter(v=>v.isTrue).length,1);const hot=(await q.keys(n,winner)).toString(),version=(await q.weightsVersionKey(n)).toString();
 for(let m=0;m<M;m++){const index=n+4096*m,old=await q.weights(index,winner);let dest=old.map(v=>v[0].toNumber()),values=old.map(v=>v[1].toNumber());if(!values.some(v=>v>0)){dest=Array.from({length:N},(_,uid)=>uid).filter(uid=>uid!==winner);values=dest.map(()=>1);}await send(api.tx.sudo.sudoAs(hot,api.tx.subtensorModule.setMechanismWeights(n,m,dest,values,version)));}console.log('NULL PREPARED',n,winner);}
 const after=await epochs('NULL',before),rows=[],snapshots=[];let roles=0;
 for(const {n,N}of nets){const b=before.get(n),c=after.get(n),keys=Object.fromEntries((await q.keys.entries(n)).map(([k,v])=>[k.args[1].toNumber(),v.toString()]));snapshots.push({netuid:n,warmup:warm.get(n),before:b,after:c});for(let uid=0;uid<N;uid++)if(b.permits[uid]){roles++;const hotkey=keys[uid],old=BigInt(b.alphaDividends[hotkey]??0),next=BigInt(c.alphaDividends[hotkey]??0),oldProduct=old*BigInt(b.priceRaoPerAlpha),nextProduct=next*BigInt(c.priceRaoPerAlpha);if(oldProduct<=100000000n*1000000000n)continue;
 const beforeTao=Number(oldProduct)/1e18,afterTao=Number(nextProduct)/1e18,x=beforeTao/b.elapsed*361,y=afterTao/c.elapsed*361;rows.push({netuid:n,uid,hotkey,beforeBlock:b.block,afterBlock:c.block,beforeElapsed:b.elapsed,afterElapsed:c.elapsed,beforeTao,afterTao,beforeNormalizedTao:x,afterNormalizedTao:y,changeTao:y-x,changePercent:100*(y/x-1)});}}
 assert.ok(rows.length);function stats(key){const v=[...rows].sort((a,b)=>a[key]-b[key]),i=v.length>>1;return {min:v[0][key],median:v.length%2?v[i][key]:(v[i-1][key]+v[i][key])/2,max:v.at(-1)[key],minimumValidator:v[0],maximumValidator:v.at(-1)};}
 const result={spec:474,wasmHash,formula:'TAO equivalent paid alpha dividends / blocks since actual previous epoch * 361',filter:'pre-switch actual epoch dividends strictly > 0.1 TAO equivalent',subnets:128,validatorRoles:roles,selectedRoles:rows.length,selectedSubnets:new Set(rows.map(r=>r.netuid)).size,method:'warm-up epoch, uninterrupted coinbase accumulation, Yuma epoch, Null switch and sole winner submissions, Null epoch; no budget or anchor resets after warm-up',taoDifference:stats('changeTao'),percentageChange:stats('changePercent'),rows,snapshots};fs.writeFileSync(new URL('../temp/pr3206-null-dividends-per-361-blocks.json',import.meta.url),JSON.stringify(result,null,2));const {rows:detail,snapshots:states,...summary}=result;console.log('PASS final saved continuous 361-block rate test',JSON.stringify(summary));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
