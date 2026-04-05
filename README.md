# GitHub Pages Oyun Link Sayfasi

Bu proje, Instagram reklamlarindan gelen kullanicilari tek bir ara sayfada karsilayip Google Play sayfaniza yonlendirmek icin hazirlandi.

## Neden bu yapi?

- Build gerektirmez: GitHub Pages uzerine dogrudan atip yayinlayabilirsiniz.
- Hizlidir: Sadece statik `HTML`, `CSS` ve `JavaScript` kullanir.
- Kolay ozellestirilir: Icerigin cogu [`config.js`](./config.js) icinde tutulur.
- Daha guvenli bir varsayilanla gelir: Sadece `https` baglantilarina izin verir, CSP kullanir ve gereksiz ucuncu taraf kutuphane barindirmaz.

## Duzenlemeniz gereken yerler

1. [`config.js`](./config.js) dosyasindaki `socialHandle`, `description` ve `links` alanlarini kendi oyununuza gore degistirin.
2. Ana butondaki `https://play.google.com/store/apps/details?id=com.example.game` adresini kendi Google Play linkinizle degistirin.
3. Poster arka planini degistirmek isterseniz [`assets/game-poster.webp`](./assets/game-poster.webp) dosyasini degistirin veya `posterImagePath` alanini guncelleyin.
4. Profil ikonunu degistirmek isterseniz [`assets/game-icon.webp`](./assets/game-icon.webp) dosyasini degistirin veya `heroImagePath` alanini guncelleyin.
5. Analytics istiyorsaniz [`config.js`](./config.js) icindeki:

```js
analytics: {
  enabled: true,
  measurementId: "G-XXXXXXXXXX"
}
```

degerlerini kendi Google Analytics 4 olcum kimliginizle doldurun.

## GitHub Pages yayinlama

1. Bu klasoru bir GitHub reposuna yukleyin.
2. GitHub uzerinde `Settings > Pages` kismina gidin.
3. `Deploy from a branch` secin.
4. Branch olarak `main` ve klasor olarak `/root` secin.
5. Bir iki dakika sonra sayfaniz `https://kullaniciadi.github.io/repo-adi/` benzeri adreste yayinda olur.

## Google Analytics notu

Tiklama ve sayfa goruntuleme olcumleri eklendi. Reklam hedeflediginiz ulkeye gore cerez/onay metni ihtiyaci dogabilir; yayinlamadan once kendi hukuki gereksinimlerinizi kontrol etmeniz iyi olur.
