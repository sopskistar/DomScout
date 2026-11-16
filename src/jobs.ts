import { randomUUID } from 'node:crypto';
import { Store } from './db.ts';
import { fail } from './types.ts';
export function queueJob(store:Store,kind:'digest'|'telegram',payload:unknown={},now=Date.now()){const id=randomUUID();store.db.prepare('INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,kind,JSON.stringify(payload),'queued',0,now,null,null,null,new Date(now).toISOString());return id;}
export function claimJob(store:Store,now=Date.now()) {
 return store.transaction(()=>{
  store.db.prepare("UPDATE jobs SET state='dead',last_error='Lease expired after maximum attempts' WHERE state='running' AND lease_until<=? AND attempts>=3").run(now);
  const r=store.db.prepare("SELECT * FROM jobs WHERE attempts<3 AND ((state='queued' AND available_at<=?) OR (state='running' AND lease_until<=?)) ORDER BY available_at,id LIMIT 1").get(now,now);
  if(r)store.db.prepare("UPDATE jobs SET state='running',attempts=attempts+1,lease_until=? WHERE id=?").run(now+30_000,r.id as string);return r?{id:String(r.id),kind:String(r.kind),payload:String(r.payload),attempts:Number(r.attempts)+1}:null;
 });
}
export async function runOne(store:Store,handler:(kind:string,payload:unknown)=>Promise<unknown>,now=Date.now()){
 const r=claimJob(store,now);if(!r)return {state:'empty'};
 try{const result=await handler(String(r.kind),JSON.parse(String(r.payload)));store.db.prepare("UPDATE jobs SET state='done',lease_until=NULL,checkpoint=? WHERE id=? AND state='running' AND attempts=?").run(JSON.stringify(result),r.id as string,r.attempts);return {state:'done'};}
 catch{const dead=r.attempts>=3;store.db.prepare("UPDATE jobs SET state=?,lease_until=NULL,available_at=?,last_error='Operation failed; inspect redacted audit log' WHERE id=? AND state='running' AND attempts=?").run(dead?'dead':'queued',now+Math.min(3600_000,1000*2**r.attempts)+Math.floor(Math.random()*500),r.id as string,r.attempts);return {state:dead?'dead':'retry'};}
}
export function reserveRequest(store:Store,provider:string,{dailyLimit,costCents=0,dailyCapCents=0,monthlyCapCents=0}:{dailyLimit:number;costCents?:number;dailyCapCents?:number;monthlyCapCents?:number},now=new Date()) {
 if(!Number.isInteger(dailyLimit)||dailyLimit<1||!Number.isInteger(costCents)||costCents<0)fail('budget_exceeded','Provider requests disabled.',429);
 return store.transaction(()=>{const day=new Date(now);day.setUTCHours(0,0,0,0);const month=new Date(day);month.setUTCDate(1);
  const count=store.db.prepare('SELECT count(*) AS n FROM request_ledger WHERE provider=? AND created_at>=?').get(provider,day.toISOString())!;
  const daily=store.db.prepare('SELECT coalesce(sum(cost_cents),0) AS n FROM request_ledger WHERE created_at>=?').get(day.toISOString())!;
  const monthly=store.db.prepare('SELECT coalesce(sum(cost_cents),0) AS n FROM request_ledger WHERE created_at>=?').get(month.toISOString())!;
  if(Number(count.n)>=dailyLimit||Number(daily.n)+costCents>dailyCapCents||Number(monthly.n)+costCents>monthlyCapCents)fail('budget_exceeded','Provider quota or absolute spend cap reached.',429);
  store.db.prepare('INSERT INTO request_ledger VALUES (?,?,?,?)').run(randomUUID(),provider,now.toISOString(),costCents);return true;
 });
}
