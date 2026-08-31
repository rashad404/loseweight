import { Link } from '@/i18n/navigation';

export const meta = {
  title: 'Düzəlişlər',
  description:
    'Səhvləri necə bildirmək olar, tibbi düzəlişlərə nə qədər tez baxılır və dəyişikliklər səhifədə necə qeyd olunur.',
};

export default function Corrections() {
  return (
    <>
      <p>
        Düzəldilməyən yanlış sağlamlıq məlumatı real zərər verir, ona görə düzəlişlərə
        saytdakı hər şeydən əvvəl baxılır. Səhv görsəniz, yazın, düzəldəcəyik.
      </p>

      <h2>Səhvi necə bildirmək olar</h2>
      <p>
        hello@loseweight.net ünvanına yazın: səhifənin ünvanını, sizcə səhv olan cümləni və
        varsa, əks fikri təsdiqləyən mənbəni göstərin. Bunun üçün həkim olmaq lazım deyil
        və tam əmin olmağınız da vacib deyil.
      </p>

      <h2>Sonra nə olur</h2>
      <ol>
        <li>İddianı səhifədəki mənbələrlə və mövcud tövsiyələrlə tutuşdururuq.</li>
        <li>Səhvdirsə, düzəldirik. Tibbi səhvlər digər bütün işlərdən əvvəl gəlir.</li>
        <li>
          Səhifədə nəyin dəyişdiyi qeyd olunur. İddianı səssizcə düzəldib köhnə baxış
          tarixini yerində saxlamırıq.
        </li>
        <li>Fikir düzgün çıxsa, mənbə ilə birlikdə səbəbini izah edən cavab yazırıq.</li>
      </ol>

      <h2>Nə düzəliş sayılır</h2>
      <p>
        Faktiki səhv, aid olduğu iddianı dəstəkləməyən istinad, köhnəlmiş tövsiyə, səhv
        işləyən hesablama və ya mənanı dəyişən tərcümə. Vurğu və şərh fərqləri barədə də
        yaza bilərsiniz, sadəcə nəticə dəyişiklik deyil, izahat ola bilər.
      </p>

      <h2>Baxış statusu</h2>
      <p>
        Hər məqalə həkim tərəfindən yoxlanılıb-yoxlanılmadığını açıq yazır, yoxlanılmayıbsa bunu
        yuxarıda bildirir. Statusun səhv göstərildiyini düşünsəniz, bu da bildirilməyə
        dəyər. Özümüzə qoyduğumuz tələblər{' '}
        <Link href="/editorial-policy">redaksiya qaydalarındadır</Link>.
      </p>

      <h2>Nəyi edə bilmirik</h2>
      <p>
        Fərdi tibbi məsləhət verə, analizlərinizi şərh edə və ya hansısa dərmanın sizə
        uyğun olub-olmadığını deyə bilmərik. Bunlar üçün tarixçənizi bilən həkim lazımdır.
        Təcili vəziyyətdəsinizsə, bizə yazmaq əvəzinə təcili yardıma müraciət edin.
      </p>
    </>
  );
}
