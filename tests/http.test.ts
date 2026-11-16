import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {Store} from '../src/db.ts';
import {createApp} from '../src/server.ts';
import {fixtureRows} from '../src/fixtures.ts';
const origin='http://127.0.0.1:4310';
async function setup(t:TestContext) {
 const store=new Store();store.import(fixtureRows,null,'fixture');const owner=store.createUser('a@example.com','test-only-long-passphrase','owner'),other=store.createUser('b@example.com','test-only-long-passphrase','researcher');const server=createApp(store,{origin});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address() as {port:number};const base=`http://127.0.0.1:${address.port}`;t.after(async()=>{await new Promise<void>(r=>server.close(()=>r()));store.db.close();});
 const request=(path:string,body?:unknown,cookie='',givenOrigin=origin)=>fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json',origin:givenOrigin}),cookie},body:body===undefined?undefined:JSON.stringify(body)});
 const login=async(email:string)=>{const res=await request('/api/login',{email,password:'test-only-long-passphrase'});assert.equal(res.status,200);assert.match(res.headers.get('set-cookie')!,/HttpOnly; SameSite=Strict/);return res.headers.get('set-cookie')!.split(';')[0];};return {store,owner,other,request,login};
}
test('HTTP public boundary, filters/sorts/pagination, missing-value semantics and disabled product routes',async t=>{
 const {request}=await setup(t);assert.equal((await (await request('/api/domains')).json()).total,0);const sample=await (await request('/api/domains?dataset=fixture&sort=length:asc,domain:asc')).json();assert.equal(sample.records.length,12);assert.equal(sample.total,24);const second=await (await request('/api/domains?dataset=fixture&page=2')).json();assert.equal(second.records.length,12);assert.equal((await request('/api/domains?sort=raw_json:asc')).status,400);
 const filtered=await(await request('/api/domains?dataset=fixture&minExtensions=5')).json();const included=await(await request('/api/domains?dataset=fixture&minExtensions=5&unknown=include_labeled')).json();assert(included.total>filtered.total);assert(filtered.records.every((d:any)=>d.extensionCount>=5));
 assert.equal((await request('/api/v1/domains')).status,503);assert.equal((await request('/api/telegram/link',{})).status,401);assert.equal((await request('/api/import',{format:'json',content:'[]'})).status,401);assert.equal((await request('/api/login',{email:'a@example.com',password:'test-only-long-passphrase'},'','https://attacker.example')).status,403);
});
test('HTTP denies cross-account rule access and invalid sessions; no private/raw evidence leaked',async t=>{
 const {request,login,store,owner}=await setup(t);const a=await login('a@example.com'),b=await login('b@example.com');const rule={name:'Only mine',kind:'alert',group:{op:'and',conditions:[{field:'length',op:'gte',value:3}]},unknown:'exclude',schedule:{frequency:'daily',timezone:'Africa/Lagos',hour:9,maxMatches:10,maxAlerts:10,quietStart:22,quietEnd:7}};
 const created=await(await request('/api/rules',{rule},a)).json();assert.equal((await(await request('/api/rules',undefined,b)).json()).rules.length,0);assert.equal((await request('/api/rules',{rule,id:created.id},b)).status,404);assert.equal((await request('/api/rules/action',{id:created.id,action:'delete'},b)).status,404);assert.equal((await request('/api/rules',undefined,'domscout_session=invalid')).status,401);
 store.import([{...fixtureRows[0],observedAt:new Date().toISOString()}],owner);const d=store.records(owner)[0];assert.equal((await request('/api/domains/'+d.id,undefined,b)).status,404);assert.equal((await request('/api/domains/'+d.id)).status,404);assert.equal((await request('/api/health')).status,200);assert.equal((await(await request('/api/health')).json()).jobs.length,0);
 const bad=await request('/api/import',{format:'json',content:'[]'},b);assert.equal(bad.status,403);assert.equal((await request('/api/logout',{},a)).status,200);assert.equal((await request('/api/rules',undefined,a)).status,401);
});
