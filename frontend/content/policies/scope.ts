/**
 * The canonical scope statement.
 *
 * Every policy page, the onboarding consent, and the product copy render this
 * same text. Keeping one source prevents the drift that produced the earlier
 * contradiction, where the site advertised clinician-reviewed guides while every
 * article said the review had not happened.
 */
export const SCOPE = {
  en: {
    statement:
      'LoseWeight.net provides personalized educational guidance about food choices, portions, activity, habits, and weight-management planning. This is general wellness guidance, not medical care, diagnosis, or treatment. The service does not establish a physician-patient relationship.',
    providesTitle: 'What the service does',
    provides: [
      'Suggests changes to how you already eat, rather than replacing your diet.',
      'Sets calorie, protein, and fiber ranges from published equations.',
      'Adjusts the plan from your own weigh-ins over time.',
      'Explains why each change was chosen.',
    ],
    excludesTitle: 'What it will not do',
    excludes: [
      'Diagnose you, or interpret symptoms as a diagnosis.',
      'Treat disease, or provide a therapeutic diet for a diagnosed condition without your clinician involved.',
      'Recommend medications or supplements, or suggest a dose for either.',
      'Contradict advice your own clinician has given you.',
      'Help with a medical emergency.',
      'Produce a personalized plan for anyone under 18, during pregnancy or breastfeeding, or for anyone with an active or suspected eating disorder.',
    ],
    blockedNote:
      'If one of those situations applies to you, the calculators and guides remain available, but we will not generate a personalized plan. That is a deliberate limit, not an oversight.',
  },
  az: {
    statement:
      'LoseWeight.net qida seçimi, porsiyalar, hərəkət, vərdişlər və çəki idarəetməsi ilə bağlı fərdiləşdirilmiş maarifləndirici tövsiyələr verir. Bu, ümumi sağlamlıq tövsiyəsidir: tibbi xidmət, diaqnoz və ya müalicə deyil. Xidmətdən istifadə həkim-xəstə münasibəti yaratmır.',
    providesTitle: 'Xidmət nə edir',
    provides: [
      'Pəhrizinizi tamamilə dəyişmək əvəzinə, artıq necə yediyinizə düzəlişlər təklif edir.',
      'Dərc olunmuş düsturlara əsasən kalori, zülal və lif aralıqlarını müəyyən edir.',
      'Zamanla sizin öz ölçmələrinizə görə planı uyğunlaşdırır.',
      'Hər dəyişikliyin niyə seçildiyini izah edir.',
    ],
    excludesTitle: 'Xidmət nə etmir',
    excludes: [
      'Diaqnoz qoymur və simptomları diaqnoz kimi şərh etmir.',
      'Xəstəlik müalicə etmir və həkiminiz cəlb olunmadan diaqnoz qoyulmuş xəstəlik üçün müalicəvi pəhriz vermir.',
      'Dərman və ya qida əlavəsi tövsiyə etmir, doza təyin etmir.',
      'Öz həkiminizin verdiyi tövsiyəyə zidd getmir.',
      'Təcili tibbi hallarda kömək etmir.',
      '18 yaşdan kiçiklər üçün, hamiləlik və süd vermə dövründə, habelə qidalanma pozğunluğu olan və ya şübhə edilən şəxslər üçün fərdi plan hazırlamır.',
    ],
    blockedNote:
      'Bu hallardan biri sizə aiddirsə, kalkulyatorlar və məqalələr açıq qalır, lakin fərdi plan hazırlamırıq. Bu, nəzərdən qaçmış məsələ deyil, qəsdən qoyulmuş həddir.',
  },
  ru: {
    statement:
      'LoseWeight.net даёт персонализированные образовательные рекомендации по выбору продуктов, размерам порций, активности, привычкам и планированию снижения веса. Это общие рекомендации по здоровому образу жизни, а не медицинская помощь, диагноз или лечение. Пользование сервисом не создаёт отношений врача и пациента.',
    providesTitle: 'Что сервис делает',
    provides: [
      'Предлагает изменения к тому, как вы уже едите, а не заменяет ваш рацион.',
      'Задаёт диапазоны калорий, белка и клетчатки по опубликованным формулам.',
      'Со временем корректирует план по вашим собственным взвешиваниям.',
      'Объясняет, почему выбрано каждое изменение.',
    ],
    excludesTitle: 'Чего он не делает',
    excludes: [
      'Не ставит диагноз и не трактует симптомы как диагноз.',
      'Не лечит заболевания и не назначает лечебную диету при установленном диагнозе без участия вашего врача.',
      'Не рекомендует лекарства и добавки и не подбирает дозы.',
      'Не противоречит рекомендациям вашего врача.',
      'Не помогает при неотложных состояниях.',
      'Не составляет персональный план для лиц младше 18 лет, во время беременности и грудного вскармливания, а также при активном или предполагаемом расстройстве пищевого поведения.',
    ],
    blockedNote:
      'Если что-то из этого относится к вам, калькуляторы и статьи остаются доступны, но персональный план мы не составим. Это осознанное ограничение, а не недоработка.',
  },
} as const;

export type ScopeLocale = keyof typeof SCOPE;
export const scopeFor = (lang: string) => SCOPE[(lang as ScopeLocale)] ?? SCOPE.en;
