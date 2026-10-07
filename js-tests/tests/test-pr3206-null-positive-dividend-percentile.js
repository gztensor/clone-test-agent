import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-positive-dividend-percentile.log');logger.captureConsole();
async function main(){
 await logger.start();
 const data=JSON.parse(fs.readFileSync(new URL('../temp/pr3206-null-dividends-percentile.json',import.meta.url),'utf8'));
 // In this freshly executed clone experiment, the literal global percentile
 // is zero. Its saved rows therefore contain the complete validator population.
 assert.equal(data.cutoffPaidAlphaRao,'0');assert.equal(data.rows.length,data.validatorRoles);
 const earners=data.rows.filter(r=>BigInt(r.beforePaidAlpha)>0n).sort((a,b)=>{const x=BigInt(a.beforePaidAlpha),y=BigInt(b.beforePaidAlpha);return x<y?-1:x>y?1:0;});
 const cutoff=BigInt(earners[Math.ceil(earners.length*.2)-1].beforePaidAlpha),selected=earners.filter(r=>BigInt(r.beforePaidAlpha)>=cutoff);
 function stats(key){const rows=selected.filter(r=>r[key]!==null).sort((a,b)=>a[key]-b[key]),v=rows.map(r=>r[key]),i=v.length>>1;assert.ok(v.length);return {count:v.length,minPercent:v[0],medianPercent:v.length%2?v[i]:(v[i-1]+v[i])/2,maxPercent:v.at(-1),minValidator:rows[0],maxValidator:rows.at(-1)};}
 const result={wasmHash:data.wasmHash,spec:data.spec,subnets:data.subnets,validatorRoles:data.validatorRoles,zeroPayoutRoles:data.validatorRoles-earners.length,positivePayoutRoles:earners.length,interpretation:'exclude zero payouts before computing global 20th percentile; keep >= cutoff among positive pre-switch earners',percentile:20,cutoffPaidAlphaRao:cutoff.toString(),selectedRoles:selected.length,excludedPositiveRoles:earners.length-selected.length,rawPaidDividends:stats('paidChangePercent'),budgetNormalizedPaidDividendShares:stats('paidShareChangePercent'),dividendReports:stats('dividendReportChangePercent'),rows:selected};
 fs.writeFileSync(new URL('../temp/pr3206-null-positive-dividend-percentile.json',import.meta.url),JSON.stringify(result,null,2));const {rows,...summary}=result;console.log('PASS final saved positive-earner percentile analysis',JSON.stringify(summary));
}
main().catch(err=>{console.error(err);process.exit(1);});
