import { Link } from '@/i18n/navigation';

export const meta = {
  title: 'Sayt haqqında',
  description:
    'LoseWeight.net-i kim aparır, planlayıcı nəyə görə hər həftə yenidən hesablayır, məqalələr necə yazılır və sayt necə maliyyələşir.',
};

export default function About() {
  return (
    <>
      <p>
        LoseWeight.net pulsuz arıqlama kalkulyatorları və məqalələr toplusudur. Saytın
        əsas hissəsi planlayıcıdır: məlumatlarınızı yazırsınız, gündəlik kalori normanızı,
        real tarixi və bunun arxasındakı həftəlik hesablamanı görürsünüz. Rəqəmlər açıq
        göstərilir ki, özünüz yoxlaya biləsiniz.
      </p>

      <h2>Sayt nəyə görə var</h2>
      <p>
        Əksər arıqlama kalkulyatorları itirmək istədiyiniz çəkini sabit həftəlik sürətə
        bölür. Bu isə bədəninizin həm 90 kq-da, həm də 75 kq-da eyni enerji yandırdığını
        güman edir. Belə deyil. Çəkiniz azaldıqca gündəlik sərfiyyatınız da azalır, eyni
        qidalanma daha kiçik defisit yaradır və proses ləngiyir.
      </p>
      <p>
        Bunu nəzərə almayan kalkulyator real olmayan tarix göstərə bilər. Həmin tarixə
        çatmamaq isə insanların rejimi yarımçıq qoymasının ən çox rast gəlinən
        səbəblərindəndir. Buradakı bütün proqnozlar çəki dəyişdikcə sərfiyyatı yenidən
        hesablayır və maddələr mübadiləsinin uyğunlaşmasını da müəyyən qədər nəzərə alır.
        Fərqi öz rəqəmlərinizlə müqayisə edə bilərsiniz.
      </p>

      <h2>Burada nə etmirik</h2>
      <ul>
        <li>Diaqnoz qoymuruq və fərdi tibbi məsləhət vermirik.</li>
        <li>Dərman tövsiyə etmirik, satmırıq və aptek saytlarına keçid vermirik.</li>
        <li>Ölçülərinizi saxlamırıq. Hesablamalar brauzerinizdə aparılır.</li>
        <li>Konkret nə qədər və nə sürətlə arıqlayacağınıza zəmanət vermirik.</li>
      </ul>

      <h2>Məqalələr necə yazılır</h2>
      <p>
        Məqalələr maşınla tərcümə olunmur, hər dil üçün ayrıca yazılır. Azərbaycan dilində
        yazılmış məqalə yalnız saytın Azərbaycan versiyasında görünür. Səbəb sadədir: heç
        kimin yenidən yoxlamadığı tərcümə edilmiş tibbi iddia ümumiyyətlə olmayan
        məqalədən daha pisdir.
      </p>
      <p>
        Hər məqalənin mənbələri göstərilir və hər məqalə həkim tərəfindən yoxlanılıb-yoxlanılmadığını
        açıq yazır. Baxış hələ olmayıbsa, səhifə bunu yuxarıda bildirir, olmayan təsdiqi
        varmış kimi göstərmir. Tam qaydalar{' '}
        <Link href="/editorial-policy">redaksiya qaydaları</Link> səhifəsindədir.
      </p>

      <h2>Saytı kim yazır</h2>
      <p>
        LoseWeight.net-i Rəşad Mirzəyev yazır və yoxlayır. O, Azərbaycan Tibb
        Universitetini bitirib, Azərbaycanda pediatr kimi təhsil alıb və işləyib. Hazırda
        ABŞ-da yaşayır və orada həkimlik fəaliyyəti üçün lisenziyası yoxdur.
      </p>
      <p>
        Müəllif və yoxlayıcı eyni şəxs olduğu üçün məqalələrdə &quot;yazılıb və tibbi
        dəqiqliyi yoxlanılıb&quot; yazılır, &quot;müstəqil yoxlanılıb&quot; yox. İkinci
        həkim tərəfindən müstəqil yoxlama hazırda prosesin bir hissəsi deyil və hər səhifə
        vəziyyəti olduğu kimi göstərir. Ətraflı məlumat və məqalələrin siyahısı{' '}
        <Link href="/authors/rashad-mirzayev">müəllif səhifəsindədir</Link>.
      </p>

      <h2>Sayt necə maliyyələşir</h2>
      <p>
        Alətlər pulsuzdur və pulsuz qalacaq. Saytda reklam, tərəfdaş keçidi və ya ödənişli
        məhsul olarsa, bu, yerləşdiyi səhifədə açıq bildirilir. Kommersiya münasibətləri
        heç vaxt hansısa müalicənin necə təsvir olunmasına və ya sıralanmasına təsir etmir.
      </p>

      <h2>Əlaqə</h2>
      <p>
        Xüsusilə tibbi məsələlərdə düzəlişlərinizi gözləyirik.{' '}
        <Link href="/contact">Əlaqə səhifəsinə</Link> baxın.
      </p>
    </>
  );
}
