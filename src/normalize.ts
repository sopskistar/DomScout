import { domainToASCII, domainToUnicode } from 'node:url';
import { parse } from 'tldts';
import { fail } from './types.ts';
export function normalize(input: unknown) {
 if (typeof input !== 'string' || input.length>254 || /[\s/@:#?\\\x00-\x1f]/u.test(input.trim())) fail('invalid_domain','Use a domain name, without a URL or path.');
 const ascii=domainToASCII(input.trim().replace(/\.$/,'').toLowerCase());
 if (!ascii || ascii.split('.').some(x=>!x || x.length>63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x))) fail('invalid_domain','Invalid domain label.');
 const info=parse(ascii,{allowPrivateDomains:true});
 if (!info.domain || !info.publicSuffix || !info.isIcann) fail('invalid_suffix','A recognized ICANN registrable domain is required.');
 const root=info.domainWithoutSuffix!;const unicode=domainToUnicode(info.domain);
 return {domain:info.domain, unicode, root, tld:info.publicSuffix, length:Array.from(domainToUnicode(root)).length, hasHyphen:root.includes('-'),hasDigit:/\d/.test(root)};
}
