# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Pie & Mash UK** — a cross-platform iOS/Android app (React Native + Expo) for discovering and checking in to traditional British pie & mash shops, with gamification, groups, and a community leaderboard.

GitHub: `BurtonJeff/pie-mash-uk`
Supabase project ref: `cjvhpjgpjldtfrrzcgvn`
Supabase credentials: stored in `Supabase.txt` (gitignored — never commit)

## Commands

```bash
npx expo start                  # start dev server
npx expo start --ios            # iOS simulator
npx expo start --android        # Android emulator
npx tsc --noEmit                # TypeScript check (run after every change)

# Supabase CLI (binary at %LOCALAPPDATA%/supabase/supabase.exe on Windows)
SUPABASE_ACCESS_TOKEN=<token> supabase db push                          # push migrations
SUPABASE_ACCESS_TOKEN=<token> supabase functions deploy <name> --project-ref cjvhpjgpjldtfrrzcgvn
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 55, managed workflow) |
| Language | TypeScript (strict) |
| Navigation | React Navigation v7 — native stack + bottom tabs |
| Backend | Supabase (PostgreSQL + PostGIS, RLS, Edge Functions, Storage, Realtime) |
| Auth | Supabase Auth — email/password, Google OAuth, Apple Sign-In |
| State | Zustand (`src/store/authStore.ts`) |
| Data fetching | TanStack Query v5 |
| Push notifications | expo-notifications + Expo Push API (via edge function) |
| Icons | @expo/vector-icons (Ionicons) |
| Maps | react-native-maps |
| Location | expo-location |
| Camera / photos | expo-image-picker + expo-file-system |
| Async storage | @react-native-async-storage/async-storage |

## Critical Implementation Patterns

**TanStack Query — always wrap queryFn in an arrow function** when the underlying function has default parameters or overloads:
```ts
// ✅ correct
queryFn: () => fetchAllTimeLeaderboard()
// ❌ causes TS overload errors
queryFn: fetchAllTimeLeaderboard
```

**expo-file-system encoding** — `EncodingType` is not on the type, cast it:
```ts
encoding: 'base64' as any
```

**PostgreSQL UUID generation** — use `gen_random_uuid()`, not `uuid_generate_v4()`.

**Supabase CLI** — the npm package requires Node ≥ 20. On this machine the binary was downloaded directly to `%LOCALAPPDATA%/supabase/`. Always pass `SUPABASE_ACCESS_TOKEN` as an env var; it is not persisted in the shell.

**Conditional FlatList rendering** — avoid ternary between `<ActivityIndicator>` and `<FlatList>` inside JSX (TypeScript infers the union wrong). Use separate conditions:
```tsx
{loading && <ActivityIndicator />}
{!loading && <FlatList ... />}
```

**Navigation from outside React** — use `navigationRef` from `src/navigation/navigationRef.ts`. Check `navigationRef.isReady()` before calling `.navigate()`.

## Navigation Structure

```
RootNavigator
├── (spinner — auth not yet initialized or onboarding not checked)
├── OnboardingScreen          ← shown once on first install (AsyncStorage flag)
├── AuthNavigator             ← SignIn, SignUp
└── TabNavigator (5 tabs)
    ├── HomeNavigator         ← HomeMain, ShopDetail
    ├── DiscoverNavigator     ← DiscoverHome, ShopDetail
    ├── CheckInScreen         ← single screen, multi-step local state
    ├── JourneyNavigator      ← JourneyHome, AllBadges, AllVisits, EditProfile,
    │                            Settings, Admin (modal → AdminNavigator)
    └── CommunityNavigator    ← CommunityHome, GroupDetail, CreateGroup, JoinGroup
