import {randomUUID} from 'node:crypto';
import {Store} from './db.ts';
import {hash,stable} from './import.ts';
import {fail,type Principal} from './types.ts';
import {normalize} from './normalize.ts';
import {scoreResearch,validateBundle,defaultScoreConfig,type ScoreConfig} from './research.ts';
export function saveResearch(store:Store,p:Principal,listingId:string,input:unknown,config:ScoreConfig=defaultScoreConfig()) {
 const d=store.record(listingId,p);if(p.role!=='owner'||d.tenantId!==p.tenantId||d.dataset!=='manual')fail('forbidden','Research imports require a private manual listing owned by your workspace.',403);
 const bundle=validateBundle(input);if(normalize(bundle.domain).domain!==d.domain||bundle.dataset!=='manual')fail('evidence_mismatch','Research must match this domain and manual dataset. Fixtures cannot be promoted.');
 const result=scoreResearch(d.root,bundle,config);const id=hash(stable({listingId,observation:d.observationId,bundle,config}));
 return store.transaction(()=>{const existing=store.db.prepare('SELECT result_json FROM research_snapshots WHERE id=? AND tenant_id=?').get(id,p.tenantId);if(existing)return {id,result:JSON.parse(String(existing.result_json)),created:false};
  const now=new Date().toISOString(),weightId=hash(p.tenantId+d.category+stable(config));const known=store.db.prepare('SELECT id FROM score_weight_sets WHERE id=?').get(weightId);
  if(!known){const v=Number(store.db.prepare('SELECT coalesce(max(version),0) AS n FROM score_weight_sets WHERE tenant_id=? AND category=?').get(p.tenantId,d.category)!.n)+1;store.db.prepare('INSERT INTO score_weight_sets VALUES (?,?,?,?,?,?)').run(weightId,p.tenantId,d.category,v,stable(config),now);}
  store.db.prepare('INSERT INTO research_snapshots VALUES (?,?,?,?,?,?,?,?,?)').run(id,d.id,p.tenantId,p.id,'manual',stable(bundle),stable(config),stable(result),now);
  const domainId=hash(d.domain);for(const score of Object.values(result.scores))store.db.prepare('INSERT INTO scores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),domainId,p.tenantId,d.observationId,score.dimension,score.value,score.confidence,score.coverage,score.modelVersion,weightId,stable(score.evidence),stable(score.missing),stable(score.risks),stable(score.reasons),score.nextAction,now);
  d.reviewed=false;store.db.prepare('UPDATE listings SET record_json=? WHERE id=? AND tenant_id=?').run(stable(d),d.id,p.tenantId);
  const historicalAbuse=bundle.history.some(h=>['spam','phishing','malware','adult','gambling'].includes(h.assessment));const badBacklinks=typeof bundle.metrics.backlinkQuality?.value==='number'&&bundle.metrics.backlinkQuality.value<20;
  if(historicalAbuse||badBacklinks){d.risk=d.risk||(historicalAbuse?'Historical abuse evidence requires independent review; alerts blocked.':'Low backlink quality evidence requires independent review; alerts blocked.');d.reviewed=false;d.publicAllowed=false;store.db.prepare('UPDATE listings SET public_allowed=0,record_json=? WHERE id=? AND tenant_id=?').run(stable(d),d.id,p.tenantId);store.db.prepare("UPDATE delivery_events SET status='cancelled' WHERE observation_id=? AND status='pending'").run(d.observationId);}
  store.audit(p,'research.import',{snapshotId:id,listingId});return {id,result,created:true};
 });
}
export function latestResearch(store:Store,p:Principal,listingId:string){const d=store.record(listingId,p);if(d.tenantId!==p.tenantId)fail('not_found','Private research not found.',404);const row=store.db.prepare('SELECT id,bundle_json,config_json,result_json,created_at FROM research_snapshots WHERE listing_id=? AND tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(listingId,p.tenantId);return row?{id:row.id,result:JSON.parse(String(row.result_json)),bundle:JSON.parse(String(row.bundle_json)),config:JSON.parse(String(row.config_json)),createdAt:row.created_at}:null;}
