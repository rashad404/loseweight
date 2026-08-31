---
name: seo
description: Audit and fix technical SEO, structured data, multilingual hreflang, health-content trust signals, Core Web Vitals, and accessibility on LoseWeight.net. Use when asked to improve SEO, check indexability, add schema, fix metadata, audit crawlability, or before launching new pages or a new locale.
---

# SEO for LoseWeight.net

Act as a senior technical SEO engineer and health-content specialist. **Implement fixes,
do not just list recommendations.** Weight loss is a health topic, so trust and accuracy
standards are stricter than for an ordinary site.

Never use manipulative SEO: no keyword stuffing, hidden content, doorway pages, link
schemes, or mass-generated pages. Never claim rankings are guaranteed.

## Before changing anything

1. Confirm the stack and rendering method. Today: Next.js App Router, `[lang]` segment,
   `next-intl` with `localePrefix: 'as-needed'`, mostly SSG with dynamic guide routes,
   Laravel API behind `api.loseweight.net`.
2. List every public route and check which are in the sitemap.
3. Find duplicate, thin, unfinished, test, filter, or parameter pages.
4. Confirm important content is in the initial HTML, not injected by client JS.
5. Summarize the problems and the files you will change, then edit.

Preserve existing functionality and design unless a change is required for SEO,
accessibility, or performance.

## Project invariants

These are specific to this codebase and easy to break:

- **English has no URL prefix.** Build every canonical, hreflang, and sitemap URL with
  `localePath()` from `i18n/routing.ts`. Interpolating `/${lang}` emits `/en/...` URLs
  that 308 away and split the ranking signal.
- **Guides exist in exactly one language and never cross locales.** An `az` guide 404s
  under English. Never emit an hreflang alternate for a guide translation that does not
  exist. Only the shared UI pages (home, planner, tracker, calculators, policies) get
  full reciprocal alternates.
- **`NEXT_PUBLIC_SITE_URL` feeds every absolute URL.** If it is wrong, canonicals,
  sitemap, robots, and OG tags all point at the wrong host.
- **Calculators run in the browser.** Results must never become indexable URLs and must
  never put body measurements in query strings, metadata, logs, or structured data.
- Copy rules are binding: see `docs/EDITORIAL.md`. Azerbaijani is written, not
  translated: see `docs/LOCALIZATION-AZ.md`. Run `npm run lint:copy` before committing.

## Technical checklist

- Unique, descriptive `<title>` and useful meta description on every indexable page. A
  page inheriting the site-wide description is a bug.
- Exactly one `<h1>` per page. Logical `h2`/`h3` hierarchy below it.
- Self-referencing canonical, absolute, production host.
- Correct robots directives. `noindex` anything that should not rank; never block CSS,
  JS, or images needed to render.
- `robots.txt` and an XML sitemap containing only canonical, indexable, 200-returning
  URLs. No redirects, error pages, parameter URLs, or `noindex` pages. `lastmod` only
  when content actually changed.
- One URL format: no trailing slash, lowercase, https. Alternates redirect to canonical.
  Remove redirect chains, a redirect should reach its target in one hop.
- Useful custom 404 that returns status 404.
- Fix broken internal links. No orphan pages.
- Breadcrumbs where they help, with matching `BreadcrumbList`.
- Contextual internal links between calculators and the guides that explain them, using
  descriptive anchor text, never "click here" or "read more".

## Multilingual

- Every language gets a stable, crawlable URL. Valid language codes.
- Reciprocal `hreflang` only where an equivalent page genuinely exists, plus `x-default`
  pointing at the default locale.
- Correct `lang` attribute on `<html>`.
- Never auto-redirect by IP or `Accept-Language`. Offer a switcher instead.
- Canonicals point to the same-language page.

## Structured data

JSON-LD only. Add only schema that reflects content actually visible on the page.

- `Organization` and `WebSite` on the site root.
- `Article` or `MedicalWebPage` for genuine editorial guides, with real author, real
  reviewer, real dates.
