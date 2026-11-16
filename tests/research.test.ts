import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Store} from '../src/db.ts';
import {enrichmentConnectors} from '../src/connectors.ts';
import {fixtureRows} from '../src/fixtures.ts';
import {scoreResearch,validateBundle,classifyBrandable,parseCdx,defaultScoreConfig,subtypes,rankWithinStrategy,type Bundle,type Fact,type Provenance} from '../src/research.ts';
import {saveResearch,latestResearch} from '../src/research-store.ts';
const p:Provenance={source:'Synthetic research fixture',url:'https://example.com/research-fixture',observedAt:'2026-11-16T08:00:00Z',licenseRef:'Test-only synthetic evidence; no real sale, company or availability claim',independenceKey:'fixture',confidence:.8,evidenceClass:'fixture'};
const fact=(value:number|string|null,k:string):Fact=>({...p,value,independenceKey:k,currency:'USD',geography:'Synthetic test market',period:'2025 fixture',unit:k==='cpc'?'USD/click':k==='census-income'?'USD/year':k==='census-home'?'USD':'index/count'});
function bundle(domain='Nexora.com'):Bundle{return {schemaVersion:1,domain,dataset:'fixture',subtypes:[],metrics:{},extensions:null,history:[],sales:[]};}
function strong(domain:string){const b=bundle(domain);b.metrics=Object.fromEntries(['meaning','recall','deliberateSpelling','communication','adaptability','keywordClarity','alternativeScarcity'].map(k=>[k,fact(90,k)]));return b;}
test('all owner structures remain eligible and can score well; no fictional availability assigned',()=>{
 const cases:[string,string[]][]=[['ABMC',['acronym_initialism']],['ZayaPay',['invented_coined','commercial_prefix_suffix']],['BluebirdHQ',['compound','commercial_prefix_suffix']],['AuthenTalk',['blend','compound']],['GetBlocky',['commercial_prefix_suffix']],['Nexora',['invented_coined']]];
 for(const [name,types]of cases){const r=scoreResearch(name,strong(name+'.com'));assert.equal(r.eligible,true);for(const type of types)assert(r.subtypes.includes(type as any),name+': '+type);assert(r.scores.brandability.value!>=65,name);assert(!('availability'in r));assert.equal(r.trademark,'not_checked');}
 const bad=strong('xqvq999---spam.com');for(const f of Object.values(bad.metrics))f.value=5;const r=scoreResearch('xqvq999---spam',bad);assert(r.scores.brandability.value!<35);assert(r.scores.brandability.risks.some(x=>x.includes('Digit')));
});
test('unknown remains null, evidence coverage gates and independent-group correlation cap',()=>{
 const unknown=scoreResearch('Nexora',bundle());assert.equal(unknown.scores.brandability.value,null);assert.equal(unknown.scores.extension_adoption.value,null);assert.equal(unknown.scores.cleanliness.value,null);assert.equal(unknown.scores.company_gap.value,null);assert.equal(unknown.scores.trend.value,null);
 const b=strong('Nexora.com');for(const v of Object.values(b.metrics))v.independenceKey='one-repeated-opinion';const r=scoreResearch('Nexora',b);assert(r.scores.brandability.confidence<50);const c=defaultScoreConfig();c.minimumCoverage=1;assert.equal(scoreResearch('Nexora',strong('Nexora.com'),c).scores.brandability.value,null);
});
test('actual extension lists and complete/partial semantics preserve count bands, not inferred ownership',()=>{
 const b=bundle();b.extensions={...p,tlds:['com','ai','io','co','net','org'],usedByCompanies:null,completeness:'complete'};assert.equal(scoreResearch('Nexora',b).scores.extension_adoption.value,60);b.extensions.completeness='partial';assert.equal(scoreResearch('Nexora',b).scores.extension_adoption.value,null);b.extensions.completeness='complete';b.extensions.tlds=[];assert.equal(scoreResearch('Nexora',b).scores.extension_adoption.value,0);
});
test('history cleanliness separate from stability: no archive is unknown, unreviewed not clean, abuse explicit',()=>{
 const b=strong('Nexora.com');b.history=[{...p,capturedAt:'2020-01-01',assessment:'unreviewed'}];assert.equal(scoreResearch('Nexora',b).scores.cleanliness.value,null);b.history[0].assessment='legitimate';assert.equal(scoreResearch('Nexora',b).scores.cleanliness.value,null);b.history[0].assessment='phishing';const r=scoreResearch('Nexora',b);assert.equal(r.scores.cleanliness.value,5);assert.equal(r.scores.stability.value,null);
});
test('listings/estimates/irrelevant comps excluded; third-party reports retain reduced evidence weight',()=>{
 const b=strong('Nexora.com');const s={...p,domain:'Veyra.com',category:'Brandable',kind:'listing' as const,amount:100,currency:'USD',soldDate:'2025-01-01',reportDate:'2025-01-02',confirmationClass:'third_party_reported' as const,venue:null};b.sales=[s];assert.equal(scoreResearch('Nexora',b).scores.comparable_sales.value,null);
 b.sales=[{...s,kind:'sale',independenceKey:'report1'},{...s,domain:'Zenova.com',kind:'sale',independenceKey:'report2'}];const reported=scoreResearch('Nexora',b);assert(reported.scores.comparable_sales.value!==null);assert(reported.relevantComps.every(c=>c.sale.confirmationClass==='third_party_reported'));b.sales=b.sales.map(s=>({...s,confirmationClass:'verified'}));assert(scoreResearch('Nexora',b).scores.comparable_sales.value!>reported.scores.comparable_sales.value!);
 b.sales=[{...s,kind:'sale',domain:'VeryLongUnrelatedRoofingName.org',category:'Geo / EMD'}];assert.equal(scoreResearch('Nexora',b).scores.comparable_sales.value,null);
});
test('geo and exact-match inputs distinguish commercial markets; CPC never becomes price prediction',()=>{
 const b=strong('DallasRoofing.com');b.metrics={...b.metrics,population:fact(1000000,'census-pop'),income:fact(120000,'census-income'),homeValue:fact(800000,'census-home'),buyerCount:fact(80,'directory'),commercialIntent:fact('transactional','intent'),searchVolume:fact(15000,'demand'),cpc:fact(30,'cpc')};const good=scoreResearch('DallasRoofing',b);const weak=structuredClone(b);weak.metrics.population.value=500;weak.metrics.income.value=10000;weak.metrics.buyerCount.value=1;weak.metrics.commercialIntent.value='informational';weak.metrics.searchVolume.value=10;weak.metrics.cpc.value=0;assert(good.scores.geo_service.value!>scoreResearch('DallasRoofing',weak).scores.geo_service.value!);assert(good.scores.exact_match.value!==null);assert(!('estimatedPrice'in good));
});
test('strategy-specific config preserves unusual lengths, all eight manual subtype labels, rejects malformed evidence',()=>{
 const c=defaultScoreConfig();c.subtypeLengths.acronym_initialism={min:2,max:5};const b=strong('ABMC.com');b.subtypes=['intentional_misspelling','dictionary_near_dictionary'];const r=scoreResearch('ABMC',b,c);assert(r.subtypes.includes('intentional_misspelling'));assert(r.subtypes.includes('acronym_initialism'));assert.equal(r.eligible,true);assert.throws(()=>validateBundle({...b,metrics:{meaning:{...p,value:101}}}));assert.throws(()=>validateBundle({...b,dataset:'manual'}));assert.throws(()=>scoreResearch('Different',b));
 const rows=[['timestamp','original','statuscode','digest'],['20200101120000','http://example.com','200','fixture']];assert.equal(parseCdx(rows)[0].assessment,'unreviewed');assert.throws(()=>parseCdx([['bad']]));
});
test('private research persistence, idempotent snapshots, twelve nullable scores and abuse promotion block',t=>{
 const s=new Store();s.publicLicenses=['test publication license'];t.after(()=>s.db.close());const owner=s.createUser('research@example.com','test-only-long-passphrase','owner'),other=s.createUser('other@example.com','test-only-long-passphrase','owner');s.import([{...fixtureRows[0],observedAt:'2026-11-16T08:00:00Z',publicAllowed:true,licenseRef:'test publication license'}],owner);const d=s.records(owner)[0],b=strong('Nexora.com');b.dataset='manual';for(const f of Object.values(b.metrics))f.evidenceClass='manual_review';const saved=saveResearch(s,owner,d.id,b);assert.equal(saved.created,true);assert.equal(saveResearch(s,owner,d.id,b).created,false);assert.equal(Number(s.db.prepare('SELECT count(*) AS n FROM scores').get()!.n),12);assert(latestResearch(s,owner,d.id));assert.throws(()=>latestResearch(s,other,d.id));assert.throws(()=>saveResearch(s,other,d.id,b));
 b.history=[{...p,evidenceClass:'manual_review',capturedAt:'2020-01-01',assessment:'malware'}];saveResearch(s,owner,d.id,b);assert(s.record(d.id,owner).risk?.includes('abuse'));assert.equal(s.records(null).length,0);assert.equal(s.record(d.id,owner).reviewed,false);
});

