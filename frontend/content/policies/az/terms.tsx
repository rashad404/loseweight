import { Link } from '@/i18n/navigation';

export const meta = {
  title: 'İstifadə şərtləri',
  description:
    'LoseWeight.net-dən istifadə şərtləri: kalkulyatorların nə olduğu və nə olmadığı, məsuliyyət hüdudları, saxlanan planlar və məzmundan istifadə qaydaları.',
};

export default function Terms() {
  return (
    <>
      <p>
        LoseWeight.net-dən istifadə etməklə bu şərtləri qəbul edirsiniz. Şərtlər qəsdən
        qısadır. Hər hansı bənd sizə uyğun gəlmirsə, saytdan istifadə etməyin.
      </p>

      <h2>Bu sayt nədir</h2>
      <p>
        Arıqlama ilə bağlı pulsuz kalkulyatorlar və məqalələr toplusu. Kalkulyatorlar
        yazdığınız rəqəmlərə dərc olunmuş düsturları tətbiq edir. Nəticələr geniş qruplar
        üzrə orta göstəricilərə əsaslanan təxminlərdir və ayrıca bir insan üçün ciddi
        şəkildə yanıla bilər.
      </p>
      <p>
        Burada tibbi məsləhət, diaqnoz və ya müalicə planı yoxdur, saytdan istifadə
        həkim-xəstə münasibəti yaratmır.{' '}
        <Link href="/medical-disclaimer">Tibbi xəbərdarlıq</Link> səhifəsi bu şərtlərin
        tərkib hissəsidir.
      </p>

      <h2>Sizin məsuliyyətiniz</h2>
      <p>
        Nəticələrlə nə edəcəyinizə siz qərar verirsiniz. Qidalanmanızı, hərəkət rejiminizi
        və ya dərman qəbulunuzu dəyişməzdən əvvəl tibbi tarixçənizi bilən həkimlə
        məsləhətləşin, xüsusilə tibbi xəbərdarlıq səhifəsindəki hallardan biri sizə aiddirsə.
      </p>

      <h2>Hesab və saxlanan məlumat</h2>
      <p>
        Hesab yaratmaq məcburi deyil. Planı və ya ölçmələri saxlasanız, bu məlumat
        hesabınıza bağlanır və istədiyiniz vaxt silə bilərsiniz. Xidmətə hücum, kütləvi
        məlumat yığımı və ya işinə maneə üçün istifadə olunan hesabı bağlaya bilərik. Nə
        saxlandığı <Link href="/privacy">məxfilik siyasətində</Link> yazılıb.
      </p>

      <h2>Əlçatanlıq</h2>
      <p>
        Sayt olduğu kimi təqdim olunur. Fasiləsiz və səhvsiz işləyəcəyinə zəmanət vermirik,
        bölmələri dəyişə və ya çıxara bilərik. Səhv aşkarladıqda düzəldirik və dəyişikliyi
        səhifədə qeyd edirik.
      </p>

      <h2>Məsuliyyət hüdudları</h2>
      <p>
        Qanunun icazə verdiyi həddə, saytdan istifadə və ya məzmuna əsaslanma nəticəsində
        yaranan zərərə görə məsuliyyət daşımırıq. Qanunla məhdudlaşdırıla bilməyən
        məsuliyyət, o cümlədən səhlənkarlıq nəticəsində sağlamlığa dəyən zərər buraya aid
        deyil.
      </p>

      <h2>Məzmun və istifadə</h2>
      <p>
        Mətnlər, kalkulyatorlar və dizayn bizə məxsusdur. Mənbəyə keçid verməklə qısa
        hissəni sitat gətirə bilərsiniz. Məqalələrin tam şəkildə yenidən dərc edilməsi və
        kalkulyatorların kopyalanması yazılı icazə olmadan qadağandır. İstinad edilən
        tədqiqatlar öz naşirlərinə aiddir.
      </p>

      <h2>Dəyişikliklər</h2>
      <p>
        Şərtlər sizə təsir edəcək şəkildə dəyişsə, bunu bu səhifədə yazacağıq və tarixini
        göstərəcəyik. Suallar üçün <Link href="/contact">əlaqə səhifəsi</Link>.
      </p>
    </>
  );
}
