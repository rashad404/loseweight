/**
 * Author records.
 *
 * Every field here is a fact the owner supplied in docs/author.md. Nothing may
 * be added that implies US licensure, board certification, obesity-medicine
 * specialisation, current practice, or independent review.
 */
export interface Author {
  slug: string;
  name: string;
  credentials: string;
  jurisdiction: string;
  usLicensed: false;
  role: Record<string, string>;
  bio: Record<string, string>;
  licensing: Record<string, string>;
}

export const AUTHORS: Record<string, Author> = {
  'rashad-mirzayev': {
    slug: 'rashad-mirzayev',
    name: 'Rashad Mirzayev',
    credentials: 'Medical degree, Azerbaijan Medical University',
    jurisdiction: 'Azerbaijan',
    usLicensed: false,
    role: {
      en: 'Founder, writer, and medical accuracy reviewer',
      az: 'Təsisçi, müəllif və tibbi dəqiqlik üzrə yoxlayıcı',
      ru: 'Основатель, автор и проверяющий на медицинскую точность',
    },
    bio: {
      en: 'Rashad Mirzayev earned his medical degree from Azerbaijan Medical University and trained and worked as a pediatrician in Azerbaijan. He currently lives in the United States. At LoseWeight.net he researches, writes, and reviews educational health content using established clinical guidelines and peer-reviewed sources.',
      az: 'Rəşad Mirzəyev Azərbaycan Tibb Universitetini bitirib, Azərbaycanda pediatr kimi təhsil alıb və işləyib. Hazırda ABŞ-da yaşayır. LoseWeight.net-də klinik protokollara və elmi jurnallarda dərc olunmuş tədqiqatlara əsaslanaraq maarifləndirici sağlamlıq materialları araşdırır, yazır və yoxlayır.',
      ru: 'Рашад Мирзаев окончил Азербайджанский медицинский университет, прошёл подготовку и работал педиатром в Азербайджане. Сейчас живёт в США. На LoseWeight.net он изучает, пишет и проверяет образовательные материалы о здоровье, опираясь на клинические рекомендации и рецензируемые исследования.',
    },
    licensing: {
      en: 'He is not licensed to practice medicine in the United States. Nothing on this site is medical advice, and it does not substitute for a clinician who knows your history.',
      az: 'ABŞ-da həkimlik fəaliyyəti üçün lisenziyası yoxdur. Bu saytdakı heç bir material tibbi məsləhət deyil və tibbi tarixçənizi bilən həkimi əvəz etmir.',
      ru: 'Он не имеет лицензии на медицинскую практику в США. Ничто на этом сайте не является медицинской рекомендацией и не заменяет врача, знающего вашу историю.',
    },
  },
};

export const authorBySlug = (slug: string) => AUTHORS[slug] ?? null;

export const authorByName = (name: string | null | undefined) =>
  name ? Object.values(AUTHORS).find((a) => a.name === name) ?? null : null;
