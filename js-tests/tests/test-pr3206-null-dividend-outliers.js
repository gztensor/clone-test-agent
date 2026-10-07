import assert from 'node:assert/strict';
import fs from 'node:fs';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-dividend-outliers.log');logger.captureConsole();
async function main(){
 await logger.start();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const source=JSON.parse(fs.readFileSync(new URL('../temp/pr3206-null-dividends-per-361-blocks.json',import.meta.url),'utf8')),result=[];
 for(const n of [95,66,61,44]){
 const saved=source.snapshots.find(s=>s.netuid===n),phases=[];
 for(const phase of ['before','after']){
 // Read the same block as the saved report. The parent block can precede
 // in-block root/delegation accounting that changes effective stake.
 const snapshot=saved[phase],hash=await api.rpc.chain.getBlockHash(snapshot.block),at=await api.at(hash),q=at.query.subtensorModule,N=(await q.subnetworkN(n)).toNumber(),hotkeys=(await q.keys.multi(Array.from({length:N},(_,uid)=>[n,uid]))).map(v=>v.toString()),parents=await q.parentKeys.multi(hotkeys.map(h=>[h,n])),children=await q.childKeys.multi(hotkeys.map(h=>[h,n])),accounts=[...new Set([...hotkeys,...parents.flatMap(v=>v.map(p=>p[1].toString()))])],values=await q.totalHotkeyAlpha.multi(accounts.flatMap(h=>[[h,n],[h,0]])),balances=new Map();accounts.forEach((h,i)=>balances.set(h,[BigInt(values[2*i].toString()),BigInt(values[2*i+1].toString())]));
 const subnetOwner=(await q.subnetOwnerHotkey(n)).toString(),suspensions=await q.childkeyThresholdSuspended.multi(accounts),suspended=new Set(accounts.filter((h,i)=>suspensions[i].isSome&&h!==subnetOwner));
 // Stored child links can be inert. Match get_children/get_parents, including
 // the owner exception, rather than counting suspended delegation balances.
 const liveParents=parents.map(row=>row.filter(p=>!suspended.has(p[1].toString()))),liveChildren=children.map((row,uid)=>suspended.has(hotkeys[uid])?[]:row);
 const Q=1n<<32n,U=(1n<<64n)-1n,taoWeight=BigInt((await q.taoWeight()).toString())*Q/U,stakes=hotkeys.map((hot,uid)=>balances.get(hot).map((v,asset)=>{const sent=liveChildren[uid].reduce((sum,p)=>sum+v*(BigInt(p[0].toString())*Q/U),0n),received=liveParents[uid].reduce((sum,p)=>sum+balances.get(p[1].toString())[asset]*(BigInt(p[0].toString())*Q/U),0n);return ((v*Q>sent?v*Q-sent:0n)+received)/Q;})),effective=stakes.map(([alpha,tao])=>alpha*Q+tao*taoWeight),total=effective.reduce((a,b)=>a+b,0n),ownerHotkey=subnetOwner,ownerUid=hotkeys.indexOf(ownerHotkey),taobotUid=hotkeys.indexOf('5E2LP6EnZ54m3wS8s1yPvD5c3xo71kQroBw7aUVK32TKeZ5u'),totalPaid=Object.values(snapshot.alphaDividends).reduce((a,b)=>a+BigInt(b),0n);
 const important=[...new Set([ownerUid,taobotUid,...snapshot.dividends.map((v,uid)=>[uid,v]).sort((a,b)=>b[1]-a[1]).slice(0,5).map(v=>v[0])])].filter(uid=>uid>=0),rows=[];
 for(const uid of important){const hotkey=hotkeys[uid],weights=(await q.weights(n,uid)).toJSON(),bonds=(await q.bonds(n,uid)).toJSON(),paid=BigInt(snapshot.alphaDividends[hotkey]??0);rows.push({uid,hotkey,isOwner:uid===ownerUid,isTaobot:uid===taobotUid,rawAlpha:Number(balances.get(hotkey)[0])/1e9,rawRootTao:Number(balances.get(hotkey)[1])/1e9,inheritedAlpha:Number(stakes[uid][0])/1e9,inheritedRootTao:Number(stakes[uid][1])/1e9,effectiveStakeShare:Number(effective[uid])/Number(total),dividendReportShare:snapshot.dividends[uid]/65535,paidAlpha:Number(paid)/1e9,paidShare:totalPaid?Number(paid)/Number(totalPaid):0,permit:snapshot.permits[uid],active:(await q.active(n))[uid]?.isTrue,lastUpdate:(await q.lastUpdate(n))[uid]?.toString(),weightsCount:weights.length,selfOnly:weights.length===1&&weights[0][0]===uid,weightRow:weights,bondsCount:bonds.length,bondRow:bonds,delegateTakePercent:(await q.delegates(hotkey)).toNumber()/65535*100,childkeyTakePercent:(await q.childkeyTake(hotkey,n)).toNumber()/65535*100,parents:parents[uid].toJSON(),children:children[uid].toJSON()});}
 if(phase==='after')for(const row of rows){console.log('STAKE COMPARISON',n,row.uid,row.effectiveStakeShare,row.dividendReportShare);assert.ok(Math.abs(row.effectiveStakeShare-row.dividendReportShare)<0.0001,'Null report must match effective stake share');}
 const payers=Object.keys(snapshot.alphaDividends),takes=await q.delegates.multi(payers);let grossAlpha=0;for(let i=0;i<payers.length;i++){const take=takes[i].toNumber();assert.ok(take<65535,'recorded nominator payout must have a nonzero net fraction');grossAlpha+=Number(snapshot.alphaDividends[payers[i]])/1e9*65535/(65535-take);}
 phases.push({phase,epochBlock:snapshot.block,elapsed:snapshot.elapsed,ownerUid,ownerHotkey,yuma3On:(await q.yuma3On(n)).isTrue,totalEffectiveStake:Number(total)/Number(Q)/1e9,totalPaidAlpha:Number(totalPaid)/1e9,totalPaidAlphaPerBlock:Number(totalPaid)/1e9/snapshot.elapsed,reconstructedGrossAlphaPerBlock:grossAlpha/snapshot.elapsed,estimatedWeightedDelegateTakePercent:100*(1-Number(totalPaid)/1e9/grossAlpha),rows});
 }
 result.push({netuid:n,phases});console.log('OUTLIER',JSON.stringify(result.at(-1)));
 }
 fs.writeFileSync(new URL('../temp/pr3206-null-dividend-outliers.json',import.meta.url),JSON.stringify(result,null,2));console.log('PASS final saved historical outlier investigation; effective stake shares verified');
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
