# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Expo dev server (then `i` for iOS sim, `a` for Android, `w` for web)
- `npm run ios` / `npm run android` / `npm run web` — launch directly on a platform
- `npm run lint` — ESLint via `expo lint` (config: `eslint.config.js` → `eslint-config-expo`)
- `npm test` — Jest (preset `jest-expo`)
- `npm test -- __tests__/nights-store.test.ts` — run a single test file
- `npm test -- -t "accepts an invite"` — filter by test name
- CI installs with `npm ci --legacy-peer-deps` (see `.github/workflows/test.yml`); use the same flag if `npm install` fails on peer deps.

`EXPO_PUBLIC_API_URL` must be set (copy `.env.example` → `.env`). The API client prepends `/api/v1` to this URL (`lib/api.ts`).

## Architecture

This is the **consumer-facing** mobile app (Expo SDK 54, React Native 0.81, React 19, New Architecture + React Compiler enabled). It talks to a separate backend under `/api/v1/consumer/*`. There is a sibling producer/admin app elsewhere in `pub-app-dev/` — don't conflate the two.

### Routing (Expo Router, file-based)

`app/` uses route groups to separate auth state:

- `app/_layout.tsx` is the auth gate. It calls `useAuthStore.hydrate()` on mount, shows a spinner until `isReady`, then redirects based on `token` and current `segments[0]`: no token → `(auth)/login`; token + in `(auth)` → `(app)/nights`. The `invite` group is exempt from the redirect so deep links work while logged out.
- `app/(auth)/` — `login.tsx`, `verify.tsx` (phone/OTP-style flow).
- `app/(app)/nights/` — authenticated stack. `[id]/_layout.tsx` is a **Tabs** layout (Overview / Members / Itinerary / Invite) that fetches the night in its own `useEffect`; each tab screen reads `currentNight` from the store rather than fetching itself.
- `app/invite/[code].tsx` — deep-link landing (scheme `nitepool` per `app.json`). If the user is unauthenticated it stashes the code in `authStore.pendingInviteCode` and routes to login; the login/verify flow is responsible for consuming that pending code after successful auth.

`typedRoutes` is enabled in `app.json`, so route strings are type-checked — prefer template literals like `` `/(app)/nights/${id}` `` over string concatenation.

### State (Zustand)

Two stores, both in `stores/`, both talking to `lib/api.ts` directly:

- **`auth.ts`** — owns `consumer`, `token`, `isReady`, `pendingInviteCode`. Persists only the token via `expo-secure-store` under key `consumer_token`; the `consumer` object is rehydrated by calling `/consumer/me` in `hydrate()`. On 401 it clears the token and sets an `error` message. Root layout's redirect depends on `isReady`, so any auth change must flow through this store.
- **`nights.ts`** — owns the nights list, `currentNight`, venues, and all night-related mutations (members, itinerary reorder/remove, invites). Mutations optimistically update `currentNight` in-place, guarded by `currentNight?.id === nightId` checks — preserve that pattern when adding new mutations or stale updates will clobber unrelated nights. API responses are unwrapped defensively (`data.night ?? data`, `data.data ?? data.nights ?? data`) because the backend wraps some endpoints and not others.

Don't add a third store for night-scoped data — extend `nights.ts`. Don't call `api` directly from screens; go through a store action so tests can mock the store.

### API client

`lib/api.ts` is a single axios instance. The request interceptor reads `useAuthStore.getState().token` on every request, so there's no need to re-create the client after login. Base URL is `${EXPO_PUBLIC_API_URL}/api/v1`. All consumer endpoints live under `/consumer/*`.

### Path alias

`@/*` maps to the repo root (`tsconfig.json`). Use `@/stores/...`, `@/lib/api`, `@/types/night`, etc.

### Theming

`constants/theme.ts` + `hooks/use-color-scheme.ts` (with a `.web.ts` variant) drive light/dark colors. Screens read via `Colors[colorScheme]` — follow that instead of hard-coding colors when touching themed surfaces. Root layout wraps everything in `@react-navigation/native`'s `ThemeProvider`.

## Testing

- Jest preset is `jest-expo`; `jest.setup.js` globally mocks `expo-secure-store` so auth code runs in tests without native modules.
- `transformIgnorePatterns` in `package.json` already whitelists `zustand`, `axios`, `@sentry/react-native`, etc. If you add a dep that ships ESM, extend that list rather than mocking it.
- Component tests use `@testing-library/react-native` and typically mock the store hooks (`jest.mock('@/stores/nights')`) rather than the axios layer — match that style in new tests.
- Tests live in top-level `__tests__/` (not colocated).
