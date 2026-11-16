import {test} from 'node:test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../src/db.ts';
import {normalize} from '../src/normalize.ts';
import {parseImport,csv} from '../src/import.ts';
import {validateRule,evaluate,scheduleDue,type Rule} from '../src/rules.ts';
import {fixtureRows} from '../src/fixtures.ts';
import {rdapEndpoint,parseRdap,godaddy,dynadot} from '../src/connectors.ts';
import {createLink,consumeLink,unlink,enqueueMatches,deliverOne,decrypt,renderAlert,type TelegramOptions} from '../src/telegram.ts';
import {queueJob,claimJob,runOne,reserveRequest} from '../src/jobs.ts';
const now=new Date('2026-11-16T08:05:00Z');
const bot:TelegramOptions={enabled:true,token:'123456:fixture-token',username:'DomScoutTestBot',webhookSecret:'fixture-webhook-secret-only',encryptionKey:'ab'.repeat(32)};
function baseRule(tld='com'):Rule{return {name:'Expiring shortlist',kind:'alert',group:{op:'and',conditions:[{field:'category',op:'eq',value:'Expiring'},{field:'tld',op:'eq',value:tld},{field:'length',op:'gte',value:4},{field:'length',op:'lte',value:8},{field:'extensionCount',op:'gte',value:5},{field:'price',op:'lte',value:500},{field:'currency',op:'eq',value:'USD'}]},unknown:'exclude',schedule:{frequency:'daily',timezone:'Africa/Lagos',hour:9,maxMatches:10,maxAlerts:10,quietStart:22,quietEnd:7}};}
function manual(domain='Nexora.com'){return {...fixtureRows[0],domain,category:'Expiring',price:250,extensionTlds:['com','ai','io','net','org'],observedAt:now.toISOString(),notificationsAllowed:true};}
function link(s:Store,p:ReturnType<Store['createUser']>,chat:number){const code=new URL(createLink(s,p,bot,now.getTime()).url).searchParams.get('start');return consumeLink(s,{message:{text:'/start '+code,chat:{id:chat,type:'private'},from:{id:chat}}},bot.webhookSecret,bot,now.getTime());}
test('normalization handles IDN, suffixes, case and subdomains without collisions',()=>{
 assert.deepEqual(normalize('WWW.Example.CO.UK.').domain,'example.co.uk');assert.equal(normalize('Bücher.de').domain,'xn--bcher-kva.de');assert.equal(normalize('Bücher.de').length,6);assert.equal(normalize('example.com').root,'example');
 for(const bad of ['https://example.com','127.0.0.1','localhost','bad-.com','user@example.com','a..com','foo.invalid','foo.blogspot.com'])assert.throws(()=>normalize(bad));
});
test('CSV quoting, null metrics, bounds and malicious input',()=>{
 assert.equal(csv('domain,source\r\n"nexora.com","quoted, source"')[0].source,'quoted, source');assert.equal(csv('domain,source\n"nexora.com","line\nnext"')[0].source,'line\nnext');
 assert.throws(()=>csv('domain,domain\na.com,b.com'));assert.throws(()=>csv('domain,source\na.com,"unclosed'));assert.throws(()=>parseImport('{}','json'));assert.throws(()=>parseImport('x'.repeat(1000001),'json'));
});
test('migration reruns and import are idempotent, raw observations retained and stale overwrite blocked',t=>{
 const s=new Store();t.after(()=>s.db.close());const p=s.createUser('owner@example.com','test-only-long-passphrase','owner');
 assert.equal(s.import([manual()],p).changed,1);assert.equal(s.import([manual()],p).changed,0);assert.equal(s.records(p).length,1);assert.equal(s.raw(s.records(p)[0].id,p).length,1);
 assert.throws(()=>s.import([{...manual(),price:-2}],p));assert.throws(()=>s.import([{...manual(),availability:'available_confirmed'}],p));assert.throws(()=>s.import([{...manual(),observedAt:'2000-01-01'}],p));
 s.import([{...manual(),price:260}],p);assert.equal(s.raw(s.records(p)[0].id,p).length,2);assert.equal(s.records(p)[0].reviewed,false);
 assert.equal(Number(s.db.prepare('SELECT count(*) AS n FROM domains').get()!.n),1);
});
test('license partitions default private, public redistribution requires independent allowlist',t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('a@example.com','test-only-long-passphrase','owner'),b=s.createUser('b@example.com','test-only-long-passphrase','owner');s.import([manual()],a);
 assert.equal(s.records(null).length,0);assert.equal(s.records(b).length,0);assert.throws(()=>s.record(s.records(a)[0].id,b));assert.throws(()=>s.import([{...manual(),publicAllowed:true}],a));
 s.publicLicenses=['approved test license'];s.import([{...manual(),publicAllowed:true,licenseRef:'approved test license'}],a);assert.equal(s.records(null).length,1);assert.equal(s.records(null)[0].tenantId,'');
});
test('rule schema, nested AND/OR, null handling, acronym eligibility and trend rule',t=>{
 const s=new Store();t.after(()=>s.db.close());s.import(fixtureRows,null,'fixture');const d=s.records(null,'fixture').find(d=>d.domain==='abmc.com')!;
 const r=baseRule();r.group={op:'or',conditions:[{field:'length',op:'lte',value:4},{op:'and',conditions:[{field:'price',op:'lte',value:500},{field:'tld',op:'eq',value:'com'}]}]};assert(evaluate(validateRule(r),d).matches);
 const unknown={...d,extensionCount:null};const ext=baseRule();ext.group={op:'and',conditions:[{field:'extensionCount',op:'gte',value:5}]};assert.equal(evaluate(ext,unknown).matches,false);ext.unknown='include_labeled';assert.deepEqual(evaluate(ext,unknown),{matches:true,missing:['extensionCount']});
 const trend=baseRule();trend.group={op:'and',conditions:[{field:'trendVelocity',op:'gte',value:20}]};assert.equal(evaluate(trend,d).matches,false);
 assert.throws(()=>validateRule({...r,group:{op:'eval',conditions:[]}}));assert.throws(()=>validateRule({...r,group:{op:'and',conditions:[null]}}));assert.throws(()=>validateRule({...r,schedule:{...r.schedule,timezone:'Mars/City'}}));assert.throws(()=>validateRule({...r,group:{op:'and',conditions:[{field:'price',op:'contains',value:'1'}]}}));
});
test('per-user saved rules are isolated and versioned; edits and deletes denied cross-user',t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('a@example.com','test-only-long-passphrase','owner'),b=s.createUser('b@example.com','test-only-long-passphrase');const r=s.saveRule(a,baseRule());
 assert.equal(s.rules(b).length,0);assert.throws(()=>s.saveRule(b,baseRule(),r.id));assert.throws(()=>s.toggleRule(b,r.id,false));assert.throws(()=>s.deleteRule(b,r.id));assert.equal(s.saveRule(a,{...baseRule(),name:'Updated'},r.id).version,2);assert.equal(Number(s.db.prepare('SELECT count(*) AS n FROM rule_versions').get()!.n),2);s.toggleRule(a,r.id,false);assert.equal(s.saveRule(a,{...baseRule(),name:'Still paused'},r.id).enabled,false);
});
test('Lagos daily schedule, quiet hours, weekly gating and same-day dedupe',()=>{
 const r=baseRule();assert(scheduleDue(r,now,null));assert.equal(scheduleDue(r,now,now.toISOString()),false);assert.equal(scheduleDue(r,new Date('2026-11-16T22:00:00Z'),null),false);r.schedule.frequency='weekly';assert(scheduleDue(r,now,null));assert.equal(scheduleDue(r,new Date('2026-11-17T08:05:00Z'),null),false);
});
test('RDAP absence/expiry remain uncertain; bootstrap permits only approved HTTPS endpoints',async()=>{
 assert.equal(parseRdap(404,{}).availability,'possibly_available');assert.equal(parseRdap(429,{}).availability,'unknown');assert.equal(parseRdap(200,{objectClassName:'domain',ldhName:'example.com',events:[{eventAction:'expiration',eventDate:'2000-01-01'}]}).availability,'registered');assert.throws(()=>parseRdap(200,{foo:true}));
 const bootstrap:{services:[string[],string[]][]}={services:[[['com'],['http://127.0.0.1/','https://rdap.verisign.com/com/v1/']]]};assert.equal(rdapEndpoint('example.com',bootstrap,['rdap.verisign.com']),'https://rdap.verisign.com/com/v1/domain/example.com');assert.throws(()=>rdapEndpoint('example.com',bootstrap,[]));assert.equal(godaddy.canFetch().allowed,false);await assert.rejects(()=>dynadot.fetchPage());
});
test('Telegram requires verified private control, expires codes, encrypts destination and prevents replays',t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('a@example.com','test-only-long-passphrase','owner');const c=new URL(createLink(s,a,bot,now.getTime()).url).searchParams.get('start');const message={message:{text:'/start '+c,chat:{id:123,type:'private'},from:{id:123}}};
 assert.throws(()=>consumeLink(s,message,'wrong',bot,now.getTime()));assert.equal(consumeLink(s,{message:{...message.message,from:{id:456}}},bot.webhookSecret,bot,now.getTime()).accepted,false);
 assert.equal(consumeLink(s,message,bot.webhookSecret,bot,now.getTime()).accepted,true);assert.equal(consumeLink(s,message,bot.webhookSecret,bot,now.getTime()).accepted,false);const encrypted=String(s.db.prepare('SELECT encrypted_destination FROM telegram_links').get()!.encrypted_destination);assert.notEqual(encrypted,'123');assert.equal(decrypt(encrypted,bot),'123');
 const next=new URL(createLink(s,a,bot,now.getTime()).url).searchParams.get('start');assert.equal(consumeLink(s,{message:{...message.message,text:'/start '+next}},bot.webhookSecret,bot,now.getTime()+600001).accepted,false);unlink(s,a);assert.equal(s.db.prepare('SELECT * FROM telegram_links').get(),undefined);assert.throws(()=>createLink(s,a,{...bot,enabled:false}));
});
test('import -> review -> user-specific match -> mocked Telegram delivery, fixture exclusion and no duplicates',async t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('a@example.com','test-only-long-passphrase','owner'),b=s.createUser('b@example.com','test-only-long-passphrase','owner');s.import([manual()],a);s.import([manual('Nuvio.io')],b);s.import(fixtureRows,null,'fixture');
 const da=s.records(a)[0],db=s.records(b)[0];s.review(da.id,a);s.review(db.id,b);s.saveRule(a,baseRule('com'));s.saveRule(b,baseRule('io'));link(s,a,123);link(s,b,456);
 assert.equal(enqueueMatches(s,a,now).queued,1);assert.equal(enqueueMatches(s,b,now).queued,1);assert.equal(enqueueMatches(s,a,now).queued,0);
 const bodies:{chat_id:string;text:string;allow_paid_broadcast:boolean}[]=[];
 const transport=(async(_url:unknown,init:RequestInit)=>{bodies.push(JSON.parse(String(init.body)));return new Response(JSON.stringify({ok:true}),{status:200});}) as typeof fetch;
 assert.equal((await deliverOne(s,bot,transport)).state,'sent');assert.equal((await deliverOne(s,bot,transport)).state,'sent');assert.equal((await deliverOne(s,bot,transport)).state,'empty');assert.equal(bodies.length,2);assert(bodies.find(x=>x.chat_id==='123')!.text.includes('nexora.com'));assert(!bodies.find(x=>x.chat_id==='123')!.text.includes('nuvio.io'));assert(bodies.every(x=>x.allow_paid_broadcast===false));assert(bodies.every(x=>!x.text.includes('SAMPLE ONLY')));
});
test('unreviewed, stale, unknown, risk and fixture-only candidates never enqueue; ambiguous send not retried',async t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('a@example.com','test-only-long-passphrase','owner');link(s,a,123);const rule=baseRule();rule.schedule.frequency='instant';s.saveRule(a,rule);s.import(fixtureRows,null,'fixture');assert.equal(enqueueMatches(s,a,now).queued,0);s.import([manual()],a);assert.equal(enqueueMatches(s,a,now).queued,0);s.review(s.records(a)[0].id,a);assert.equal(enqueueMatches(s,a,new Date(now.getTime()+48*3600_000)).queued,0);assert.equal(enqueueMatches(s,a,now).queued,1);
 let calls=0;const transport=(async()=>{calls++;throw Error('network timeout after possible acceptance');}) as typeof fetch;assert.equal((await deliverOne(s,bot,transport)).state,'uncertain');assert.equal((await deliverOne(s,bot,transport)).state,'empty');assert.equal(calls,1);assert(renderAlert(s.records(null,'fixture')[0]).startsWith('SAMPLE ONLY'));
});
test('durable jobs lease, retries/dead letter, checkpoint and absolute daily/monthly cost caps',async t=>{
 const s=new Store();t.after(()=>s.db.close());const id=queueJob(s,'digest',{},1000);assert.equal(claimJob(s,1000)?.id,id);assert.equal(claimJob(s,2000),null);assert.equal(claimJob(s,32000)?.id,id);assert.equal(claimJob(s,64000)?.attempts,3);assert.equal(claimJob(s,96000),null);assert.equal(s.db.prepare('SELECT state FROM jobs WHERE id=?').get(id)!.state,'dead');
 const id2=queueJob(s,'digest',{},1000);assert.equal((await runOne(s,async()=>({cursor:'ok'}),1000)).state,'done');assert(String(s.db.prepare('SELECT checkpoint FROM jobs WHERE id=?').get(id2)!.checkpoint).includes('ok'));
 assert(reserveRequest(s,'rdap',{dailyLimit:1},now));assert.throws(()=>reserveRequest(s,'rdap',{dailyLimit:1},now));assert.throws(()=>reserveRequest(s,'paid',{dailyLimit:100,costCents:1},now));assert(reserveRequest(s,'paid',{dailyLimit:100,costCents:5,dailyCapCents:5,monthlyCapCents:5},now));assert.throws(()=>reserveRequest(s,'paid',{dailyLimit:100,costCents:1,dailyCapCents:100,monthlyCapCents:5},now));
});

