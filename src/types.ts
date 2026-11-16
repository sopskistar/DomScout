export type Dataset = 'fixture' | 'manual' | 'live';
export type Availability = 'unknown' | 'registered' | 'possibly_available' | 'available_confirmed';
export const categories = ['Brandable','Expiring','Geo / EMD','Company gap','Keyword trend','TLD trend'] as const;
export type Category = typeof categories[number];
export interface Principal { id: string; tenantId: string; email: string; role: 'owner' | 'researcher'; }
export interface DomainRecord {
 id: string; domain: string; unicode: string; root: string; tld: string; length: number; hasHyphen: boolean; hasDigit: boolean;
 dataset: Dataset; tenantId: string; category: Category; source: string; sourceUrl: string; externalId: string;
 licenseRef: string; publicAllowed: boolean; notificationsAllowed: boolean; observedAt: string; price: number | null; currency: string;
 deadline: string | null; availability: Availability; extensionTlds: string[] | null; extensionCount: number | null;
 history: 'unknown' | 'present'; confidence: number | null; trendVelocity: number | null;
 reviewed: boolean; risk: string | null; observationId: string; trademark: 'not_checked';
}
export const disclaimer = 'Trademark not checked — independent review required before acquisition';
export class AppError extends Error { status:number; code:string; constructor(status:number,code:string,message:string) { super(message); this.status=status; this.code=code; } }
export function fail(code: string, message: string, status=400): never { throw new AppError(status, code, message); }
