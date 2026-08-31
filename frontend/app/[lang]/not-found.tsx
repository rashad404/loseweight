import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <div className="mx-auto max-w-[860px] px-5 sm:px-8 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">{t('notFound')}</h1>
      <p className="t-lead mt-4 max-w-[58ch]">{t('notFoundBody')}</p>
      <Link href="/" className="btn btn-primary mt-6">{t('goHome')}</Link>
    </div>
  );
}
