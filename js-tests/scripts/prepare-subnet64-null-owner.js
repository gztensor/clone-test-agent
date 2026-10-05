import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Keyring} from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';
import {cryptoWaitReady} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('subnet64-null-owner.log');logger.captureConsole();
async function main(){
 await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');const q=api.query.subtensorModule,n=64;
 assert.equal((await api.query.sudo.key()).unwrap().toString(),alice.address);assert.equal(api.runtimeVersion.specVersion.toNumber(),474);assert.ok((await q.networksAdded(n)).isTrue);
 const before={owner:(await q.subnetOwner(n)).toString(),mode:(await q.subnetEpochConsensus(n)).toString(),population:(await q.subnetworkN(n)).toNumber(),mechanisms:(await q.mechanismCountCurrent(n)).toNumber(),block:(await api.rpc.chain.getHeader()).number.toNumber()};
 fs.writeFileSync(new URL('../temp/subnet64-owner-before.json',import.meta.url),JSON.stringify(before,null,2));console.log('BEFORE',JSON.stringify(before));
 async function root(call){return new Promise((resolve,reject)=>{
 let unsub,done=false;const timer=setTimeout(()=>{if(!done){done=true;unsub?.();reject(Error('sudo inclusion timed out'));}},120000);
 api.tx.sudo.sudo(call).signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{
 if(done||(!status.isInBlock&&!status.isFinalized))return;done=true;clearTimeout(timer);unsub?.();
 if(dispatchError)return reject(Error(dispatchError.toString()));
 for(const {event}of events){console.log('EVENT',event.section,event.method,event.data.toString());if(event.section==='sudo'&&event.method==='Sudid'&&event.data[0].isErr)return reject(Error(event.data[0].toString()));}
 resolve();}).then(u=>{unsub=u;if(done)u();}).catch(e=>{clearTimeout(timer);reject(e);});
 });}
 const ownerType=api.registry.createLookupType(q.subnetOwner.creator.meta.type.asMap.value);
 await root(api.tx.system.setStorage([[q.subnetOwner.key(n),u8aToHex(api.createType(ownerType,alice.address).toU8a())]]));
 // Snapshot timelocks reference mainnet epochs and can prevent a local mode switch.
 const commitKeys=[];for(let mechanism=0;mechanism<16;mechanism++){const index=n+4096*mechanism;commitKeys.push(...await q.timelockedWeightCommits.keys(index));}
 if(commitKeys.length)await root(api.tx.system.killStorage(commitKeys.map(k=>k.toHex())));
 const rateKeys=(await q.lastRateLimitedBlock.keys()).filter(key=>key.args[0].type==='OwnerHyperparamUpdate'&&key.args[0].value[0].toNumber()===n);
 if(rateKeys.length)await root(api.tx.system.killStorage(rateKeys.map(key=>key.toHex())));
 console.log('Reset inherited owner-hyperparameter timestamps for subnet 64:',rateKeys.length);
 // Open the local demonstration's administration window; production owners retain
 // their normal freeze windows and cooldowns.
 await root(api.tx.adminUtils.sudoSetAdminFreezeWindow(0));
 assert.equal((await q.subnetOwner(n)).toString(),alice.address);assert.equal((await q.subnetEpochConsensus(n)).toString(),'Yuma');
 const after={owner:(await q.subnetOwner(n)).toString(),ownerHotkey:(await q.subnetOwnerHotkey(n)).toString(),mode:(await q.subnetEpochConsensus(n)).toString(),population:(await q.subnetworkN(n)).toNumber(),mechanisms:(await q.mechanismCountCurrent(n)).toNumber(),capacity:(await q.maxAllowedUids(n)).toNumber(),runtime:api.runtimeVersion.specVersion.toNumber(),clearedTimelockKeys:commitKeys.length,block:(await api.rpc.chain.getHeader()).number.toNumber()};
 console.log('PASS Alice owns subnet 64; Yuma retained for user CLI switch',JSON.stringify(after));fs.writeFileSync(new URL('../temp/subnet64-null-ready.json',import.meta.url),JSON.stringify(after,null,2));
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
