import ScopeStatement from '@/components/ui/ScopeStatement';

export const meta = {
  title: 'Tibbi xəbərdarlıq',
  description:
    'LoseWeight.net ümumi məlumat verir, tibbi məsləhət yox. Başlamazdan əvvəl nə vaxt həkimlə danışmalı, nə vaxt təcili yardıma müraciət etməli və kalkulyatorların hüdudları nədir.',
};

export default function MedicalDisclaimer() {
  return (
    <>
      <ScopeStatement lang="az" />

      <h2>Kalkulyatorlar təxmindir</h2>
      <p>
        Buradakı düsturlar geniş qruplar üzrə orta göstəricilərə əsaslanır. Maddələr
        mübadiləsini hesablayan düsturlar insanların təxminən üçdə ikisində ölçülmüş
        nəticəyə 10% yaxınlıqda düşür, qalanlarında isə fərq daha böyük olur. Ona görə
        buradakı hər rəqəmi öz məlumatlarınızla yoxlanacaq başlanğıc nöqtəsi sayın, sizi
        ölçən nəticə kimi yox.
      </p>

      <h2>Aşağıdakılardan biri sizə aiddirsə, əvvəlcə həkimlə danışın</h2>
      <ul>
        <li>Hamiləsiniz və ya süd verirsiniz.</li>
        <li>18 yaşdan kiçik və ya 65 yaşdan böyüksünüz.</li>
        <li>Şəkərli diabet, böyrək, qaraciyər və ya ürək xəstəliyiniz var.</li>
        <li>
          Keçmişdə qidalanma pozğunluğu olub, yaxud kalori sayma əvvəllər psixoloji
          vəziyyətinizə mənfi təsir edib.
        </li>
        <li>
          Dozası çəkidən və ya qida qəbulundan asılı olan dərman qəbul edirsiniz: insulin,
          varfarin, qalxanabənzər vəz hormonu, litium və s.
        </li>
        <li>Bariatrik əməliyyat keçirmisiniz.</li>
        <li>Səbəbsiz, öz-özünə çəki itirirsiniz.</li>
      </ul>

      <h2>Bu hallarda təcili yardıma müraciət edin</h2>
      <ul>
        <li>Sinə ağrısı, güclü təngnəfəslik və ya huşitirmə.</li>
        <li>Davamlı qusma, maye qəbul edə bilməmək.</li>
        <li>Qida məhdudiyyəti fonunda huşun bulanması, ciddi zəiflik, ürəkdöyünmə.</li>
        <li>Özünə zərər vermə fikirləri.</li>
      </ul>

      <h2>Dərmanlar</h2>
      <p>
        Saytdakı səhifələr dərman qruplarını ümumi şəkildə təsvir edir və dərc olunmuş
        tədqiqat nəticələrini yekunlaşdırır. Bu, maarifləndirmədir, tövsiyə deyil. Hansısa
        dərmanın məhz sizə uyğun olduğunu demirik və doza tənzimləmirik. Belə qərarları
        yalnız tibbi tarixçənizi bilən həkim verə bilər.
      </p>

      <h2>Ölkələr arasında fərq</h2>
      <p>
        Dərmanların qeydiyyatı, müalicə hüdudları və mövcud preparatlar ölkədən ölkəyə
        dəyişir. Buradakı məlumat ümumidir və yaşadığınız ölkədəki qaydalara tam uyğun
        gəlməyə bilər. Məqalə həkim baxışından keçibsə, həmin həkimin hansı ölkədə təhsil
        aldığı və işlədiyi səhifədə göstərilir.
      </p>

      <h2>Dəqiqlik və düzəlişlər</h2>
      <p>
        Səhifələri aktual saxlamağa və ilkin mənbələrə istinad etməyə çalışırıq. Tibb
        dəyişir, səhvlər də olur. Səhv görsəniz, bizə yazın: düzəldirik və dəyişikliyi
        səhifədə qeyd edirik.
      </p>
    </>
  );
}
