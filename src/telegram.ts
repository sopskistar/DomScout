import { createCipheriv,createDecipheriv,randomBytes,randomUUID,timingSafeEqual } from 'node:crypto';
import { Store } from './db.ts';
import { hash,stable } from './import.ts';
import { disclaimer,fail,type DomainRecord,type Principal } from './types.ts';
import { evaluate,scheduleDue,type Rule } from './rules.ts';
export interface TelegramOptions {enabled:boolean; token:string; username:string; webhookSecret:string; encryptionKey:string;}
export const optionsFromEnv=():TelegramOptions=>({enabled:process.env.TELEGRAM_ENABLED==='true',token:process.env.TELEGRAM_BOT_TOKEN||'',username:process.env.TELEGRAM_BOT_USERNAME||'',webhookSecret:process.env.TELEGRAM_WEBHOOK_SECRET||'',encryptionKey:process.env.CREDENTIAL_ENCRYPTION_KEY||''});
function key(opts:TelegramOptions) {if(!/^[a-f0-9]{64}$/i.test(opts.encryptionKey))fail('telegram_configuration','Set a 32-byte credential encryption key.',503);return Buffer.from(opts.encryptionKey,'hex');}
export function encrypt(value:string,opts:TelegramOptions){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(opts),iv);const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),encrypted].map(x=>x.toString('base64url')).join('.');}
export function decrypt(value:string,opts:TelegramOptions){const [iv,tag,data]=value.split('.').map(x=>Buffer.from(x,'base64url'));const c=createDecipheriv('aes-256-gcm',key(opts),iv);c.setAuthTag(tag);return Buffer.concat([c.update(data),c.final()]).toString('utf8');}
export function telegramReady(o:TelegramOptions){return o.enabled&&/^\d+:[\w-]+$/.test(o.token)&&/^[A-Za-z0-9_]{5,32}$/.test(o.username)&&/^[A-Za-z0-9_-]{16,256}$/.test(o.webhookSecret)&&/^[a-f0-9]{64}$/i.test(o.encryptionKey);}
export function createLink(store:Store,p:Principal,o:TelegramOptions,now=Date.now()) {
 if(!telegramReady(o))fail('telegram_disabled','Telegram is disconnected. Owner bot credentials and a verified webhook are required.',503);
 const code=randomBytes(24).toString('base64url');store.transaction(()=>{store.db.prepare('DELETE FROM link_codes WHERE user_id=? OR expires_at<?').run(p.id,new Date(now).toISOString());store.db.prepare('INSERT INTO link_codes VALUES (?,?,?)').run(hash(code),p.id,new Date(now+600_000).toISOString());store.audit(p,'telegram.link_requested');});return {url:`https://t.me/${o.username}?start=${code}`,expiresAt:new Date(now+600_000).toISOString()};
}
export function consumeLink(store:Store,body:unknown,secret:string,o:TelegramOptions,now=Date.now()) {
 if(!telegramReady(o))fail('telegram_disabled','Telegram is disabled.',503);
 if(Buffer.byteLength(secret)!==Buffer.byteLength(o.webhookSecret)||!timingSafeEqual(Buffer.from(secret),Buffer.from(o.webhookSecret)))fail('forbidden','Invalid webhook verification.',403);
 const b=body as {message?:{text?:string;chat?:{id?:number;type?:string};from?:{id?:number}}};
 const m=b?.message;if(!m?.text?.startsWith('/start ')||m.chat?.type!=='private'||!Number.isSafeInteger(m.chat.id)||m.chat.id!==m.from?.id)return {accepted:false};
 const code=m.text.slice(7).trim();if(!/^[A-Za-z0-9_-]{32}$/.test(code))return {accepted:false};
 return store.transaction(()=>{const r=store.db.prepare('SELECT * FROM link_codes WHERE hash=? AND expires_at>?').get(hash(code),new Date(now).toISOString());if(!r)return {accepted:false};
  const dest=String(m.chat!.id),encrypted=encrypt(dest,o);const existing=store.db.prepare('SELECT user_id FROM telegram_links WHERE destination_hash=?').get(hash(dest));if(existing&&existing.user_id!==r.user_id)fail('destination_in_use','Disconnect the previous account before linking this destination.',409);
  store.db.prepare('INSERT INTO telegram_links VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET destination_hash=excluded.destination_hash,encrypted_destination=excluded.encrypted_destination,linked_at=excluded.linked_at').run(r.user_id as string,hash(dest),encrypted,new Date(now).toISOString());store.db.prepare('DELETE FROM link_codes WHERE user_id=?').run(r.user_id as string);return {accepted:true};
 });
}
export function unlink(store:Store,p:Principal){store.transaction(()=>{store.db.prepare('DELETE FROM telegram_links WHERE user_id=?').run(p.id);store.db.prepare('DELETE FROM link_codes WHERE user_id=?').run(p.id);store.db.prepare("UPDATE delivery_events SET status='cancelled' WHERE user_id=? AND status='pending'").run(p.id);store.audit(p,'telegram.unlinked');});}
export function renderAlert(d:DomainRecord,missing:string[]=[]){return [d.dataset==='fixture'?'SAMPLE ONLY — synthetic research, never delivered':'DomScout — reviewed research',d.domain,`Category: ${d.category}`,`Availability: ${d.availability.replaceAll('_',' ')} (not a purchase guarantee)`,`Price: ${d.price===null?'Unknown':`${d.currency} ${d.price}`} | Deadline: ${d.deadline||'Unknown'}`,`Registered extensions: ${d.extensionCount??'Unknown'}`,`Scores: not yet calculated | Confidence: ${d.confidence??'Unknown'}`,`History: ${d.history==='unknown'?'Unknown — not evidence of cleanliness':'Evidence present; inspect source'}`,`Observed: ${d.observedAt}`,`Missing rule inputs: ${missing.join(', ')||'None'}`,disclaimer,`Source: ${d.sourceUrl}`,'Manual review and acquisition approval required.'].join('\n');}
export function enqueueMatches(store:Store,p:Principal,now=new Date()) {
 return store.transaction(()=>{let queued=0;const start=new Date(now);start.setUTCHours(0,0,0,0);
  const linked=store.db.prepare('SELECT user_id FROM telegram_links WHERE user_id=?').get(p.id);if(!linked)return {queued,reason:'not_linked'};
  let daily=Number(store.db.prepare("SELECT count(*) AS n FROM delivery_events WHERE user_id=? AND created_at>=? AND status<>'cancelled'").get(p.id,start.toISOString())!.n);
  for(const row of store.rules(p)){const r=row.rule;if(!row.enabled||r.kind!=='alert')continue;const previous=store.db.prepare('SELECT last_evaluated_at FROM rules WHERE id=? AND user_id=?').get(row.id,p.id);if(!scheduleDue(r,now,previous?.last_evaluated_at as string|null))continue;
   let matches=0;const candidates=store.records(p).filter(d=>d.dataset!=='fixture'&&d.category!=='Company gap'&&d.reviewed&&d.notificationsAllowed&&!d.risk&&now.getTime()-Date.parse(d.observedAt)<=24*3600_000&&now.getTime()>=Date.parse(d.observedAt));
   for(const d of candidates){if(daily>=Math.min(20,r.schedule.maxAlerts)||matches>=r.schedule.maxMatches)break;const result=evaluate(r,d);if(!result.matches)continue;
    const materialKey=hash(stable({listing:d.id,price:d.price,currency:d.currency,deadline:d.deadline,availability:d.availability,extensions:d.extensionTlds,category:d.category,history:d.history,confidence:d.confidence,trendVelocity:d.trendVelocity,risk:d.risk}));
    const change=store.db.prepare('INSERT OR IGNORE INTO delivery_events (id,user_id,rule_id,observation_id,status,payload,created_at,sent_at,attempts,material_key) VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),p.id,row.id,d.observationId,'pending',renderAlert(d,result.missing),now.toISOString(),null,0,materialKey);
    if(change.changes){queued++;daily++;matches++;}
   }
   store.db.prepare('UPDATE rules SET last_evaluated_at=? WHERE id=? AND user_id=?').run(now.toISOString(),row.id,p.id);
  }store.audit(p,'alerts.evaluate',{queued});return {queued,reason:'evaluated'};
 });
}
// Telegram has no caller-provided idempotency key. Ambiguous network results become
// uncertain and require manual reconciliation; never blindly retry a possibly sent message.
export async function deliverOne(store:Store,o:TelegramOptions,transport:typeof fetch=fetch) {
 if(!telegramReady(o))return {state:'disabled'};
 const row=store.transaction(()=>{const r=store.db.prepare("SELECT delivery_events.*,telegram_links.encrypted_destination FROM delivery_events JOIN telegram_links USING(user_id) JOIN rules ON rules.id=delivery_events.rule_id WHERE delivery_events.status='pending' AND rules.enabled=1 ORDER BY delivery_events.created_at LIMIT 1").get();if(r)store.db.prepare("UPDATE delivery_events SET status='sending',attempts=attempts+1 WHERE id=? AND status='pending'").run(r.id as string);return r;});
 if(!row)return {state:'empty'};
 try {const chatId=decrypt(String(row.encrypted_destination),o);const res=await transport(`https://api.telegram.org/bot${o.token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chatId,text:String(row.payload),link_preview_options:{is_disabled:true},allow_paid_broadcast:false}),signal:AbortSignal.timeout(8000)});
  const body=await res.json() as {ok?:boolean};const state=res.ok&&body.ok?'sent':'failed';store.db.prepare('UPDATE delivery_events SET status=?,sent_at=? WHERE id=?').run(state,state==='sent'?new Date().toISOString():null,row.id as string);return {state};
 }catch{store.db.prepare("UPDATE delivery_events SET status='uncertain' WHERE id=?").run(row.id as string);return {state:'uncertain'};}
}
