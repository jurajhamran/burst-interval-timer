<div align="center">
  <img src="public/icon.svg" width="96" height="96" alt="Burst Logo" />
  <h1>Burst: Tabata &amp; Interval Timer</h1>
  <p>Free offline Tabata and interval timer. Build custom work and rest workouts, drag to reorder, no sign-up. Your data stays on your device.</p>
</div>

---

## Features

- Create and edit workouts with work/rest items, rounds, prepare countdown, round rest, and skip-last-rest options.
- Run workouts with audio cues, vibration, and a progress ring.
- Bottom navigation (mobile) / left rail (desktop) for Workouts, History, and Settings.
- History with sessions, total time, and day streak.
- Settings for theme, sound, volume, vibration, and data backup/import.
- Offline-ready PWA with install prompt support.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - typecheck and build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest in watch mode
- `npm run test:run` - run Vitest once
- `npm run test:ui` - open Vitest UI
- `npm run test:coverage` - run tests with coverage

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test:run
npx tsc -b
```

## Project structure

- `src/app` - app shell
- `src/components` - shared UI components
- `src/features` - feature modules (timer, workouts, editor, settings, history, backup, theme)
- `src/pages` - route pages
- `src/lib` - helpers (audio, formatting, vibration)
- `src/router.tsx` - TanStack Router (hash history) configuration

## Notes

- Path alias `@/*` maps to `src/*`.
- Data is stored in the browser via Zustand persist (`localStorage`).
- Backup export/import uses JSON files.
