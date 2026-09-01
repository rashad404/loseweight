'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Check, RotateCcw, X } from 'lucide-react';
import type { WeeklyPlan } from '@/lib/routine/models';
import {
  loadDay, loadDays, loadWeekly, saveDay, type DayRecord,
} from '@/lib/plan/storage';

const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

/**
 * The page for the day you are actually in.
 *
 * It shows only what this day asks of you: the accepted changes, your own foods
 * to choose between, and the two things that end most attempts, eating out and
 * getting hungry. No totals to hit, no diary to fill in.
 *
 * Marking a day is deliberately three-state. Silence has to mean "not answered"
 * rather than "failed", or the adjustment engine later reads an unopened app as
 * evidence the plan is not working.
 */
export default function Today() {
  const t = useTranslations('today');
  const tc = useTranslations();

  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [day, setDay] = useState<DayRecord | null>(null);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPlan(loadWeekly());
    setDay(loadDay(isoDate()));
    setHistory(loadDays());
    setReady(true);
  }, []);

  const accepted = useMemo(
    () => plan?.changes.filter((c) => c.accepted) ?? [],
    [plan],
  );

  if (!ready) return null;

  if (!plan || accepted.length === 0) {
    return (
      <div className="panel p-6 max-w-prose">
        <p className="text-[0.9375rem]">{t('noPlan')}</p>
        <Link href="/onboarding" className="btn btn-primary mt-4">
          {t('startPlan')}
        </Link>
      </div>
    );
  }

  const record = day ?? { date: isoDate(), followed: [], skipped: [], usedFlexibleMeal: false };

  const update = (next: DayRecord) => {
    setDay(next);
    saveDay(next);
    setHistory(loadDays());
  };

  const mark = (id: string, state: 'done' | 'skip' | 'clear') =>
    update({
      ...record,
      followed: state === 'done'
        ? [...new Set([...record.followed, id])]
        : record.followed.filter((x) => x !== id),
      skipped: state === 'skip'
        ? [...new Set([...record.skipped, id])]
        : record.skipped.filter((x) => x !== id),
    });

  // Only days the person actually answered count. An unopened day is unknown,
  // not a miss.
  const answered = history.filter((d) => d.followed.length + d.skipped.length > 0);
  const fullyFollowed = answered.filter((d) => accepted.every((c) => d.followed.includes(c.id)));

  return (
    <div>
      <h1 className="t-h1">{t('title')}</h1>
      <p className="t-lead mt-2">{t('weekOf', { n: plan.weekNumber })}</p>

      <section className="mt-8">
        <h2 className="t-h3">{t('changesTitle')}</h2>
        <ul className="mt-4 space-y-3">
          {accepted.map((change) => {
            const done = record.followed.includes(change.id);
            const skipped = record.skipped.includes(change.id);

            return (
              <li key={change.id} className="panel p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{tc(change.title, change.params)}</p>
                  {(done || skipped) && (
                    <p className="mt-1 text-[0.8125rem] text-muted">
                      {done ? t('done') : t('skipped')}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 shrink-0">
                  {done || skipped ? (
                    <button
                      type="button"
                      onClick={() => mark(change.id, 'clear')}
                      className="btn btn-ghost btn-sm"
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                      {t('undo')}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => mark(change.id, 'done')}
                        className="btn btn-primary btn-sm"
                      >
                        <Check size={14} aria-hidden="true" />
                        {t('markDone')}
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(change.id, 'skip')}
                        className="btn btn-ghost btn-sm"
                      >
                        <X size={14} aria-hidden="true" />
                        {t('skip')}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-[0.8125rem] text-muted max-w-prose">{t('noJudgement')}</p>

        {answered.length > 0 && (
          <p className="mt-2 text-[0.8125rem] text-muted">
            {t('streak', { done: fullyFollowed.length, total: answered.length })}
          </p>
        )}
      </section>

      {plan.templates.length > 0 && (
        <section className="mt-9">
          <h2 className="t-h3">{t('eatTitle')}</h2>
          <p className="mt-1 text-[0.9375rem] text-muted max-w-prose">{t('eatIntro')}</p>

          <ul className="mt-4 space-y-3">
            {plan.templates.map((template) => (
              <li key={template.slot} className="panel p-4">
                <p className="field-label">{t(`slot.${template.slot}`)}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {template.options.map((option) => (
                    <li
                      key={option}
                      className="text-[0.8125rem] px-2.5 py-1.5 rounded-lg border border-line"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-9 grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="t-h4">{t('outTitle')}</h2>
          <ul className="mt-2 space-y-2 text-[0.9375rem] text-muted">
            {plan.eatingOutRules.map((key) => <li key={key}>{tc(key)}</li>)}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="t-h4">{t('hungerTitle')}</h2>
          <ul className="mt-2 space-y-2 text-[0.9375rem] text-muted">
            {plan.hungerRescue.map((key) => <li key={key}>{tc(key)}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-4 panel p-5">
        <h2 className="t-h4">{t('flexTitle')}</h2>
        <p className="mt-2 text-[0.9375rem] text-muted max-w-prose">{tc(plan.flexibleMeal)}</p>

        {record.usedFlexibleMeal ? (
          <p className="mt-3 text-[0.8125rem] text-brand-800 font-medium">{t('flexUsed')}</p>
        ) : (
          <button
            type="button"
            onClick={() => update({ ...record, usedFlexibleMeal: true })}
            className="btn btn-ghost btn-sm mt-3"
          >
            {t('flexUse')}
          </button>
        )}
      </section>
    </div>
  );
}
