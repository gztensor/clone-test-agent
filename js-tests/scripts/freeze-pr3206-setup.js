import {Keyring} from '@polkadot/api';
import {cryptoWaitReady} from '@polkadot/util-crypto';
import {u8aToHex} from '@polkadot/util';
import {connectApi} from '../lib/api.js';
import {createTempLogger} from '../lib/file-log.js';
const logger=createTempLogger('pr3206-freeze-setup.log');logger.captureConsole();
async function main(){await logger.start();await cryptoWaitReady();const api=await connectApi('ws://127.0.0.1:9944');try{
 const q=api.query.subtensorModule,alice=new Keyring({type:'sr25519'}).addFromUri('//Alice');const pairs=[];const block=(await api.rpc.chain.getHeader()).number.toNumber();
 for(let n=0;n<=128;n++)for(const [name,value]of [['tempo',65535],['lastEpochBlock',block],['blocksSinceLastStep',0],['pendingEpochAt',0]]){const f=q[name],m=f.creator.meta.type;const type=api.registry.createLookupType(m.asMap.value);pairs.push([f.key(n),u8aToHex(api.createType(type,value).toU8a())]);}
 await new Promise((resolve,reject)=>{let unsub,done=false;api.tx.sudo.sudo(api.tx.system.setStorage(pairs)).signAndSend(alice,{nonce:-1},({status,events,dispatchError})=>{if(done||(!status.isInBlock&&!status.isFinalized))return;done=true;unsub?.();if(dispatchError)return reject(Error(dispatchError.toString()));for(const {event}of events)if(event.section==='sudo'&&event.method==='Sudid'&&event.data[0].isErr)return reject(Error(event.data[0].toString()));resolve();}).then(u=>{unsub=u;if(done)u();}).catch(reject);});
 console.log('PASS temporarily froze epoch scheduling for dense fixture construction',pairs.length,'storage fields');
}finally{await api.disconnect();}}
main().catch(err=>{console.error(err);process.exit(1);});
