Act as a senior technical SEO engineer and health-content SEO specialist. Audit and improve the entire LoseWeight.net codebase according to current Google Search standards.

Your task is to implement fixes, not merely provide recommendations.

Primary goals:

* Make every public page crawlable, indexable, fast, accessible, and understandable to search engines.
* Preserve a useful experience for real visitors.
* Apply stricter trust and accuracy standards because weight loss is a health topic.
* Do not use manipulative SEO, keyword stuffing, hidden content, doorway pages, link schemes, or mass-generated pages.

First inspect the project:

* Identify the framework, routing system, rendering method, metadata implementation, and deployment setup.
* List all public routes.
* Identify duplicate, thin, unfinished, test, filter, parameter, and utility pages.
* Check whether important content is rendered in the initial HTML.
* Preserve existing functionality and design unless a change is necessary for SEO, accessibility, or performance.
* Before editing, summarize the main problems and the files you will change.

Technical SEO requirements:

* Give every indexable page a unique and descriptive HTML title.
* Give every indexable page a useful meta description.
* Add exactly one clear H1 to each page.
* Use H2 and H3 headings in a logical hierarchy.
* Add self-referencing canonical URLs.
* Use absolute production URLs in canonical tags, Open Graph metadata, sitemaps, and structured data.
* Add appropriate robots directives.
* Use `noindex` for pages that should not appear in search results.
* Do not block required CSS, JavaScript, images, or other rendering assets.
* Create or correct `robots.txt`.
* Create a valid XML sitemap containing only canonical, indexable URLs that return successful responses.
* Exclude redirects, error pages, duplicate URLs, parameter pages, and `noindex` pages from the sitemap.
* Add meaningful `lastmod` values only when content has actually changed.
* Create a useful custom 404 page.
* Fix broken internal links.
* Remove unnecessary redirect chains.
* Choose one consistent URL format for trailing slashes, capitalization, and protocol.
* Redirect alternate URL versions to the canonical version.
* Prevent duplicate pages created by query parameters or route variations.
* Add breadcrumb navigation where it helps users understand site structure.
* Add contextual internal links between calculators, guides, and related pages.
* Use descriptive anchor text instead of phrases such as "click here."
* Ensure pagination, if present, is crawlable and logically linked.
* Do not depend on client-side JavaScript for essential text, titles, metadata, or internal links when server rendering or static generation is available.

Multilingual SEO:

* Inspect all supported languages.
* Give every language a stable, crawlable URL.
* Add correct reciprocal `hreflang` tags when equivalent translated pages exist.
* Use valid language and regional codes.
* Include an `x-default` version when appropriate.
* Set the correct HTML `lang` attribute on every page.
* Do not automatically redirect visitors solely by IP address or browser language.
* Do not create `hreflang` references for translations that do not exist.
* Ensure canonical tags point to the same-language canonical page.
* Keep each language version internally consistent.

Azerbaijani content:

* Do not translate English copy word for word.
* Rewrite text so it sounds natural to a native Azerbaijani speaker.
* Use language commonly used in Azerbaijan.
* Avoid English sentence structure expressed with Azerbaijani words.
* Avoid awkward phrases such as "Tərəqqi izləyicisi."
* Prefer natural labels such as "Nəticələrinizi izləyin," "Çəki izləmə," "Faydalı məlumatlar," or "Məqalələr," depending on context.
* Preserve Azerbaijani characters correctly.
* Do not generate separate pages for trivial keyword variations.
* Keep terminology consistent throughout the website.

Health-content trust requirements:

* Do not promise guaranteed or unusually rapid weight loss.
* Do not diagnose users or provide personalized medication recommendations.
* Clearly distinguish educational information from medical advice.
* Include appropriate warnings about pregnancy, eating disorders, childhood, chronic illness, medications, and other situations requiring professional care.
* Support medical claims with reliable sources such as FDA labeling, NIH resources, established clinical guidelines, systematic reviews, and peer-reviewed research.
* Never invent citations, statistics, authors, credentials, studies, or review dates.
* Confirm that each citation exists and supports the associated statement.
* Add visible author information where appropriate.
* Represent credentials and licensing jurisdiction accurately.
* Add publication and update dates only when they are truthful.
* Create clear About, Editorial Policy, Medical Disclaimer, Privacy Policy, Terms, Contact, and Corrections pages.
* Make ownership, commercial relationships, sponsorships, and affiliate disclosures easy to find.
* Keep sponsored placement separate from editorial ranking.
* Do not use fake reviews, fake testimonials, or unsupported before-and-after claims.