- `BreadcrumbList` only when visible breadcrumbs exist.
- `FAQPage` only for a visible, genuine FAQ that meets current eligibility rules.
- No fake ratings, reviews, or invented aggregate data. No medical schema types unless
  the content genuinely qualifies.
- Keep URLs, names, authors, dates, and images consistent with the rendered page.

## Health-content trust

This section outranks ranking considerations. If they conflict, trust wins.

- Never promise guaranteed or rapid weight loss. Never diagnose. Never give personalized
  medication or dosage recommendations.
- Distinguish education from medical advice, visibly.
- Warn where it matters: pregnancy, eating disorders, children, chronic illness,
  medications, and anything needing urgent care.
- Cite primary sources next to the claims they support: FDA labeling, NIH, clinical
  guidelines, systematic reviews, major peer-reviewed studies.
- **Never invent citations, statistics, authors, credentials, studies, or review dates.**
  Verify each citation exists and supports the statement.
- Represent credentials and licensing jurisdiction accurately. A guide that no clinician
  has reviewed must say so, visibly. Never populate `reviewer_name`, `reviewer_credentials`
  or `reviewed_at` to make a badge disappear.
- Keep About, Editorial Policy, Medical Disclaimer, Privacy, Terms, Contact, and
  Corrections pages present and easy to find.
- Disclose ownership, sponsorships, and affiliate relationships. Keep paid placement out
  of editorial ranking. No fake reviews, testimonials, or before-and-after claims.

## Calculators

- Unique introduction per calculator explaining what it measures, how it works, its
  limitations, and when to see a clinician.
- Results understandable without the crawler executing complex interaction.
- Real `<label>` on every field, accessible validation, clear errors.
- Never call a result a diagnosis.
- Link results to the guides that explain them.
- No indexable URL per calculation result.

## Images and media

- Concise descriptive `alt` on informative images, empty `alt` on decorative ones. No
  keyword stuffing in alt text or filenames.
- Explicit width and height to avoid layout shift. Responsive sizes, modern formats.
- Lazy-load below the fold, but never the LCP image.
- Accurate Open Graph and X card metadata with a real sharing image.

## Performance

- Watch LCP, INP, CLS. Reduce JS, drop unused dependencies, split large bundles.
- Load only the font weights actually used. Self-host rather than render-blocking a CDN.
- Preload only genuinely critical assets. Reserve space for dynamic content.
- No intrusive interstitials. Must work on slow mobile.
- Never trade correctness or accessibility for a synthetic score.

## Accessibility

Semantic HTML, full keyboard operation, visible focus states, sufficient contrast, every
field labeled, understandable validation, descriptive button text, working mobile nav, no
layout shift when results appear, and `prefers-reduced-motion` respected.

## Verify before reporting

Run the type checker, linter, `npm run lint:copy`, and a production build. Then check on
real URLs:

```bash
# titles, descriptions, canonical, hreflang, h1 count
curl -s "$URL" | grep -oE '<title>[^<]*|<meta name="description"[^>]*|<link rel="canonical"[^>]*|hrefLang="[a-z-]+" href="[^"]*"'
curl -s "$URL" | grep -c '<h1'

# every sitemap URL must return 200
curl -s "$SITE/sitemap.xml" | grep -oE '<loc>[^<]*' | sed 's/<loc>//' | while read u; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"
done | grep -v '^200' || echo "all sitemap URLs 200"

# structured data
curl -s "$URL" | python3 -c "import sys,re,json;[json.loads(m) and print('valid') for m in re.findall(r'application/ld\+json\">(.*?)</script>',sys.stdin.read(),re.S)]"
```

Confirm private routes and calculator results are not indexable. Check representative
pages at mobile and desktop widths.

## Reporting

Summarize what changed and list every file touched. List pages deliberately set to
`noindex`. **List anything still needing the owner's verification**, especially reviewer
names, credentials, licensing jurisdiction, and review dates. Separate completed work
from things blocked on external services or owner decisions. Never leave placeholder
content, invented facts, or fake credentials.
