import assert from 'node:assert/strict';
import {Keyring} from '@polkadot/api';
import {cryptoWaitReady} from '@polkadot/util-crypto';
import {u8aToHex} from '@polkadot/util';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-stale-weights-selection.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule,n=1,N=(await q.subnetworkN(n)).toNumber(),alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');assert.equal((await q.subnetEpochConsensus(n)).toString(),'Null');
 async function send(tx){return new Promise((resolve,reject)=>{let unsub,done=false;const finish=e=>{if(done)return;done=true;clearTimeout(timer);unsub?.();e?reject(e):resolve();},timer=setTimeout(()=>finish(Error('inclusion timeout')),120000);tx.signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{if(!status.isInBlock&&!status.isFinalized)return;let error=dispatchError;for(const {event}of events)if(event.section==='sudo'&&['Sudid','SudoAsDone'].includes(event.method)&&event.data[0].isErr)error=event.data[0].asErr;finish(error?Error(error.toString()):null);}).then(u=>{unsub=u;if(done)u();}).catch(finish);});}
 const root=call=>send(api.tx.sudo.sudo(call));
 async function store(items){await root(api.tx.system.setStorage(items.map(([name,args,value])=>{const f=q[name],m=f.creator.meta.type,id=api.registry.createLookupType(m.isMap?m.asMap.value:m.asPlain);return [f.key(...args),u8aToHex(api.createType(id,value).toU8a())];})));}
 const hotkeys=(await q.keys.multi(Array.from({length:N},(_,uid)=>[n,uid]))).map(v=>v.toString()),balances=new Map();
 const parents=await q.parentKeys.multi(hotkeys.map(h=>[h,n])),children=await q.childKeys.multi(hotkeys.map(h=>[h,n]));
 const accounts=[...new Set([...hotkeys,...parents.flatMap(v=>v.map(p=>p[1].toString()))])];const values=await q.totalHotkeyAlpha.multi(accounts.flatMap(h=>[[h,n],[h,0]]));accounts.forEach((h,i)=>balances.set(h,[BigInt(values[2*i].toString()),BigInt(values[2*i+1].toString())]));
 const Q=1n<<32n,U=(1n<<64n)-1n,taoWeight=BigInt((await q.taoWeight()).toString())*Q/U,stakes=hotkeys.map((hot,uid)=>{
 const own=balances.get(hot);return own.map((v,asset)=>{const sent=children[uid].reduce((sum,p)=>sum+v*(BigInt(p[0].toString())*Q/U),0n),received=parents[uid].reduce((sum,p)=>sum+balances.get(p[1].toString())[asset]*(BigInt(p[0].toString())*Q/U),0n);return ((v*Q>sent?v*Q-sent:0n)+received)/Q;}).reduce((alpha,tao)=>alpha*Q+tao*taoWeight);
 });let predicted=0;for(let uid=1;uid<N;uid++)if(stakes[uid]>stakes[predicted])predicted=uid;
 const winner=(await q.validatorPermit(n)).findIndex(v=>v.isTrue);assert.equal(winner,predicted,'sole permit must match maximum inherited alpha plus weighted root stake');console.log('SELECTION VERIFIED',JSON.stringify({netuid:n,winner,hotkey:hotkeys[winner],unroundedStakeQ32:stakes[winner].toString()}));
 const dest=Array.from({length:N},(_,i)=>i).filter(i=>i!==winner).slice(0,2),version=(await q.weightsVersionKey(n)).toString();await send(api.tx.sudo.sudoAs(hotkeys[winner],api.tx.subtensorModule.setWeights(n,dest,[3,1],version)));
 // Positive update 1 is newer than registration 0, yet far outside the
 // 65-block activity cutoff. This distinguishes stale validity from an
 // invalidated row (update <= registration), which correctly masks weights.
 await store([['lastUpdate',[n],Array(N).fill(1)],['activityCutoffFactorMilli',[n],1],...dest.map(uid=>['blockAtRegistration',[n,uid],0])]);
 async function epoch(){const now=(await api.rpc.chain.getHeader()).number.toNumber();await store([['pendingEpochAt',[n],now+3],['pendingServerEmission',[n],1000000000],['pendingValidatorEmission',[n],1000000000],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0]]);const deadline=Date.now()+120000;while(Date.now()<deadline){if((await q.lastMechansimStepBlock(n)).toNumber()>now)return;await new Promise(r=>setTimeout(r,200));}throw Error('epoch timeout');}
 await epoch();const stale=(await q.incentive(n)).toJSON();assert.equal((await q.active(n))[winner].isTrue,false);assert.ok(stale[dest[0]]>stale[dest[1]]&&stale[dest[1]]>0);assert.ok(stale.every((v,uid)=>dest.includes(uid)||v===0));assert.deepEqual((await q.weights(n,winner)).toJSON(),dest.map((uid,i)=>[uid,[3,1][i]]));assert.ok((await q.dividends(n)).some(v=>v.toNumber()>0));console.log('STALE VALID ROW USED despite inactive winner',JSON.stringify({n,winner,dest,incentive:dest.map(uid=>stale[uid])}));
 await root(api.tx.system.killStorage([q.weights.key(n,winner)]));await epoch();const empty=(await q.incentive(n)).toJSON();assert.ok(empty.every(v=>v===empty[0]&&v>0));assert.ok((await q.dividends(n)).some(v=>v.toNumber()>0));console.log('PASS empty row gives uniform miner incentive to all registered UIDs; dividends continue',JSON.stringify({n,N,incentivePerUid:empty[0]}));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
