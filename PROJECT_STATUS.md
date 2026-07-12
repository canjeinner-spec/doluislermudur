# ASTERA — Proje Durumu

> Senkron izleme partisi uygulaması (Rave benzeri). React Native + Expo + TypeScript.
> Bu dosya "A'dan Z'ye ne yaptık, ne kaldı" özetidir. Son güncelleme: 2026-07-12.

---

## 1. Ürün özeti

ASTERA, birden fazla kişinin **aynı içeriği eş zamanlı** izlediği bir "watch party" uygulaması.
Host içeriği bir platformda (YouTube / Netflix / Prime / Google Drive) başlatır; odaya
katılanlar aynı anı, aynı yerden izler. Sohbet, davet, kick/ban, profil ve izleme
istatistikleri var.

- **Dil / ton:** Türkçe arayüz, Apple HIG cilası, koyu tema, sıcak bakır/amber vurgu.
- **Kimlik:** Anonim başlama ("Başlayalım") + e-posta/şifre ile kalıcı hesaba yükseltme.

---

## 2. Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Uygulama | Expo SDK 54, React Native 0.81, React 19, New Architecture (Fabric), Hermes |
| Navigasyon | React Navigation native-stack v7 |
| Backend | Supabase (Auth, Postgres, RLS, Realtime, RPC) |
| Senkron | Supabase Realtime **Broadcast** (host-otoriter) + `postgres_changes` (chat/roster) |
| Oynatıcı | react-native-youtube-iframe (patch-package ile play/mute), react-native-webview |
| Medya | expo-image-picker (profil fotoğrafı) + Supabase Storage |
| Animasyon | react-native-reanimated, react-native-gesture-handler |

Backend `isBackendConfigured` arkasında; yapılandırılmadıysa mock veriye düşer.

---

## 3. Ekranlar (`src/screens`)

- **OnboardingScreen** — karşılama, "Başlayalım" (anonim giriş).
- **HomeScreen** — oda listesi (canlı), bilgi + profil ikonları, ASTERA wordmark (R ters).
  Anonim kullanıcı profile basınca giriş kapısı (AuthGateModal).
- **LoginScreen** — e-posta → (kayıtlı mı?) → şifre / kayıt. Odadan gelindiyse girişten
  sonra **aynı odaya yeni hesapla** geri döner.
- **CreateRoomScreen** — oda taslağı (public/private).
- **PlatformSelectScreen** — platform seç (SVG sembol logolar, şeffaf, `>` chevron).
- **WebViewLoginScreen** — platformun kendi sayfasında giriş + içerik başlatma; og:image/
  og:title ile başlık & kapak yakalama; oda burada oluşturulur.
