'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/planner', label: t('planner') },
    { href: '/tracker', label: t('tracker') },
    { href: '/calculators', label: t('calculators') },
    { href: '/guides', label: t('guides') },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-line paper/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1160px] px-5 sm:px-8">
        <div className="flex h-[68px] items-center justify-between gap-6">
          <Link href="/" className="shrink-0 leading-none">
            <span
              className="text-[1.375rem] font-extrabold tracking-[-0.04em]"
              style={{ color: 'var(--text)' }}
            >
              loseweight
            </span>
            <span className="text-[1.375rem] font-extrabold tracking-[-0.04em] text-brand-500">
              .net
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 mr-auto ml-4">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-[0.9375rem] font-medium transition-colors hover:text-brand-600"
                  style={{ color: active ? 'var(--color-brand-600)' : 'var(--text)' }}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-[25px] left-0 right-0 h-[2px] bg-brand-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/planner" className="btn btn-primary hidden sm:inline-flex ml-2">
              {t('planner')}
            </Link>
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:sunken ml-1"
              onClick={() => setOpen(!open)}
              aria-label={open ? t('closeMenu') : t('openMenu')}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden border-t border-line py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-1 py-3 font-medium border-b border-line last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
