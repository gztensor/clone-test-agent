import assert from 'node:assert/strict';
import {Keyring} from '@polkadot/api';
import {cryptoWaitReady} from '@polkadot/util-crypto';
import {u8aToHex} from '@polkadot/util';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('mainnet-clone-max-allowed-uids-32.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const q=api.query.subtensorModule,a=api.tx.adminUtils,n=Number(process.env.NETUID??1),alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');
 assert.equal((await api.query.sudo.key()).unwrap().toString(),alice.address);
 async function state(){return {runtime:api.runtimeVersion.specVersion.toNumber(),netuid:n,population:(await q.subnetworkN(n)).toNumber(),minimum:(await q.minAllowedUids(n)).toNumber(),maximum:(await q.maxAllowedUids(n)).toNumber()};}
 function decode(e){if(!e.isModule)return e.toString();const d=api.registry.findMetaError(e.asModule);return `${d.section}.${d.name}`;}
 async function root(call){console.log('CALL',call.method.section,call.method.method,call.method.args.toString());return new Promise((resolve,reject)=>{
 let unsub,done=false;const timer=setTimeout(()=>{if(!done){done=true;unsub?.();reject(Error('sudo inclusion timeout'));}},120000);
 api.tx.sudo.sudo(call).signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{
 if(done||(!status.isInBlock&&!status.isFinalized))return;done=true;clearTimeout(timer);unsub?.();let error=dispatchError?decode(dispatchError):null;
 for(const {event}of events){console.log('EVENT',event.section,event.method,event.data.toString());if(event.section==='sudo'&&event.method==='Sudid'&&event.data[0].isErr)error=decode(event.data[0].asErr);}
 resolve({error,hash:(status.isInBlock?status.asInBlock:status.asFinalized).toHex()});}).then(u=>{unsub=u;if(done)u();}).catch(e=>{clearTimeout(timer);reject(e);});
 });}
 async function success(call){const r=await root(call);assert.equal(r.error,null);return r;}
 const before=await state();console.log('ORIGINAL',JSON.stringify(before));assert.ok(before.population>32);assert.ok(before.maximum>=before.population);
 const originalKeys=await q.keys.entries(n),oldHotkeys=originalKeys.map(([,v])=>v.toString());const originalImmunity=(await q.immunityPeriod(n)).toNumber();
 await success(a.sudoSetAdminFreezeWindow(0));await success(a.sudoSetImmunityPeriod(n,0));
 // Use the runtime's real pruning path for complete UID/index cleanup. Temporarily
 // permit pruning below the original minimum; restore that minimum before the test.
 if(before.minimum>32)await success(a.sudoSetMinAllowedUids(n,31));
 await success(a.sudoTrimToMaxAllowedUids(n,32));assert.equal((await q.subnetworkN(n)).toNumber(),32);
 const retained=await q.keys.entries(n);assert.equal(retained.length,32);const survivors=new Set(retained.map(([,v])=>v.toString()));
 for(const [key,hot]of retained){assert.equal((await q.uids(n,hot)).unwrap().toNumber(),key.args[1].toNumber());assert.ok((await q.isNetworkMember(hot,n)).isTrue);}
 let removed=0;for(const hot of oldHotkeys)if(!survivors.has(hot)){assert.ok((await q.uids(n,hot)).isNone);assert.ok((await q.isNetworkMember(hot,n)).isFalse);removed++;}
 assert.equal(removed,before.population-32);console.log('FORCE-DEREGISTRATION VERIFIED',removed,'removed;',survivors.size,'remain');
 await success(a.sudoSetMaxAllowedUids(n,before.maximum));
 if(before.minimum>32){
 // The public minimum setter rejects minimum > current population. Restore the
 // original raw minimum to reproduce forced deregistration without changing policy.
 const f=q.minAllowedUids,type=api.registry.createLookupType(f.creator.meta.type.asMap.value);
 await success(api.tx.system.setStorage([[f.key(n),u8aToHex(api.createType(type,before.minimum).toU8a())]]));
 }
 await success(a.sudoSetImmunityPeriod(n,originalImmunity));
 console.log('BEFORE REQUESTED CALL',JSON.stringify(await state()));
 const requested=await root(a.sudoSetMaxAllowedUids(n,32));console.log('REQUESTED CALL RESULT',JSON.stringify(requested),'STATE',JSON.stringify(await state()));
 if(before.minimum>32){
 assert.equal(requested.error,'adminUtils.MaxAllowedUidsLessThanMinAllowedUids');assert.equal((await q.maxAllowedUids(n)).toNumber(),before.maximum);
 console.log('PASS original minimum blocks max=32 even with exactly 32 registered UIDs');
 // Separate control: change the minimum explicitly, then repeat the exact call.
 await success(a.sudoSetMinAllowedUids(n,31));const control=await success(a.sudoSetMaxAllowedUids(n,32));assert.equal((await q.maxAllowedUids(n)).toNumber(),32);console.log('CONTROL SUCCESS after explicitly lowering minimum to 31',JSON.stringify(control));
 }else{assert.equal(requested.error,null);assert.equal((await q.maxAllowedUids(n)).toNumber(),32);}
 console.log('PASS final saved test complete; no runtime upgrade performed; FINAL',JSON.stringify(await state()));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
