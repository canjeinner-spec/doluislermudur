# ASTERA Backend (Supabase)

Real-time watch-party sync + user profiles, on Supabase. This document covers
the one-time setup. The app runs fine on local mock data **without** any of
this — the backend layer stays inert until credentials are present.

## Architecture

| Concern            | Mechanism                                        |
| ------------------ | ------------------------------------------------ |
| Auth / identity    | Supabase Auth (anonymous sign-in to start)       |
| Profiles           | `profiles` table (Postgres)                      |
| Rooms & membership | `rooms`, `room_members` tables                   |
| Chat               | `messages` table + Realtime Postgres changes     |
| **Playback sync**  | Realtime **Broadcast** channel `room:{id}`       |
| Live participants  | Realtime **Presence** on the same channel        |

Playback sync is **host-authoritative**: only the host emits `control`
(play/pause/seek) and periodic `heartbeat` events; every follower applies them
and self-corrects drift when it slips more than ~400 ms from the host.

## One-time setup

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is
   fine to start).
2. **Run the schema.** Open *SQL Editor* → paste the contents of
   [`supabase/schema.sql`](../supabase/schema.sql) → Run. This creates the
   tables, Row Level Security policies, and the realtime publication.
3. **Enable anonymous auth.** *Authentication → Providers → Anonymous sign-ins*
   → enable. (Lets people start watching before a full account exists.)
4. **Add credentials.** Copy `.env.example` to `.env` and fill in from
   *Project Settings → API*:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
   The anon key is public by design — RLS is what protects the data.
5. **Restart Metro** so the new env vars are inlined:
   `EXPO_FORCE_WEBCONTAINER_ENV=1 npx expo start --go --clear`.

On next launch the app signs in anonymously and creates your `profiles` row.

## Roadmap

- [x] Foundation: client, auth, profiles, schema, RLS
- [ ] Room create/join persisted to `rooms` / `room_members`
- [ ] Live participant list via Presence
- [ ] Host-authoritative playback sync wired into the player
- [ ] Chat backed by `messages`
- [ ] Real login (email / OAuth) on top of the anonymous session
