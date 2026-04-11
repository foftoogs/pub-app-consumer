# NitePool

Consumer-facing mobile app for planning nights out. Built with React Native and Expo.

## Tech Stack

- **Framework:** [Expo](https://expo.dev) (SDK 54) with [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Language:** TypeScript
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **HTTP Client:** Axios
- **Auth:** Token-based authentication with Expo SecureStore
- **Testing:** Jest + React Native Testing Library

## Project Structure

```
app/
  (auth)/          # Login and verification screens
    login.tsx
    verify.tsx
  (app)/           # Authenticated screens
    nights/
      index.tsx    # Night list
      create.tsx   # Create a night
      [id]/        # Night detail (tab layout)
        index.tsx  # Overview
        members.tsx
        itinerary.tsx
        invite.tsx
components/        # Reusable UI components
lib/
  api.ts           # Axios API client
stores/
  auth.ts          # Auth state (Zustand)
  nights.ts        # Nights state (Zustand)
types/
  consumer.ts      # Consumer/user types
  night.ts         # Night types
__tests__/         # Unit and component tests
```

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the dev server

   ```bash
   npx expo start
   ```

3. Open the app in a [development build](https://docs.expo.dev/develop/development-builds/introduction/), [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), or [Expo Go](https://expo.dev/go).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
