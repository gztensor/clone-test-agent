import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-dividends-percentile.log');logger.captureConsole();
const temp=new URL('../temp/',import.meta.url);
function statistics(rows,key){const sorted=[...rows].sort((a,b)=>a[key]-b[key]),values=sorted.map(v=>v[key]),middle=values.length>>1;return {count:rows.length,minimumPercent:values[0],maximumPercent:values.at(-1),medianPercent:values.length%2?values[middle]:(values[middle-1]+values[middle])/2,minimumValidator:sorted[0],maximumValidator:sorted.at(-1)};}
async function main(){
 await logger.start();
 // Run the historical saved behavioral test unchanged on a freshly upgraded
 // clone. Preserve the previous investigation's generated evidence first.
 for(const name of ['pr3206-null-validator-dividends.json','pr3206-null-validator-dividends.log']){const source=new URL(name,temp);if(fs.existsSync(source))fs.copyFileSync(source,new URL(`percentile-prior-${Date.now()}-${name}`,temp));}
 const stderr=fs.openSync(new URL('pr3206-null-dividends-percentile-child.stderr.log',temp),'w');
 try{await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[fileURLToPath(new URL('./test-pr3206-null-validator-dividends.js',import.meta.url))],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:['ignore',stderr,stderr]});child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(Error(`saved behavioral test failed: ${code}, ${signal}`)));});}finally{fs.closeSync(stderr);}
 const data=JSON.parse(fs.readFileSync(new URL('pr3206-null-validator-dividends.json',temp),'utf8'));assert.equal(data.subnets.length,128);
 const rows=[];for(const s of data.subnets){const before=s.snapshotBeforeSwitch,after=s.nullGreen;assert.ok(before&&after);assert.deepEqual(before.dividends,s.yuma.dividends);const totalBefore=Object.values(before.alphaDividends).reduce((sum,v)=>sum+BigInt(v),0n),totalAfter=Object.values(after.alphaDividends).reduce((sum,v)=>sum+BigInt(v),0n);
 for(let uid=0;uid<s.N;uid++)if(before.permits[uid]){const hotkey=s.keys[uid],old=BigInt(before.alphaDividends[hotkey]??0),next=BigInt(after.alphaDividends[hotkey]??0);rows.push({netuid:s.n,uid,hotkey,beforeBlock:before.block,afterBlock:after.block,beforePaidAlpha:old.toString(),afterPaidAlpha:next.toString(),beforeTotalPaidAlpha:totalBefore.toString(),afterTotalPaidAlpha:totalAfter.toString(),beforeDividendReport:before.dividends[uid],afterDividendReport:after.dividends[uid],paidChangePercent:old?100*(Number(next)/Number(old)-1):null,paidShareChangePercent:old&&totalBefore&&totalAfter?100*(Number(next)/Number(totalAfter)/(Number(old)/Number(totalBefore))-1):null,dividendReportChangePercent:before.dividends[uid]>0?100*(after.dividends[uid]/before.dividends[uid]-1):null});}}
 // Global nearest-rank 20th percentile of pre-switch paid alpha dividends.
 // Each (subnet, UID) validator role is one observation. Keep cutoff ties.
 const ranked=[...rows].sort((a,b)=>{const x=BigInt(a.beforePaidAlpha),y=BigInt(b.beforePaidAlpha);return x<y?-1:x>y?1:0;}),cutoff=BigInt(ranked[Math.ceil(rows.length*.2)-1].beforePaidAlpha);
 const selected=rows.filter(v=>BigInt(v.beforePaidAlpha)>=cutoff),paid=selected.filter(v=>v.paidChangePercent!==null),share=selected.filter(v=>v.paidShareChangePercent!==null),report=selected.filter(v=>v.dividendReportChangePercent!==null);assert.ok(share.length&&paid.length&&report.length);
 const result={wasmHash:data.wasmHash,spec:data.spec,subnets:data.subnets.length,percentile:20,interpretation:'keep >= global 20th percentile, excluding bottom 20%; rank by pre-switch paid alpha dividends',percentileMethod:'nearest rank, include cutoff ties',validatorRoles:rows.length,cutoffPaidAlphaRao:cutoff.toString(),selectedRoles:selected.length,excludedRoles:rows.length-selected.length,undefinedZeroBaselinePercentages:selected.filter(v=>v.paidChangePercent===null).length,rawPaidDividends:statistics(paid,'paidChangePercent'),budgetNormalizedPaidDividendShares:statistics(share,'paidShareChangePercent'),dividendReports:statistics(report,'dividendReportChangePercent'),queueNormalizationSubnets:data.subnets.filter(s=>s.queueKeysCleared>0).map(s=>s.n),rows:selected};
 fs.writeFileSync(new URL('pr3206-null-dividends-percentile.json',temp),JSON.stringify(result,null,2));fs.copyFileSync(new URL('pr3206-null-validator-dividends.json',temp),new URL('pr3206-null-dividends-percentile-snapshots.json',temp));
 const {rows:details,...summary}=result;console.log('PASS final saved percentile test completed after fresh clone upgrade',JSON.stringify(summary));
}
main().catch(err=>{console.error(err);process.exit(1);});
