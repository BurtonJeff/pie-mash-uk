# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Pre-development.** The only current artifact is `pie_mash_app_plan.docx` — a full product specification. No code exists yet. The project is a cross-platform mobile app (iOS & Android) called **Pie & Mash UK**: a directory and gamified check-in app celebrating traditional British pie & mash shops.

## Planned Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native (Expo) |
| Language | TypeScript |
| Navigation | React Navigation v6 |
| Backend / Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email, Apple, Google OAuth) |
| Image storage | Supabase Storage (CDN) |
| Push notifications | Expo Notifications + Supabase Edge Functions |
| Maps | React Native Maps |
| Location / GPS | Expo Location |
| State management | Zustand |
| Data fetching | TanStack Query (React Query) |
| Offline / local DB | WatermelonDB (SQLite) |
| Analytics | PostHog |
| Build / deploy | Expo Application Services (EAS) |
| Admin dashboard | Custom React web app + Supabase Studio |

## Planned Commands (once scaffolded)

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build for production (EAS)
eas build --platform all

# Submit to app stores
eas submit

# Run TypeScript type checks
npx tsc --noEmit

# Run tests
npm test

# Run a single test file
npm test -- --testPathPattern=<filename>
```

## Architecture Overview

### Navigation (5 tabs)
1. **Home** — feed, featured shop, recent activity, daily fact
2. **Discover** — map view + list, search, filters
3. **Check In** — GPS-verified check-in flow (photo, note, submit)
4. **My Journey** — visit history, badges, stats, profile
5. **Community** — leaderboard, friends, challenges, groups

### Supabase Database Schema (core tables)
- `shops` — directory entries (location, hours, features as JSONB)
- `shop_photos` — images linked to shops, stored in Supabase Storage
- `profiles` — extends `auth.users` with points, visit counts
- `checkins` — GPS-verified visits with earned points
- `badges` / `user_badges` — badge definitions and awards per user
- `challenges` — global or group-scoped; scope field + optional `group_id`
- `groups` / `group_members` — friend groups with admin/member roles
- `group_messages` — in-app chat per group

RLS is enabled on all user-facing tables.

### Supabase Edge Functions
- `award-badges` — triggered after check-in insert; evaluates all badge criteria
- `calculate-points` — updates `profile.total_points` after each check-in
- `send-notification` — push on badge unlock or challenge completion
- `nearby-shops` — PostGIS geospatial query for shops within X km
- `group-challenge-notify` — notifies group on challenge create/complete
- `evaluate-group-challenges` — checks group challenge completion after check-in

### Check-In Flow
GPS must be within **200m** of the shop. Flow: GPS confirmation → optional photo capture → optional note → submit → badge celebration modal.

### Gamification
- Points per visit, first-visit bonus, repeat-visit rewards
- Badge taxonomy: First Visit, Quantity, Regional, Social, Seasonal, Speed, Group
- Challenges: weekly/seasonal (global) and custom (group-admin created)
- Leaderboards: national and per-group

### Groups
- Any user can create a group; creator is admin
- Group admin can create custom challenges, manage members, transfer admin role
- Members can belong to multiple groups simultaneously
- Join via unique `invite_code` or username search
- Group features: leaderboard, activity feed, group chat, group-exclusive badges

### Offline Support
WatermelonDB provides local SQLite for browsing shop directory offline. TanStack Query handles background refresh and cache.

## Phased Delivery Plan

| Phase | Weeks | Focus |
|---|---|---|
| 1 | 1–4 | Expo setup, Supabase schema, auth, shop directory, maps |
| 2 | 5–8 | GPS check-ins, points engine, badges, push notifications |
| 3 | 9–12 | Search/filters, social/friends, groups, group challenges, chat |
| 4 | 13–16 | Editorial content, global challenges, offline mode, app store submission |
| 5 | Post-launch | Apple Watch, AR viewfinder, shop-owner portal, widgets |

## Key Business Rules
- GPS check-in valid within 200m radius of shop coordinates
- Group challenge types: first to check in, most visits in period, complete a specific shop list
- Premium tier ("Pie Passport") is a future monetisation feature — not in initial launch
- No external payment links at launch (to avoid App Store rejection)