Structured data:

* Add only schema that accurately represents visible page content.
* Use JSON-LD.
* Add `Organization` and `WebSite` schema where appropriate.
* Use `Article` or `BlogPosting` for genuine editorial articles.
* Use `BreadcrumbList` when visible breadcrumbs exist.
* Use `FAQPage` only when the page contains a visible, genuine FAQ and current Google eligibility rules are satisfied.
* Do not add fake ratings or reviews.
* Do not use medical schema types unless the content and entity genuinely qualify.
* Ensure URLs, names, authors, dates, images, and relationships are consistent.
* Validate all structured data and remove unsupported properties.

Calculators and tools:

* Give each calculator a unique explanatory introduction.
* Explain what the calculator measures, how it works, its limitations, and when professional advice may be needed.
* Make calculator results understandable without requiring search engines to execute complex interactions.
* Use proper form labels and accessible validation.
* Do not claim that calculator results are a medical diagnosis.
* Add relevant links from calculator results to supporting educational pages.
* Avoid creating indexable pages for every possible calculation result.
* Do not expose private user data in URLs, metadata, analytics, logs, or structured data.

Content quality:

* Write for the visitor's intent, not a target word count.
* Answer the main question near the beginning.
* Remove filler, repetition, generic introductions, and keyword stuffing.
* Avoid formulaic AI phrasing.
* Do not use em dashes or decorative Unicode symbols.
* Do not mass-produce low-value articles.
* Do not copy or lightly rewrite competitors' content.
* Add original value through calculators, comparison criteria, transparent methods, verified data, or useful explanations.
* Each page should have a distinct purpose.
* Merge or remove pages that substantially overlap.
* Add relevant sources close to the claims they support.
* Do not add content solely to manipulate rankings.

Images and media:

* Give informative images concise, descriptive alt text.
* Use empty alt text for decorative images.
* Do not stuff keywords into alt text or filenames.
* Serve properly sized responsive images.
* Use modern formats where supported.
* Set width and height attributes to reduce layout shifts.
* Lazy-load images below the fold.
* Do not lazy-load the main above-the-fold image if it harms Largest Contentful Paint.
* Add useful social-sharing images with accurate Open Graph and X metadata.
* Ensure the logo remains legible and accessible.

Performance and Core Web Vitals:

* Improve Largest Contentful Paint, Interaction to Next Paint, and Cumulative Layout Shift.
* Reduce unnecessary JavaScript.
* Remove unused dependencies where safe.
* Split large bundles where appropriate.
* Optimize fonts and avoid excessive font weights.
* Preload only genuinely critical assets.
* Prevent render-blocking resources where practical.
* Reserve space for images, embeds, ads, and dynamic components.
* Avoid intrusive popups and interstitials.
* Ensure the site works well on slow mobile connections.
* Do not sacrifice correctness or accessibility for a better synthetic score.

Accessibility and usability:

* Use semantic HTML.
* Make the site fully usable by keyboard.
* Add visible focus states.
* Maintain sufficient color contrast.
* Associate every form field with a label.
* Provide understandable validation and error messages.
* Use descriptive button labels.
* Ensure navigation works on mobile.
* Avoid layout shifts when validation messages or results appear.
* Respect reduced-motion preferences.
* Verify that important functionality works without a mouse.

Verification:

* Run the existing test suite, type checker, linter, and production build.
* Fix errors introduced by your changes.
* Test representative pages at mobile and desktop sizes.
* Check titles, descriptions, canonicals, robots directives, headings, language tags, `hreflang`, structured data, and sitemap entries.
* Verify that all sitemap URLs return successful responses and are indexable.
* Validate `robots.txt` and XML sitemap syntax.
* Test structured data using an appropriate validator.
* Run Lighthouse or an equivalent local audit when possible.
* Check for broken links and orphan pages.
* Confirm that private routes and user-generated result pages cannot be indexed accidentally.
* Do not claim that rankings are guaranteed.

Final report:

* Summarize the changes implemented.
* List every file changed.
* List pages intentionally set to `noindex`.
* List any content or credential information that still requires owner verification.
* Report build, test, structured-data, link-checking, and performance results.
* Separate completed work from recommendations that require external services, production data, or owner decisions.
* Do not leave placeholder content, invented facts, or fake credentials.
