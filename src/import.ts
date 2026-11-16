import { createHash } from 'node:crypto';
import { normalize } from './normalize.ts';
import { categories, fail, type Dataset, type DomainRecord } from './types.ts';
export const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
export const stable=(v:unknown):string=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export function csv(text:string):Record<string,string>[] {
 if(text.length>1_000_000)fail('import_limit','Import at most 1 MB.');
 let cell='',row:string[]=[],rows:string[][]=[],quoted=false;
 for(let i=0;i<text.length;i++) {const c=text[i];if(c==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!cell||quoted)quoted=!quoted;else fail('invalid_csv','Unexpected quote in CSV.');}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)fail('invalid_csv','Unclosed CSV quote.');if(cell||row.length){row.push(cell);rows.push(row);}
 const headers=rows.shift()?.map(h=>h.trim().replace(/^\uFEFF/,''));
 if(!headers?.includes('domain')||new Set(headers).size!==headers.length||headers.some(h=>['__proto__','constructor','prototype'].includes(h)))fail('invalid_csv','CSV needs a unique domain header.');
 return rows.map(r=>{if(r.length!==headers.length)fail('invalid_csv','CSV row has a different number of fields.');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));});
}
export function parseImport(content:string,format:'json'|'csv'):unknown[] {
 if(Buffer.byteLength(content)>1_000_000)fail('import_limit','Import at most 1 MB.');
 let rows:unknown;try{rows=format==='csv'?csv(content):JSON.parse(content);}catch(e){if(e instanceof SyntaxError)fail('invalid_json','Use a JSON array of domain records.');throw e;}
 if(!Array.isArray(rows)||!rows.length||rows.length>500)fail('import_limit','Import 1–500 rows per request.');return rows;
}
export function validateImport(raw:unknown,tenantId:string,dataset:Dataset,now=new Date()):DomainRecord {
 const x=raw as Record<string,unknown>;
 if(!x||typeof x!=='object'||Array.isArray(x))fail('invalid_import','Each row must be an object.');
 const n=normalize(x.domain);const text=(k:string,max=500)=>{const t=x[k];if(typeof t!=='string'||!t.trim()||t.length>max)fail('invalid_import',`${k} is required (maximum ${max} characters).`);return t.trim();};
 const source=text('source',80),externalId=text('externalId',120),licenseRef=text('licenseRef',500),sourceUrl=text('sourceUrl',1000),observedAt=text('observedAt',50);
 try{const u=new URL(sourceUrl);if(u.protocol!=='https:'||u.username||u.password)throw 0;}catch{fail('invalid_import','sourceUrl must be an HTTPS evidence link. It will not be fetched.');}
 const observed=Date.parse(observedAt);if(!Number.isFinite(observed)||observed>now.getTime()+300_000)fail('invalid_import','observedAt must be an ISO date, not in the future.');
 const numeric=(k:string)=>{const v=x[k];if(v===undefined||v===null||v==='')return null;const n=typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)?Number(v):v;if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>1e12)fail('invalid_import',`${k} must be a nonnegative number or null.`);return n;};
 const category=(x.category||'Expiring') as DomainRecord['category'];if(!categories.includes(category))fail('invalid_import','Unknown category.');
 const availability=(x.availability||'unknown') as DomainRecord['availability'];if(!['unknown','registered','possibly_available'].includes(availability))fail('availability_unverified','Manual imports cannot confirm buy-now availability. Use unknown, registered or possibly_available.');
 let tlds:string[]|null=null;if(x.extensionTlds!==undefined&&x.extensionTlds!==null&&x.extensionTlds!=='') {const v=typeof x.extensionTlds==='string'?String(x.extensionTlds).split('|'):x.extensionTlds;if(!Array.isArray(v)||v.length>1000||v.some(t=>typeof t!=='string'||!/^\.?[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i.test(t)))fail('invalid_import','extensionTlds must be a TLD list or pipe-separated set.');tlds=[...new Set(v.map(t=>String(t).replace(/^\./,'').toLowerCase()))].sort();}
 if(x.deadline&&!Number.isFinite(Date.parse(String(x.deadline))))fail('invalid_import','deadline must be an ISO date or null.');
 const deadline=x.deadline?new Date(String(x.deadline)).toISOString():null;const confidence=numeric('confidence');if(confidence!==null&&confidence>100)fail('invalid_import','Confidence must be between 0 and 100.');
 const currency=String(x.currency||'USD').toUpperCase();if(!/^[A-Z]{3}$/.test(currency))fail('invalid_import','Use a three-letter currency code.');
 return {...n,id:hash([n.domain,tenantId,source,externalId,dataset].join('\0')),dataset,tenantId,source,externalId,licenseRef,sourceUrl,observedAt:new Date(observed).toISOString(),category,availability,price:numeric('price'),currency,deadline,extensionTlds:tlds,extensionCount:tlds===null?null:tlds.length,history:x.history==='present'?'present':'unknown',confidence,trendVelocity:numeric('trendVelocity'),publicAllowed:dataset!=='fixture'&&x.publicAllowed===true,notificationsAllowed:dataset!=='fixture'&&x.notificationsAllowed===true,reviewed:false,risk:typeof x.risk==='string'?x.risk.slice(0,500):null,observationId:'',trademark:'not_checked'};
}
