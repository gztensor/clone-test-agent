import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Keyring} from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';
import {cryptoWaitReady,blake2AsHex} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('runtime-474-abc-baseline.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule,n=Number(process.env.NETUID??1),alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);
 const wasm=fs.readFileSync(new URL('../../subtensor-reference/target/release/wbuild/node-subtensor-runtime/node_subtensor_runtime.compact.compressed.wasm',import.meta.url));
 const hash=blake2AsHex(wasm);assert.equal(blake2AsHex(Buffer.from((await api.rpc.state.getStorage('0x3a636f6465')).unwrap().toHex().slice(2),'hex')),hash);
 const N=(await q.subnetworkN(n)).toNumber(),M=(await q.mechanismCountCurrent(n)).toNumber();
 const configuration={netuid:n,population:N,mechanisms:M,minimum:(await q.minAllowedUids(n)).toNumber(),maximum:(await q.maxAllowedUids(n)).toNumber(),consensus:(await q.subnetEpochConsensus(n)).toString(),wasmHash:hash};console.log('A CONFIGURATION',JSON.stringify(configuration));
 function item(name,args,value){const f=q[name],m=f.creator.meta.type,id=api.registry.createLookupType(m.isMap?m.asMap.value:m.asPlain);return [f.key(...args),u8aToHex(api.createType(id,value).toU8a())];}
 async function root(pairs){return new Promise((resolve,reject)=>{let unsub,done=false;const timer=setTimeout(()=>{done=true;unsub?.();reject(Error('inclusion timeout'));},120000);api.tx.sudo.sudo(api.tx.system.setStorage(pairs)).signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{if(done||(!status.isInBlock&&!status.isFinalized))return;done=true;clearTimeout(timer);unsub?.();if(dispatchError)return reject(Error(dispatchError.toString()));for(const {event}of events)if(event.section==='sudo'&&event.method==='Sudid'&&event.data[0].isErr)return reject(Error(event.data[0].toString()));resolve();}).then(u=>{unsub=u;if(done)u();}).catch(reject);});}
 const samples=[];
 // Preserve the subnet's population, consensus, mechanism count and submitted
 // weights. Normalize clone chronology so existing weights can participate.
 // Funding and scheduling are identical for each repeated measured epoch.
 for(let repetition=0;repetition<10;repetition++){
 const now=(await api.rpc.chain.getHeader()).number.toNumber(),pairs=[item('pendingEpochAt',[n],now+2),item('lastEpochBlock',[n],now),item('blocksSinceLastStep',[n],0),item('pendingServerEmission',[n],1000000000),item('pendingValidatorEmission',[n],1000000000),item('pendingRootAlphaDivs',[n],0),item('pendingOwnerCut',[n],0)];
 for(let m=0;m<M;m++){const index=n+4096*m;pairs.push(item('lastUpdate',[index],Array(N).fill(now)));}
 for(let uid=0;uid<N;uid++)pairs.push(item('blockAtRegistration',[n,uid],0));
 await root(pairs);let processed=now,found=false;const deadline=Date.now()+180000;
 while(!found&&Date.now()<deadline){const head=(await api.rpc.chain.getHeader()).number.toNumber();for(let block=processed+1;block<=head;block++){
 const bh=await api.rpc.chain.getBlockHash(block),events=await api.query.system.events.at(bh),epochs=[];let target=false;
 for(const {event}of events){if(event.section!=='subtensorModule')continue;if(event.method==='EpochSkipped'&&event.data[0].toNumber()===n)throw Error('target epoch skipped');if(event.method!=='IncentiveAlphaEmittedToMiners')continue;const index=event.data[0].toNumber(),values=event.data[1].map(v=>BigInt(v.toString()));epochs.push({index,positive:values.filter(v=>v>0n).length,total:values.reduce((a,b)=>a+b,0n).toString()});if(index%4096===n){assert.equal(values.length,N);assert.ok(values.some(v=>v>0n),'target must emit nonzero miner rewards');target=true;}}
 if(target){samples.push({repetition,block,epochs});console.log('EPOCH',JSON.stringify(samples.at(-1)));found=true;break;}}
 processed=head;if(!found)await new Promise(r=>setTimeout(r,500));}assert.ok(found,'target epoch was not executed');
 }
 const text=fs.readFileSync(new URL('../temp/abc-474-builder.log',import.meta.url),'utf8'),timings=new Map([...text.matchAll(/Prepared block for proposing at (\d+) \((\d+) ms\)/g)].map(m=>[Number(m[1]),Number(m[2])]));
 for(const s of samples){assert.ok(timings.has(s.block),'builder timing must exist');s.preparedMs=timings.get(s.block);}
 const sorted=samples.map(s=>s.preparedMs).sort((a,b)=>a-b),result={configuration,samples,medianMs:(sorted[4]+sorted[5])/2,minMs:sorted[0],maxMs:sorted.at(-1)};
 fs.writeFileSync(new URL('../temp/runtime-474-abc-baseline.json',import.meta.url),JSON.stringify(result,null,2));console.log('PASS A',JSON.stringify(result));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
