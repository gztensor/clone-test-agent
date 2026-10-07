import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Keyring} from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';
import {cryptoWaitReady,blake2AsHex} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-validator-dividends.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule,a=api.tx.adminUtils,alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');
 const wasmHash=blake2AsHex(fs.readFileSync(new URL('../../subtensor-reference/target/release/wbuild/node-subtensor-runtime/node_subtensor_runtime.compact.compressed.wasm',import.meta.url)));
 assert.equal(blake2AsHex(Buffer.from((await api.rpc.state.getStorage('0x3a636f6465')).unwrap().toHex().slice(2),'hex')),wasmHash);assert.equal(api.runtimeVersion.specVersion.toNumber(),474);
 const decode=e=>e.isModule?api.registry.findMetaError(e.asModule).name:e.toString();
 async function send(tx,expected=null){return new Promise((resolve,reject)=>{let unsub,done=false;const finish=(err,v)=>{if(done)return;done=true;clearTimeout(timer);unsub?.();err?reject(err):resolve(v);};const timer=setTimeout(()=>finish(Error('inclusion timeout')),120000);
 tx.signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{if(status.isInvalid||status.isDropped||status.isUsurped)return finish(Error(status.toString()));if(!status.isInBlock&&!status.isFinalized)return;
 let error=dispatchError?decode(dispatchError):null;for(const {event}of events)if(event.section==='sudo'&&['Sudid','SudoAsDone'].includes(event.method)&&event.data[0].isErr)error=decode(event.data[0].asErr);
 try{assert.equal(error,expected);}catch(e){return finish(e);}finish(null,(status.isInBlock?status.asInBlock:status.asFinalized).toHex());}).then(u=>{unsub=u;if(done)u();}).catch(e=>finish(e));});}
 const root=(call,expected)=>send(api.tx.sudo.sudo(call),expected);
 function pair(name,args,value){const f=q[name],m=f.creator.meta.type,id=api.registry.createLookupType(m.isMap?m.asMap.value:m.asPlain);return [f.key(...args),u8aToHex(api.createType(id,value).toU8a())];}
 async function store(items){for(let i=0;i<items.length;i+=2000)await root(api.tx.system.setStorage(items.slice(i,i+2000).map(([name,args,value])=>pair(name,args,value))));}
 const nets=[];for(const [k,v]of await q.networksAdded.entries())if(v.isTrue&&k.args[0].toNumber()!==0){const n=k.args[0].toNumber(),N=(await q.subnetworkN(n)).toNumber(),M=(await q.mechanismCountCurrent(n)).toNumber();if(N)nets.push({n,N,M});}nets.sort((x,y)=>x.n-y.n);assert.equal(nets.length,128,'all original non-root subnets');
 const result={wasmHash,spec:474,subnets:[],weightPermissions:[],noFreshWeights:[]};
 function save(){fs.writeFileSync(new URL('../temp/pr3206-null-validator-dividends.json',import.meta.url),JSON.stringify(result,null,2));}
 // Harness only: suspend automatic epochs and normalize inherited mainnet
 // chronology. Populations, stakes, bonds and submitted weights are preserved.
 const freeze=[];const now=(await api.rpc.chain.getHeader()).number.toNumber();
 for(const {n,N,M}of nets){assert.equal((await q.subnetEpochConsensus(n)).toString(),'Yuma');freeze.push(['tempo',[n],65535],['pendingEpochAt',[n],0],['lastEpochBlock',[n],now],['blocksSinceLastStep',[n],0]);for(let m=0;m<M;m++)freeze.push(['lastUpdate',[n+4096*m],Array(N).fill(now)]);}
 await store(freeze);await root(a.sudoSetAdminFreezeWindow(0));
 const registration=[];for(const {n,N}of nets)for(let uid=0;uid<N;uid++)registration.push(['blockAtRegistration',[n,uid],0]);await store(registration);
 async function capture(n,hash){const at=await api.at(hash),s=at.query.subtensorModule;return {block:(await api.rpc.chain.getHeader(hash)).number.toNumber(),permits:(await s.validatorPermit(n)).toJSON(),dividends:(await s.dividends(n)).toJSON(),alphaDividends:Object.fromEntries((await s.alphaDividendsPerSubnet.entries(n)).map(([k,v])=>[k.args[1].toString(),v.toString()])),rootDividends:Object.fromEntries((await s.rootAlphaDividendsPerSubnet.entries(n)).map(([k,v])=>[k.args[1].toString(),v.toString()]))};}
 async function epochs(label,selected=nets){
 const start=(await api.rpc.chain.getHeader()).number.toNumber(),items=[];for(const {n}of selected)items.push(['pendingEpochAt',[n],start+3],['lastEpochBlock',[n],start],['blocksSinceLastStep',[n],0],['pendingServerEmission',[n],1000000000],['pendingValidatorEmission',[n],1000000000],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0]);await store(items);
 const targets=new Set(selected.map(v=>v.n)),states=new Map();let processed=start;const deadline=Date.now()+900000;
 while(states.size<targets.size&&Date.now()<deadline){const head=(await api.rpc.chain.getHeader()).number.toNumber();for(let block=processed+1;block<=head;block++){
 const hash=await api.rpc.chain.getBlockHash(block),events=await api.query.system.events.at(hash),seen=new Set();for(const {event}of events){if(event.section!=='subtensorModule')continue;if(event.method==='EpochSkipped'&&targets.has(event.data[0].toNumber()))throw Error('target epoch skipped');if(event.method==='IncentiveAlphaEmittedToMiners'){const index=event.data[0].toNumber(),n=index%4096;if(targets.has(n)&&!states.has(n)){seen.add(n);}}}
 for(const n of seen){const state=await capture(n,hash);states.set(n,state);console.log('EPOCH',label,n,block,'positive dividends',state.dividends.filter(v=>v>0).length);}}
 processed=head;if(states.size<targets.size)await new Promise(r=>setTimeout(r,200));}assert.equal(states.size,targets.size,'every target subnet executed');return states;
 }
 const baseline=await epochs('YUMA');
 // Exercise mode switching alone. Do not submit weights or touch permits,
 // limits, stake, dividend reports or bonds during this transition.
 for(const subnet of nets){const {n,N,M}=subnet,hash=await api.rpc.chain.getBlockHash(),before=await capture(n,hash),bondBefore=[];for(let m=0;m<M;m++)bondBefore.push(JSON.stringify((await q.bonds.entries(n+4096*m)).map(([k,v])=>[k.toHex(),v.toJSON()])));
 const outstanding=[];for(let m=0;m<16;m++)for(const k of await q.timelockedWeightCommits.keys(n+4096*m))outstanding.push(k.toHex());
 if(outstanding.length){await root(a.sudoSetEpochConsensus(n,'Null'),'InvalidValue');await root(api.tx.system.killStorage(outstanding));console.log('CLONE QUEUE NORMALIZATION',n,outstanding.length);}
 const switchedHash=await root(a.sudoSetEpochConsensus(n,'Null')),after=await capture(n,switchedHash);assert.equal(after.permits.filter(Boolean).length,1);assert.deepEqual(after.dividends,before.dividends,'mode setter leaves dividend report unchanged until epoch');assert.deepEqual(after.alphaDividends,before.alphaDividends,'mode setter does not pay or rewrite dividends');
 for(let m=0;m<M;m++)assert.equal(JSON.stringify((await q.bonds.entries(n+4096*m)).map(([k,v])=>[k.toHex(),v.toJSON()])),bondBefore[m],'mode switch preserves frozen bonds');
 const keys=Object.fromEntries((await q.keys.entries(n)).map(([k,v])=>[k.args[1].toNumber(),v.toString()])),winner=after.permits.findIndex(Boolean),lost=before.permits.map((permit,uid)=>permit&&!after.permits[uid]?uid:null).filter(v=>v!==null);
 result.subnets.push({...subnet,keys,winner,lostPermits:lost,snapshotBeforeSwitch:before,immediatelyAfterSwitch:after,yuma:baseline.get(n),queueKeysCleared:outstanding.length});console.log('SWITCH',n,'winner',winner,'lost permits',lost.length);save();}
 const noNew=await epochs('NULL_NO_NEW_WEIGHTS');for(const s of result.subnets)s.nullWithoutNewWeights=noNew.get(s.n);save();
 // Green path: only the elected validator submits. Others are explicitly
 // tested with ordinary signed origins (sudoAs provides local hotkey access).
 const enable=[];for(const {n,N,M}of nets){enable.push(['commitRevealWeightsEnabled',[n],false],['weightsSetRateLimit',[n],0],['minAllowedWeights',[n],0],['maxWeightsLimit',[n],65535]);for(let m=0;m<M;m++)enable.push(['lastUpdate',[n+4096*m],Array(N).fill(0)]);}await store(enable);
 for(const s of result.subnets){const {n,N,M}=s,permits=await q.validatorPermit(n),winner=permits.findIndex(v=>v.isTrue);s.greenWinner=winner;const loser=s.lostPermits.find(uid=>uid!==winner),version=(await q.weightsVersionKey(n)).toString();
 if(loser!==undefined){const dest=Array.from({length:N},(_,i)=>i).filter(i=>i!==loser);await send(api.tx.sudo.sudoAs(s.keys[loser],api.tx.subtensorModule.setWeights(n,dest,dest.map(()=>1),version)),'NeuronNoValidatorPermit');result.weightPermissions.push({n,uid:loser,outcome:'NeuronNoValidatorPermit'});}
 for(let m=0;m<M;m++){const index=n+4096*m,row=await q.weights(index,winner);let dest=row.map(v=>v[0].toNumber()),values=row.map(v=>v[1].toNumber());if(!values.some(v=>v>0)){dest=Array.from({length:N},(_,i)=>i).filter(i=>i!==winner);values=dest.map(()=>1);s.greenSeededEmptyWinner=true;}
 await send(api.tx.sudo.sudoAs(s.keys[winner],api.tx.subtensorModule.setMechanismWeights(n,m,dest,values,version)));assert.deepEqual((await q.weights(index,winner)).toJSON(),dest.map((uid,i)=>[uid,values[i]]));}
 console.log('WEIGHT ADMISSION',n,'winner',winner,'other rejected',loser??'no former second validator');save();}
 const green=await epochs('NULL_GREEN');for(const s of result.subnets)s.nullGreen=green.get(s.n);save();
 const changes=[],zeroBaselines=[],payoutShareChanges=[];
 for(const s of result.subnets){const old=s.yuma.dividends,next=s.nullGreen.dividends;for(let uid=0;uid<old.length;uid++){if(!s.yuma.permits[uid])continue;const record={netuid:s.n,uid,hotkey:s.keys[uid],before:old[uid],after:next[uid]};if(old[uid]>0)changes.push({...record,relativeChangePercent:100*(next[uid]-old[uid])/old[uid]});else if(next[uid]>0)zeroBaselines.push(record);}}
 for(const s of result.subnets){const before=s.yuma.alphaDividends,after=s.nullGreen.alphaDividends,sumBefore=Object.values(before).reduce((a,b)=>a+BigInt(b),0n),sumAfter=Object.values(after).reduce((a,b)=>a+BigInt(b),0n);if(!sumBefore||!sumAfter)continue;for(let uid=0;uid<s.N;uid++){if(!s.yuma.permits[uid])continue;const hot=s.keys[uid],old=BigInt(before[hot]??0),next=BigInt(after[hot]??0);if(!old)continue;payoutShareChanges.push({netuid:s.n,uid,hotkey:hot,before:old.toString(),after:next.toString(),beforeTotal:sumBefore.toString(),afterTotal:sumAfter.toString(),relativeShareChangePercent:100*(Number(next)/Number(sumAfter)/(Number(old)/Number(sumBefore))-1)});}}
 changes.sort((x,y)=>Math.abs(y.relativeChangePercent)-Math.abs(x.relativeChangePercent));payoutShareChanges.sort((x,y)=>Math.abs(y.relativeShareChangePercent)-Math.abs(x.relativeShareChangePercent));result.summary={subnetCount:nets.length,subnetsLosingPermits:result.subnets.filter(s=>s.lostPermits.length).length,lostPermits:result.subnets.reduce((v,s)=>v+s.lostPermits.length,0),maximumAbsoluteRelativeDividendReportChange:changes[0],maximumAbsoluteRelativePaidDividendShareChange:payoutShareChanges[0],maximumDecrease:changes.reduce((x,y)=>y.relativeChangePercent<x.relativeChangePercent?y:x,changes[0]),zeroToPositive:zeroBaselines,comparedPositiveBaselineValidators:changes.length,topChanges:changes.slice(0,20)};save();console.log('GREEN SUMMARY',JSON.stringify(result.summary));
 // Representative no-fresh-weight behavior: a stale nonempty row remains
 // usable; removing that row triggers uniform registered-UID miner payout.
 const s=result.subnets.find(s=>s.N>1&&s.M===1),n=s.n,winner=(await q.validatorPermit(n)).findIndex(v=>v.isTrue),row=(await q.weights(n,winner)).toJSON();assert.ok(row.length);
 await store([['lastUpdate',[n],Array(s.N).fill(0)],['activityCutoffFactorMilli',[n],1]]);const stale=await epochs('STALE_ROW',[s]);assert.deepEqual((await q.weights(n,winner)).toJSON(),row);assert.ok(stale.get(n).dividends.some(v=>v>0));const staleIncentive=(await q.incentive(n)).toJSON();result.noFreshWeights.push({n,case:'stale nonempty winner row',state:stale.get(n),incentive:staleIncentive});
 await root(api.tx.system.killStorage([q.weights.key(n,winner)]));const empty=await epochs('EMPTY_ROW',[s]),incentive=(await q.incentive(n)).toJSON();assert.equal(incentive.length,s.N);assert.ok(incentive.every(v=>v===incentive[0]&&v>0),'empty winner row distributes across every registered UID');assert.ok(empty.get(n).dividends.some(v=>v>0));result.noFreshWeights.push({n,case:'empty winner row',state:empty.get(n),incentive});save();
 console.log('PASS final saved investigation complete; expected dividend/permit continuity is NOT satisfied; all behavioral checks complete');
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
