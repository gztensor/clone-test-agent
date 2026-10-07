import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-dividends-above-01-tao.log');logger.captureConsole();
const temp=new URL('../temp/',import.meta.url);
async function main(){
 await logger.start();
 // Preserve previous generated evidence and execute the existing saved chain
 // experiment unchanged against a freshly upgraded clone.
 for(const name of ['pr3206-null-validator-dividends.json','pr3206-null-validator-dividends.log']){const source=new URL(name,temp);if(fs.existsSync(source))fs.copyFileSync(source,new URL(`above-01tao-prior-${Date.now()}-${name}`,temp));}
 const stderr=fs.openSync(new URL('pr3206-null-dividends-above-01-tao-child.stderr.log',temp),'w');
 try{await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[fileURLToPath(new URL('./test-pr3206-null-validator-dividends.js',import.meta.url))],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:['ignore',stderr,stderr]});child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(Error(`saved chain test failed: ${code}, ${signal}`)));});}finally{fs.closeSync(stderr);}
 const source=JSON.parse(fs.readFileSync(new URL('pr3206-null-validator-dividends.json',temp),'utf8'));assert.equal(source.subnets.length,128);
 const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const rows=[],prices=[],cutoffRao=100000000n,Q=1000000000n;let validatorRoles=0;
 for(const s of source.subnets){
 const before=s.snapshotBeforeSwitch,after=s.nullGreen,beforeHash=await api.rpc.chain.getBlockHash(before.block),afterHash=await api.rpc.chain.getBlockHash(after.block),beforeApi=await api.at(beforeHash),afterApi=await api.at(afterHash);
 const beforePrice=BigInt((await beforeApi.call.swapRuntimeApi.currentAlphaPrice(s.n)).toString()),afterPrice=BigInt((await afterApi.call.swapRuntimeApi.currentAlphaPrice(s.n)).toString());assert.ok(beforePrice>0n&&afterPrice>0n);
 prices.push({netuid:s.n,beforeBlock:before.block,afterBlock:after.block,beforePriceRaoPerAlpha:beforePrice.toString(),afterPriceRaoPerAlpha:afterPrice.toString()});
 const sumBefore=Object.values(before.alphaDividends).reduce((a,b)=>a+BigInt(b),0n),sumAfter=Object.values(after.alphaDividends).reduce((a,b)=>a+BigInt(b),0n);
 for(let uid=0;uid<s.N;uid++)if(before.permits[uid]){
 validatorRoles++;const hotkey=s.keys[uid],old=BigInt(before.alphaDividends[hotkey]??0),next=BigInt(after.alphaDividends[hotkey]??0);
 // Strict pre-switch > 0.1 TAO cutoff, evaluated without floating point
 // or truncating a fractional rao at the threshold. Do not filter on outcome.
 if(old*beforePrice<=cutoffRao*Q)continue;assert.ok(sumBefore>0n&&sumAfter>0n);
 const beforeTao=Number(old*beforePrice)/1e18,afterTao=Number(next*afterPrice)/1e18;
 rows.push({netuid:s.n,uid,hotkey,beforeBlock:before.block,afterBlock:after.block,beforeAlphaRao:old.toString(),afterAlphaRao:next.toString(),beforeTao,afterTao,changeTao:afterTao-beforeTao,paidTaoChangePercent:100*(afterTao/beforeTao-1),normalizedDividendShareChangePercent:100*(Number(next)/Number(sumAfter)/(Number(old)/Number(sumBefore))-1),beforeDividendReport:before.dividends[uid],afterDividendReport:after.dividends[uid]});
 }
 console.log('PRICES AND FILTER',s.n,'qualifying cumulative',rows.length);
 }
 assert.ok(rows.length,'at least one validator must qualify for the requested threshold');
 function stats(key){const sorted=[...rows].sort((a,b)=>a[key]-b[key]),v=sorted.map(r=>r[key]),i=v.length>>1;return {count:v.length,min:v[0],median:v.length%2?v[i]:(v[i-1]+v[i])/2,max:v.at(-1),minimumValidator:sorted[0],maximumValidator:sorted.at(-1)};}
 const result={spec:source.spec,wasmHash:source.wasmHash,subnets:source.subnets.length,validatorRoles,thresholdTao:0.1,filter:'pre-switch paid alpha dividends, converted at historical spot price, strictly greater than 0.1 TAO; each subnet-validator role is one observation',selectedRoles:rows.length,selectedSubnets:new Set(rows.map(r=>r.netuid)).size,budgetNormalizedDividendSharePercent:stats('normalizedDividendShareChangePercent'),paidTaoPercent:stats('paidTaoChangePercent'),absoluteTaoChange:stats('changeTao'),queueNormalizationSubnets:source.subnets.filter(s=>s.queueKeysCleared>0).map(s=>s.n),prices,rows};
 fs.writeFileSync(new URL('pr3206-null-dividends-above-01-tao.json',temp),JSON.stringify(result,null,2));fs.copyFileSync(new URL('pr3206-null-validator-dividends.json',temp),new URL('pr3206-null-dividends-above-01-tao-snapshots.json',temp));const {prices:priceDetails,rows:details,...summary}=result;console.log('PASS final saved 0.1 TAO threshold test completed',JSON.stringify(summary));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
