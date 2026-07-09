# ASTERA

**Watch Together. Anywhere.**

A premium, synchronized watch-party app — think _"if Apple designed a Watch
Party app in 2026."_ Dark-mode-only, cinematic, and built with an
Apple-Human-Interface-Guidelines sensibility: iOS 26 Liquid Glass materials,
warm copper/amber accents, soft shadows, native segmented controls, native
sheets and switches, and spring-driven motion throughout.

<p align="center"><em>Recreated from the Rave-style reference with App-Store-Featured polish.</em></p>

---

## ✨ Features (MVP)

| Screen | What it does |
| --- | --- |
| **Home / Room List** | Searchable list of live rooms — poster, platform badge, participant avatars, host & privacy badges, live indicator, and a floating **Create Room** button. |
| **Sidebar** | Slide-over drawer: Rooms, Create Room, Platforms, How It Works, Invite Friends, Settings, About. Edge-swipe to dismiss. |
| **Create Room** | Native form sheet — name, description, privacy (public/private), and participant capacity. |
| **Platform Selection** | Large platform cards (Netflix, Disney+, Prime Video, Apple TV+, Max, YouTube, Vimeo, Google Drive, Web) with logo, title, description and chevron. |
| **WebView Login** | Opens the provider's **own** login page in a WebView. ASTERA never sees credentials; already-authenticated platforms skip login. |
| **Room** | The core screen: collapsible top bar, participant strip, large embedded player (play/pause, ±10s, draggable timeline, volume, fullscreen), and a `Sohbet ／ Kullanıcılar` segmented control. Chat lives **below** the player; the Users tab is a slide-over roster. |

> **Friends exist only to send room invitations — there is no direct messaging.**

## 🎨 Design System

- **Dark mode only**, background `#090909`, surfaces `#121212` / `#1A1A1A`.
- **Glass**: real `expo-blur` materials with a hairline border and diagonal sheen.
- **Accent**: warm copper → amber → ember gradient (no purple, no neon).
- **Typography** mapped to Apple's HIG text styles (San Francisco / platform default).
- **Motion**: `react-native-reanimated` springs, native press feedback on every control.

Tokens live in [`src/theme`](src/theme).

## 🧱 Tech Stack

React Native · Expo (SDK 52) · TypeScript · React Navigation (native stack) ·
Reanimated · Gesture Handler · Safe Area Context · SVG · Blur · MMKV · WebView.

## 🚀 Getting Started

```bash
npm install
npm run start      # Expo dev server — press i / a, or scan the QR code
```

Other scripts:

```bash
npm run ios        # open in the iOS simulator
npm run android    # open on an Android device/emulator
npm run typecheck  # tsc --noEmit
node scripts/gen-assets.js   # regenerate the app icon / splash
```

> MMKV requires a development build (New Architecture). In Expo Go the storage
> layer transparently falls back to an in-memory store, so the UI still runs.

## 🗂 Project Structure

```
App.tsx                 Root: providers + navigation container
index.ts                Entry point
src/
  theme/                Colors, typography, spacing, shadows, springs
  components/            Reusable UI (GlassSurface, GradientButton, RoomCard,
                        SegmentedControl, VideoPlayer, Sidebar, BottomSheet, …)
    icons/              SVG icon set + platform brand marks
  navigation/           Native stack + route types
  screens/              Home, CreateRoom, PlatformSelect, WebViewLogin, Room
    room/               Chat view + Users slide-over panel
    sheets/             Platforms / HowItWorks / InviteFriends / Settings / About
  data/                 Types + mock rooms, platforms, friends
  storage/              MMKV wrapper with in-memory fallback
scripts/gen-assets.js   Procedural icon / splash generator
```

## 🔒 A note on authentication

Sign-in **always** happens on the streaming provider's own web page inside a
`WebView`. ASTERA never renders a credential form and never stores passwords —
it only remembers _that_ you're signed in to a platform (via MMKV) so it can
skip the login step next time.

---

_Made with ♥ · © 2026 ASTERA_
