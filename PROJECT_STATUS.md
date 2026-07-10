# ASTERA — Proje Durumu

> Senkron izleme partisi uygulaması (Rave benzeri). React Native + Expo + TypeScript.
> Bu dosya "A'dan Z'ye ne yaptık, ne kaldı" özetidir. Son güncelleme: 2026-07-10.

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
  `setHandle` (7 gün cooldown), `signOut`, `deleteAccount`, `updateDisplayName`, `fetchMyProfile`.
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
- Profil: DB'den gerçek veriler; düzenleme (ad, @handle 7 gün kilidi); çıkış; hesap silme.
- İzleme süresi sayacı (dakikada +1) ve "geçirilen süre" / "kurulan oda" istatistikleri.
- **Odada giriş yap → aynı odaya yeni hesapla dön** (eski anonim izleyici sayımda kalmaz).
- Platform logoları: koyu karo kaldırıldı, şeffaf SVG sembol logolar (Netflix/YouTube/Prime/
  Drive + Disney/Max/AppleTV/Vimeo/Web). *(Tam wordmark PNG denemesi geri alındı — sembol
  görünümü tercih edildi.)*

---

## 6. Ertelenenler / bilinen sınırlar ⏳

- **Android'de YouTube sesi** — muted autoplay çalışıyor; sesi açmak (unmute) cross-origin
  iframe jesti gerektirdiği için enjeksiyonla çözülemiyor → **native dev build**'e ertelendi.
- **Netflix / Prime DRM** — Widevine/FairPlay; Expo Go/WebView'de tam oynatma yok →
  native dev build gerekiyor.
- **Avatar yükleme** (kayıtlı kullanıcı) — Supabase Storage bucket gerekiyor, henüz başlanmadı.
- Google Drive için "wordmark" logo yok (sadece üçgen sembol).

---

## 7. Kalan işler / sıradaki adımlar 📋

1. Migration'ları (002–006) Supabase'de çalıştır ve prod'da doğrula.
2. Native dev build al → Android ses + Netflix/Prime DRM'i gerçek cihazda test et.
3. Avatar yükleme (Storage bucket + upload akışı).
4. Oda içi "kimler izliyor" ve host devri uç durumlarının cihazda testi.
5. Yayın öncesi: hata/analitik, boş durum ekranları, ince tasarım geçişleri.

---

## 8. Çalıştırma

```bash
npm install
npm start          # expo start (Metro, port 8081)
npm run typecheck  # tsc --noEmit
npm run lint
```

Ortam değişkenleri (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

> 🔐 **Güvenlik notu:** Supabase **secret** anahtarı hiçbir zaman uygulamaya/repoya konmaz;
> yalnızca anon key kullanılır. Secret paylaşıldıysa Supabase panelinden **rotate** edilmeli.

---

## 9. Geliştirme dalı

Tüm geliştirme `claude/astera-watchparty-mvp-8x5k5g` dalında. Commit'ler açıklamalı;
iş tamamlandıkça bu dala push'lanıyor.