- **RoomScreen** — oynatıcı + senkron + sohbet + katılımcılar + davet + kick.
- **ProfileScreen** — gerçek profil (avatar, ad, @handle, üyelik, geçirilen süre, kurulan oda).
- **ProfileEditScreen** — görünen ad, @kullanıcı adı (7 günde bir), çıkış yap, hesabı sil.
- **room/** — `ChatView`, `UsersPanel`, `usePlaybackSync` (senkron çekirdeği).
- **sheets/** — davet & platform alt sayfaları.

---

## 4. Backend (`src/backend`) ve SQL

- **auth.ts** — `emailExists`, `signIn`, `register` (anonim→kalıcı yükseltme + sağlam profil),
  `setHandle` (7 gün cooldown), `signOut`, `deleteAccount`, `updateDisplayName`, `uploadAvatar`
  (galeriden foto → Storage → `avatar_url`), `fetchMyProfile`.
- **rooms.ts** — `createRoom`, `joinRoom`, `leaveRoom(roomId, userId?)`, `currentUserId`,
  `updateRoomContent`, `kickMember`, `inviteByHandle`, `addWatchMinutes`, `fetch*`,
  `sendMessage`, `subscribe*` (postgres_changes kanalları benzersiz suffix'li), `thumbnailFor`.
- **hooks.ts** — `useRooms`, `useRoomSession` (join/leave + roster + katıldığı uid'i saklar),
  `useMyProfile`, `useMyId`, `useAuth`.

### SQL şeması ve migration'lar (`supabase/`)
- `schema.sql` — profiles, rooms, room_members, room_bans, messages + RLS + trigger'lar
  (üye sayısı, host devri, boş oda otomatik silme).
- `002_hide_banned_rooms.sql` — banlı oda listede görünmez.
- `003_auth.sql` — `email_exists`, `set_handle` (7 gün), `handle_updated_at`.
- `004_room_thumbnail.sql` — `thumbnail_url` kolonu.
- `005_profile.sql` — `bump_rooms_hosted` trigger, `delete_account` RPC.
- `006_watch_time.sql` — `add_watch_minutes` RPC.
- `007_avatar_upload.sql` — `profiles.avatar_url` kolonu + public `avatars` Storage bucket'ı
  + storage RLS (herkes okur, kullanıcı yalnızca kendi klasörüne yazar).
- `008_realtime_profiles.sql` — `profiles` tablosunu `supabase_realtime` publication'ına ekler
  (profil düzenlemeleri odadaki roster/sohbete anlık aksın).

> ⚠️ **Yapılacak:** 002–006 migration'larının Supabase SQL editöründe çalıştırıldığından
> emin ol. E-posta onayı (confirm mail) **kapalı** olmalı (doğrulandı).

---

## 5. Biten özellikler ✅

- Anonim başlama + e-posta/şifre giriş & kayıt; anonim→kalıcı hesap yükseltme.
- Anonim kullanıcı için etkileşim kapısı (AuthGateModal), Android'de buton dokunuşları düzeltildi
  (GestureHandlerRootView).
- Oda oluşturma → platform seç → WebView'de içerik başlat → oda aç.
- Canlı oda listesi: gerçek video başlığı + kapak (oEmbed / og:image), boyuta göre sıralama.
- **Host-otoriter senkron:** heartbeat + drift düzeltme + katılırken anlık iste/cevapla.
  Host değilse controller kapalı (sadece izler).
- Sohbet: gerçek zamanlı, efemeral (geç gelen/çıkıp giren için temizlenmiş başlar).
- Kick + ban + davet (@handle ile) + banlı kullanıcı tekrar giremez.
- Profil: DB'den gerçek veriler; düzenleme (ad, @handle 7 gün kilidi).
- **Profil fotoğrafı yükleme** — galeriden seç (expo-image-picker) → Supabase Storage `avatars`
  bucket'ına yükle → `avatar_url` profile yaz; avatar her yerde resmi gösterir.
- **Çıkış Yap + Hesabı Sil**, düzenleme ekranından alınıp Profil'de "HIZLI İŞLEMLER"e taşındı;
  düzenleme ekranı artık foto + ad + @handle + Kaydet/İptal odaklı.
- **Avatar her yerde:** sohbet baloncukları ve kullanıcı listesi gerçek profil fotoğrafını gösterir.
- **Canlı profil senkronu:** bir üye adını/fotoğrafını değiştirince odadaki roster ve sohbet
  (o üyenin geçmiş mesajları dahil) anında güncellenir (`subscribeProfiles`).
- **Kazara oda çıkışı engellendi:** kaydırma jesti kapalı; çıkış yalnızca sol üst X ile ve
  "emin misin?" onayıyla (Android donanım geri tuşu da onaydan geçer; kick istisna).
- **Kayıt/giriş e-posta kısıtı:** yalnızca bilinen sağlayıcılar (Gmail, Outlook, iCloud, Yahoo,
  Proton, Yandex…) — `emailPolicy.ts`, saçma/rastgele domainler engellenir.
- **Oda üst bar (Rave tarzı):** sade büyük iconlar (cam/gri arka plan yok), ortada ASTERA
  wordmark (tam ortalı), sol grupta X + arama(=içeriği değiştir, host'a özel), sağda davet +
  kullanıcılar (sayı rozeti yok). Alttaki "Değiştir" kaldırıldı; wordmark ortak `Wordmark` bileşeni.
- **İlk açılış teşekkür ekranı** (`WelcomeScreen`): uzun mesafe/arkadaşlar için kişisel not +
  Instagram @ardaowskix; yalnızca ilk açılışta, Onboarding'den önce.
- **Bilgilendirme (About) sadeleştirildi:** kısa tanıtım + büyüme notu + Instagram @ardaowskix + teşekkür.
- **Co-watching giriş kapısı:** oynatıcıda platform giriş kapısı çıkınca ham WebView yerine "Oturum aç"
  butonu → `WebViewLogin` loginOnly → dönünce oynatıcı paylaşılan çerezle yeniden yüklenir.
- **Oda re-entry çökmesi düzeltildi:** presence kanalı (stabil topic) eski kanalı temizlemeden yeniden
  açılınca "cannot add presence callbacks after subscribe()" patlıyordu → artık eski kanal önce kapatılıyor.
- **EAS build + dev client workflow** kuruldu (bkz. §8) — buluttan PC'siz build; JS değişikliği anında.
- **Sohbette katılım bildirimleri:** biri odaya girince/çıkınca/atılınca sohbete "{ad} katıldı /
  ayrıldı / atıldı" sistem satırı (avatarıyla) düşer. **Supabase Realtime Presence** ile üretilir
  (`openRoomPresence`) — anlık, iOS+Android'de aynı, sınırsız gir/çık döngüsüne dayanıklı, DB/RLS
  teslimatına bağlı değil. Bir üyenin hareketi **yalnızca diğerlerinin** akışında görünür (kendi
  katılışını görmezsin); baştan odada olanlar sessizce seed edilir. Profil düzenleyince (`update()`)
  yanlışlıkla "ayrıldı/katıldı" üretmez. Kick vs ayrılma RoomScreen'in kicked-id seti ile ayrılır.
- İzleme süresi sayacı (dakikada +1) ve "geçirilen süre" / "kurulan oda" istatistikleri.
- **Odada giriş yap → aynı odaya yeni hesapla dön** (eski anonim izleyici sayımda kalmaz).
- Platform logoları: koyu karo kaldırıldı, şeffaf SVG sembol logolar (Netflix/YouTube/Prime/
  Drive + Disney/Max/AppleTV/Vimeo/Web). *(Tam wordmark PNG denemesi geri alındı — sembol
  görünümü tercih edildi.)*

---

## 6. Ertelenenler / bilinen sınırlar ⏳

- **Android'de YouTube sesi** — native build'de **çözüldü** (unmute çalışıyor). Ayrıca YouTube
  reklamı: iframe artık dokunulabilir → "Skip Ad" basılabiliyor (reklamın kendisi embed sınırı).
- **Netflix / Prime DRM — aktif araştırma (co-watching modeli):**
  - Model: DRM bypass DEĞİL. Herkes **kendi hesabıyla** girer, kendi kopyasını izler; ASTERA yalnızca
    oynat/durdur/seek **senkronunu** sağlar. Oynatıcıda giriş kapısı çıkınca ham WebView yerine
    **"Oturum aç"** butonu → platformun login ekranı (`WebViewLogin` loginOnly) → dönünce oynatıcı
    paylaşılan çerezle yeniden yüklenir.
  - **Prime:** büyük ölçüde çalışıyor (ana içerik seçimi + chrome gizleme + "Oynat" tetikleme).
  - **Netflix:** hâlâ "Bu içerik anında izleme için mevcut değil" veriyor. **ÖNEMLİ bulgu:** rakip
    **Turtle**, Netflix'i bir **Android WebView içinde gerçekten oynatıyor** (ekran görüntüsü hareketli
    kareyi yakalıyor → web **L3**, donanım-güvenli yüzey yok). Yani bu **aşılabilir bir duvar** — imkânsız
    değil. Denenenler: masaüstü UA ✅, `allowsProtectedMedia` ✅, warm-load (kaldırıldı), navigator
    tahrifat spoof'u (kaldırıldı — ters tepti), **Client Hints spoof'u** (`navigator.userAgentData` =
    masaüstü, `platform=Win32`, `maxTouchPoints=0`) — modern Netflix UA string yerine Client Hints okur,
    en güçlü aday buydu. Sıradaki: **Rave'in decompile dosyalarını inceleyip birebir reçeteyi bulmak.**
- **Avatar yükleme** artık BİTTİ (bkz. §5). Google Drive için "wordmark" logo yok (sadece üçgen sembol).

---

## 7. Kalan işler / sıradaki adımlar 📋

1. **`007_avatar_upload.sql` + `008_realtime_profiles.sql`'i Supabase SQL editöründe çalıştır**
   — 007 olmadan avatar yükleme "bucket not found" verir; 008 olmadan profil değişiklikleri
   odaya anlık yansımaz. 002–006 zaten doğrulandı ✅.
2. **Netflix WebView reçetesi** — Rave'in dosyalarını inceleyip UA/enjekte-JS/WebView config'ini
   birebir kopyala (Turtle'ın çalıştığı kanıtlı). Prime senkron cilası.
3. **Senkronu sıkılaştır** — host oynat/durdur/seek yapınca herkes otomatik takip etsin (DRM'in
   ilk dokunuş şartı hariç).
4. Oda içi host devri uç durumları + yayın öncesi cila (hata/analitik, boş durum ekranları).

---

## 8. Çalıştırma & build

### Yerel / bulut geliştirme (Metro)
```bash
npm install
EXPO_FORCE_WEBCONTAINER_ENV=1 npx expo start   # Bolt tüneli (bulut sandbox → telefon)
npm run typecheck                              # tsc --noEmit
```
- Ortam değişkenleri **`.env`** (gitignore'lu): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  ⚠️ `.env` yoksa uygulama mock veriye düşer. (Bir kez kaybolduysa yeniden oluştur + Metro'yu restart et.)
- Telefondan bağlanmak için Metro'nun bastığı `exp+astera://<alt-alan>.boltexpo.dev` linki kullanılır
  (her `expo start`'ta alt-alan adı değişebilir).

### Native build (EAS) — PC'siz, buluttan alınıyor
- Expo hesabı: **rjkovicx** · proje: **@rjkovicx/astera** (`eas.json`'da 3 profil, Supabase env gömülü).
- **Dev client (development profili)** bir kez kurulunca → tüm JS/UI/WebPlayer değişiklikleri **Metro
  üzerinden anında** (build beklemeden). DRM/Widevine dev client'ta da çalışır. Native değişiklikte rebuild.
- `eas build -p android --profile development` (dev client) / `--profile preview` (dağıtılabilir APK).
- **Not:** `expo-dev-client` SDK 54 için **~6.0.21** olmalı (yanlış sürüm Gradle'ı patlatır).

> 🔐 **Güvenlik notu:** Supabase **secret** anahtarı asla repoya konmaz; yalnızca **publishable/anon**
> key kullanılır (bundle'da zaten görünür, güvenli). Secret sızarsa panelden **rotate** edilir.

---

## 9. Geliştirme dalı

Aktif dal: **`claude/astera-watchparty-mvp-4g6xkz`**. Commit'ler açıklamalı; iş tamamlandıkça push'lanıyor.

> Not: DRM/WebView deneyleri sırasında uzun oturumda `node_modules` ve `.env` bir kez bozuldu/kayboldu
> → `npm install` + `.env` yeniden oluşturma + Metro restart ile toparlandı. Metro'yu restart ederken
> 8081 portundaki eski süreci öldürmek gerekir (yoksa yeni Metro `.env`'siz eskisine düşer).