test('all eight labels configurable, strategy ranking nulls last, foreign CPC remains unscored input',()=>{
 for(const subtype of subtypes){const b=strong('Nexora.com');b.subtypes=[subtype];assert(scoreResearch('Nexora',b).subtypes.includes(subtype));}
 const a=scoreResearch('Nexora',strong('Nexora.com')),b=scoreResearch('Nuvio',bundle('Nuvio.com'));assert.equal(rankWithinStrategy([b,a],'brandability')[0].domain,'nexora.com');
 const geo=strong('DallasRoofing.com');geo.metrics.cpc={...fact(1000,'fx-cpc'),currency:'NGN'};assert(scoreResearch('DallasRoofing',geo).scores.geo_service.missing.some(x=>x.includes('USD')));
});

test('duplicate snapshots/reported sales and unrelated local services cannot inflate evidence coverage',()=>{
 const b=strong('Nexora.com');const snap={...p,capturedAt:'2020-01-01',assessment:'legitimate' as const};b.history=[snap,snap,snap,snap,snap];assert.equal(scoreResearch('Nexora',b).scores.cleanliness.value,null);
 const sale={...p,domain:'Veyra.com',category:'Brandable',kind:'sale' as const,amount:100,currency:'USD',soldDate:'2025-01-01',reportDate:'2025-01-02',confirmationClass:'third_party_reported' as const,venue:null};b.sales=[sale,{...sale,independenceKey:'reposted-report'}];assert.equal(scoreResearch('Nexora',b).scores.comparable_sales.value,null);
 const geo=strong('DallasRoofing.com');geo.sales=[{...sale,domain:'AustinDental.com',category:'Geo / EMD'}];assert.equal(scoreResearch('DallasRoofing',geo).relevantComps.length,0);
});

