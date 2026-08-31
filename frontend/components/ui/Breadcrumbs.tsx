import { Link } from '@/i18n/navigation';
import { localePath } from '@/i18n/routing';
import { absolute } from '@/lib/seo';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  /** Locale-relative path. Omit on the final crumb, which is the current page. */
  href?: string;
}

/**
 * Visible breadcrumbs plus the matching BreadcrumbList. The two are emitted
 * together on purpose: structured data for a trail the user cannot see is
 * exactly the mismatch Google penalizes.
 */
export default function Breadcrumbs({
  items,
  lang,
  homeLabel,
}: {
  items: Crumb[];
  lang: string;
  homeLabel: string;
}) {
  const trail: Crumb[] = [{ label: homeLabel, href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: absolute(localePath(lang, crumb.href)) } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-muted">
          {trail.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} aria-hidden="true" className="opacity-50" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-brand-800 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-[var(--text)]">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
