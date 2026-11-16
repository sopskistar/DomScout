Complete Build Specification: Domain Research & Opportunity Discovery Bot
This is the consolidated specification for your AI build agent. It combines our previous discussions about domain investing, ExpiredDomains.net alternatives, company-gap hunting, expired domains, brandables, local-service domains, comparable sales, domain history, trend detection, and the new Spaceship `.si` data.
My recommendation: Build a domain intelligence system, not just an expired-domain scraper. The system should collect domain opportunities from multiple sources, investigate them, score them using different strategies, and send the best candidates to Telegram.
The goal is to reduce thousands of potential domains to a manageable shortlist of high-quality opportunities.
---
1. The Main Idea
Build an automated domain research platform that discovers, evaluates, ranks, and monitors potentially valuable domains.
It should identify six main types of opportunities:
Brandable domains: Short, memorable names suitable for startups and businesses.
Company-gap opportunities: Companies using a domain such as `brand.ai`, `brand.io`, or `brand.co` without owning the matching `.com`.
Expired and expiring domains: Domains available through auctions, closeouts, backorders, or pending deletion.
Exact-match domains (EMDs): Commercially valuable keyword domains such as `DallasRoofing.com`.
Geo-service domains: Domains combining a city or region with a valuable local service, such as `BrooklynCountertops.com`.
Trend opportunities: Emerging keywords, naming patterns, and domain extensions attracting increasing attention.
The platform should also investigate:
Domain extension adoption.
Comparable domain sales.
Domain registration and drop history.
Existing businesses and potential end users.
Trademark risks.
Search demand and commercial intent.
Auction activity and acquisition costs.
Emerging TLDs and changes in investor behavior.
The main workflow
```text
DATA SOURCES
    ↓
DOMAIN AND KEYWORD COLLECTION
    ↓
NORMALIZATION AND DEDUPLICATION
    ↓
INITIAL FILTERS
    ↓
DOMAIN ENRICHMENT
    ↓
OPPORTUNITY CLASSIFICATION
    ↓
SPECIALIZED SCORING MODELS
    ↓
TRADEMARK AND HISTORY CHECKS
    ↓
FINAL RANKING
    ↓
TELEGRAM ALERTS
    ↓
USER REVIEWS OPPORTUNITIES
    ↓
TRACK PURCHASES, COSTS AND SALES
    ↓
IMPROVE SCORING USING REAL RESULTS
```
The system should not assume that every domain with strong metrics is valuable. Its job is to find candidates worth investigating, not to guarantee profitable sales.
---
2. Data Sources and Tools
The following is the recommended source inventory. The agent must verify each provider's current API availability, pricing, access permissions, and rate limits before implementation.
Some sources offer APIs or downloadable inventory. Others are research interfaces or commercial data providers. Do not assume every source has a free, public API.
A. Domain inventory and auction sources
These provide candidate domains to evaluate.
Source	Primary purpose	Implementation priority
GoDaddy Auctions API and inventory documentation	Expiring auctions, closeouts, downloadable inventory	High
Dynadot Domain API	Auction discovery, expired inventory, backorders and domain operations	High
NameJet	Pre-release and expired-domain opportunities	Medium
DropCatch	Pending-delete and drop-catching opportunities	Medium
SnapNames	Expired and dropping domains	Medium
Namecheap	Domain registration, marketplace and TLD research	Medium
Sedo	Domain marketplace and aftermarket inventory	Medium
Afternic	Domain aftermarket research	Medium
Spaceship	Domain registration, TLD launches and market signals	Medium
ExpiredDomains.net	Domain discovery and research	Reference only
Important implementation details
GoDaddy: Its official documentation describes downloadable auction inventory in ZIP, XML and JSON formats. It also documents an Auctions API for supported auction operations. Check authentication and account eligibility before building around it. GoDaddy Developer Platform
Dynadot: Its API supports domain operations and aftermarket functionality. Its documentation includes open-auction discovery and backorder-related commands. Check the current API documentation and account limits. Dynadot
ExpiredDomains.net: Treat it as a research reference, not the foundation of the application. Our earlier research indicated that it did not provide a public, documented API and restricted automated collection in certain areas. Verify its current terms before using any automated integration.
Do not make the system depend on unauthorized scraping, browser automation that violates terms, or private datasets.
Why multiple inventory sources matter
Different platforms expose different inventory and acquisition opportunities. A domain may be available through one source but absent from another.
The system should preserve the source of every candidate, including:
Source name.
Original listing URL.
Auction or listing ID.
First-seen timestamp.
Last-checked timestamp.
Current listing status.
Current price, if available.
Auction closing time, if available.
Acquisition method.
Any restrictions on how the source data can be used.
This makes it possible to measure which sources produce the best opportunities.
---
B. Domain registration and availability
Use registration data to determine whether a domain is registered, who its registrar is, and what public lifecycle information is available.
Source	Use
ICANN RDAP information	Registration data and domain status
ICANN Lookup	Manual registration lookup
WhoisXML API	Commercial WHOIS, history and related domain data
SecurityTrails	DNS and historical domain intelligence
RDAP is the preferred starting point for standardized registration data where the relevant registry supports it. ICANN
Collect these fields where available:
Registration creation date.
Expiration date.
Registrar.
Domain status.
Nameservers.
Last update date.
Current registration status.
Whether the domain appears to be available.
Whether it is listed for sale or auction.
Historical ownership or registration information, if legally available.
Important limitation
A domain's expiration date does not mean it is immediately available for registration.
Domains can pass through renewal, grace, redemption, auction, and deletion processes. These vary by registry, registrar, and domain extension.
The bot must not label a domain as available merely because its expiration date has passed.
---
C. Extension-count research
This is one of the most important components of the system.
Primary source
DotDB
Secondary source
Namecheap, including its bulk domain-search facilities where appropriate.
The objective is to measure how widely a name is registered across different TLDs.
For example:
```text
Example name: Nexora

nexora.com
nexora.net
nexora.org
nexora.ai
nexora.io
nexora.co
nexora.app
nexora.xyz
```
The system should record:
Total number of registered TLD variants.
Which exact TLDs are registered.
Whether the `.com` is registered.
Whether `.ai`, `.io`, `.app`, `.xyz`, or other strategically relevant extensions are registered.
Whether the same root is used by multiple businesses.
Whether the domain is listed for sale.
Whether registrations are concentrated in particular extensions.
Initial interpretation
These are starting heuristics, not proven valuation rules:
Registered extensions	Initial interpretation
0–2	Limited evidence of broader adoption
3–4	Weak to moderate evidence
5–9	Potential demand signal
10–19	Stronger adoption signal
20+	Significant adoption signal
The agent must not equate extension count with domain value.
A name can have many registrations because it is a common word, a trademark, or a name shared by unrelated companies.
Improvement: Store the actual TLDs and their relevance, not just a single total.
A matching `.com` plus registrations across relevant startup extensions may mean something different from registrations across many unrelated country-code TLDs.
---
3. Domain History and Cleanliness
A good-looking domain can still be a poor investment if it has a history of spam or abuse.
Research sources
Internet Archive Wayback Machine
Internet Archive CDX API documentation
ICANN Lookup
WhoisXML API
SecurityTrails
Metrics to collect
Historical website content.
Previous business use.
Approximate historical first-seen date.
Evidence of adult, gambling, spam, phishing, or other abusive use.
Evidence of repeated drops or ownership changes, where reliable data exists.
Historical redirects.
Suspicious backlink patterns, if backlink data is available.
Search-engine reputation concerns, if a reliable permitted source provides this data.
Domain Cleanliness Score
Build a score from 0 to 100.
Example:
Factor	Effect
Long-term legitimate business use	Positive
No obvious abuse in available history	Positive
Repeated spam or doorway-page history	Negative
Known phishing or malware association	Strong negative
Unnatural backlink patterns	Negative
Insufficient historical evidence	Unknown; do not assume clean
A lack of archived pages does not prove that a domain is clean.
Similarly, a high number of historical registration changes is not automatically proof of abuse. Registration and drop-history data may be incomplete.
The agent should return both a score and the evidence behind it.
---
4. Comparable Sales and Market Research
Primary source
NameBio
Additional research
DNJournal
NamePros
Atom
BrandBucket
The agent should use comparable sales to investigate whether similar domains have actually sold.
What to compare
For brandables:
Similar spelling patterns.
Similar length.
Similar syllable count.
Similar prefixes and suffixes.
Similar pronunciation.
Similar number of recognizable root words.
Similar TLDs.
For geo-service domains:
Similar cities.
Similar services.
Similar commercial industries.
Similar buyer markets.
Similar domain structures.
For exact-match domains:
Search phrase.
Commercial intent.
Industry.
Geographic scope.
Comparable reported sales.
For trend domains:
Similar keyword.
Similar stage of the trend.
Sale date relative to the trend's growth.
TLD.
Comparable reported sales.
Example
If considering `Nexora.com`, research sales involving comparable short, pronounceable brandables.
Do not compare it only with unrelated premium one-word domains.
If considering `DallasRoofing.com`, compare it with geo-service and roofing-domain sales, not short AI brandables.
Critical requirement
Do not invent comparable sales or sale prices.
If the source does not provide usable public access or an authorized API, the agent should use permitted manual research or an authorized dataset.
The agent must record whether a sale price is verified, reported by a third party, estimated, or unknown.
---
5. Startup and Company-Gap Hunting
This is one of the highest-priority strategies because it identifies a potential buyer before you acquire a domain.
The goal is to find companies using a particular name but not owning the matching domain.
For example:
```text
Company: Example Labs

Current website:
example.ai

Other domains:
example.io
example.co

Potential opportunity:
example.com
```
This does not automatically mean the company wants to buy the `.com`. It is a lead that requires verification.
Sources
Source	Purpose
LinkedIn	Company identity, employees and growth signals
Crunchbase	Funding, investors and company profiles
Product Hunt	Newly launched products
Y Combinator Companies	Startup discovery
Wellfound	Startup and hiring research
Google Search	Company verification and public web presence
Prefer official APIs, permitted search interfaces, licensed providers, and public company pages. Do not assume LinkedIn or Crunchbase offers unrestricted access to every field.
Company information to collect
Company name.
Official website.
Exact brand name.
Domain currently used.
Matching `.com` status.
Other TLDs owned or used.
LinkedIn company page.
Employee count, where available.
Funding information, where available.
Recent funding or growth.
Product launch date.
Recent news.
Hiring activity.
Evidence of marketing activity.
Possible brand confusion with unrelated companies.
Whether the company already owns or redirects the exact-match `.com`.
Company-gap workflow
```text
1. Discover a company using a non-.com domain.
2. Extract the brand root.
3. Verify the company is real.
4. Verify its official website.
5. Check whether the exact-match .com is registered.
6. Check whether it is listed for sale or expiring.
7. Check the company's other TLDs.
8. Research employees, funding, product activity and marketing.
9. Search for competing businesses using the same name.
10. Check trademark risk.
11. Estimate whether the domain could have legitimate alternative buyers.
12. Calculate a Company-Gap Score.
13. Alert only when the evidence justifies further research.
```
Examples from our previous discussions
You previously discussed companies using names such as:
Purpose Labs.
Restorative Dental.
OceanWise Global.
The OceanWise example involved use of other extensions, including `.io` and `.eu`, while the matching `.com` was of interest.
The broader lesson is that existing businesses can provide evidence of naming demand.
However, the bot must not assume that a company will buy a domain simply because it uses a similar name.
Suggested initial Company-Gap Score
Signal	Initial points
Verified company using the exact brand	+30
Verified official website	+10
LinkedIn company profile	+10
10+ employees, where reliable	+10
Verified funding	+15
Recent product launch or meaningful growth	+10
Owns or uses `.ai`	+5
Owns or uses `.io`	+5
Uses several relevant TLDs	+10
Matching `.com` is available or obtainable	+20
Exact-match `.com` is already owned by the company	Disqualify this specific gap
Material trademark or impersonation concern	Block or send for review
These points are an initial model to test, not validated probabilities.
Avoid counting the same underlying fact multiple times. For example, a funding announcement and a news article repeating that announcement are not two independent signals.
---
6. Brandable Domain Scoring
This model evaluates invented names and broad, startup-friendly brandables.
Your preferences from our earlier discussions should be implemented as configurable defaults.
Preferred characteristics
Usually 5–8 letters; 5–10 may be acceptable.
Two or three syllables.
Easy to pronounce.
Easy to spell after hearing once.
Memorable.
No hyphens.
No numbers.
No unnecessarily complex letter combinations.
No awkward endings such as `q`, `xq`, or `vq`.
Broad potential applications.
Plausible as a real startup name.
No material trademark concerns.
Examples of styles you have considered include Nexora, Zenova, Veyra, Nuvio, and similar pronounceable names. These are examples of naming patterns, not endorsements of their availability or legal safety.
Brandability metrics
Metric	What to measure
Length	Character count
Pronounceability	How naturally the name can be spoken
Spelling simplicity	Whether listeners can spell it after hearing it
Syllable count	Prefer approximately 2–3
Memorability	Distinctiveness and ease of recall
Visual simplicity	Avoid awkward letter sequences
Root words	Detect meaningful words or word combinations
Versatility	Number of plausible industries
Startup fit	Could a credible company use the name?
Extension adoption	Number and relevance of matching TLDs
Comparable sales	Evidence from similar sold names
Trademark risk	Conflicts with existing marks
Domain cleanliness	Historical use and abuse risk
End-user count	Number of plausible buyers
Replacement cost	Difficulty of finding an equivalent name
The radio test
The bot cannot perfectly reproduce human judgment, but it can flag likely spelling and pronunciation problems.
Use this test:
> If a person heard the name once, could they reasonably spell it without asking for clarification?
Names with unnecessary complexity should lose points.
Startup-feel test
Ask:
> Could a credible startup use this name in a product launch or funding announcement?
This should be a ranking signal, not a claim that the startup will actually exist.
Brand versatility
A broad name may be suitable for AI, SaaS, fintech, healthcare, consulting, or ecommerce.
A name tied to one narrow product may have fewer plausible buyers.
However, do not automatically penalize specific names: a highly commercial niche can sometimes be more valuable than a generic brandable.
---
7. Geo-Service Domain Scoring
This model is based on the lesson from the BrooklynCountertops.com sale you discussed.
The important insight was not simply that countertops are a good niche.
It was that the domain could connect a real geographic market to a commercially valuable service.
Examples of niches to investigate
Roofing.
HVAC.
Plumbing.
Countertops.
Injury lawyers.
Pest control.
Solar.
Water damage restoration.
Remodeling.
Tree services.
Concrete.
Pressure washing.
Dental services.
These are candidates for research, not guaranteed profitable categories.
Data sources
Source	Data
Google Maps Platform	Business discovery and geographic information
U.S. Census Bureau	U.S. population, income and demographic data
U.S. Census data API	Programmatic access to eligible Census datasets
Google Ads Keyword Planner	Search demand and advertising estimates
U.S. Small Business Administration	Business and market research resources
Local business registries	Registered businesses in relevant jurisdictions
Chambers of commerce	Local business directories
Yellow Pages	Business listings and category research
Check the relevant APIs' access requirements and commercial-use terms before implementing them.
Geo-Service Score metrics
City or region population.
Median household income.
Average home value.
Number of businesses in the service category.
Number of potential local buyers.
Search volume.
Advertising cost per click (CPC).
Commercial search intent.
Competition among service providers.
Comparable domain sales.
Domain length and readability.
Domain cleanliness.
Trademark and naming conflicts.
Core principle
```text
Geo-Service Opportunity
=
Geographic Market Value
+ Industry Value
+ Potential Buyer Count
+ Commercial Intent
+ Domain Quality
+ Comparable Sales Evidence
```
A large city is not automatically a good opportunity. The relevant question is whether the location, service, and domain combine to create a useful commercial asset.
---
8. Exact-Match Domain Scoring
Exact-match domains target a commercial keyword or phrase.
Examples:
PayrollSoftware.com
TaxAttorney.com
AIConsulting.com
These examples illustrate domain structures only; their current registration status and availability have not been checked.
Metrics
Search volume.
Commercial intent.
CPC.
Number of businesses providing the service.
Number of potential end users.
Keyword clarity.
Geographic relevance.
Comparable sales.
Domain length.
Extension quality.
Trademark risk.
Domain history.
Whether the keyword is still commercially relevant.
Important distinction
A keyword with high search volume is not necessarily a good domain investment.
The bot should distinguish:
Informational searches.
Commercial investigation.
High-intent purchase searches.
Brand searches.
Search trends that may be temporary.
A keyword's CPC and search volume should be treated as supporting evidence rather than direct domain valuation.
---
9. Trend Detection Engine
This is the part that could help you discover naming opportunities before a trend becomes crowded.
It must be a separate module, not just a filter added to expired-domain searches.
Sources
Source	Purpose
X Developer Platform	Trend and conversation monitoring, subject to API access
GitHub REST API	Repository activity and developer trends
Product Hunt API documentation	New products and naming patterns
Y Combinator Companies	Emerging startups and company names
Crunchbase	Company activity and funding
Hacker News API	Technology discussion and emerging topics
TechCrunch	Startup and technology news
The Verge	Technology trends
Wired	Technology and industry coverage
VentureBeat	AI and technology industry coverage
For sources without suitable free APIs, use permitted RSS feeds, public datasets, licensed providers, or manual research. Do not assume that public visibility means unrestricted automated collection.
The Product Hunt API, for example, requires authentication, and its documentation says commercial use requires contacting the provider. api.producthunt.com
What the system should detect
Rapidly increasing keyword mentions.
New AI and SaaS terminology.
New startup naming patterns.
Repeated prefixes and suffixes.
New product categories.
Newly popular acronyms.
Emerging technical concepts.
Growing interest in particular TLDs.
Keywords appearing across multiple independent sources.
Trend velocity
For each keyword, collect mentions over several time windows.
Example:
```text
Keyword: exampleterm

Mentions during previous 30 days: 100
Mentions during current 30 days: 500

Absolute change: +400
Percentage change: +400%
```
This is only a simple example. The production system should account for the baseline, source coverage, and changes in collection volume.
A keyword rising from 1 to 10 mentions is not equivalent to one rising from 10,000 to 20,000.
Trend score should consider
Mention volume.
Growth rate.
Growth acceleration.
Number of independent sources.
Number of new companies using the term.
Number of new products using the term.
Search demand.
Relevant domain registrations.
Comparable sales.
Commercial usefulness.
Trademark risk.
Whether the term is already saturated.
Detecting saturation
The bot should investigate whether a trend is already crowded.
For example, a keyword may be growing rapidly while nearly all good domain combinations are registered.
A strong trend does not automatically produce a good domain opportunity.
The system should check:
How quickly attention is increasing.
Whether relevant names are still available.
Whether there is evidence of commercial adoption.
Whether the trend is becoming saturated.
Whether the remaining names are actually usable.
---
10. The New `.si` Signal From Spaceship
The Spaceship post you shared is useful for your research system, but it needs to be interpreted correctly.
It reports the first week's activity for the `.si` domain extension on Spaceship.
The figures you provided were:
More than 30,000 `.si` domains registered with Spaceship.
Approximately 10,000 `.si` domains transferred to Spaceship.
Registrations at 42 times the provider's previous best-performing domain launch.
Largest reported markets: US, China, Morocco, India, and Canada.
42.2% of customers own one `.si` domain.
39.9% own 2–9.
15.6% own 10–99.
2.3% own 100 or more.
That 2.3% of customers hold 48.1% of the `.si` domains.
Around two-thirds of `.si` owners also own `.com`.
Around 20% also own each of `.ai`, `.app`, and `.xyz`.
These are figures from the post you supplied. They should not be treated as independently verified global registration totals.
What this could tell your bot
A. Extension-launch monitoring
Create an extension intelligence module that tracks:
Newly launched or newly promoted TLDs.
Registration growth after launch.
Transfers versus new registrations.
Registration concentration among customers.
Geographic distribution.
Existing TLDs owned by the same customer group.
Changes in aftermarket listings.
Comparable sales activity.
Registration and renewal prices.
Availability of attractive names.
B. Customer concentration
The reported figures suggest that a relatively small group of customers controls a substantial share of the `.si` domains registered through Spaceship.
That is useful market context.
However, it does not establish that those domains will sell, that all registrants are investors, or that the extension will retain its momentum.
C. Cross-extension adoption
The reported overlap with `.com`, `.ai`, `.app`, and `.xyz` could be useful for studying which TLDs are commonly held by the same customers.
If similar data becomes available for other launches, the system could compare:
Which TLDs attract multi-domain holders.
Which TLDs attract large portfolios.
Whether early registrations are concentrated or broadly distributed.
Whether registration activity persists after launch.
Whether aftermarket sales follow the initial launch spike.
D. Separate registration activity from investor demand
Track these as distinct measurements:
```text
New registrations
Transfers
Unique registrants
Domains per registrant
Concentration among large portfolios
Aftermarket listings
Verified aftermarket sales
Renewal behavior
```
These metrics answer different questions.
For example, a large registration count can reflect speculation rather than end-user demand. Aftermarket sales and renewal behavior provide different evidence about the market.
Important correction about `.si` and superintelligence
The `.si` extension in this post is a domain extension, not proof that the keyword “superintelligence” is trending.
Keep these two concepts separate:
TLD trend: `.si` registrations and aftermarket activity.
Keyword trend: Growth in mentions of terms such as “superintelligence,” “agentic,” or other emerging concepts.
They may both be interesting to domain investors, but they require different data and scoring methods.
The bot should not infer one trend from the other.
---
11. Domain Stability and Replacement Cost
These two additional metrics should be included in the scoring engine.
A. Domain Stability Score
This measures available evidence about a domain's registration history.
Potential signals:
Long registration history.
Few observed drops.
Consistent legitimate use.
Stable use by the same identifiable business.
Repeated drops or changes in use.
A domain that has existed for a long time without obvious abuse may deserve additional investigation.
However, age alone does not establish value. Historical registration data may also be incomplete.
B. Replacement Cost Score
Ask:
> If this domain were unavailable today, how difficult would it be to find a comparable alternative?
Consider:
Length.
Pronounceability.
Memorability.
Meaning.
Uniqueness.
Availability of close alternatives.
Relevance to a commercial category.
Strength of comparable sales.
A short, distinctive brandable might be difficult to replace.
A long, generic phrase may have many alternatives.
This score should help estimate scarcity, not serve as a standalone valuation.
---
12. End-User Count and Category Strength
A domain can be good because it has a large pool of plausible buyers.
The bot should estimate the number of legitimate businesses that could use each candidate.
For example:
A city-plus-roofing domain may appeal to local contractors.
A short brandable may appeal to startups across several industries.
A niche keyword domain may appeal to a smaller group of specialist businesses.
Category-strength signals
Investigate categories such as:
AI.
SaaS.
Fintech.
Cybersecurity.
Healthcare.
Legal services.
Roofing.
HVAC.
Plumbing.
Solar.
Home improvement.
Do not hard-code these as permanently superior industries. Measure actual sales and buyer activity to determine which categories perform well.
End-user research
For promising candidates, collect:
Number of relevant companies.
Number of companies using similar names.
Company size distribution.
Commercial activity.
Existing domain usage.
Geographic reach.
Possible trademark conflicts.
Do not interpret a large number of similarly named companies as a positive signal without checking for trademark and confusion risks.
---
13. Trademark and Legal Risk
Trademark checks should be part of the pipeline, not a feature added at the end.
Sources
USPTO Trademark Search
WIPO Global Brand Database
For domains targeting other countries, investigate the relevant national or regional trademark registries.
Checks
Exact-match trademarks.
Similar spellings.
Phonetic similarities.
Related goods and services.
Relevant jurisdictions.
Existing companies using the name.
Evidence of a well-known brand.
Potential impersonation or cybersquatting concerns.
The bot should classify results as:
No obvious conflict found in available sources.
Possible conflict requiring manual review.
Significant concern.
Insufficient data.
A search that finds no obvious trademark conflict is not a legal guarantee.
The system must never encourage acquiring a domain solely to pressure an existing trademark owner into buying it.
Company-gap hunting should focus on legitimate, independently useful names and should not depend on targeting a company's trademark.
---
14. Separate Scoring Models
Do not evaluate every domain using the same formula.
Build at least these specialized models:
Brandable Score.
Geo-Service Score.
Exact-Match Score.
Company-Gap Score.
Trend Score.
Domain Cleanliness Score.
Domain Stability Score.
Extension Adoption Score.
Comparable Sales Score.
Commercial Intent Score.
Each model should produce:
Score from 0 to 100.
Confidence level.
Evidence supporting the score.
Missing data.
Major risks.
Recommended next action.
Example output
```text
Domain: Example.com

Opportunity type:
Brandable / Company-Gap

Brandable Score: 84
Company-Gap Score: 78
Domain Cleanliness Score: 92
Extension Adoption Score: 71
Comparable Sales Score: 63
Trademark Risk: Medium
Confidence: Medium

Positive signals:
- Short and pronounceable.
- Several relevant extensions registered.
- A potentially relevant company was identified.

Risks:
- Similar names are used by multiple businesses.
- Trademark review is incomplete.
- Comparable sales evidence is limited.

Recommendation:
Manual review required.
Do not acquire automatically.
```
The figures above are illustrative only.
Final ranking
A combined score can help prioritize opportunities, but it should not erase the separate scores.
For example, a domain with a high Brandable Score and low Geo-Service Score is not necessarily a bad domain. It may simply belong to a different investment category.
The system should rank candidates within each category and then create a cross-category shortlist.
Avoid double-counting
Several metrics may measure the same underlying fact.
For example:
Extension count.
Number of matching TLDs.
Number of companies using the same root.
These may be correlated.
The scoring engine should avoid rewarding the same signal multiple times without justification.
---
15. Auction Conversion and Historical Learning
We previously discussed domains such as:
Cytronics.com.
Textology.com.
FairCredit.com.
Ossicle.com.
You considered signals including extension counts and referring-domain metrics when evaluating these candidates.
The important next step is to turn those observations into a dataset.
Record every candidate
```text
Domain
Date discovered
Discovery source
TLD
Character count
Extension count
Referring domains
Backlink quality
Domain age
Drop history
Cleanliness score
Brandability score
Company-gap score
Trademark status
Auction status
Auction price
Final acquisition cost
Whether acquired
Resale listing status
Sale price, if sold
Time to sale
Outcome date
```
Record unknown values as unknown rather than zero.
For example, an unavailable backlink metric should not be treated as proof that a domain has no backlinks.
Questions to investigate
Which extension-count ranges are associated with auction activity?
Which domain structures attract bidders?
Do shorter names perform better in particular categories?
Does a company's existing use correlate with successful sales?
Which sources produce the best candidates?
Which categories sell most frequently?
Which acquisition costs are associated with positive returns?
Important distinction
Auction activity is not the same as profitable resale.
A domain attracting many bidders might be overpriced by the time you acquire it.
Track both:
The probability of attracting interest.
The probability of generating a profitable sale after all costs.
Do not assume a rule such as `RDT > 10 AND extension count > 5` guarantees a particular auction probability. Such relationships must be measured from historical data.
---
16. Investor Research and Feedback
You have been collecting opinions from other domain investors and studying examples of actual sales.
Continue doing this, but turn the findings into structured data.
Sources
NamePros
X
DNJournal
NameBio
Atom
BrandBucket
Record investor feedback
For every useful opinion, store:
```text
Investor identifier or public profile
Date
Domain category discussed
Specific criteria mentioned
Example domains
Reported sale examples
Whether the sale is independently verifiable
Your interpretation
Whether the criterion can be automated
```
After collecting feedback from 10–20 domain investors, look for recurring patterns.
Then compare those patterns with historical sales data.
Do not automatically turn every investor opinion into a scoring rule. Investors may specialize in different domain categories or have different acquisition budgets and sales strategies.
Marketplace research
Study accepted and listed brandables on marketplaces such as Atom and BrandBucket to identify recurring naming patterns.
This can inform your model, but do not claim to know their exact acceptance algorithms unless they publish them.
---
17. The Data Architecture
Ask your AI build agent to use a modular architecture.
The exact technology stack can be selected by the agent, but it should be easy to maintain, test, and extend.
Required modules
1. Source connectors
Each source should have its own connector.
Examples:
```text
godaddy_connector
dynadot_connector
rdap_connector
dotdb_connector
wayback_connector
sales_data_connector
company_research_connector
trend_source_connector
telegram_connector
```
A source that does not offer permitted programmatic access should be marked as manual-only or deferred.
2. Domain normalization
Normalize:
Domain casing.
Internationalized domain names.
Punycode.
TLD.
Root name.
Domain length.
Hyphens and numbers.
Duplicate records.
Keep the original source record for traceability.
3. Database
Store domains, source records, observations, scores, alerts, user decisions, acquisition costs, and sales outcomes.
A relational database such as PostgreSQL is a reasonable default.
For a lightweight prototype, SQLite may be sufficient.
4. Enrichment pipeline
Enrich only the strongest initial candidates.
This reduces unnecessary API requests and costs.
Example:
```text
Stage 1:
Collect 10,000 candidates.

Stage 2:
Remove duplicates and apply cheap filters.

Stage 3:
Retain 1,000 candidates.

Stage 4:
Check extension adoption and basic domain status.

Stage 5:
Retain 200 candidates.

Stage 6:
Run history, company, sales and trademark research.

Stage 7:
Rank the top candidates.

Stage 8:
Send a smaller, high-quality shortlist to Telegram.
```
These numbers are examples, not fixed requirements.
5. Scoring engine
Keep scoring rules configurable.
Do not bury every score threshold inside application code.
Store weights and thresholds in configuration or the database so they can be adjusted without rebuilding the entire system.
6. Scheduler
Support scheduled tasks for:
Daily inventory collection.
Periodic availability checks.
Auction closing-time checks.
Trend monitoring.
Company-gap monitoring.
TLD launch tracking.
Alert delivery.
Historical performance updates.
7. Telegram alerts
Each alert should include:
Domain.
Opportunity category.
Overall priority.
Individual scores.
Asking price or current auction price, if available.
Auction deadline, if available.
Extension count.
History summary.
Comparable sales evidence.
Company evidence, if applicable.
Trademark warning.
Source links.
Confidence.
Recommended next action.
Telegram is an alerting interface, not a substitute for a database.
8. Feedback and learning
Allow you to label opportunities:
Interesting.
Not interesting.
Purchased.
Passed.
Overpriced.
Trademark concern.
Sold.
Unsold.
Profitable.
Loss.
Use these outcomes to evaluate the scoring models.
Do not claim that the system learns from sales until it actually has enough reliable, labeled data.
---
18. Recommended MVP
Do not attempt to build every feature at once.
Start with a small, working version and expand only after the data pipeline works reliably.
Phase 1: Core discovery
Implement:
GoDaddy inventory connector.
Dynadot auction connector.
RDAP lookup.
Domain normalization and deduplication.
Basic filters.
Database storage.
Telegram alerts.
This should produce a functioning discovery bot.
Phase 2: Domain quality
Add:
Extension-count research.
Wayback history.
Domain cleanliness checks.
Comparable sales research.
Brandability scoring.
Exact-match scoring.
Geo-service scoring.
Phase 3: Company-gap hunting
Add:
Company discovery.
Official website verification.
Matching `.com` checks.
Other-extension research.
Employee and funding signals.
Trademark screening.
Company-Gap Score.
Phase 4: Trend detection
Add:
Trend-source connectors.
Keyword frequency tracking.
Growth and velocity calculations.
Startup-name analysis.
Emerging TLD tracking.
Trend scoring.
TLD launch and concentration dashboards.
Phase 5: Empirical validation
Add:
Auction outcome tracking.
Acquisition cost tracking.
Sales outcome tracking.
Historical score evaluation.
Threshold tuning.
False-positive analysis.
Source-quality measurement.
Do not delay the MVP until every source is integrated. A small, reliable pipeline is more useful than a large system that depends on inaccessible APIs or incomplete data.
---
19. Free and Paid Tools Strategy
The aim is to start cheaply and upgrade when the system proves useful.
Function	Start with	Upgrade when needed
Auction inventory	Official downloadable inventory and accessible APIs	Additional permitted inventory providers
Registration data	RDAP and ICANN resources	WHOIS history and commercial enrichment
Extension count	Manual checks or an authorized provider plan	Automated bulk access
Domain history	Wayback Machine	Additional historical data providers
Sales research	Public sales reports and manual research	Authorized sales datasets
Company research	Public company pages and accessible directories	Licensed company-data APIs
Trend detection	Accessible public APIs and RSS feeds	Additional licensed data
Geo research	Public census data and permitted directories	Commercial search and market data
Trademark screening	Official trademark search tools	Licensed legal or trademark research services
Notifications	Telegram Bot API	No paid upgrade needed initially
Database	SQLite or PostgreSQL	Managed database if operational needs justify it
Paid tools to evaluate later
DomCop
SpamZilla
RegisterCompass
CatchDoms
Verify each provider's current products, API access, pricing, and terms before integrating it. These are candidates for evaluation, not guarantees of free or public API availability.
API-cost principle
Use inexpensive checks first.
For example, do not send every domain to multiple paid enrichment services before eliminating duplicates and obvious low-quality candidates.
A cost-efficient pipeline looks like this:
```text
Cheap collection
    ↓
Cheap filters
    ↓
Basic registration checks
    ↓
Extension-count checks
    ↓
Historical research
    ↓
Company and sales enrichment
    ↓
Trademark screening
    ↓
Final scoring
```
The most expensive checks should be reserved for candidates that have already passed the initial filters.
---
20. Configuration and Safety Requirements
Tell the agent to make the following configurable:
Preferred domain extensions.
Minimum and maximum domain length.
Allowed hyphens and numbers.
Preferred syllable count.
Excluded letter combinations.
Minimum extension-count signal.
Minimum cleanliness score.
Minimum opportunity score.
Maximum acquisition budget.
Target categories.
Geographic markets.
Trend-monitoring keywords.
Telegram alert frequency.
Maximum daily API spending.
Maximum daily alerts.
Source-specific rate limits.
Required protections
Respect provider terms and API limits.
Do not hard-code API credentials.
Store credentials in environment variables or an appropriate secrets manager.
Log source failures and data freshness.
Retry temporary errors with bounded backoff.
Avoid duplicate notifications.
Store timestamps for observations.
Distinguish unknown values from zero.
Do not automatically purchase or bid on domains in the MVP.
Require manual review before acquisition.
Flag trademark and impersonation concerns.
Record the evidence behind every important score.
The first version should be a research and alerting system, not an autonomous purchasing agent.
---
21. How the Bot Should Measure Its Own Performance
A discovery system can produce thousands of alerts and still be useless if the candidates are poor.
Track the following:
Metric	What it measures
Candidates collected	Total inventory entering the system
Unique candidates	Duplicates removed
Enrichment success rate	How often data providers return usable data
Alert count	Number of opportunities surfaced
User acceptance rate	Percentage of alerts you consider worth reviewing
Source yield	Useful candidates per source
Auction participation rate	Candidates that attract auction activity
Acquisition rate	Candidates actually purchased
Acquisition cost	Total cost of acquiring domains
Resale rate	Purchased domains that sell
Time to sale	Time between acquisition and sale
Net profit	Sale proceeds minus acquisition and selling costs
Return on investment	Profit relative to invested capital
Use these metrics to identify which sources and scoring models are genuinely useful.
A model should not be judged solely by how many domains it identifies.
It should be judged by the quality of the opportunities it surfaces and, eventually, by the outcomes of the domains you acquire.
---
22. Copyable Instructions for Your AI Build Agent
The following is the condensed master prompt you can give your build agent. It is intentionally implementation-focused.
```text
PROJECT: DOMAIN INTELLIGENCE AND OPPORTUNITY DISCOVERY BOT

OBJECTIVE

Build a modular domain research system that discovers, enriches, scores,
ranks and monitors potentially valuable domains.

The system must support multiple domain-investing strategies rather than
using a single scoring formula.

PRIMARY OPPORTUNITY CATEGORIES

1. Brandable domains.
2. Company-gap opportunities.
3. Expired and expiring domains.
4. Exact-match domains.
5. Geo-service domains.
6. Emerging keyword and trend opportunities.
7. Emerging TLD and extension-adoption opportunities.

CORE WORKFLOW

1. Collect domains and keywords from authorized data sources.
2. Normalize and deduplicate records.
3. Apply inexpensive initial filters.
4. Check registration status and available domain data.
5. Enrich promising candidates.
6. Research extension adoption and historical usage.
7. Research comparable sales where data is available.
8. Identify potential companies and end users.
9. Check trademark risk.
10. Calculate category-specific scores.
11. Rank candidates by category and overall priority.
12. Send high-priority alerts to Telegram.
13. Store user decisions and eventual acquisition/sales outcomes.
14. Evaluate and improve the scoring system using historical results.

DOMAIN SOURCES TO EVALUATE

- GoDaddy Auctions inventory and official API.
- Dynadot Domain API and auction functionality.
- NameJet.
- DropCatch.
- SnapNames.
- Namecheap marketplace and registration research.
- Sedo.
- Afternic.
- Spaceship.
- RDAP and ICANN registration data.
- DotDB or another authorized extension-count provider.
- Internet Archive Wayback Machine.
- NameBio and other authorized comparable-sales sources.
- LinkedIn and Crunchbase through permitted access methods.
- Product Hunt and Y Combinator company directories.
- Google Maps Platform and public business directories.
- Public census and demographic datasets.
- Official trademark registries.
- Authorized public APIs and RSS feeds for trend monitoring.

Do not assume that every source has a public API.
Verify documentation, access permissions, pricing, rate limits and terms
before implementing each connector.

Do not build the system around unauthorized scraping of ExpiredDomains.net.
Use official inventory feeds, APIs and other permitted sources.

MODULES

A. Source connectors.
B. Domain normalization and deduplication.
C. Registration and availability checks.
D. Extension-adoption research.
E. Domain history and cleanliness checks.
F. Comparable-sales research.
G. Company-gap discovery.
H. Brandability scoring.
I. Geo-service scoring.
J. Exact-match scoring.
K. Trend detection.
L. TLD launch and adoption monitoring.
M. Trademark risk screening.
N. Opportunity ranking.
O. Telegram alerts.
P. Historical performance tracking.
Q. Configuration and administrative controls.

SCORING MODELS

Implement separate scores for:

- Brandability.
- Company-gap potential.
- Geo-service potential.
- Exact-match potential.
- Trend strength.
- Domain cleanliness.
- Domain stability.
- Extension adoption.
- Comparable-sales evidence.
- Commercial intent.
- End-user count.
- Replacement cost.

Each score must return:

- Numeric score from 0 to 100.
- Confidence level.
- Supporting evidence.
- Missing data.
- Risk flags.
- Recommended next action.

Do not use one formula for every domain category.
Do not invent evidence, sales prices, registration data or API results.
Do not treat missing data as a zero score without an explicit rule.

BRANDABLE FILTERS

Use configurable defaults:

- Prefer 5–8 characters.
- Allow up to 10 characters when the name is strong.
- Prefer 2–3 syllables.
- Prefer pronounceable, memorable names.
- Prefer names that are easy to spell after hearing them once.
- Penalize unnecessary spelling complexity.
- Exclude hyphens and numbers by default.
- Penalize awkward letter combinations and endings.
- Check root words and broad use cases.
- Check comparable sales and trademark risk.
- Evaluate plausible startup usage.

COMPANY-GAP WORKFLOW

1. Discover companies using non-.com domains.
2. Verify the official business and website.
3. Extract the brand root.
4. Check whether the matching .com is available, registered,
   listed for sale, or expiring.
5. Research other TLDs used by the company.
6. Collect available company-size, funding, launch and growth signals.
7. Search for unrelated companies using the same name.
8. Check trademark risks.
9. Estimate the number of legitimate potential buyers.
10. Score and alert only when evidence supports further review.

Do not assume that a company will buy a domain.
Do not encourage targeting trademark owners for coercive resale.

GEO-SERVICE WORKFLOW

For city + service domains, investigate:

- Population.
- Median household income.
- Home values.
- Relevant business count.
- Potential buyer count.
- Search demand.
- CPC and commercial intent.
- Industry economics.
- Comparable domain sales.
- Domain quality and history.

EXACT-MATCH WORKFLOW

Investigate:

- Search volume.
- Commercial intent.
- CPC.
- Relevant businesses.
- Geographic demand.
- Comparable sales.
- Domain quality.
- Trademark risk.

TREND DETECTION

Monitor permitted sources such as:

- X API, where access permits.
- GitHub API.
- Product Hunt API, subject to its terms.
- Y Combinator companies.
- Crunchbase, subject to access terms.
- Hacker News API.
- Technology-news RSS feeds.
- Other authorized datasets.

Track:

- Keyword mentions over time.
- Growth and acceleration.
- Number of independent sources.
- New companies using the term.
- New products using the term.
- Search demand.
- Relevant domain registrations.
- Domain availability.
- Comparable sales.
- Trend saturation.

Keep keyword trends separate from TLD adoption trends.

TLD ADOPTION MODULE

Track where data is available:

- Registrations over time.
- Transfers over time.
- Customer/portfolio concentration.
- Registrations by geographic market.
- Number of domains per customer.
- Cross-extension ownership.
- Aftermarket listings.
- Verified sales.
- Renewal behavior.

Treat provider-specific launch statistics as provider-specific evidence,
not as global registration totals.

DOMAIN HISTORY

Use available historical records to investigate:

- Previous website content.
- Legitimate business use.
- Spam or abuse history.
- Suspicious redirects.
- Drop history where reliable.
- Backlink quality where data is available.

Do not claim that a domain is clean merely because no archived content exists.

COMPARABLE SALES

Use permitted sales data and public reports.
Compare names by category, length, structure, industry, TLD and sale date.

Distinguish verified sales from reported, estimated and unknown values.
Never fabricate sales prices.

DATABASE

Store:

- Domains.
- Source records.
- Domain observations.
- Registration status.
- Extension counts.
- Historical evidence.
- Company research.
- Comparable sales.
- Trademark findings.
- Scores.
- Alerts.
- User feedback.
- Acquisition costs.
- Sales outcomes.

Store timestamps, source provenance and confidence for important data.

TELEGRAM ALERTS

Include:

- Domain.
- Opportunity category.
- Overall priority.
- Category-specific scores.
- Current price if available.
- Auction deadline if available.
- Extension count.
- Domain history summary.
- Comparable-sales evidence.
- Company evidence where applicable.
- Trademark risk.
- Source links.
- Confidence level.
- Recommended next action.

Avoid duplicate alerts.

MVP ORDER

PHASE 1:
- GoDaddy inventory.
- Dynadot auction data.
- RDAP.
- Domain normalization.
- Basic filters.
- Database.
- Telegram alerts.

PHASE 2:
- Extension-count research.
- Wayback history.
- Cleanliness scoring.
- Comparable-sales research.
- Brandable, geo and exact-match scoring.

PHASE 3:
- Company-gap research.
- Company and funding signals.
- Trademark screening.

PHASE 4:
- Trend detection.
- Keyword velocity.
- TLD adoption tracking.

PHASE 5:
- Historical outcome tracking.
- Source-performance evaluation.
- Score validation and tuning.

COST CONTROL

Use inexpensive checks first.
Enrich only promising candidates.
Set source-specific rate limits and API budgets.
Make scoring thresholds configurable.
Store cached results where permitted.

SAFETY AND RELIABILITY

- Never hard-code API secrets.
- Use environment variables or a secrets manager.
- Respect provider terms and rate limits.
- Log failures and data freshness.
- Distinguish unknown values from zero.
- Retry temporary errors with bounded backoff.
- Require manual approval before any purchase or bid.
- Flag material trademark concerns.
- Keep evidence and score explanations auditable.

DELIVERABLES

1. Architecture document.
2. Source/API inventory with verified access requirements.
3. Database schema.
4. Configuration file.
5. Source connectors.
6. Domain filtering and normalization pipeline.
7. Scoring engine.
8. Telegram integration.
9. Scheduler.
10. Tests.
11. Setup and deployment documentation.
12. API credential setup guide.
13. Operating-cost estimate.
14. Known limitations and unavailable data sources.
15. Instructions for adding new data providers.

Before coding, verify source availability and identify which integrations
can actually be implemented under their current terms.

Build a working MVP before attempting the full platform.
Do not fabricate data or pretend an unavailable integration works.
```
---
23. Official Documentation and Starting Links
These are useful starting points for the agent when implementing the MVP.
Domain inventory and registration
GoDaddy Auctions API documentation
GoDaddy developer documentation
Dynadot API documentation
ICANN RDAP documentation
Trends and startups
Product Hunt API documentation
GitHub REST API documentation
Hacker News API documentation
Y Combinator Companies
Domain history and legal research
Internet Archive Wayback Machine
USPTO trademark search
WIPO Global Brand Database
DotDB
NameBio
---
24. My Final Recommendation
Build the project in this order:
First: Create the inventory pipeline and Telegram alerts.
Second: Add extension counts, domain history, and comparable-sales research.
Third: Build the company-gap strategy, because it can identify specific businesses that may have a legitimate reason to use a matching domain.
Fourth: Add geo-service and exact-match scoring.
Fifth: Build the trend and TLD intelligence engine, including the kind of adoption and portfolio-concentration information highlighted in the Spaceship `.si` post.
Sixth: Track your own acquisition and sales outcomes so you can measure which strategies work for you.
The most important design decision is to separate discovery, evidence, scoring, and outcomes. That will let you improve each part without rebuilding the whole application.
And remember: the goal is not to generate the highest number of alerts. It is to identify the strongest opportunities, explain why they deserve attention, and gradually improve your decisions using real market evidence.