test('unsupported prototype/model keys cannot enter a scoring configuration',()=>{
 const c=defaultScoreConfig();const malicious=JSON.parse(JSON.stringify(c));Object.defineProperty(malicious.weights,'__proto__',{value:{toString:100},enumerable:true});assert.throws(()=>scoreResearch('Nexora',strong('Nexora.com'),malicious));
});

test('pronunciation and syllable preferences are optional manual evidence and never forced onto initialisms',()=>{
 const b=strong('Nexora.com');b.metrics.pronounceability=fact(90,'spoken-review');b.metrics.syllableCount=fact(3,'syllable-review');b.metrics.startupFit=fact(85,'startup-review');const scored=scoreResearch('Nexora',b);assert(scored.scores.brandability.value!==null);const acronym=scoreResearch('ABMC',strong('ABMC.com'));assert(!acronym.scores.brandability.missing.includes('syllableCount'));assert(acronym.scores.brandability.reasons.some(x=>x.includes('Initialism model')));
});

test('all gated enrichment adapters stay disabled and cannot turn fixtures into network access',async()=>{
 assert.equal(new Set(enrichmentConnectors.map(c=>c.flag)).size,enrichmentConnectors.length);for(const c of enrichmentConnectors){assert.equal(c.canFetch().allowed,false);await assert.rejects(()=>c.fetchPage());}
});

test('missing financial units and very old sales cannot silently support current scoring',()=>{
 const b=strong('DallasRoofing.com');b.metrics.income={...fact(5000,'income'),currency:'USD',unit:'USD/month'};assert(scoreResearch('DallasRoofing',b).scores.geo_service.missing.some(x=>x.includes('USD/year')));
 const names=strong('Nexora.com');names.sales=[{...p,domain:'Zenova.com',category:'Brandable',kind:'sale',amount:100,currency:'USD',soldDate:'1990-01-01',reportDate:'1990-01-02',confirmationClass:'third_party_reported',venue:null}];assert.equal(scoreResearch('Nexora',names).relevantComps.length,0);
});

test('known low backlink quality is adverse evidence while an unavailable backlink metric stays unknown',()=>{
 const unknown=scoreResearch('Nexora',bundle());assert.equal(unknown.scores.cleanliness.value,null);const b=strong('Nexora.com');b.metrics.backlinkQuality=fact(5,'manual-backlink-review');const scored=scoreResearch('Nexora',b);assert.equal(scored.scores.cleanliness.value,20);assert(scored.scores.cleanliness.risks.some(x=>x.includes('backlink')));
});

test('IDN usability remains a language-specific unknown rather than a Punycode spelling penalty',()=>{
 const b=bundle('пример.рф');const r=scoreResearch('пример',b);assert(r.scores.brandability.missing.includes('readability'));assert.equal(r.scores.brandability.value,null);
});
