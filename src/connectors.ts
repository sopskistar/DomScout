import { normalize } from './normalize.ts';
import { fail,type Availability } from './types.ts';
export interface Connector<T> { id:string;flag:string;status:'blocked'|'fixture_only'|'implemented_needs_key';canFetch():{allowed:boolean;reason:string};fetchPage(cursor?:string):Promise<{records:T[];nextCursor:string|null}>; }
export class DisabledInventory implements Connector<never> {
 status='blocked' as const;
 id:string;flag:string;
 constructor(id:string,flag:string){this.id=id;this.flag=flag;}
 canFetch(){return {allowed:false,reason:'Current documented access, credentials, retention and redistribution rights must be approved. Use an authorized manual import.'};}
 async fetchPage(_cursor?:string):Promise<{records:never[];nextCursor:string|null}>{return fail('source_disabled',this.canFetch().reason,503);}
}
export const godaddy=new DisabledInventory('godaddy','GODADDY_ENABLED');
export const dynadot=new DisabledInventory('dynadot','DYNADOT_ENABLED');
export function parseRdap(status:number,body:unknown) {
 if(status===404)return {availability:'possibly_available' as Availability,createdAt:null,expiresAt:null,updatedAt:null,registrar:null,nameservers:[],statuses:[],caveat:'RDAP not found does not prove registrar purchase eligibility.'};
 if(status!==200)return {availability:'unknown' as Availability,createdAt:null,expiresAt:null,updatedAt:null,registrar:null,nameservers:[],statuses:[],caveat:'Registration data unavailable.'};
 const b=body as {objectClassName?:string;ldhName?:string;events?:{eventAction:string;eventDate:string}[];nameservers?:{ldhName?:string}[];status?:string[];entities?:{roles?:string[];vcardArray?:unknown[]}[]};
 if(b?.objectClassName!=='domain'||!b.ldhName)fail('source_schema','RDAP returned an unexpected schema.',502);
 const event=(s:string)=>{const e=b.events?.find(x=>x.eventAction===s)?.eventDate;return e&&Number.isFinite(Date.parse(e))?new Date(e).toISOString():null;};
 const registrar=b.entities?.find(x=>x.roles?.includes('registrar'));const vc=registrar?.vcardArray?.[1] as unknown[][]|undefined;const reg=vc?.find(x=>x[0]==='fn')?.[3];
 return {availability:'registered' as Availability,createdAt:event('registration'),expiresAt:event('expiration'),updatedAt:event('last changed'),registrar:typeof reg==='string'?reg:null,nameservers:(b.nameservers||[]).map(x=>x.ldhName).filter((s):s is string=>!!s),statuses:b.status||[],caveat:'Expiry is a lifecycle date, not availability. Registry grace/redemption rules vary.'};
}
export function rdapEndpoint(domain:string,bootstrap:{services:[string[],string[]][]},approvedHosts:string[]) {
 const n=normalize(domain),suffix=n.domain.split('.').at(-1)!;const endpoints=bootstrap.services.find(([tlds])=>tlds.includes(suffix))?.[1]||[];
 for(const base of endpoints){const u=new URL(base);if(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&approvedHosts.includes(u.hostname))return new URL(`domain/${n.domain}`,u.href.endsWith('/')?u.href:u.href+'/').href;}
 return fail('rdap_unapproved','No approved HTTPS registry endpoint for this suffix.',503);
}
// Live RDAP transport intentionally not enabled until each registry's terms/retention
// and request budget are approved. No arbitrary URL fetch or hidden scraping fallback.

// Typed normalized evidence is in research.ts; vendor wire schemas stay unknown
// until official access/rights are approved. No paid or hidden fetch fallback.
export const enrichmentConnectors=[
 new DisabledInventory('dotdb','DOTDB_ENABLED'),new DisabledInventory('namebio','NAMEBIO_ENABLED'),
 new DisabledInventory('internet-archive-wayback-cdx','INTERNET_ARCHIVE_WAYBACK_CDX_ENABLED'),new DisabledInventory('namecheap','NAMECHEAP_ENABLED'),
 new DisabledInventory('securitytrails','SECURITYTRAILS_ENABLED'),new DisabledInventory('whoisxml-api','WHOISXML_API_ENABLED'),
 new DisabledInventory('u-s-census-bureau-api','U_S_CENSUS_BUREAU_API_ENABLED'),new DisabledInventory('google-maps-places','GOOGLE_MAPS_PLACES_ENABLED'),
 new DisabledInventory('google-ads-keyword-planner','GOOGLE_ADS_KEYWORD_PLANNER_ENABLED')
];
