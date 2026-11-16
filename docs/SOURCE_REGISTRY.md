# Source registry

Checked 2026-11-16 where a date is present. No provider is live_verified. Unreviewed sources have lastChecked=null and remain OFF. Before implementing each adapter verify official auth, collection, commercial use, storage, redistribution, pricing and rate limits. Unknown terms prohibit activation. Source contracts do not grant access.

|Provider / official starting point|Phase / status|Flag|Review / access limits|
|---|---|---|---|
|[GoDaddy](https://developer.godaddy.com/)|1 / blocked|`GODADDY_ENABLED=false`|Current portal documents API; old /doc/endpoint/auctions returned 404. Inventory access, storage, redistribution, pricing and quotas unverified.|
|[Dynadot](https://www.dynadot.com/domain/api-document)|1 / not_started|`DYNADOT_ENABLED=false`|REST docs beta; keys generated under Tools > API. Legacy docs scheduled for retirement; legacy regular limits 1 thread, 60/min cannot be assumed for REST. Auction feed redistribution rights unverified.|
|[NameJet](https://www.namejet.com/)|1 / not_started|`NAMEJET_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[DropCatch](https://www.dropcatch.com/)|1 / not_started|`DROPCATCH_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[SnapNames](https://www.snapnames.com/)|1 / not_started|`SNAPNAMES_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Namecheap](https://www.namecheap.com/support/api/intro/)|2 / not_started|`NAMECHEAP_ENABLED=false`|Developer intro accessible. Production eligibility, prices, quotas and bulk lookup storage rights must be checked before activation.|
|[Sedo](https://sedo.com/)|1 / not_started|`SEDO_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Afternic](https://www.afternic.com/)|1 / not_started|`AFTERNIC_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Spaceship](https://www.spaceship.com/)|4 / not_started|`SPACESHIP_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[ExpiredDomains.net](https://www.expireddomains.net/)|0 / manual_only|`EXPIREDDOMAINS_NET_ENABLED=false`|Terms URL unavailable in review. Reference/manual-only, no scraper.|
|[ICANN RDAP](https://www.icann.org/rdap)|1 / not_started|`ICANN_RDAP_ENABLED=false`|Registration protocol verified; registry-specific terms, retention and quotas still require per-host approval. Nonexistence never proves purchase eligibility.|
|[IANA RDAP Bootstrap](https://data.iana.org/rdap/dns.json)|1 / not_started|`IANA_RDAP_BOOTSTRAP_ENABLED=false`|Official HTTPS DNS bootstrap inspected, publication 2026-10-28. Registry URLs must be vetted; HTTPS only, no arbitrary host fetch.|
|[ICANN Lookup](https://lookup.icann.org/)|1 / manual_only|`ICANN_LOOKUP_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[WhoisXML API](https://www.whoisxmlapi.com/)|2 / not_started|`WHOISXML_API_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[SecurityTrails](https://securitytrails.com/)|2 / not_started|`SECURITYTRAILS_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[DotDB](https://dotdb.com/api)|2 / blocked|`DOTDB_ENABLED=false`|Official /api URL could not be fetched. Needs official plan/terms verification; no scraping.|
|[Internet Archive Wayback CDX](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)|2 / not_started|`INTERNET_ARCHIVE_WAYBACK_CDX_ENABLED=false`|Official upstream documentation accessible. Documentation existence is not clearance for unrestricted storage of archived content.|
|[NameBio](https://namebio.com/)|2 / not_started|`NAMEBIO_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[DNJournal](https://www.dnjournal.com/)|2 / not_started|`DNJOURNAL_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[NamePros](https://www.namepros.com/)|5 / not_started|`NAMEPROS_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Atom](https://www.atom.com/)|2 / not_started|`ATOM_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[BrandBucket](https://www.brandbucket.com/)|2 / not_started|`BRANDBUCKET_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[LinkedIn](https://www.linkedin.com/legal/user-agreement)|3 / not_started|`LINKEDIN_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Crunchbase](https://data.crunchbase.com/docs)|3 / not_started|`CRUNCHBASE_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Product Hunt](https://api.producthunt.com/v2/docs)|3 / not_started|`PRODUCT_HUNT_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Y Combinator Companies](https://www.ycombinator.com/companies)|3 / not_started|`Y_COMBINATOR_COMPANIES_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Wellfound](https://wellfound.com/)|3 / not_started|`WELLFOUND_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Google Search](https://developers.google.com/custom-search)|3 / not_started|`GOOGLE_SEARCH_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Google Maps Places](https://developers.google.com/maps/documentation/places/web-service/policies)|2 / not_started|`GOOGLE_MAPS_PLACES_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[U.S. Census Bureau API](https://www.census.gov/data/developers.html)|2 / not_started|`U_S_CENSUS_BUREAU_API_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Google Ads Keyword Planner](https://developers.google.com/google-ads/api/docs/keyword-planning/overview)|2 / not_started|`GOOGLE_ADS_KEYWORD_PLANNER_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[U.S. SBA](https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis)|2 / not_started|`U_S_SBA_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Local business registries](Jurisdiction-specific; no selected provider)|2 / not_started|`LOCAL_BUSINESS_REGISTRIES_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Chambers of commerce](Jurisdiction-specific; no selected provider)|2 / not_started|`CHAMBERS_OF_COMMERCE_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Yellow Pages](https://www.yellowpages.com/)|2 / not_started|`YELLOW_PAGES_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[X Developer Platform](https://docs.x.com/)|4 / not_started|`X_DEVELOPER_PLATFORM_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[GitHub REST API](https://docs.github.com/en/rest)|4 / not_started|`GITHUB_REST_API_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Hacker News API](https://github.com/HackerNews/API)|4 / not_started|`HACKER_NEWS_API_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[TechCrunch](https://techcrunch.com/)|4 / not_started|`TECHCRUNCH_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[The Verge](https://www.theverge.com/)|4 / not_started|`THE_VERGE_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Wired](https://www.wired.com/)|4 / not_started|`WIRED_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[VentureBeat](https://venturebeat.com/)|4 / not_started|`VENTUREBEAT_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[USPTO Trademark Search](https://www.uspto.gov/trademarks/search)|None / deferred|`USPTO_TRADEMARK_SEARCH_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[WIPO Global Brand Database](https://www.wipo.int/en/web/global-brand-database)|None / deferred|`WIPO_GLOBAL_BRAND_DATABASE_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[National/regional trademark registries](Jurisdiction-specific; deferred)|None / deferred|`NATIONAL_REGIONAL_TRADEMARK_REGISTRIES_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[DomCop](https://www.domcop.com/)|8 / not_started|`DOMCOP_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[SpamZilla](https://www.spamzilla.io/)|8 / not_started|`SPAMZILLA_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[RegisterCompass](https://www.registercompass.com/)|8 / not_started|`REGISTERCOMPASS_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[CatchDoms](https://catchdoms.com/)|8 / not_started|`CATCHDOMS_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Telegram](https://core.telegram.org/bots/api)|1 / not_started|`TELEGRAM_ENABLED=false`|Bot API, BotFather, FAQ and deep-linking docs read. Short-lived account link and secure webhook needed. Free normal broadcast subject to limits; paid broadcast stays disabled.|
|[Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)|7B / not_started|`META_WHATSAPP_CLOUD_API_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Email provider](No provider selected)|7B / not_started|`EMAIL_PROVIDER_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|
|[Billing provider](No provider selected)|7B / not_started|`BILLING_PROVIDER_ENABLED=false`|Not yet reviewed. URL is a starting point from the inventory, not access authorization.|

Per-source metadata in source-registry.json contains auth, quota, pricing, storage, fallback and checked date. Local operational cap can be lower than a provider cap; caps are not claims about provider permission. All prices remain unknown except Telegram normal free messaging; do not enable paid broadcast.

Manual imports must identify the original provider and authorized license reference. Importing does not make restricted data public. Fixture support never changes blocked to live.
