import assert from 'node:assert/strict';
import fs from 'node:fs';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const phase=process.env.STRESS_PHASE??'baseline';
const minimumBlocks=Number(process.env.STRESS_MIN_BLOCKS??(phase==='baseline'?128:160));
const logger=createTempLogger(`pr3206-block-production-${phase}.log`);logger.captureConsole();
const wanted=Array.from({length:128},(_,i)=>i+1);
function percentile(values,p){const s=[...values].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor((s.length-1)*p))]??null;}
async function main(){
 await logger.start();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);assert.ok(['baseline','stress'].includes(phase));
 const q=api.query.subtensorModule,rows=[];
 for(const n of wanted){const N=(await q.subnetworkN(n)).toNumber(),mode=(await q.subnetEpochConsensus(n)).toString();assert.equal(N,phase==='stress'&&n<=64?2000:256);assert.equal(mode,phase==='stress'&&n<=64?'Null':'Yuma');assert.equal((await q.mechanismCountCurrent(n)).toNumber(),1);rows.push({netuid:n,N,mode});}
 console.log('START',phase,'minimum blocks',minimumBlocks,'population',JSON.stringify(rows));
 let processed=0,previousTimestamp=null,previousArrival=null,previousObservedHeight=null;
 const slotDeltas=[],slotGaps=[],arrivalDeltas=[],samples=[],seen=new Map();let deferred=0,skipped=0;
 const deadline=Date.now()+4*60*60*1000;let lastAdvance=Date.now();
 // Include early epochs produced during readiness checks, without assigning fabricated
 // arrival times to historical blocks. Timing samples start at the live observation point.
 while(Date.now()<deadline){
 const head=await api.rpc.chain.getHeader();const latest=head.number.toNumber();const arrival=Date.now();
 if(latest===processed){assert.ok(Date.now()-lastAdvance<180000,'block production stalled for 180 seconds');await new Promise(r=>setTimeout(r,500));continue;}
 assert.ok(latest>processed,'chain height regressed');lastAdvance=arrival;
 let liveArrivalDelta=null;if(previousObservedHeight!==null&&latest===previousObservedHeight+1){liveArrivalDelta=arrival-previousArrival;arrivalDeltas.push(liveArrivalDelta);}
 previousObservedHeight=latest;previousArrival=arrival;
 for(let block=processed+1;block<=latest;block++){
 const hash=await api.rpc.chain.getBlockHash(block);const [timestamp,events]=await Promise.all([api.query.timestamp.now.at(hash),api.query.system.events.at(hash)]);
 const ms=timestamp.toNumber(),slotDelta=previousTimestamp===null?null:ms-previousTimestamp;if(slotDelta!==null){slotDeltas.push(slotDelta);slotGaps.push(Math.floor(ms/12000)-Math.floor(previousTimestamp/12000));}previousTimestamp=ms;
 const epochs=[];
 for(const {event} of events){if(event.section!=='subtensorModule')continue;
 if(event.method==='EpochDeferred')deferred++;
 if(event.method==='EpochSkipped')skipped++;
 if(event.method==='IncentiveAlphaEmittedToMiners'){
 const n=event.data[0].toNumber();if(!wanted.includes(n))continue;
 const payouts=event.data[1].map(x=>BigInt(x.toString()));const sum=payouts.reduce((x,y)=>x+y,0n);
 assert.equal(payouts.length,rows[n-1].N,`epoch payout vector length subnet ${n}`);assert.ok(sum>0n,`zero miner emissions on subnet ${n}`);
 const positive=payouts.filter(x=>x>0n).length;const old=seen.get(n)??{epochs:0,firstBlock:block,lastBlock:block,minerTotal:'0',positive:0};old.epochs++;old.lastBlock=block;old.minerTotal=(BigInt(old.minerTotal)+sum).toString();old.positive=positive;seen.set(n,old);epochs.push({netuid:n,N:payouts.length,sum:sum.toString(),positive});
 }
 }
 const sample={block,hash:hash.toHex(),timestamp:ms,slotDeltaMs:slotDelta,arrivalDeltaMs:block===latest?liveArrivalDelta:null,epochs,covered:seen.size,deferred,skipped};samples.push(sample);console.log('BLOCK',JSON.stringify(sample));
 }
 processed=latest;
 if(samples.length>=minimumBlocks&&seen.size===wanted.length)break;
 }
 assert.equal(seen.size,128,'every subnet must execute a funded epoch during observation');assert.ok(samples.length>=minimumBlocks,'minimum timing sample size not reached');assert.equal(skipped,0,'inconsistent fixture skipped epochs');
 for(const n of wanted){const values=(await q.emission(n)).map(x=>BigInt(x.toString()));assert.equal(values.length,rows[n-1].N);assert.ok(values.some(x=>x>0n));const permits=(await q.validatorPermit(n)).filter(x=>x.isTrue).length;if(phase==='stress'&&n<=64)assert.equal(permits,1);}
 const missedSlots=slotGaps.reduce((total,gap)=>total+Math.max(0,gap-1),0);const delayedArrivals=arrivalDeltas.filter(x=>x>18000).length;
 const summary={phase,runtime:474,minimumBlocks,observedBlocks:samples.length,startBlock:samples[0].block,endBlock:samples.at(-1).block,subnets:128,null2000Subnets:phase==='stress'?64:0,yuma256Subnets:phase==='stress'?64:128,epochCoverage:[...seen].map(([netuid,details])=>({netuid,...details})),slotMs:{p50:percentile(slotDeltas,.5),p95:percentile(slotDeltas,.95),p99:percentile(slotDeltas,.99),max:Math.max(...slotDeltas),missedSlots},arrivalMs:{samples:arrivalDeltas.length,p50:percentile(arrivalDeltas,.5),p95:percentile(arrivalDeltas,.95),p99:percentile(arrivalDeltas,.99),max:Math.max(...arrivalDeltas),over18Seconds:delayedArrivals},deferred,skipped,delayed:missedSlots>0||delayedArrivals>0};
 fs.writeFileSync(new URL(`../temp/pr3206-block-production-${phase}.json`,import.meta.url),JSON.stringify(summary,null,2));console.log('PASS every subnet emitted nonzero rewards; SUMMARY',JSON.stringify(summary));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
