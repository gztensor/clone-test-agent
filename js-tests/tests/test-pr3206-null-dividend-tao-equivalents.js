import assert from 'node:assert/strict';
import fs from 'node:fs';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-dividend-tao-equivalents.log');logger.captureConsole();
async function main(){
 await logger.start();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const source=JSON.parse(fs.readFileSync(new URL('../temp/pr3206-null-positive-dividend-percentile.json',import.meta.url),'utf8')),rows=[];
 for(const [label,key]of [['largest normalized decrease','minValidator'],['largest normalized increase','maxValidator']]){
 const s=source.budgetNormalizedPaidDividendShares[key],beforeHash=await api.rpc.chain.getBlockHash(s.beforeBlock),afterHash=await api.rpc.chain.getBlockHash(s.afterBlock);
 const beforeApi=await api.at(beforeHash),afterApi=await api.at(afterHash);
 const beforePrice=BigInt((await beforeApi.call.swapRuntimeApi.currentAlphaPrice(s.netuid)).toString()),afterPrice=BigInt((await afterApi.call.swapRuntimeApi.currentAlphaPrice(s.netuid)).toString());
 assert.ok(beforePrice>0n&&afterPrice>0n);const beforeAlpha=BigInt(s.beforePaidAlpha),afterAlpha=BigInt(s.afterPaidAlpha),beforeRao=beforeAlpha*beforePrice/1000000000n,afterRao=afterAlpha*afterPrice/1000000000n;
 rows.push({label,netuid:s.netuid,uid:s.uid,beforeBlock:s.beforeBlock,afterBlock:s.afterBlock,beforeAlpha:Number(beforeAlpha)/1e9,afterAlpha:Number(afterAlpha)/1e9,beforeTaoPerAlpha:Number(beforePrice)/1e9,afterTaoPerAlpha:Number(afterPrice)/1e9,beforeTao:Number(beforeRao)/1e9,afterTao:Number(afterRao)/1e9,changeTao:Number(afterRao-beforeRao)/1e9});
 }
 fs.writeFileSync(new URL('../temp/pr3206-null-dividend-tao-equivalents.json',import.meta.url),JSON.stringify(rows,null,2));console.log('PASS historical snapshot price conversions',JSON.stringify(rows));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
