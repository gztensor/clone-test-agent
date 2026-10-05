import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { connectApi } from '../lib/api.js';
import { createTempLogger } from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-consensus-e2e.log');
logger.captureConsole();
let api, alice;
function errorName(e) { return e.isModule ? api.registry.findMetaError(e.asModule).name : e.toString(); }
async function submit(tx, signer=alice, expected) {
 console.log('CALL',tx.method.section,tx.method.method,expected??'success');
 const outcome=await new Promise((resolve,reject)=>{
 let unsub,done=false;
 const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);unsub?.();err?reject(err):resolve(value);};
 const timer=setTimeout(()=>finish(Error('transaction inclusion timeout')),120000);
 tx.signAndSend(signer,{nonce:-1},({status,events,dispatchError})=>{
 if(status.isInvalid||status.isDropped||status.isUsurped) return finish(Error(status.toString()));
 if(!status.isInBlock && !status.isFinalized)return;
 let error=dispatchError?errorName(dispatchError):null;
 for(const {event} of events) {
 console.log('EVENT',event.section,event.method,event.data.toString());
 if(event.section==='sudo' && ['Sudid','SudoAsDone'].includes(event.method) && event.data[0].isErr) error=errorName(event.data[0].asErr);
 }
 finish(null,{error,hash:(status.isInBlock?status.asInBlock:status.asFinalized).toHex()});
 }).then(u=>{unsub=u;if(done)u();}).catch(e=>finish(e));
 });
 if(expected) assert.equal(outcome.error,expected); else assert.equal(outcome.error,null);
 return outcome;
}
async function root(call,expected) {return submit(api.tx.sudo.sudo(call),alice,expected);}
async function store(items) {
 const pairs=[];
 for(const [name,args,value] of items) {
 const q=api.query.subtensorModule[name];assert.ok(q,`missing storage ${name}`);
 const old=await q(...args);
 pairs.push([q.key(...args),u8aToHex(api.createType(old.toRawType(),value).toU8a())]);
 }
 return root(api.tx.system.setStorage(pairs));
}
async function epoch(netuid) {
 const before=(await api.query.subtensorModule.lastMechansimStepBlock(netuid)).toNumber();
 await submit(api.tx.subtensorModule.triggerEpoch(netuid));
 const deadline=Date.now()+120000;
 while(Date.now()<deadline) {
 const last=(await api.query.subtensorModule.lastMechansimStepBlock(netuid)).toNumber();
 if(last>before){const values=(await api.query.subtensorModule.emission(netuid)).map(x=>BigInt(x.toString()));console.log('EPOCH',last,JSON.stringify(values.map(String)));assert.ok(values.some(x=>x>0n),'epoch must produce nonzero emissions');return values;}
 await new Promise(r=>setTimeout(r,1000));
 }
 throw Error('forced epoch did not complete');
}
async function main() {
 await logger.start();await cryptoWaitReady();
 api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try {
 const keyring=new Keyring({type:'sr25519'});
 alice=keyring.addFromUri('//Alice');const bob=keyring.addFromUri('//Bob');const charlie=keyring.addFromUri('//Charlie');
 const hot=keyring.addFromUri('//PR3206//validator');const miner1=keyring.addFromUri('//PR3206//miner1');const miner2=keyring.addFromUri('//PR3206//miner2');
 assert.equal((await api.query.sudo.key()).unwrap().toString(),alice.address);
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);
 console.log('RUNTIME',api.runtimeVersion.specVersion.toString());
 const a=api.tx.adminUtils;
 await root(api.tx.utility.batchAll([a.sudoSetNetworkRateLimit(0),a.sudoSetTxRateLimit(0),a.sudoSetOwnerHparamRateLimit(0),a.sudoSetAdminFreezeWindow(0),a.sudoSetStartCallDelay(0)]));
 // Mainnet snapshot start heights are in the future relative to clone block zero.
 await store([['networkRegistrationStartBlock',[],0],['subnetLimit',[],1024]]);
 await submit(api.tx.subtensorModule.registerNetwork(hot.address));
 const entries=await api.query.subtensorModule.networksAdded.entries();
 const n=Math.max(...entries.filter(([,v])=>v.isTrue).map(([k])=>k.args[0].toNumber()));console.log('NETUID',n);
 const q=api.query.subtensorModule;
 assert.equal((await q.subnetOwner(n)).toString(),alice.address);
 const limit=(await q.maxAllowedValidators(n)).toNumber();
 await root(api.tx.utility.batchAll([a.sudoSetWeightsSetRateLimit(n,0),a.sudoSetMinAllowedWeights(n,0),a.sudoSetCommitRevealWeightsEnabled(n,false),a.sudoSetNetworkRegistrationAllowed(n,true)]));
 await submit(a.sudoSetEpochConsensus(n,'Null'));
 assert.equal((await q.subnetEpochConsensus(n)).toString(),'Null');
 assert.equal((await q.savedYumaMaxAllowedValidators(n)).unwrap().toNumber(),limit);
 assert.deepEqual((await q.validatorPermit(n)).toJSON(),[true]);
 await submit(api.tx.balances.transferKeepAlive(bob.address,1000000000000n));
 await submit(api.tx.balances.transferKeepAlive(charlie.address,1000000000000n));
 await submit(a.sudoSetEpochConsensus(n,'Yuma'),bob,'BadOrigin');
 await root(a.sudoSetEpochConsensus(0,'Null'),'InvalidValue');
 await submit(a.sudoSetMaxAllowedUids(n,2500));assert.equal((await q.maxAllowedUids(n)).toNumber(),2500);
 await submit(a.sudoSetMaxAllowedUids(n,2501),alice,'MaxAllowedUidsGreaterThanDefaultMaxAllowedUids');
 await submit(a.sudoSetMaxAllowedUids(n,256));
 await submit(api.tx.subtensorModule.burnedRegister(n,miner1.address),bob);
 await submit(api.tx.subtensorModule.burnedRegister(n,miner2.address),charlie);
 await submit(api.tx.subtensorModule.startCall(n));
 await submit(api.tx.subtensorModule.addStake(hot.address,n,100000000000n));
 await submit(api.tx.subtensorModule.setWeights(n,[1,2],[3,1],0),hot);
 assert.deepEqual((await q.weights(n,0)).toJSON(),[[1,3],[2,1]]);
 const first=await epoch(n);assert.equal(first.length,3);assert.ok(first[1]>0n&&first[2]>0n);assert.ok(first[1]-3n*first[2]>=-3n&&first[1]-3n*first[2]<=3n,'exact 3:1 miner ratio');
 await submit(a.sudoSetEpochConsensus(n,'Yuma'));assert.equal((await q.maxAllowedValidators(n)).toNumber(),limit);assert.ok((await q.savedYumaMaxAllowedValidators(n)).isNone);
 await epoch(n);await submit(a.sudoSetEpochConsensus(n,'Null'));
 const bonds=(await q.bonds(n,0)).toHex();
 const again=await epoch(n);assert.ok(again[1]-3n*again[2]>=-3n&&again[1]-3n*again[2]<=3n);assert.equal((await q.bonds(n,0)).toHex(),bonds,'Null preserves bonds');
 fs.writeFileSync(new URL('../temp/pr3206-feature-fixture.json',import.meta.url),JSON.stringify({netuid:n,runtime:474},null,2));
 console.log('PASS mode selection, origins, capacity boundaries, exact raw weights, real emissions, round trip and frozen bonds');
 } finally {await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
