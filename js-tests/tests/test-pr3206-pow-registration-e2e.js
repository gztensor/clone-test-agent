import {createHash} from 'node:crypto';
import {decodeAddress,keccakAsU8a} from '@polkadot/util-crypto';
import fs from 'node:fs';
import { blake2AsU8a } from '@polkadot/util-crypto';
import assert from 'node:assert/strict';
import { Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { connectApi } from '../lib/api.js';
import { createTempLogger } from '../lib/file-log.js';
const logger=createTempLogger('pr3206-pow-registration-e2e.log');
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
 if(event.section==='sudo' || event.method==='ExtrinsicFailed') console.log('EVENT',event.section,event.method,event.data.toString());
 if(event.section==='sudo' && ['Sudid','SudoAsDone'].includes(event.method) && event.data[0].isErr) error=errorName(event.data[0].asErr);
 }
 finish(null,{error,hash:(status.isInBlock?status.asInBlock:status.asFinalized).toHex()});
 }).then(u=>{unsub=u;if(done)u();}).catch(e=>finish(e));
 });
 if(expected) assert.equal(outcome.error,expected); else assert.equal(outcome.error,null);
 return outcome;
}
async function root(call,expected) {return submit(api.tx.sudo.sudo(call),alice,expected);}
const storageTypes=new Map();
async function store(items) {
 const pairs=[];
 for(const [name,args,value] of items) {
 const q=api.query.subtensorModule[name];assert.ok(q,`missing storage ${name}`);
 if(!storageTypes.has(name)){const meta=q.creator.meta.type;storageTypes.set(name,api.registry.createLookupType(meta.isMap?meta.asMap.value:meta.asPlain));}
 pairs.push([q.key(...args),u8aToHex(api.createType(storageTypes.get(name),value).toU8a())]);
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
async function mine(n,cold,hot){
 const header=await api.rpc.chain.getHeader(),block=header.number.toNumber(),hash=await api.rpc.chain.getBlockHash(block);
 const difficulty=(await api.query.subtensorModule.difficulty(n)).toBigInt();const bound=((1n<<256n)-1n)/difficulty;
 const prefix=Buffer.concat([Buffer.from('subtensor-pow-register-v1'),Buffer.from(api.createType('u16',n).toU8a()),Buffer.from(hash.toU8a()),Buffer.from(decodeAddress(hot)),Buffer.from(decodeAddress(cold))]);
 const nonceBytes=Buffer.alloc(8);
 for(let nonce=0n;nonce<1000000n;nonce++){
 nonceBytes.writeBigUInt64LE(nonce);const sha=createHash('sha256').update(prefix).update(nonceBytes).digest();const work=keccakAsU8a(sha,256);
 const number=BigInt('0x'+Buffer.from(work).reverse().toString('hex'));
 if(number<=bound){console.log('MINED',block,'nonce',nonce.toString(),'difficulty',difficulty.toString());return {block,nonce:nonce.toString(),work:Array.from(work)};}
 }
 throw Error('local low-difficulty mining fixture exhausted nonce bound');
}
async function main(){
 await logger.start();await cryptoWaitReady();api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const keyring=new Keyring({type:'sr25519'});alice=keyring.addFromUri('//Alice');const cold=keyring.addFromUri('//PR3206//unfunded-pow-cold'),hot=keyring.addFromUri('//PR3206//unfunded-pow-hot');
 const q=api.query.subtensorModule,a=api.tx.adminUtils;
 await submit(api.tx.subtensorModule.registerNetwork(alice.address));
 const entries=await q.networksAdded.entries();const n=Math.max(...entries.filter(([,v])=>v.isTrue).map(([k])=>k.args[0].toNumber()));
 console.log('ISOLATED POW NETUID',n);
 // Stop price decay to distinguish admission demand from independent block-time decay.
 await store([['tempo',[n],0],['subtokenEnabled',[n],false],['subnetEmissionEnabled',[n],false],['burnHalfLife',[n],0]]);
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);assert.equal((await q.subnetOwner(n)).toString(),alice.address);assert.equal((await api.query.system.account(cold.address)).data.free.toBigInt(),0n);
 assert.equal((await q.networkPowRegistrationAllowed(n)).isTrue,false,'new subnet PoW defaults off');
 const off={block:(await api.rpc.chain.getHeader()).number.toNumber(),nonce:0,work:Array(32).fill(0)};
 await submit(api.tx.sudo.sudoAs(cold.address,api.tx.subtensorModule.powRegister(n,off.block,off.nonce,off.work,hot.address)),alice,'SubNetRegistrationDisabled');
 await root(api.tx.utility.batchAll([a.sudoSetMinDifficulty(n,1),a.sudoSetDifficulty(n,1000),a.sudoSetMaxDifficulty(n,1000000000),a.sudoSetNetworkPowRegistrationAllowed(n,true)]));
 await submit(a.sudoSetNetworkRegistrationAllowed(n,false));await submit(a.sudoSetNetworkPowRegistrationAllowed(n,false),alice,'InvalidValue');
 const proof=await mine(n,cold.address,hot.address);
 await submit(api.tx.sudo.sudoAs(alice.address,api.tx.subtensorModule.powRegister(n,proof.block,proof.nonce,proof.work,hot.address)),alice,'InvalidSeal');
 const rootProof=await mine(n,cold.address,hot.address);
 await submit(api.tx.sudo.sudoAs(cold.address,api.tx.subtensorModule.powRegister(0,rootProof.block,rootProof.nonce,rootProof.work,hot.address)),alice,'RegistrationNotPermittedOnRootSubnet');
 const fresh=await mine(n,cold.address,hot.address),burnBefore=(await q.burn(n)).toString(),difficultyBefore=(await q.difficulty(n)).toBigInt(),countBefore=(await q.subnetworkN(n)).toNumber();
 await submit(api.tx.subtensorModule.powRegister(n,fresh.block,fresh.nonce,fresh.work,hot.address),cold);
 assert.equal((await api.query.system.account(cold.address)).data.free.toBigInt(),0n,'direct zero-tip PoW must consume no TAO fee or burn');assert.equal((await q.burn(n)).toString(),burnBefore,'PoW must not change burn price');assert.equal((await q.subnetworkN(n)).toNumber(),countBefore+1);
 assert.equal((await q.owner(hot.address)).toString(),cold.address);assert.ok((await q.uids(n,hot.address)).isSome);assert.equal((await q.lastPowRegistrationBlock(hot.address)).unwrap().toNumber(),fresh.block);
 assert.ok((await q.difficulty(n)).toBigInt()>difficultyBefore,'PoW difficulty cannot fall during registration');assert.equal((await q.minerCollateral(n,hot.address,cold.address)).toJSON(),null,'PoW must not purchase upfront collateral');
 await submit(api.tx.sudo.sudoAs(cold.address,api.tx.subtensorModule.powRegister(n,fresh.block,fresh.nonce,fresh.work,hot.address)),alice,'HotKeyAlreadyRegisteredInSubNet');assert.equal((await q.subnetworkN(n)).toNumber(),countBefore+1);
 await submit(a.sudoSetNetworkRegistrationAllowed(n,true));await submit(a.sudoSetNetworkPowRegistrationAllowed(n,false));
 console.log('PASS PoW defaults, last-route protection, proof coldkey/root checks, unfunded zero-fee registration, independent burn accounting, replay rejection and ownership indexes');
 }finally{await api.disconnect();}
}
main().catch(err=>{console.error(err);process.exit(1);});
