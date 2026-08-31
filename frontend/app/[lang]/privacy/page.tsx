import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'pages' });
  return { title: t('privacy'), alternates: { canonical: `/${lang}/privacy` } };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-14 sm:py-20">
      <h1 className="t-h1 max-w-[16ch]">Privacy</h1>

      <div className="prose-guide mt-8">
        <p>
          Short version: the calculators run in your browser and we do not receive what you
          type into them. We collect an email address only if you hand us one.
        </p>

        <h2>Your measurements</h2>
        <p>
          Age, height, weight, waist, goal weight, and activity level are processed entirely
          in your browser. They are not transmitted to our servers, and we cannot see them.
        </p>
        <p>
          Weigh-ins in the progress tracker are stored in your browser's local storage on the
          device you used. Clearing site data deletes them. If you create an account and
          choose to save a plan or sync your weigh-ins, that specific data is then stored on
          our server against your account, and you can delete it at any time.
        </p>

        <h2>Email</h2>
        <p>
          If you subscribe, we store your email address, the language version of the site you
          subscribed from, and which page you subscribed on. We use it to send new guides and
          calculators. Every email has an unsubscribe link, and unsubscribing removes you.
          We do not sell or rent the list.
        </p>

        <h2>Accounts</h2>
        <p>
          Signing in is optional and uses Kimlik.az. If you sign in, we receive your name,
          email address, and phone number if you have one on file there, plus an access token
          so the sign-in works. We do not receive your password.
        </p>

        <h2>Analytics and advertising</h2>
        <p>
          If we add analytics or advertising, this page will say which provider, what it
          collects, and how to opt out, before it goes live. As of the date below, neither is
          running on the site.
        </p>

        <h2>Your rights</h2>
        <p>
          You can ask what we hold about you, ask for a copy, or ask us to delete it. Write to
          the address on the contact page and we will respond within 30 days.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes in a way that affects what we collect, we will say so here
          and date the change.
        </p>
      </div>
    </div>
  );
}
