import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Preserve the upgraded stress fixture while restarting its block/timestamp chronology.
// Run `keys` while the node is alive, then export-state offline, then `patch <input> <output>`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {u8aToHex} from '@polkadot/util';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-exported-spec.log');logger.captureConsole();
const normalization=new URL('../temp/pr3206-export-normalization.json',import.meta.url);
async function main(){
 await logger.start();const command=process.argv[2];
 if(command==='keys'){
 const api=await connectApi('ws://127.0.0.1:9944',{log:console.log});
 try{
 const pairs=[];
 function pair(q,args,value){const type=q.creator.meta.type;const id=api.registry.createLookupType(type.isMap?type.asMap.value:type.asPlain);pairs.push([q.key(...args),u8aToHex(api.createType(id,value).toU8a())]);}
 pair(api.query.timestamp.now,[],0);pair(api.query.aura.currentSlot,[],0);pair(api.query.system.number,[],0);
 const q=api.query.subtensorModule;
 for(const [key,v] of await q.networksAdded.entries()){
 if(!v.isTrue)continue;const n=key.args[0].toNumber();const target=0<n&&n<=128;
 pair(q.tempo,[n],target?360:(n===0?100:0));pair(q.lastEpochBlock,[n],0);pair(q.lastMechansimStepBlock,[n],0);pair(q.blocksSinceLastStep,[n],0);pair(q.pendingEpochAt,[n],target?1:0);
 if(!target)continue;
 const N=(await q.subnetworkN(n)).toNumber();pair(q.lastUpdate,[n],Array(N).fill(1));
 for(let uid=0;uid<N;uid++)pair(q.blockAtRegistration,[n,uid],0);
 pair(q.pendingServerEmission,[n],1000000000);pair(q.pendingValidatorEmission,[n],1000000000);pair(q.pendingRootAlphaDivs,[n],0);pair(q.pendingOwnerCut,[n],0);
 }
 fs.writeFileSync(normalization,JSON.stringify({pairs,removePrefixes:[api.query.system.blockHash.keyPrefix()]},null,2));console.log('PASS exported normalization keys',pairs.length);
 }finally{await api.disconnect();}
 }else if(command==='patch'){
 const [input,output]=process.argv.slice(3);assert.ok(input&&output,'patch needs input and output paths');
 const helper=fileURLToPath(new URL('./pr3206-patch-export.py',import.meta.url));
 console.log(execFileSync('python3',[helper,input,output,fileURLToPath(normalization)],{encoding:'utf8',maxBuffer:1048576}).trim());
 }else throw Error('use keys or patch <input> <output>');
}
main().catch(err=>{console.error(err);process.exit(1);});
