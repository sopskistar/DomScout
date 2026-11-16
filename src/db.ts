import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {domainToUnicode} from 'node:url';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { hash,stable,validateImport } from './import.ts';
import { fail,type Dataset,type DomainRecord,type Principal } from './types.ts';
import { validateRule,type Rule } from './rules.ts';
export class Store {
 db:DatabaseSync;
 publicLicenses:string[];
 constructor(path=':memory:',publicLicenses:string[]=[] ) {
  this.publicLicenses=publicLicenses;
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});this.db=new DatabaseSync(path);
  this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS migrations(name TEXT PRIMARY KEY,applied_at TEXT NOT NULL)');
  for(const name of readdirSync('migrations').filter(x=>x.endsWith('.sql')).sort())if(!this.db.prepare('SELECT name FROM migrations WHERE name=?').get(name))this.transaction(()=>{this.db.exec(readFileSync(`migrations/${name}`,'utf8'));this.db.prepare('INSERT INTO migrations VALUES (?,?)').run(name,new Date().toISOString());});
  this.db.prepare('INSERT OR IGNORE INTO tenants VALUES (?,?)').run('fixture','Isolated sample inventory');
  this.transaction(()=>{for(const row of this.db.prepare('SELECT id,normalized_json FROM domains WHERE root_id IS NULL').all()){const d=JSON.parse(String(row.normalized_json));const rootId=hash(d.root);this.db.prepare('INSERT OR IGNORE INTO roots VALUES (?,?,?)').run(rootId,d.root,domainToUnicode(d.root));this.db.prepare('UPDATE domains SET root_id=? WHERE id=?').run(rootId,row.id as string);}for(const row of this.db.prepare("SELECT id,ascii_root,unicode_root FROM roots WHERE ascii_root LIKE 'xn--%'").all()){const unicode=domainToUnicode(String(row.ascii_root));if(unicode!==row.unicode_root)this.db.prepare('UPDATE roots SET unicode_root=? WHERE id=?').run(unicode,row.id as string);}});
 }
 transaction<T>(f:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try{const result=f();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 audit(p:Principal|null,action:string,details:unknown={}){this.db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?)').run(randomUUID(),p?.id||null,p?.tenantId||null,action,new Date().toISOString(),stable(details));}
 createUser(email:string,password:string,role:'owner'|'researcher'='researcher',tenantId=randomUUID()):Principal {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<14||password.length>256)fail('invalid_account','Use an email and a passphrase of 14–256 characters.');
  const salt=randomBytes(16).toString('hex'),digest=scryptSync(password,salt,64).toString('hex'),id=randomUUID();
  return this.transaction(()=>{this.db.prepare('INSERT OR IGNORE INTO tenants VALUES (?,?)').run(tenantId,'Private workspace');this.db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(id,tenantId,email.toLowerCase(),`${salt}:${digest}`,role,1,new Date().toISOString());return {id,tenantId,email:email.toLowerCase(),role};});
 }
 login(email:string,password:string) {
  if(typeof email!=='string'||typeof password!=='string'||password.length>256)fail('unauthorized','Email or passphrase is incorrect.',401);
  const u=this.db.prepare('SELECT * FROM users WHERE email=? AND verified=1').get(email.toLowerCase());
  const [salt,digest]=String(u?.password_hash||'0000000000000000:'+ '00'.repeat(64)).split(':');const actual=scryptSync(password,salt,64);
  if(!u||!timingSafeEqual(actual,Buffer.from(digest,'hex')))fail('unauthorized','Email or passphrase is incorrect.',401);
  const token=randomBytes(32).toString('base64url');this.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token),u.id as string,new Date(Date.now()+12*3600_000).toISOString());return {token,principal:{id:String(u.id),tenantId:String(u.tenant_id),email:String(u.email),role:u.role as Principal['role']}};
 }
 principal(token:string|undefined):Principal|null {
  if(!token)return null;const u=this.db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.hash=? AND expires_at>?').get(hash(token),new Date().toISOString());
  return u?{id:String(u.id),tenantId:String(u.tenant_id),email:String(u.email),role:u.role as Principal['role']}:null;
 }
 import(rows:unknown[],p:Principal|null,dataset:Dataset='manual') {
  if(dataset!=='fixture'&&p?.role!=='owner')fail('forbidden','Only the owner can import inventory.',403);
  const tenant=dataset==='fixture'?'fixture':p!.tenantId;const normalized=rows.map(x=>validateImport(x,tenant,dataset));let changed=0;
  this.transaction(()=>{for(let i=0;i<normalized.length;i++){
   const d=normalized[i],domainId=hash(d.domain),fingerprint=hash(stable(rows[i]));
   if(d.publicAllowed&&!this.publicLicenses.includes(d.licenseRef))fail('license_unapproved','Public redistribution requires an owner-approved license allowlist. Imports are private by default.',403);d.observationId=hash(d.id+fingerprint);
   const existing=this.db.prepare('SELECT record_json FROM listings WHERE id=?').get(d.id);
   if(existing){const old=JSON.parse(String(existing.record_json)) as DomainRecord;if(Date.parse(old.observedAt)>Date.parse(d.observedAt))fail('stale_import','An import cannot replace a newer observation.');if(old.observationId===d.observationId)continue;}
   const rootId=hash(d.root);this.db.prepare('INSERT OR IGNORE INTO roots VALUES (?,?,?)').run(rootId,d.root,domainToUnicode(d.root));
   this.db.prepare('INSERT OR IGNORE INTO domains (id,domain,normalized_json,root_id) VALUES (?,?,?,?)').run(domainId,d.domain,stable({domain:d.domain,root:d.root,tld:d.tld,unicode:d.unicode,length:d.length,hasHyphen:d.hasHyphen,hasDigit:d.hasDigit}),rootId);
   this.db.prepare('INSERT INTO listings VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET public_allowed=excluded.public_allowed,notifications_allowed=excluded.notifications_allowed,license_ref=excluded.license_ref,record_json=excluded.record_json,updated_at=excluded.updated_at').run(d.id,domainId,tenant,d.source,d.externalId,dataset,Number(d.publicAllowed),Number(d.notificationsAllowed),d.licenseRef,stable(d),d.observedAt);
   this.db.prepare('INSERT OR IGNORE INTO observations VALUES (?,?,?,?,?)').run(d.observationId,d.id,fingerprint,stable(rows[i]),d.observedAt);changed++;
  }this.audit(p,'inventory.import',{dataset,rows:rows.length,changed});});return {received:rows.length,changed};
 }
 records(p:Principal|null,dataset:Dataset|'all'='manual'):DomainRecord[] {
  const records=this.db.prepare("SELECT record_json FROM listings WHERE (?='fixture' AND dataset='fixture') OR (?<>'fixture' AND dataset<>'fixture' AND (tenant_id=? OR public_allowed=1)) ORDER BY updated_at DESC,id").all(dataset,dataset,p?.tenantId||'');
  return records.map(x=>JSON.parse(String(x.record_json)) as DomainRecord).map(d=>!p||p.tenantId!==d.tenantId ? {...d,tenantId:'',licenseRef:d.dataset==='fixture'?d.licenseRef:'Approved public summary'}:d);
 }
 record(id:string,p:Principal|null,dataset:Dataset|'all'='all'):DomainRecord {const d=this.records(p,dataset).find(d=>d.id===id);if(!d)fail('not_found','Domain record not found.',404);return d;}
 review(id:string,p:Principal){const d=this.record(id,p);if(p.role!=='owner'||d.tenantId!==p.tenantId)fail('forbidden','Owner review is required.',403);d.reviewed=true;this.db.prepare('UPDATE listings SET record_json=? WHERE id=? AND tenant_id=?').run(stable(d),id,p.tenantId);this.audit(p,'record.review',{id});return d;}
 raw(id:string,p:Principal){const d=this.record(id,p);if(d.tenantId!==p.tenantId||p.role!=='owner')fail('not_found','Raw evidence not found.',404);return this.db.prepare('SELECT id,raw_json,observed_at FROM observations WHERE listing_id=? ORDER BY observed_at DESC LIMIT 100').all(id);}
 saveRule(p:Principal,input:unknown,id?:string){const rule=validateRule(input);return this.transaction(()=>{let version=1;const key=id||randomUUID();if(id){const existing=this.db.prepare('SELECT version FROM rules WHERE id=? AND user_id=? AND tenant_id=?').get(id,p.id,p.tenantId);if(!existing)fail('not_found','Rule not found.',404);version=Number(existing.version)+1;this.db.prepare('UPDATE rules SET version=?,rule_json=? WHERE id=? AND user_id=? AND tenant_id=?').run(version,stable(rule),id,p.id,p.tenantId);}else{this.db.prepare('INSERT INTO rules VALUES (?,?,?,?,?,?,?,?)').run(key,p.id,p.tenantId,version,1,stable(rule),new Date().toISOString(),null);}
  this.db.prepare('INSERT INTO rule_versions VALUES (?,?,?,?)').run(key,version,stable(rule),new Date().toISOString());this.audit(p,'rule.save',{id:key,version});return {id:key,version,enabled:!!this.db.prepare('SELECT enabled FROM rules WHERE id=? AND user_id=? AND tenant_id=?').get(key,p.id,p.tenantId)?.enabled,rule};});}
 rules(p:Principal){return this.db.prepare('SELECT id,version,enabled,rule_json FROM rules WHERE user_id=? AND tenant_id=? ORDER BY created_at DESC').all(p.id,p.tenantId).map(x=>({id:String(x.id),version:Number(x.version),enabled:!!x.enabled,rule:JSON.parse(String(x.rule_json)) as Rule}));}
 toggleRule(p:Principal,id:string,enabled:boolean){const r=this.db.prepare('UPDATE rules SET enabled=? WHERE id=? AND user_id=? AND tenant_id=?').run(Number(enabled),id,p.id,p.tenantId);if(!r.changes)fail('not_found','Rule not found.',404);if(!enabled)this.db.prepare("UPDATE delivery_events SET status='cancelled' WHERE user_id=? AND rule_id=? AND status='pending'").run(p.id,id);this.audit(p,'rule.toggle',{id,enabled});}
 deleteRule(p:Principal,id:string){const r=this.db.prepare('DELETE FROM rules WHERE id=? AND user_id=? AND tenant_id=?').run(id,p.id,p.tenantId);if(!r.changes)fail('not_found','Rule not found.',404);this.audit(p,'rule.delete',{id});}
 watch(p:Principal,id:string,add:boolean,dataset:Dataset|'all'='all'){this.record(id,p,dataset);if(add)this.db.prepare('INSERT OR IGNORE INTO watchlist VALUES (?,?,?)').run(p.id,id,new Date().toISOString());else this.db.prepare('DELETE FROM watchlist WHERE user_id=? AND listing_id=?').run(p.id,id);this.audit(p,add?'watch.add':'watch.remove',{id});}
 watches(p:Principal){return this.db.prepare('SELECT listing_id FROM watchlist WHERE user_id=?').all(p.id).map(x=>String(x.listing_id));}
}