```

**AdminNavigator** (modal stack inside JourneyNavigator):
`AdminHome → AdminShops / AdminShopForm → AdminBadges / AdminBadgeForm → AdminChallenges / AdminChallengeForm`

## Screen Inventory

| Tab | Screens |
|---|---|
| Home | Greeting + stats, FeaturedShopCard (Shop of the Week), DailyFactCard, recent feed |
| Discover | Map/list toggle, search, 4 filter chips, GPS sort; ShopDetail (gallery, hours, history, directions) |
| Check In | GPS verify (200 m) → photo → note → submit → BadgeCelebration modal |
| Journey | Profile, stats, badge grid, visit history; AllBadges (filter tabs); AllVisits; EditProfile; Settings; Admin |
| Community | Leaderboard (all-time/weekly), Activity feed, Challenges, Groups with real-time chat |

## Database Schema

| Table | Key columns |
|---|---|
| `shops` | `id`, `name`, `slug`, `city`, `postcode`, `latitude`, `longitude`, `price_range`, `opening_hours` (jsonb), `features` (jsonb), `is_active`, `is_featured` |
| `shop_photos` | `shop_id`, `storage_path`, `is_primary` |
| `profiles` | `id` (= auth.uid()), `username`, `display_name`, `total_points`, `total_visits`, `unique_shops_visited`, `expo_push_token`, `is_admin` |
| `checkins` | `user_id`, `shop_id`, `checked_in_at`, `latitude`, `longitude`, `photo_url`, `points_earned` |
| `badges` / `user_badges` | badge definitions + per-user awards with `awarded_at` |
| `groups` / `group_members` | groups with `invite_code`; members have `role` (admin/member) |
| `group_messages` | real-time chat (Supabase Realtime `postgres_changes`) |
| `challenges` | `scope` (global/group), `start_date`, `end_date`, `points_reward`, `is_active` |

Storage buckets: `shop-photos`, `checkin-photos` (both public; RLS on upload path = user's folder).

## Edge Functions

| Function | Purpose |
|---|---|
| `calculate-points` | Updates profile totals after check-in |
| `award-badges` | Evaluates badge criteria; calls `send-notification` for each award |
| `send-notification` | Fetches `expo_push_token` from profile; sends via Expo Push API |
| `notify-group-message` | Notifies all group members except sender on new chat message |
| `group-challenge-notify` | Notifies group on challenge created/completed |
| `evaluate-group-challenges` | Checks group challenge completion after check-in |
| `nearby-shops` | PostGIS radius query |
| `delete-account` | Verifies JWT, calls `auth.admin.deleteUser`; FK cascade cleans up profile |

## Key Business Rules

- Check-in GPS must be within **200 m** of the shop's coordinates.
- Only one shop can have `is_featured = true` at a time (`setShopFeatured` clears all others first).
- `award-badges` and `calculate-points` are called from the client after each check-in (not via DB webhooks).
- Onboarding is shown on first install only — persisted via AsyncStorage key `hasSeenOnboarding`.
- Push token is stored in `profiles.expo_push_token`; setting it to `null` soft-disables notifications.
- Admin access: set `profiles.is_admin = true` in Supabase dashboard. The "Admin Panel" row in Settings only renders for admin users.

## Important File Locations

```
src/
  lib/           supabase.ts, auth.ts, shops.ts, checkins.ts, profile.ts,
                 feed.ts, leaderboard.ts, groups.ts, challenges.ts,
                 home.ts, notifications.ts, admin.ts
  hooks/         useShops.ts, useProfile.ts, useCheckin.ts, useCommunity.ts,
                 useHome.ts, useAdmin.ts
  store/         authStore.ts (Zustand + initAuthListener)
  navigation/    RootNavigator, TabNavigator, HomeNavigator, DiscoverNavigator,
                 JourneyNavigator, CommunityNavigator, AuthNavigator,
                 AdminNavigator, navigationRef.ts
  screens/       Home/, Discover/, CheckIn/, Journey/, Community/,
                 Onboarding/, Auth/, Admin/
  components/    checkin/, community/, home/, journey/
  types/         database.ts  ← source of truth for TS interfaces
  utils/         shopUtils.ts, dateUtils.ts, facts.ts
supabase/
  migrations/    000000_initial_schema, 000001_storage_buckets,
                 000002_featured_shop, 000003_push_token, 000004_admin
  functions/     (each function in its own folder with index.ts + Deno runtime)
```