test('file database migrations safely reopen; empty research contracts and unchecked trademark constraint',t=>{
 const path=join(mkdtempSync(join(tmpdir(),'domscout-migrations-')),'test.sqlite');let s=new Store(path);assert.equal(Number(s.db.prepare('SELECT count(*) AS n FROM migrations').get()!.n),4);s.db.close();s=new Store(path);t.after(()=>s.db.close());assert.equal(Number(s.db.prepare('SELECT count(*) AS n FROM migrations').get()!.n),4);
 for(const name of ['companies','domain_statuses','tld_observations','history_evidence','sales_comps','trademark_checks','keywords','trend_snapshots','tld_snapshots','scores','review_decisions','purchases','expenses','outcomes','investor_opinions'])assert.equal(Number(s.db.prepare('SELECT count(*) AS n FROM '+name).get()!.n),0);
});
test('refresh-only observations do not trigger new alerts but a material price change does',t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('material@example.com','test-only-long-passphrase','owner');link(s,a,123);const r=baseRule();r.schedule.frequency='instant';s.saveRule(a,r);s.import([manual()],a);s.review(s.records(a)[0].id,a);assert.equal(enqueueMatches(s,a,now).queued,1);
 const refreshed={...manual(),observedAt:'2026-11-16T08:06:00Z'};s.import([refreshed],a);s.review(s.records(a)[0].id,a);assert.equal(enqueueMatches(s,a,new Date('2026-11-16T08:07:00Z')).queued,0);s.import([{...refreshed,price:200}],a);s.review(s.records(a)[0].id,a);assert.equal(enqueueMatches(s,a,new Date('2026-11-16T08:08:00Z')).queued,1);
});

