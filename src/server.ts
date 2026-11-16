import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync,existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';
import { Store } from './db.ts';
import { AppError,fail,type Principal,type Dataset,type DomainRecord } from './types.ts';
import { parseImport } from './import.ts';
import { fixtureRows } from './fixtures.ts';
import { validateRule,evaluate } from './rules.ts';
import { createLink,consumeLink,unlink,optionsFromEnv,telegramReady,renderAlert,type TelegramOptions } from './telegram.ts';
import { queueJob } from './jobs.ts';
export function createApp(store:Store,opts:{origin?:string;telegram?:TelegramOptions}={}) {
 const origin=opts.origin||process.env.PUBLIC_ORIGIN||'http://127.0.0.1:4310',telegram=opts.telegram||optionsFromEnv();
 const attempts=new Map<string,{n:number;until:number}>();
 function limit(key:string,max:number,window=60_000){const now=Date.now();let r=attempts.get(key);if(!r||r.until<=now){r={n:0,until:now+window};attempts.set(key,r);}if(++r.n>max)fail('rate_limited','Too many requests. Try again shortly.',429);if(attempts.size>10000)for(const [k,v]of attempts)if(v.until<=now)attempts.delete(k);}
 const send=(res:ServerResponse,status:number,data:unknown)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
 async function body(req:IncomingMessage){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>1_100_000)fail('request_too_large','Maximum request body is 1 MB.',413);}try{return JSON.parse(data||'{}');}catch{fail('invalid_json','Request body must be JSON.');}}
 function requireUser(p:Principal|null){if(!p)fail('unauthorized','Sign in to your private workspace.',401);return p;}
 function publicRecord(d:DomainRecord,p:Principal|null){if(p?.tenantId===d.tenantId||d.dataset==='fixture')return d;const {tenantId,licenseRef,notificationsAllowed,reviewed,...safe}=d;return {...safe,tenantId:'',licenseRef:'Approved public summary',notificationsAllowed:false,reviewed:false};}
 return createServer(async(req,res)=>{
  res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');res.setHeader('x-frame-options','DENY');res.setHeader('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  try{
   const url=new URL(req.url||'/',origin),path=url.pathname,method=req.method||'GET';limit(req.socket.remoteAddress||'local',180);
   const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('domscout_session='))?.slice(17);const p=store.principal(token);
   if(method!=='GET'&&method!=='HEAD'&&path!=='/api/telegram/webhook'&&req.headers.origin!==origin)fail('origin_denied','This action requires the configured same-origin application.',403);
   if(path.startsWith('/api/v1'))fail('api_disabled','Developer API private beta is disabled; no billing or API access is active.',503);
   if(path==='/api/session'&&method==='GET')return send(res,200,{user:p,telegram:{enabled:telegramReady(telegram),linked:!!(p&&store.db.prepare('SELECT user_id FROM telegram_links WHERE user_id=?').get(p.id))}});
   if(path==='/api/login'&&method==='POST'){limit('login:'+req.socket.remoteAddress,5,15*60_000);const b=await body(req),result=store.login(b.email,b.password);res.setHeader('set-cookie',`domscout_session=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${origin.startsWith('https:')?'; Secure':''}`);store.audit(result.principal,'session.login');return send(res,200,{user:result.principal});}
   if(path==='/api/logout'&&method==='POST'){if(token)store.db.prepare('DELETE FROM sessions WHERE hash=?').run((await import('./import.ts')).hash(token));res.setHeader('set-cookie','domscout_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');return send(res,200,{ok:true});}
   if(path==='/api/domains'&&method==='GET'){
    const dataset=url.searchParams.get('dataset')==='fixture'?'fixture':'manual';let rows=store.records(p,dataset);const q=url.searchParams.get('q')?.toLowerCase()||'',category=url.searchParams.get('category')||'',tld=url.searchParams.get('tld')?.replace(/^\./,'').toLowerCase()||'';
    rows=rows.filter(d=>(!q||d.domain.includes(q)||d.unicode.includes(q))&&(!category||d.category===category)&&(!tld||tld.split(',').includes(d.tld)));
    for(const [param,field,direction]of [['minLength','length','min'],['maxLength','length','max'],['maxPrice','price','max'],['minExtensions','extensionCount','min']] as const){const value=url.searchParams.get(param);if(value!==null&&value!==''){const n=Number(value);if(!Number.isFinite(n)||n<0)fail('invalid_filter','Filter values must be nonnegative numbers.');rows=rows.filter(d=>d[field]===null?url.searchParams.get('unknown')==='include_labeled':direction==='min'?d[field]!>=n:d[field]!<=n);}}
    if(url.searchParams.get('watchlist')==='true'){const ids=store.watches(requireUser(p));rows=rows.filter(d=>ids.includes(d.id));}
    const allowed=['domain','price','length','extensionCount','observedAt'];const sorts=(url.searchParams.get('sort')||'domain:asc').split(',').slice(0,3).map(s=>s.split(':'));
    if(sorts.some(([f,dir])=>!allowed.includes(f)||!['asc','desc'].includes(dir)))fail('invalid_sort','Sort by a supported column and direction.');
    rows.sort((a,b)=>{for(const [f,dir]of sorts){const k=f as 'domain'|'price'|'length'|'extensionCount'|'observedAt';const x=a[k],y=b[k];if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;if(x===null&&y===null)continue;const c=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y));if(c)return dir==='desc'?-c:c;}return a.id.localeCompare(b.id);});
    const page=Math.max(1,Math.min(100000,Math.floor(Number(url.searchParams.get('page'))||1))),pageSize=12,total=rows.length;
    return send(res,200,{records:rows.slice((page-1)*pageSize,page*pageSize).map(d=>publicRecord(d,p)),total,page,pageSize,dataset});
   }
   if(path.match(/^\/api\/domains\/[a-f0-9]{64}$/)&&method==='GET'){const d=store.record(path.split('/').at(-1)!,p,url.searchParams.get('dataset')==='fixture'?'fixture':'all');return send(res,200,{record:publicRecord(d,p),raw:p?.tenantId===d.tenantId&&p.role==='owner'?store.raw(d.id,p):null});}
   if(path==='/api/import'&&method==='POST'){const user=requireUser(p);if(user.role!=='owner')fail('forbidden','Owner import permission required.',403);const b=await body(req);if(typeof b.content!=='string'||!['json','csv'].includes(b.format))fail('invalid_import','Select JSON or CSV and provide content.');return send(res,200,store.import(parseImport(b.content,b.format),user));}
   if(path==='/api/review'&&method==='POST'){const user=requireUser(p),b=await body(req);return send(res,200,{record:store.review(String(b.id),user)});}
   if(path==='/api/watchlist'&&method==='GET')return send(res,200,{ids:store.watches(requireUser(p))});
   if(path==='/api/watchlist'&&method==='POST'){const user=requireUser(p),b=await body(req);store.watch(user,String(b.id),b.add===true,b.dataset==='fixture'?'fixture':'all');return send(res,200,{ids:store.watches(user)});}
   if(path==='/api/rules'&&method==='GET')return send(res,200,{rules:store.rules(requireUser(p))});
   if(path==='/api/rules'&&method==='POST'){const user=requireUser(p),b=await body(req);return send(res,200,store.saveRule(user,b.rule,b.id));}
   if(path==='/api/rules/action'&&method==='POST'){const user=requireUser(p),b=await body(req);if(b.action==='delete')store.deleteRule(user,String(b.id));else if(b.action==='toggle'&&typeof b.enabled==='boolean')store.toggleRule(user,String(b.id),b.enabled);else fail('invalid_action','Choose pause, enable or delete.');return send(res,200,{ok:true});}
   if(path==='/api/rules/preview'&&method==='POST'){const user=requireUser(p),b=await body(req),rule=validateRule(b.rule);const matches=store.records(user,b.dataset==='fixture'?'fixture':'manual').map(d=>({record:d,...evaluate(rule,d)})).filter(x=>x.matches);return send(res,200,{matches:matches.slice(0,50),total:matches.length,sample:b.dataset==='fixture',delivery:'Preview only; nothing sent.'});}
   if(path==='/api/telegram/link'&&method==='POST')return send(res,200,createLink(store,requireUser(p),telegram));
   if(path==='/api/telegram/unlink'&&method==='POST'){unlink(store,requireUser(p));return send(res,200,{ok:true});}
   if(path==='/api/telegram/webhook'&&method==='POST'){limit('webhook',60);return send(res,200,consumeLink(store,await body(req),String(req.headers['x-telegram-bot-api-secret-token']||''),telegram));}
   if(path==='/api/alerts/preview'&&method==='POST'){const user=requireUser(p),b=await body(req),d=store.record(String(b.id),user,b.dataset==='fixture'?'fixture':'all');return send(res,200,{text:renderAlert(d),sent:false});}
   if(path==='/api/alerts/history'&&method==='GET'){const user=requireUser(p);return send(res,200,{events:store.db.prepare('SELECT id,status,created_at,sent_at FROM delivery_events WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(user.id)});}
   if(path==='/api/jobs/run'&&method==='POST'){const user=requireUser(p);if(user.role!=='owner')fail('forbidden','Owner job access required.',403);limit('manual-job:'+user.id,5);return send(res,202,{id:queueJob(store,'digest',{userId:user.id})});}
   if(path==='/api/health'&&method==='GET'){const all=JSON.parse(readFileSync('docs/source-registry.json','utf8'));return send(res,200,{sources:all.map((s:Record<string,unknown>)=>({id:s.id,name:s.name,url:s.url,status:s.status,enabled:false,notes:s.notes,lastChecked:s.lastChecked})),jobs:p?.role==='owner'?store.db.prepare('SELECT id,kind,state,attempts,available_at,lease_until,last_error FROM jobs ORDER BY created_at DESC LIMIT 50').all():[],cost:{dailyCapCents:0,monthlyCapCents:0},billing:false,whatsapp:false});}
   if(path==='/robots.txt'){res.writeHead(200,{'content-type':'text/plain'});return res.end('User-agent: *\nDisallow: /api/\nDisallow: /settings\nDisallow: /watchlist\nDisallow: /rules\nDisallow: /saved\nDisallow: /import\nDisallow: /*?dataset=fixture\nSitemap: '+origin+'/sitemap.xml\n');}
   if(path==='/sitemap.xml'){res.writeHead(200,{'content-type':'application/xml'});return res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/sources','/privacy','/terms'].map(p=>'<url><loc>'+origin+p+'</loc></url>').join('')+'</urlset>');}
   if(path.startsWith('/api/'))fail('not_found','Endpoint not found.',404);
   if(method!=='GET'&&method!=='HEAD')fail('method_not_allowed','Method not allowed.',405);
   const file=resolve('public','.'+path);const publicRoot=resolve('public');const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.txt':'text/plain','.xml':'application/xml','.woff2':'font/woff2','.ttf':'font/ttf'};
   if(file.startsWith(publicRoot+'/')&&existsSync(file)&&mime[extname(file)]){res.writeHead(200,{'content-type':mime[extname(file)]});return res.end(method==='HEAD'?undefined:readFileSync(file));}
   const routes=['/','/discovery','/expiring','/watchlist','/rules','/saved','/sources','/import','/settings','/developers','/privacy','/terms'];const known=routes.includes(path);
   res.writeHead(known?200:404,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});const titles:Record<string,string>={'/':'Domain discovery','/discovery':'Domain discovery','/expiring':'Expiring & auctions','/watchlist':'Private watchlist','/rules':'Personal alert rules','/saved':'Saved searches','/sources':'Source coverage','/import':'Authorized data import','/settings':'Account & delivery','/developers':'Developer access — inactive','/privacy':'Privacy notice','/terms':'Research terms'};
   const html=readFileSync('public/index.html','utf8').replace('<title>DomScout: Domain discovery & evidence</title>',`<title>${titles[path]||'Page not found'} — DomScout</title>`).replace('content="/brand/og.png"',`content="${origin}/brand/og.png"`);res.end(method==='HEAD'?undefined:html);
  }catch(e){const err=e instanceof AppError?e:new AppError(500,'internal_error','The request could not be completed. Try again or inspect the owner log.');if(!(e instanceof AppError))console.error('Request failed:',e instanceof Error?e.name:'unknown');send(res,err.status,{error:{code:err.code,message:err.message}});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('dist/server.js')){
 const store=new Store(process.env.DATABASE_PATH||'data/domscout.sqlite',(process.env.APPROVED_PUBLIC_LICENSES||'').split('|').filter(Boolean));store.import(fixtureRows,null,'fixture');
 const port=Number(process.env.PORT||4310),host=process.env.HOST||'127.0.0.1';const server=createApp(store).listen(port,host,()=>console.log(`DomScout: http://${host}:${port} (no live connectors; sample mode explicit)`));
 for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>server.close(()=>{store.db.close();process.exit(0);}));
}
