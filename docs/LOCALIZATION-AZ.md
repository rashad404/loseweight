# Azerbaijani localization rules

Azerbaijani copy on LoseWeight.net is written, not translated. These rules are binding.

## Method

1. Read the English text and work out what it is trying to communicate.
2. Put the English away.
3. Write what an Azerbaijani speaker would naturally say in that spot.
4. Read the Azerbaijani back on its own, without the English next to it. If the meaning
   is not immediately clear, or it sounds translated, rewrite it from scratch.

Never translate word for word. Never preserve English sentence structure or word order
when it sounds unnatural. Rewrite slogans and questions completely when a direct
translation feels artificial.

## Tone

- Warm, simple, respectful.
- Not formal, bureaucratic, or literary.
- Not Turkish-sounding. Avoid Russian and Turkish constructions unless they are also
  natural in Azerbaijani.
- Prefer language actually used in Azerbaijan over dictionary equivalents.

## Context decides the wording

Ask where the string appears before writing it: navigation label, button, heading,
explanation, error message, or call to action.

- Buttons describe the action. "Hesabla", not "Hesablamağa başlayın".
- Headings communicate the benefit or the question naturally.
- Navigation labels use terms ordinary Azerbaijani users already know, and stay short.
- Avoid awkward compound nouns invented by copying English UI terminology.

## Known bad patterns and their replacements

Apply by context, not mechanically.

| Do not use | Use instead |
| --- | --- |
| Tərəqqi izləyicisi | Çəki izləmə, or Nəticələrinizi izləyin |
| Bu, əslində nə qədər çəkəcək? | Hədəfinizə nə vaxt çata bilərsiniz? |
| Bələdçilər | Məqalələr, or Faydalı məlumatlar |
| Çəki itkisi səyahətiniz | Arıqlama prosesiniz |
| Başlamağa hazırsınız? | İndi başlaya bilərsiniz |
| Hədəflərinizi kiliddən çıxarın | Hədəfinizə doğru ilk addımı atın |
| Fərdiləşdirilmiş anlayışlar | Sizə uyğun tövsiyələr |
| Tərəqqinizi qeyd edin | Nəticələrinizi izləyin |
| Daha çox öyrənin | Ətraflı baxın, or Ətraflı oxuyun |
| Hesablamağa başlayın | Hesabla |
| Səyahətinizə başlayın | Planınızı hazırlayın |

## Medical terms

Keep established medical terminology accurate. Explain unfamiliar terms plainly the
first time they appear. Accuracy wins over simplicity where the two conflict, but the
explanation that follows should be ordinary language.

## Before publishing

- Read the Azerbaijani independently, without the English.
- Remove anything that sounds translated.
- Shorten unnecessarily formal phrases.
- Confirm terminology is consistent across the whole site. The same concept gets the
  same word everywhere.
- Check the Azerbaijani characters survived intact: ə, ı, ö, ü, ş, ç, ğ.
- Run `npm run lint:copy` in `frontend/`. It catches Cyrillic characters hiding inside
  Latin-script words, which is a common and invisible corruption.

A phrase being grammatically correct is not sufficient. It has to sound natural and
communicate clearly.

## Articles

These rules cover interface copy. Articles are not translated at all: each guide is
written in one language and shown only to readers of that language. See
[EDITORIAL.md](EDITORIAL.md).
