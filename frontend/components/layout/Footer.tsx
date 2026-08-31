import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.tools'),
      links: [
        { href: '/planner', label: t('nav.planner') },
        { href: '/tracker', label: t('nav.tracker') },
        { href: '/calculators/tdee', label: t('calculators.tdee') },
        { href: '/calculators/bmi', label: t('calculators.bmi') },
        { href: '/calculators/waist-to-height', label: t('calculators.whtr') },
        { href: '/calculators/protein', label: t('calculators.protein') },
        { href: '/calculators/plateau', label: t('calculators.plateau') },
      ],
    },
    {
      title: t('footer.content'),
      links: [{ href: '/guides', label: t('nav.guides') }],
    },
    {
      title: t('footer.company'),
      links: [
        { href: '/about', label: t('pages.about') },
        { href: '/editorial-policy', label: t('pages.editorial') },
        { href: '/medical-disclaimer', label: t('pages.disclaimer') },
        { href: '/corrections', label: t('pages.corrections') },
        { href: '/privacy', label: t('pages.privacy') },
        { href: '/terms', label: t('pages.terms') },
        { href: '/contact', label: t('pages.contact') },
      ],
    },
  ];

  return (
    <footer className="mt-24 band-dark">
      <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo height={30} variant="onDark" />
            <p className="mt-3 text-[0.9375rem] text-muted max-w-[26ch] leading-relaxed">
              {t('site.tagline')}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t" style={{ borderColor: 'rgba(246,246,243,0.15)' }}>
          <p className="text-[0.8125rem] text-muted leading-relaxed max-w-[75ch]">
            {t('footer.disclaimer')}
          </p>
          <p className="mt-4 text-[0.8125rem] text-muted">
            {year} LoseWeight.net. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
