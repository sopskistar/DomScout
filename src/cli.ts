import { Store } from './db.ts';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { parseImport } from './import.ts';
import { queueJob,runOne } from './jobs.ts';
import { enqueueMatches,deliverOne,optionsFromEnv } from './telegram.ts';
import type { Principal } from './types.ts';
const store=new Store(process.env.DATABASE_PATH||'data/domscout.sqlite');
try{
 const [action,...args]=process.argv.slice(2);
 if(action==='owner'){
  if(!process.stdin.isTTY)throw Error('Run owner creation interactively; passphrases are never accepted as shell arguments.');
  let muted=false;const output=new Writable({write(chunk,_enc,done){if(!muted)process.stdout.write(chunk);done();}});const rl=createInterface({input:process.stdin,output,terminal:true});
  console.log('Local owner setup. Public customer signup remains disabled.');const email=args[0]||await rl.question('Email: ');
  process.stdout.write('Passphrase (14+ characters, hidden): ');muted=true;const password=await rl.question('');muted=false;process.stdout.write('\nRepeat passphrase: ');muted=true;const again=await rl.question('');muted=false;process.stdout.write('\n');rl.close();if(password!==again)throw Error('Passphrases do not match.');const user=store.createUser(email,password,'owner');store.audit(user,'owner.created');console.log('Owner created. Sign in through the local web application.');
 }else if(action==='worker'){
  console.log(await runOne(store,async(kind,payload)=>{if(kind==='telegram')return deliverOne(store,optionsFromEnv());if(kind!=='digest')throw Error('Unsupported job');const b=payload as {userId?:string};const users=store.db.prepare('SELECT id,tenant_id,email,role FROM users WHERE verified=1'+(b.userId?' AND id=?':'')).all(...(b.userId?[b.userId]:[]));const results=[];for(const u of users){const p:Principal={id:String(u.id),tenantId:String(u.tenant_id),email:String(u.email),role:u.role as Principal['role']};results.push(enqueueMatches(store,p));}return results;}));
 }else if(action==='queue'){const kind=args[0]==='telegram'?'telegram':'digest';console.log('Queued',queueJob(store,kind));}
 else if(action==='import'){const [email,file,format='json']=args;if(!email||!file||!['json','csv'].includes(format))throw Error('Usage: import OWNER_EMAIL PATH json|csv');const u=store.db.prepare("SELECT id,tenant_id,email,role FROM users WHERE email=? AND role='owner'").get(email);if(!u)throw Error('Owner not found.');console.log(store.import(parseImport(readFileSync(file,'utf8'),format as 'json'|'csv'),{id:String(u.id),tenantId:String(u.tenant_id),email:String(u.email),role:'owner'}));}
 else throw Error('Commands: owner [EMAIL], import OWNER_EMAIL PATH json|csv, queue digest|telegram, worker');
}catch(e){console.error(e instanceof Error?e.message:'Command failed');process.exitCode=1;}finally{store.db.close();}
