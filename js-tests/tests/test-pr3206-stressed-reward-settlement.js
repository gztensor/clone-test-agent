import assert from 'node:assert/strict';
import {blake2AsU8a,encodeAddress} from '@polkadot/util-crypto';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-stressed-reward-settlement.log');logger.captureConsole();
async function main(){await logger.start();const api=await connectApi('ws://127.0.0.1:9944');try{
 assert.equal(api.runtimeVersion.specVersion.toNumber(),474);const genesis=await api.rpc.chain.getBlockHash(0),head=await api.rpc.chain.getHeader();const q=api.query.subtensorModule;
 for(let n=1;n<=64;n++){
 assert.equal((await q.subnetworkN(n)).toNumber(),2000);assert.equal((await q.subnetEpochConsensus(n)).toString(),'Null');
 const hot=encodeAddress(blake2AsU8a(`PR3206-stress-hot-${n}-1999`));const nom=encodeAddress(blake2AsU8a(`PR3206-stress-nominator-${n}-1999`));assert.equal((await q.keys(n,1999)).toString(),hot);
 const [before,after,oldOwner,newOwner,oldNom,newNom,oldDen,newDen]=await Promise.all([q.totalHotkeyAlpha.at(genesis,hot,n),q.totalHotkeyAlpha(hot,n),q.alphaV2.at(genesis,hot,hot,n),q.alphaV2(hot,hot,n),q.alphaV2.at(genesis,hot,nom,n),q.alphaV2(hot,nom,n),q.totalHotkeySharesV2.at(genesis,hot,n),q.totalHotkeySharesV2(hot,n)]);
 const delta=BigInt(after.toString())-BigInt(before.toString());assert.ok(delta>0n,`subnet ${n} must actually credit its added shared-pool miner`);assert.notEqual(newOwner.toHex(),oldOwner.toHex(),'general deposit updates owner shares');assert.notEqual(newDen.toHex(),oldDen.toHex(),'general deposit updates share denominator');assert.equal(newNom.toHex(),oldNom.toHex(),'nominator share units are retained');
 console.log('SETTLED',n,'UID 1999 backing increase',delta.toString(),'shared owner/denominator updated; nominator units preserved');
 }
 console.log('PASS actual reward credits on added shared pools in all 64 stressed subnets; block',head.number.toString());
}finally{await api.disconnect();}}
main().catch(err=>{console.error(err);process.exit(1);});
