import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localePath } from '@/i18n/routing';
import { Geist } from 'next/font/google';
import { routing } from '@/i18n/routing';

const geist = Geist({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
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
    alternates: {
      canonical: localePath(lang),
      languages: Object.fromEntries(routing.locales.map((l) => [l, localePath(l)])),
    },
    openGraph: {
      siteName: t('name'),
      locale: lang,
      type: 'website',
    },
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
        {/* Applied before paint so a dark-mode reader never sees a white flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('lw_theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
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
