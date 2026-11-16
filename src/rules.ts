import { fail, type DomainRecord } from './types.ts';
export const fields=['domain','tld','length','price','extensionCount','category','source','availability','confidence','trendVelocity','history','currency'] as const;
type Field=typeof fields[number];
export type Condition={field:Field;op:'eq'|'neq'|'gte'|'lte'|'in'|'not_in'|'contains'|'not_contains';value:string|number|string[]};
export type Group={op:'and'|'or';conditions:(Condition|Group)[]};
export interface Rule { name:string; kind:'alert'|'search'; group:Group; unknown:'exclude'|'include_labeled'; schedule:{frequency:'daily'|'weekly'|'instant';timezone:string;hour:number;maxMatches:number;maxAlerts:number;quietStart:number;quietEnd:number}; }
const numeric=['length','price','extensionCount','confidence','trendVelocity'];
export function validateRule(value:unknown):Rule {
 const r=value as Rule;
 if(!r || typeof r!=='object' || typeof r.name!=='string' || !r.name.trim() || r.name.length>100 || !['alert','search'].includes(r.kind) || !['exclude','include_labeled'].includes(r.unknown)) fail('invalid_rule','Provide a rule name, kind and unknown-data policy.');
 let count=0;
 function group(g:Group,depth:number) {
  if(!g || !['and','or'].includes(g.op) || !Array.isArray(g.conditions) || !g.conditions.length || depth>5) fail('invalid_rule','Use AND/OR groups with conditions, at most five levels deep.');
  for(const child of g.conditions) {
   if(!child || typeof child!=='object')fail('invalid_rule','Each condition must be an object.');
   if(++count>50) fail('invalid_rule','Use at most 50 conditions.');
   if('conditions' in child) {group(child,depth+1);continue;}
   if(!child || !fields.includes(child.field) || !['eq','neq','gte','lte','in','not_in','contains','not_contains'].includes(child.op)) fail('invalid_rule','Unsupported rule field or operator.');
   if(numeric.includes(child.field)) {if(typeof child.value!=='number' || !Number.isFinite(child.value) || child.value<0 || !['eq','neq','gte','lte'].includes(child.op)) fail('invalid_rule','Numeric fields require a nonnegative finite number and comparison.');}
   else if(['in','not_in'].includes(child.op)) {if(!Array.isArray(child.value) || !child.value.length || child.value.length>30 || child.value.some(x=>typeof x!=='string'||x.length>100)) fail('invalid_rule','Set conditions require 1–30 text values.');}
   else if(typeof child.value!=='string'||child.value.length>100||['gte','lte'].includes(child.op)) fail('invalid_rule','Text conditions require text and a supported comparison.');
  }
 }
 group(r.group,0);
 const s=r.schedule;
 if(!s || !['daily','weekly','instant'].includes(s.frequency)) fail('invalid_schedule','Select a valid frequency.');
 try {new Intl.DateTimeFormat('en',{timeZone:s.timezone}).format();}catch {fail('invalid_schedule','Select a valid IANA time zone.');}
 for(const k of ['hour','quietStart','quietEnd'] as const) if(!Number.isInteger(s[k])||s[k]<0||s[k]>23) fail('invalid_schedule','Hours must be between 0 and 23.');
 for(const k of ['maxMatches','maxAlerts'] as const) if(!Number.isInteger(s[k])||s[k]<1||s[k]>50) fail('invalid_schedule','Match and alert caps must be between 1 and 50.');
 return JSON.parse(JSON.stringify(r));
}
export function evaluate(rule:Rule,d:DomainRecord):{matches:boolean;missing:string[]} {
 const missing=new Set<string>();
 function test(x:Condition|Group):boolean {
  if('conditions' in x) {const results=x.conditions.map(test);return x.op==='and'?results.every(Boolean):results.some(Boolean);}
  const v=d[x.field];if(v===null || v===undefined || v==='unknown') {missing.add(x.field);return rule.unknown==='include_labeled';}
  const a=typeof v==='string'?v.toLowerCase():v;const b=typeof x.value==='string'?x.value.toLowerCase():x.value;
  switch(x.op) {case 'eq':return a===b;case 'neq':return a!==b;case 'gte':return Number(a)>=Number(b);case 'lte':return Number(a)<=Number(b);case 'in':return (b as string[]).map(s=>s.toLowerCase()).includes(String(a));case 'not_in':return !(b as string[]).map(s=>s.toLowerCase()).includes(String(a));case 'contains':return String(a).includes(String(b));case 'not_contains':return !String(a).includes(String(b));}
 }
 return {matches:test(rule.group),missing:[...missing]};
}
export function scheduleDue(rule:Rule,now:Date,lastRun:string|null) {
 const s=rule.schedule;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:s.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(now);
 const get=(p:string)=>parts.find(x=>x.type===p)?.value||'';const hour=Number(get('hour'));
 const quiet=s.quietStart!==s.quietEnd && (s.quietStart<s.quietEnd ? hour>=s.quietStart&&hour<s.quietEnd : hour>=s.quietStart||hour<s.quietEnd);
 if(quiet)return false;
 if(s.frequency==='instant')return true;
 if(hour!==s.hour || s.frequency==='weekly'&&get('weekday')!=='Mon')return false;
 if(!lastRun)return true;
 const day=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:s.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 return day(now)!==day(new Date(lastRun));
}
