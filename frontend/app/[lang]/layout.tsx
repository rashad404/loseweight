import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';
import { Geist } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { alternatesFor, absolute } from '@/lib/seo';

const geist = Geist({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  // Only the weights actually used. Each extra weight is another font file.
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-geist',
  display: 'swap',
});
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'site' });

  return {
    title: { default: `${t('name')}: ${t('tagline')}`, template: `%s | ${t('name')}` },
    description: t('description'),
    alternates: alternatesFor(lang),
    openGraph: {
      siteName: t('name'),
      locale: lang,
      type: 'website',
      images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: t('name') }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/brand/og.png'],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/brand/icon-32.png', type: 'image/png', sizes: '32x32' },
        { url: '/brand/icon-16.png', type: 'image/png', sizes: '16x16' },
      ],
      apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
    },
    manifest: '/site.webmanifest',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  setRequestLocale(lang);

  return (
    <html lang={lang} className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Light is the default for everyone. The OS preference is deliberately
            not consulted: long-form guides are the SEO engine and read better on
            light, and it means the design signed off on is the one people see.
            A visitor who picks dark has it remembered from then on.
            Applied before paint so returning dark readers see no white flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('lw_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(lang)) }}
        />
        <NextIntlClientProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

/**
 * Organization and WebSite, describing what the site actually is. No
 * aggregateRating, no review counts, no medical entity claims: none of those
 * are true here and inventing them is the fastest way to lose trust.
 */
function siteJsonLd(lang: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${absolute('/')}#organization`,
        name: 'LoseWeight.net',
        url: absolute('/'),
        logo: {
          '@type': 'ImageObject',
          url: absolute('/brand/icon-512.png'),
          width: 512,
          height: 512,
        },
        description:
          'Free, evidence-based weight loss calculators and clinician-reviewed guides.',
      },
      {
        '@type': 'WebSite',
        '@id': `${absolute('/')}#website`,
        url: absolute('/'),
        name: 'LoseWeight.net',
        inLanguage: lang,
        publisher: { '@id': `${absolute('/')}#organization` },
      },
    ],
  };
}
