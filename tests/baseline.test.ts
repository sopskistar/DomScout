import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { config } from '../src/config.ts';
test('full appendix and every nonempty numbered research line retained', () => {
 const a=readFileSync('docs/RESEARCH_APPENDIX.md','utf8');
 const r=JSON.parse(readFileSync('docs/research-requirements.json','utf8'));
 assert.equal(new Set(r.map((x:any)=>x.section)).size,24);
 for(const x of r) assert.equal(a.split('\n')[x.line-1],x.requirement);
 assert(r.filter((x:any)=>x.section===13).every((x:any)=>x.status==='deferred' && x.reason.includes('deferred_by_owner')));
 assert(a.includes('48.1%'));
});
test('all provider flags and paid operations default off',()=>{
 const r=JSON.parse(readFileSync('docs/source-registry.json','utf8'));
 assert(r.length>=50); assert(r.every((x:any)=>x.enabled===false));
 assert.equal(config.paidDailyCapCents,0); assert.equal(config.billingEnabled,false);
});
