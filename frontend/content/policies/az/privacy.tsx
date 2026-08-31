export const meta = {
  title: 'Məxfilik',
  description:
    'Hesablamalar brauzerinizdə aparılır və ölçüləriniz bizə çatmır. Abunə olsanız və ya hesab açsanız nə saxlanılır və necə silinir.',
};

export default function Privacy() {
  return (
    <>
      <p>
        Qısaca: kalkulyatorlar brauzerinizdə işləyir və yazdıqlarınız bizə gəlmir.
        E-poçt ünvanınızı yalnız özünüz verdiyiniz halda saxlayırıq.
      </p>

      <h2>Ölçüləriniz</h2>
      <p>
        Yaş, boy, çəki, bel, hədəf çəki və aktivlik səviyyəsi tam olaraq brauzerinizdə
        emal olunur. Bu məlumatlar serverlərimizə göndərilmir və biz onları görə bilmirik.
      </p>
      <p>
        İzləyicidəki ölçmələr istifadə etdiyiniz cihazın brauzer yaddaşında saxlanılır.
        Sayt məlumatlarını silsəniz, onlar da silinir. Ona görə vaxtaşırı CSV faylı
        yükləyib saxlamağı məsləhət görürük: hazırda hesab və bulud sinxronizasiyası yoxdur.
      </p>

      <h2>E-poçt</h2>
      <p>
        Abunə olsanız, e-poçt ünvanınızı, hansı dildə abunə olduğunuzu və hansı səhifədən
        abunə olduğunuzu saxlayırıq. Bunu yeni məqalə və kalkulyatorlar barədə yazmaq üçün
        istifadə edirik. Siyahını satmırıq və kirayə vermirik.
      </p>
      <p>
        Hazırda təsdiq məktubu göndərilmir, çünki poçt sistemi hələ qurulmayıb. Bu
        dəyişəndə səhifədə yazacağıq.
      </p>

      <h2>Qida təsvirləri və süni intellektlə emal</h2>
      <p>
        Adətən necə qidalandığınızı yazsanız, həmin mətn struktur şəklində yemək və məhsul
        siyahısına çevrilmək üçün süni intellekt provayderinə göndərilir. Bu, ilk dəfə baş
        verməzdən əvvəl razılığınızı soruşuruq. İmtina edib eyni məlumatı özünüz də daxil
        edə bilərsiniz.
      </p>
      <p>
        Yalnız qida mətnini göndəririk. Adınız, e-poçtunuz və çəki ölçmələriniz daxil
        edilmir. Provayder mətni struktur məlumat qaytarmaq üçün emal edir, modelin
        öyrədilməsində istifadəyə icazə vermirik. Siz nəticəni təsdiqlədikdən sonra biz xam
        mətni yox, struktur nəticəni saxlayırıq və onu digər məlumatlarınızla birlikdə silə
        bilərsiniz.
      </p>

      <h2>Analitika və reklam</h2>
      <p>
        Analitika və ya reklam əlavə etsək, bu səhifədə hansı xidmət olduğunu, nə
        topladığını və necə imtina edə biləcəyinizi işə salmazdan əvvəl yazacağıq. Aşağıda
        göstərilən tarixə hər ikisi saytda yoxdur.
      </p>

      <h2>Hüquqlarınız</h2>
      <p>
        Sizin haqqınızda nə saxladığımızı soruşa, nüsxəsini tələb edə və silinməsini istəyə
        bilərsiniz. Əlaqə səhifəsindəki ünvana yazın, 30 gün ərzində cavab verəcəyik.
      </p>

      <h2>Dəyişikliklər</h2>
      <p>
        Bu qaydalar topladığımız məlumata təsir edəcək şəkildə dəyişsə, bunu burada
        yazacağıq və tarixini göstərəcəyik.
      </p>
    </>
  );
}