test('company-gap promotion remains blocked before alternative-use evidence gates',t=>{
 const s=new Store();t.after(()=>s.db.close());const a=s.createUser('company@example.com','test-only-long-passphrase','owner');link(s,a,123);const r=baseRule();r.group={op:'and',conditions:[{field:'length',op:'gte',value:3}]};r.schedule.frequency='instant';s.saveRule(a,r);s.import([{...manual(),category:'Company gap'}],a);s.review(s.records(a)[0].id,a);assert.equal(enqueueMatches(s,a,now).queued,0);
 const d=s.records(a)[0];const domain=s.db.prepare('SELECT id FROM domains WHERE domain=?').get(d.domain)!;s.db.prepare('INSERT INTO trademark_checks(id,domain_id,tenant_id,observed_at) VALUES (?,?,?,?)').run('test-unchecked',domain.id as string,a.tenantId,now.toISOString());assert.equal(s.db.prepare('SELECT outcome FROM trademark_checks').get()!.outcome,'not_checked');assert.throws(()=>s.db.prepare("UPDATE trademark_checks SET outcome='clear'").run());
});

test('international suffix roots and visible punctuation do not confuse Punycode encoding with name content',t=>{
 const n=normalize('пример.рф');assert.equal(n.length,6);assert.equal(n.hasHyphen,false);assert.equal(n.hasDigit,false);const path=join(mkdtempSync(join(tmpdir(),'domscout-idn-')),'test.sqlite');let s=new Store(path);t.after(()=>s.db.close());const p=s.createUser('idn@example.com','test-only-long-passphrase','owner');s.import([manual('пример.рф')],p);assert.equal(s.db.prepare('SELECT unicode_root FROM roots').get()!.unicode_root,'пример');s.db.prepare("UPDATE roots SET unicode_root=''").run();s.db.close();s=new Store(path);assert.equal(s.db.prepare('SELECT unicode_root FROM roots').get()!.unicode_root,'пример');
});
