import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { connectApi } from '../lib/api.js';
import { createTempLogger } from '../lib/file-log.js';
const logger=createTempLogger('pr3206-null-consensus-boundaries.log');
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
 console.log('STATUS',status.toString());
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
async function main(){
 await logger.start();await cryptoWaitReady();api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const keyring=new Keyring({type:'sr25519'});alice=keyring.addFromUri('//Alice');
 const hot=keyring.addFromUri('//PR3206//validator'),miner1=keyring.addFromUri('//PR3206//miner1'),miner2=keyring.addFromUri('//PR3206//miner2');
 const bob=keyring.addFromUri('//Bob');const q=api.query.subtensorModule,a=api.tx.adminUtils,n=JSON.parse(fs.readFileSync(new URL('../temp/pr3206-feature-fixture.json',import.meta.url),'utf8')).netuid;
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);await root(a.sudoSetMechanismCount(n,1));assert.equal((await q.subnetworkN(n)).toNumber(),3);assert.equal((await q.subnetEpochConsensus(n)).toString(),'Null');
 // Isolate funded atomic budgets from automatic coinbase accrual. Real registrations and
 // real staking indexes were created by test-pr3206-null-consensus-e2e.js.
 const now=(await api.rpc.chain.getHeader()).number.toNumber();
 await store([['transactionKeyLastBlock',[alice.address,n,7],0],['transactionKeyLastBlock',[alice.address,n,9],0]]);
 await store([['lastEpochBlock',[n],now],['blocksSinceLastStep',[n],0],['subtokenEnabled',[n],false],['tempo',[n],128],['activityCutoffFactorMilli',[n],1000],['pendingEpochAt',[n],0],['stakeThreshold',[],0],['totalHotkeyAlpha',[hot.address,n],300000000],['totalHotkeyAlpha',[miner1.address,n],100000000],['totalHotkeyAlpha',[miner2.address,n],0],['parentKeys',[hot.address,n],[]],['parentKeys',[miner1.address,n],[]],['parentKeys',[miner2.address,n],[]],['childKeys',[hot.address,n],[]],['childKeys',[miner1.address,n],[]],['childKeys',[miner2.address,n],[]],['totalAlphaStaked',[n],400000000],['totalHotkeySharesV2',[hot.address,n],{mantissa:1,exponent:0}],['alphaV2',[hot.address,alice.address,n],{mantissa:1,exponent:0}],['totalHotkeySharesV2',[miner1.address,n],{mantissa:1,exponent:0}],['alphaV2',[miner1.address,bob.address,n],{mantissa:1,exponent:0}],['lastUpdate',[n],[1,1,1]],['blockAtRegistration',[n,0],0],['blockAtRegistration',[n,1],0],['blockAtRegistration',[n,2],0]]);
 await submit(a.sudoSetEpochConsensus(n,'Yuma'));await submit(a.sudoSetEpochConsensus(n,'Null'));
 await submit(api.tx.sudo.sudoAs(miner1.address,api.tx.subtensorModule.setWeights(n,[1],[1],0)),alice,'NeuronNoValidatorPermit');
 await submit(api.tx.sudo.sudoAs(miner1.address,api.tx.subtensorModule.commitWeights(n,'0x'+'01'.repeat(32))),alice,'NeuronNoValidatorPermit');
 await submit(api.tx.sudo.sudoAs(miner1.address,api.tx.subtensorModule.revealWeights(n,[1],[1],[1],0)),alice,'NeuronNoValidatorPermit');
 console.log('PASS nonpermit self-weight, commit and reveal paths are rejected');
 await submit(api.tx.subtensorModule.setWeights(n,[1,2],[3,1],0),hot);
 const beforeShares=(await q.alphaV2(hot.address,alice.address,n)).toHex();const beforeDenominator=(await q.totalHotkeySharesV2(hot.address,n)).toHex();
 await store([['pendingServerEmission',[n],500001],['pendingValidatorEmission',[n],500000],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0],['lastUpdate',[n],[1,1,1]]]);
 for(const k of [hot,miner1,miner2]) console.log('PRE EPOCH stake',k.address,(await q.totalHotkeyAlpha(k.address,n)).toString(),(await q.totalHotkeyAlpha(k.address,0)).toString(),(await q.parentKeys(k.address,n)).toString(),(await q.childKeys(k.address,n)).toString());
 const paid=await epoch(n);console.log('STAKE WEIGHTS',(await q.stakeWeight(n)).toString());assert.deepEqual(paid,[375000n,500000n,125001n]);assert.equal(paid.reduce((x,y)=>x+y,0n),1000001n);
 assert.deepEqual((await q.active(n)).toJSON(),[false,false,false]);assert.equal((await q.validatorPermit(n)).filter(x=>x.isTrue).length,1);
 assert.equal((await q.alphaV2(hot.address,alice.address,n)).toHex(),beforeShares);assert.equal((await q.totalHotkeySharesV2(hot.address,n)).toHex(),beforeDenominator);
 console.log('PASS inactive nonpermit stake dividends, exact odd budget conservation, sole-owner shares preserved');
 await submit(api.tx.subtensorModule.setWeights(n,[],[],0),hot);
 await store([['pendingServerEmission',[n],300001],['pendingValidatorEmission',[n],0],['pendingRootAlphaDivs',[n],0],['pendingOwnerCut',[n],0]]);
 assert.deepEqual(await epoch(n),[100000n,100000n,100001n]);console.log('PASS empty winner row rewards every UID');
 // Exact stake ties initialize the first UID permit; a one-unit increase elects UID 1.
 await store([['totalHotkeyAlpha',[hot.address,n],100000000],['totalHotkeyAlpha',[miner1.address,n],100000000]]);
 await submit(a.sudoSetEpochConsensus(n,'Yuma'));await submit(a.sudoSetEpochConsensus(n,'Null'));assert.deepEqual((await q.validatorPermit(n)).toJSON(),[true,false,false]);
 await store([['totalHotkeyAlpha',[miner1.address,n],100000001]]);
 await submit(a.sudoSetEpochConsensus(n,'Yuma'));await submit(a.sudoSetEpochConsensus(n,'Null'));assert.deepEqual((await q.validatorPermit(n)).toJSON(),[false,true,false]);
 await submit(api.tx.sudo.sudoAs(hot.address,api.tx.subtensorModule.setWeights(n,[0],[1],0)),alice,'NeuronNoValidatorPermit');
 console.log('PASS raw stake tie ordering and owner self-weight cannot bypass permit');
 await root(a.sudoSetMaxMechanismCount(4));
 await submit(a.sudoSetMaxAllowedUids(n,1250));await submit(a.sudoSetMechanismCount(n,2));
 await submit(a.sudoSetMaxAllowedUids(n,1251),alice,'TooManyUIDsPerMechanism');
 await submit(a.sudoSetMaxAllowedUids(n,625));await submit(a.sudoSetMechanismCount(n,4),alice,'TxRateLimitExceeded');
 // The production cooldown is 7200 blocks. Reset only the local fixture timestamp
 // after verifying its enforcement, then test the next successful owner operation.
 await store([['transactionKeyLastBlock',[alice.address,n,7],0]]);await submit(a.sudoSetMechanismCount(n,4));
 await submit(a.sudoSetMaxAllowedUids(n,626),alice,'TooManyUIDsPerMechanism');
 await store([['transactionKeyLastBlock',[alice.address,n,7],0]]);await submit(a.sudoSetMechanismCount(n,1));await submit(a.sudoSetMaxAllowedUids(n,512));
 console.log('PASS shared 2/4-mechanism capacities');
 // Populate an explicit local UID fixture. No registration throughput claim is made.
 const items=[];
 for(let uid=3;uid<400;uid++){
 const bytes=new Uint8Array(32);new DataView(bytes.buffer).setUint32(0,uid,true);new DataView(bytes.buffer).setUint16(4,n,true);const address=keyring.encodeAddress(bytes);
 items.push(['keys',[n,uid],address],['uids',[n,address],uid],['isNetworkMember',[address,n],true],['owner',[address],address],['blockAtRegistration',[n,uid],0]);
 }
 const extend=(name,value)=>items.push([name,[n],Array.from({length:400},()=>value)]);
 extend('active',false);extend('emission',0);extend('consensus',0);extend('dividends',0);extend('validatorTrust',0);extend('validatorPermit',false);extend('stakeWeight',0);extend('incentive',0);extend('lastUpdate',0);
 items.push(['subnetworkN',[n],400],['immunityPeriod',[n],0],['minAllowedUids',[n],64]);
 for(let offset=0;offset<items.length;offset+=500)await store(items.slice(offset,offset+500));
 await submit(a.sudoSetEpochConsensus(n,'Yuma'),alice,'TooManyUIDsPerMechanism');assert.equal((await q.subnetworkN(n)).toNumber(),400);
 await submit(a.sudoTrimNullUidsBatch(n,256));assert.equal((await q.subnetworkN(n)).toNumber(),336);assert.equal((await q.nullPruningTarget(n)).unwrap().toNumber(),256);
 await submit(a.sudoTrimNullUidsBatch(n,256),bob,'BadOrigin');assert.equal((await q.subnetworkN(n)).toNumber(),336);
 await submit(a.sudoTrimNullUidsBatch(n,256));assert.equal((await q.subnetworkN(n)).toNumber(),272);
 await submit(a.sudoTrimNullUidsBatch(n,256));assert.equal((await q.subnetworkN(n)).toNumber(),256);assert.ok((await q.nullPruningTarget(n)).isNone);
 await submit(a.sudoSetEpochConsensus(n,'Yuma'));assert.equal((await q.maxAllowedUids(n)).toNumber(),256);
 console.log('PASS explicit bounded pruning 400 -> 336 -> 272 -> 256 and safe Yuma restoration');
 console.log('PASS all PR3206 emission boundary cases');
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
