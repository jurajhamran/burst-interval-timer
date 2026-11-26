# Burst — Project Knowledge

Read this before changing code. It describes what the app is, how it is built, and the
invariants that will break things if you ignore them.

---

## 1. What this is

**Burst: Tabata & Interval Timer** — a free, offline-first interval training timer that
runs entirely in the browser as an installable PWA.

- Package name: `tabata-timer-pwa` (internal), product name: `Burst`
- Production URL: `https://burst.jurajhamran.com`
- No backend, no accounts, no analytics, no sync. All user data lives in `localStorage`.
- Target form factor: phone first, usable on desktop (wider layout at `md:`).
- Core loop: build a workout of work/rest items -> run it with audio/vibration cues ->
  the finished session is appended to History.

The product promise is "your data stays on your device". Any feature that needs a server
or an account is out of scope by design.

---

## 2. Tech stack

| Area | Choice |
| --- | --- |
| Language | TypeScript 5.9, `strict`, `noUnusedLocals`, `verbatimModuleSyntax` |
| UI | React 19.2 (function components, no classes) |
| Build | Vite 7 + `@vitejs/plugin-react` |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`, CSS-first config in `src/index.css` |
| Components | shadcn/ui, style `base-nova`, built on **Base UI** (`@base-ui/react`), not Radix |
| Icons | `lucide-react` |
| Routing | TanStack Router 1.x, **hash history** |
| State | Zustand 5 + `persist` middleware (localStorage) |
| Validation | Zod 4 (schemas double as types) |
| Forms | React Hook Form 7 + `@hookform/resolvers/zod` |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Charts | Recharts 3 (lazy-loaded, History only) |
| Effects | `canvas-confetti`, Web Audio API, Vibration API, Screen Wake Lock |
| PWA | `vite-plugin-pwa` (Workbox), `virtual:pwa-register/react` |
| Unit tests | Vitest 5, **node environment** (no DOM) |
| E2E tests | Playwright, Chromium only |
| Lint | ESLint 9 flat config, typescript-eslint, react-hooks, react-refresh |

`cn()` comes from the `cn` npm package (not `clsx` + `tailwind-merge`), re-exported by
`src/lib/utils.ts`. Use it for conditional classes.

---

## 3. Commands

```bash
npm install
npm run dev            # Vite dev server (default :5173)

npm run build          # tsc -b && vite build
npm run preview        # serve dist/
npm run lint           # eslint .

npm run test           # Vitest watch
npm run test:run       # Vitest once
npm run test:ui        # Vitest UI
npm run test:coverage  # v8 coverage

npx playwright install chromium   # once per machine
npm run test:e2e                  # Playwright, dev server on :4173
npm run test:e2e:ui               # Playwright UI mode
```

**Definition of done** (run all, in this order):

```bash
npx tsc -b --pretty false
npm run lint
npm run test:run
npm run test:e2e
npm run build
```

`tsc -b` is a project-references build and typechecks app, Vite config, **and** the E2E
suite. A green `npm run test:run` alone is not enough.

---

## 4. Repository layout

```
.
├─ index.html                 app shell, meta/OG tags, pre-React theme bootstrap script
├─ vite.config.ts             React + Tailwind + PWA plugins, Vitest config, @ alias
├─ components.json            shadcn config (base-nova, baseColor neutral, css vars)
├─ eslint.config.js           flat config + ignores for generated dirs
├─ pwa-assets.config.ts       icon/asset preset generated from public/icon.svg
├─ playwright.config.ts       testDir ./e2e, baseURL http://localhost:4173
├─ tsconfig.json              solution file -> app / node / e2e
├─ tsconfig.app.json          src/**
├─ tsconfig.node.json         vite.config.ts
├─ tsconfig.e2e.json          e2e/** + playwright.config.ts
├─ opencode.json              shadcn MCP server config
├─ public/                    icon.svg, og-image.png
├─ e2e/                       Playwright specs (see section 8)
└─ src/
   ├─ main.tsx                React root: RouterProvider + Toaster
   ├─ router.tsx              all routes, hash history
   ├─ index.css               design tokens, @theme mapping, timer layout CSS
   ├─ schemas.ts              barrel re-exporting all domain schemas
   ├─ pages/                  thin route components (Home, History, Editor, Run, Settings)
   ├─ components/
   │  ├─ layout/              PageContainer, PageHeader, TabsLayout, AppNav
   │  └─ ui/                  shadcn primitives + custom (DurationInput, OverflowMenu,
   │                          ConfirmDialog, Button, dialog, alert-dialog, switch, slider,
   │                          input, label, badge, separator, toast)
   ├─ features/               feature modules, each owns its state + UI
   │  ├─ workouts/            store, config, types, copyName, WorkoutCard,
   │  │                       WorkoutPreviewModal
   │  ├─ editor/              EditorScreen, SortableItemList/Row
   │  ├─ timer/               engine, store, cues, confetti, finishMessages, phaseIcons,
   │  │                       components/, hooks/
   │  ├─ history/             store, stats, charts, types, components/HistoryCharts
   │  ├─ settings/            store, types, SettingsScreen
   │  ├─ backup/              backup, io, lastBackup, types
   │  ├─ theme/               store, applyTheme, ThemeSwitcher, hooks/useThemeSync
   │  └─ toast/               store wrapper over components/ui/toast + Toaster
   ├─ hooks/                  useDocumentTitle, usePwaInstall
   ├─ lib/                    audio, vibrate, format, app (name/url), utils, schemas
   ├─ pwa/                    pwaInstall, InstallButton, PWABadge, installStrings
   └─ __tests__/              Vitest specs, mirrors feature folders + factories.ts
```

There is **no** `src/app` directory (the README still mentions one; it is stale).

### Naming conventions

- Components: `PascalCase.tsx`. Hooks: `useThing.ts`. Everything else: `camelCase.ts`.
- shadcn primitives keep their generated lowercase names (`dialog.tsx`, `switch.tsx`).
- Feature folders are singular and domain-named (`timer`, not `TimerFeature`).
- Every persisted domain has `types/schemas.ts` (Zod source of truth), plus
  `types/schema.ts` and `types/types.ts` that just re-export it. Import from
  `.../types/types` in app code.

---

## 5. Architecture

### 5.1 Routing

Hash history (`createHashHistory`), so every URL looks like `/#/history`. This keeps
static hosting simple and deep links working without server rewrites.

| Path | Parent | Component | Notes |
| --- | --- | --- | --- |
| `/` | tabs | `HomePage` | workout list, preview modal |
| `/history` | tabs | `HistoryPage` | stats, charts, grouped entries |
| `/settings` | tabs | `SettingsPage` | install, theme, sound, vibration, data |
| `/workout/new` | tabs | `EditorPage` | new workout |
| `/workout/$id` | tabs | `EditorPage` | edit; unknown id redirects home |
| `/run/$id` | root | `RunPage` | fullscreen, **no nav**, blocks exit |
| `*` | root | redirect | `beforeLoad` -> `/` |

`TabsLayout` renders a scrollable `<main>` plus `AppNav`. `RunPage` is a child of the root
route, so the timer takes over the whole screen without the tab bar.

`AppNav` visual order is controlled by `order-1/2/3` classes, not array order: the array is
Workouts, History, Settings; the rendered order is History, Workouts, Settings.

### 5.2 Domain model

```ts
Workout {
  id: string                     // crypto.randomUUID()
  name: string                   // trimmed, 1..50 chars
  rounds: number                 // 1..99
  items: SessionItem[]           // min 1
  prepare: { enabled, duration }          // default { true, 5 }
  roundRest: { enabled, duration }        // default { false, 30 }
  skipLastRest: boolean                   // default true
}

SessionItem {
  id: string
  type: "work" | "rest"
  label: string                  // work: trimmed 1..60; rest: always "Rest"
  duration: number               // seconds, int 5..3600
}

HistoryEntry {
  id: string
  workoutId: string
  workoutName: string            // snapshot, not a join
  completedAt: number            // epoch ms
  durationSeconds: number        // > 0
  rounds: number                 // >= 1
}
```

Zod schemas in `features/*/types/schemas.ts` are the single source of truth; TypeScript
types are `z.infer` of them. Each store exposes a `normalizeX(raw)` helper that
`safeParse`s untrusted input (used by persistence migration and backup import).

**Limits live in `features/workouts/config.ts`** (`WORKOUT_LIMITS`): workout name 1–50,
exercise name 1–60, rounds 1–99, item duration 5–3600, prepare 1–60, round rest 1–300.
The schemas and the editor inputs both read that object, so the editor can never produce a
workout the import path would reject. Imported workouts outside the limits are skipped
(counted in `parseBackup().skipped`); copy/import suffixes are truncated to fit the name
limit. Rest is a fixed phase: `SessionItemSchema` rewrites rest labels to `"Rest"`,
`buildPhases` enforces it again at display time, and the editor renders a static "Rest"
instead of an input.

### 5.3 Persistence

All stores use Zustand `persist` with `localStorage`. Storage keys keep the legacy
`tabata-` prefix even though the product is named Burst.

| Key | Store | Version | Contents |
| --- | --- | --- | --- |
| `tabata-workouts` | `useWorkoutsStore` | 5 | `{ state: { workouts }, version: 5 }` |
| `tabata-history` | `useHistoryStore` | 1 | `{ state: { entries }, version: 1 }` |
| `tabata-settings` | `useSettingsStore` | 1 | sound, volume, vibration, confetti, lastBackupAt |
| `tabata-theme` | `useThemeStore` | 0 (implicit) | `{ state: { theme } }` |

- The timer store is **not** persisted. Refreshing mid-workout loses the session. This is
  intentional; "resume interrupted session" was explicitly declined.
- `tabata-workouts` has a `migrate` function that clamps legacy out-of-range values
  (name/label length, durations, fixed rest labels) and then re-validates every workout
  through `normalizeWorkout`, dropping anything still invalid. When migrating from a version
  older than 5 it also merges any missing starter workouts into a non-empty library (an
  intentionally emptied library stays empty). Zustand only calls `migrate` when the stored
  version differs, so a corrupt payload at the current version is not re-normalized.
- `tabata-theme` is read by an inline script in `index.html` **before React mounts** to
  avoid a light/dark flash. If you rename the key or change its shape, update that script
  (it does `JSON.parse(raw).state.theme`).
- Settings defaults: `soundEnabled: true`, `countdownSoundEnabled: true`, `volume: 0.8`,
  `vibrationEnabled: true`, `confettiEnabled: true`, `lastBackupAt: null`.
- History is capped at **1000 entries** in both `addEntry` and `addEntries`. Stats and
  charts derive from that array, so "total time" means "last 1000 sessions", not lifetime.

### 5.4 Timer engine

`features/timer/engine.ts` is pure and synchronous:

- `buildPhases(workout)` expands rounds x items into a flat `Phase[]`:
  optional `prepare`, then each round's items, then optional `round-rest` between rounds
  (never after the last round), then drops a trailing rest/round-rest when `skipLastRest`.
- `getTotalSeconds(workout)` sums phase durations.

`features/timer/store.ts` holds runtime state: `phases`, `index`, `running`, `finished`,
`endsAt`, `remainingMs`. Key behaviours:

- Time is tracked as an absolute `endsAt` timestamp, not by decrementing. `tick()` recomputes
  `endsAt - Date.now()`, so background throttling and tab suspension self-correct.
- If more than one phase elapsed (e.g. app was backgrounded), `tick()` walks forward and
  skips fully consumed phases instead of firing them late.
- `toggle()` pauses by storing `remainingMs` and resumes by recomputing `endsAt`.
- `previous()` / `skip()` restart the target phase at full duration.
- `useTimerLoop()` ticks every 100 ms while running and immediately on `visibilitychange`.
- `RunPage` resets the store to its initial state on unmount via
  `useTimerStore.setState(useTimerStore.getInitialState())`.

Effects live in `TimerScreen`, not the store: phase-start beep, countdown beeps at 3/2/1,
finish triple beep, screen-reader announcements, focus move to the finish heading.

`TimerScreen` layout contract: the progress ring contains **only the countdown**. The current
exercise sits below the ring (phase icon above the label, then `Next: …`), so user-authored
labels never have to fit inside a circle. The header keeps the workout name, round indicator
and session time. Playback is three controls (previous / play-pause / next); leaving the
session is a 44px `X` button pinned to the screen's top-right corner (`aria-label="Stop
workout"`) and routed through the same `useBlocker` confirmation as any other exit. The
countdown is sized with a container query on `.timer-ring`.

`useWakeLock()` requests a screen wake lock while running and re-requests on visibility
change. Audio needs a user gesture: `unlockAudio()` is called from the Start button and the
settings "Test" button. `beep()` and `vibrate()` read the settings store imperatively and
respect the sound/vibration toggles.

### 5.5 Finishing a workout

`RunPage` logs history exactly once:

```ts
if (finished && !loggedRef.current && workout) {
  addEntry({ id: crypto.randomUUID(), workoutId, workoutName, completedAt: Date.now(),
             durationSeconds: getTotalSeconds(workout), rounds: workout.rounds });
}
```

It also blocks navigation while `!finished` via `useBlocker` and shows a "Stop workout?"
confirmation. `durationSeconds` is the **planned** total, not elapsed wall-clock time.

### 5.6 History stats and charts

`features/history/stats.ts` (pure, unit-tested):

- `dayKey(ts)` -> local calendar key (exported; shared with charts). Note: uses 0-based
  month, so November 4 is `"2026-10-4"`. Keys are only compared, never displayed.
- `getStats(entries, now)` -> sessions, total seconds, current day streak (today or
  yesterday must be active, otherwise streak is 0).
- `groupByDay(entries, now)` -> groups labelled Today / Yesterday / weekday+date.

`features/history/charts.ts` (pure, unit-tested):

- `getVolume(entries, range, now)` -> `{ points, granularity, rangeLabel, rangeTitle }`,
  **zero-filled**, oldest first. `range` is `7 | 14 | 30 | "all"`. Days are built by
  decrementing a `Date` with `setDate`, which is DST-safe. Tick label is weekday for <= 7
  days, `Mon D` for longer ranges.
- "All time" starts at the earliest recorded session. Up to `WEEKLY_THRESHOLD_DAYS` (90) it
  uses daily buckets; beyond that it switches to weekly buckets so a years-long history does
  not become invisible 1px bars. The caption states the granularity.
- `getWorkoutBreakdown(entries, limit = 5)` -> grouped by workout name, sorted by seconds
  then sessions, remainder folded into one `"Other"` slice. Always all-time, independent of
  the volume range.
- `getRangeDelta(entries, days, now)` -> the last `days` days vs the `days` before them,
  matching the selected range. Not shown for "All time" (nothing precedes it).

`features/history/components/HistoryCharts.tsx` renders both charts with Recharts and is
**lazy-loaded** from `HistoryPage` so the library stays out of the entry chunk:

```tsx
const HistoryCharts = lazy(() => import("@/features/history/components/HistoryCharts"));
```

Build output confirms a separate `HistoryCharts-*.js` chunk (~419 kB raw / ~121 kB gzip).

Chart rendering rules that matter:

- Bars use `fill="var(--color-work)"`, axis text `var(--color-muted-foreground)`, axis line
  `var(--color-line)`. CSS variables work inside SVG, so light/dark need no JS.
- `isAnimationActive={false}` keeps E2E deterministic.
- **Recharts does not render a rectangle for a zero value.** E2E assertions on bar counts
  depend on this.
- `ResponsiveContainer` needs a parent with explicit height and `min-w-0`.
- Custom `<CategoryTick>` renders a plain SVG `<text>`; using the default YAxis tick wraps
  long workout names onto two lines.
- Each chart is a `<section aria-label="...">` (maps to `role="region"`) containing a
  `<figure>` with an `sr-only` `<figcaption>` that summarizes the data for screen readers.
- The volume card header has a `RangeMenu` dropdown (`7d` / `14d` / `30d` / `All`), defaulting
  to 7 days. Items are `role="menuitemradio"`; E2E selects them by name, not by index.
- When the selected range has no sessions, the chart is replaced by a short text message
  rather than an empty plot.
- Chart data is derived from `HistoryEntry` only, so no per-phase/intensity analysis is
  possible without a schema change.

### 5.7 Backup and import

`features/backup/backup.ts` is pure:

- `buildBackup(workouts, history)` -> `{ app: "tabata-timer", version: 1, exportedAt, ... }`.
- `parseBackup(text)` validates the envelope, rejects newer versions, then normalizes every
  workout and history entry, counting invalid ones as `skipped`.
- `planImport(existing, incoming)` dedupes by id. A workout whose id exists but whose content
  differs is imported as a copy with a new id and `" (imported)"` appended to its name.
- `backupFileName()` -> `tabata-backup-YYYY-MM-DD.json`.

`features/backup/io.ts` handles the browser side: on coarse pointers with `navigator.canShare`
it uses the share sheet, otherwise an anchor download. Import files are capped at 5 MB.
`lastBackup.ts` treats a backup older than 14 days as stale and formats "Today / Yesterday /
N days ago / date".

### 5.8 PWA and offline

- `vite.config.ts`: `registerType: "prompt"`, `injectRegister: false`, Workbox precache for
  js/css/html/svg/png/ico, `cleanupOutdatedCaches`, `clientsClaim`.
- `PWABadge` (rendered by the root route) calls `useRegisterSW`, polls for updates hourly,
  and shows toasts: "Ready to work offline" and "A new version is available" with a Reload
  action.
- `pwaInstall.ts` captures `beforeinstallprompt` at module load and exposes a tiny external
  store (`subscribePwaInstall`, `isStandaloneMode`, `isIosPlatform`, `IN_APP_BROWSER`).
  `InstallButton` renders nothing when standalone, iOS instructions on iOS, and the native
  prompt elsewhere.
- `devOptions.enabled` is `false`; `dev-dist/` only appears if you turn it on.

### 5.9 Theming and design tokens

Tokens live in `src/index.css`: raw values on `:root` / `.dark`, mapped to Tailwind via
`@theme inline` as `--color-*`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--surface` | `#f4f5f7` | `#0a0c10` | app background |
| `--surface-2` | `#ffffff` | `#131720` | cards, sheets |
| `--surface-3` | `#e8eaee` | `#1c222c` | chips, segmented controls |
| `--line` | `#d6dae1` | `#28303b` | borders, dividers |
| `--fg` | `#0d1117` | `#f3f5f9` | text |
| `--muted` | `#5b6472` | `#8b95a7` | secondary text (`text-muted-foreground`) |
| `--accent` | `#a8e000` | `#d4ff3a` | brand / volt lime (`bg-brand`) |
| `--work` | `#b8280c` | `#ff5a36` | work phases, destructive, chart bars |
| `--rest` | `#076a58` | `#2ee6c8` | rest phases |
| `--break` | `#1f57a7` | `#5aa9ff` | round rest |
| `--prepare` | `#924b04` | `#ffb020` | prepare phase |

Dark mode is a `.dark` class on `<html>` (`@custom-variant dark`), applied by
`features/theme/applyTheme.ts`, which also updates `<meta name="theme-color">`.
`useThemeSync` (root route) keeps it in sync with the store and `prefers-color-scheme`.

`index.css` also contains hand-written timer layout CSS (`.timer-layout`, `.timer-stage`,
`.timer-ring`, `.timer-countdown`, ...). A landscape media query switches the timer to
ring-left / controls-right on short viewports; a container query on `.timer-ring` sizes the
countdown, and short-portrait queries cap the ring. Prefer editing those classes over
duplicating layout logic in components.

### 5.10 Layout shell

- `PageContainer`: `mx-auto w-full max-w-md px-5 md:max-w-2xl`. Every tab page uses it.
- `PageHeader`: page title (h1) plus optional right slot.
- `TabsLayout`: `h-dvh` flex column, scrollable `main`, `AppNav` pinned at the bottom with
  safe-area padding and extra padding in standalone mode.
- Fullscreen surfaces (timer, editor) use `fixed inset-0 z-30` and their own header, and
  handle `env(safe-area-inset-*)` manually.

---

## 6. Conventions

**Components**

- Function components with named exports; pages are thin wrappers that read params/store and
  delegate to a feature screen.
- Props are inline object types unless reused. No `React.FC`.
- Tailwind classes inline; conditional classes via `cn()`.
- Destructive actions always go through `AlertDialog` / `ConfirmDialog`, never `confirm()`.
- Every page calls `useDocumentTitle(...)`.
- Toasts come from `features/toast/store` (`toast.success/error/info/delete`), never directly
  from the shadcn toast primitive.

**State**

- One Zustand store per feature, colocated with the feature. Select the narrowest slice:
  `useStore((s) => s.field)`.
- Pure logic (engine, stats, charts, backup, copyName) lives outside components so
  it can be unit-tested in the node environment.
- Time-dependent pure functions take an injected `now` for deterministic tests.

**Accessibility**

- Interactive non-buttons get `role`, `tabIndex`, and Enter/Space handling (see
  `WorkoutCard`).
- Icon-only buttons need `aria-label`.
- Dialogs: `AlertDialog` for destructive flows, `ConfirmDialog` (native `<dialog>` +
  `showModal`) for import confirmation.
- Timer announces phase changes and the 3/2/1 countdown through a `role="status"`
  `aria-live="polite"` region.
- Charts keep Recharts' default `accessibilityLayer` and add `sr-only` summaries.

**Formatting**

- `formatDuration(seconds)` -> `m:ss`, minutes unbounded (90 min renders `90:00`).
  `HistoryPage` has a local `formatTotal` for `1h 5m`; charts have `formatSecondsShort`.
- Dates use `Intl.DateTimeFormat(undefined, ...)` so they follow the user's locale.

---

## 7. Invariants and gotchas

1. **Storage keys are `tabata-*`.** They are user data. Changing a key without a migration
   silently wipes workouts/history. Bump `version` and add `migrate` if the shape changes.
2. **`index.html` reads `tabata-theme` directly.** Keep that script in sync with the theme
   store.
3. **History is capped at 1000 entries.** Anything presented as "all time" is really
   "last 1000 sessions". Add a lifetime counter store before claiming lifetime totals.
4. **The timer is not persisted.** A reload during a workout loses it. Do not "fix" this
   without being asked; it is a deliberate product decision.
5. **`durationSeconds` is the planned workout length**, not measured elapsed time, so
   duration charts reflect workout configuration rather than effort. This is why there is no
   session-duration trend chart.
6. **Recharts zero bars are invisible.** E2E bar-count assertions assume this; if you change
   to an explicit zero-height bar, those tests must change.
7. **Workout names appear twice on History** (entry list + chart axis/caption). E2E must scope
   by `data-testid="session-entry"` or by `role="region"`, never bare `getByText(name)`.
8. **The History chart bundle is lazy.** Do not import Recharts from `HistoryPage` or any
   eagerly loaded module, or the entry chunk grows by ~120 kB gzip.
9. **`/run` lives outside `TabsLayout`.** If you move it under tabs, the tab bar appears
   during workouts.
10. **Audio requires a gesture.** Any new sound must be reachable after `unlockAudio()`.
11. **`getTotalSeconds` and `buildPhases` are the only phase math.** Do not duplicate the
    prepare/round-rest/skip-last-rest rules in components.
12. **Local day boundaries, not UTC.** `dayKey` and chart buckets use local dates; do date
    arithmetic with `Date#setDate`, never by subtracting 86_400_000 ms (DST).
13. **shadcn here is Base UI, not Radix.** Props/behaviour differ (`data-checked`,
    `onCheckedChange`, `render` instead of `asChild` in places). Check the existing
    primitive before assuming Radix APIs.

---

## 8. Testing

### Unit tests (Vitest, node environment)

- Location: `src/__tests__/<feature>/*.test.ts`, mirroring `src/features`.
- Config in `vite.config.ts`: `environment: "node"`, `include: ["src/__tests__/**/*.test.ts"]`,
  `restoreMocks: true`.
- There is no DOM and no Testing Library, so component rendering is not unit-tested.
  Everything meaningful is extracted into pure functions.
- `src/__tests__/factories.ts` holds shared builders; `charts.test.ts` and `stats.test.ts`
  use fixed `new Date(2026, 10, 10, 12).getTime()` timestamps.
- Cover: engine phase building, timer store transitions, workout CRUD, validation, copy-name
  rules, history stats/charts, backup parse/plan, last-backup formatting.

### E2E tests (Playwright)

```
e2e/
├─ fixtures/workouts.ts     deterministic workouts (fastWorkout for short runs)
├─ fixtures/history.ts      historyEntries (2 recent) + historySpread (4 across days)
├─ support/seed.ts          seedWorkouts / seedHistory via addInitScript
├─ home.spec.ts             render, preview, start
├─ editor.spec.ts           defaults, fixed rest rows, name limits, create, edit, delete
├─ timer.spec.ts            pause/resume, stop confirmation, finish screen, finish -> history
├─ history.spec.ts          delete entry, clear all, charts + range dropdown
└─ settings.spec.ts         toggle persistence, backup reminder, export
```

Rules:

- Config: Chromium only, `baseURL http://localhost:4173`, webServer runs
  `npm run dev -- --port 4173 --strictPort`, `reuseExistingServer` outside CI.
- Seed state with `page.addInitScript` writing the exact persist envelope
  (`{ state: {...}, version: n }`) — this is why storage versions matter.
- **Use relative imports in `e2e/`** (`../../src/...`). Playwright's runtime does not resolve
  the `@/` tsconfig alias, even though `tsconfig.e2e.json` declares it for typechecking.
- Prefer roles and labels (`getByRole`, `getByLabel`). Use `exact: true` when a name is a
  prefix of another ("Start Core Burner" vs the card's button).
- Scope ambiguous text to a container (`getByTestId("session-entry")`,
  `getByRole("region", { name: "Training volume" })`).
- Don't assert on Recharts tooltips by hovering; assert `figcaption` summaries and bar counts.
- Artifacts (`test-results/`, `playwright-report/`, `blob-report/`) are git- and ESLint-ignored.

---

## 9. Known gaps / intentional omissions

- Workout preview modal has no `role="dialog"` or focus trap; E2E asserts its heading instead.
- No route-level code splitting; only the charts chunk is split. The main bundle is ~712 kB
  raw (~231 kB gzip), so `vite build` prints a >500 kB warning.
- No lifetime counters (see invariant 3).
- No resume-after-reload, no background notifications, no per-phase history data.
- No accounts, sync, or cloud backup by design.
- No dark/light screenshot regression tests; visual checks are manual.
- `README.md` project structure still lists a non-existent `src/app`.

---

## 10. Recipes

**Add a feature module**

1. `src/features/<name>/` with `store.ts` (if stateful), `types/schemas.ts` +
   `types/types.ts`, `components/`, and pure helpers at the feature root.
2. If persisted: `persist(..., { name: "tabata-<name>", version: 1, migrate })` and normalize
   with Zod in `migrate`.
3. Add a page in `src/pages/`, wire a route in `src/router.tsx` (tabs vs root), and add a nav
   entry in `AppNav` if it deserves a tab.
4. Add unit tests for the pure parts and an E2E spec if it changes user-visible state.

**Add a setting**

1. Field + setter in `features/settings/store.ts` (keep the existing version, or bump and
   migrate).
2. Row in `SettingsScreen` inside the right section, using `Switch` with
   `data-checked:bg-brand data-unchecked:bg-surface-3` and an `aria-label`.
3. E2E: toggle, reload, assert persisted value.

**Add a chart**

1. Pure aggregator in `features/history/charts.ts`, injectable `now`, plus unit tests.
2. Render inside `HistoryCharts.tsx` only — preserve the lazy boundary.
3. Theme via `var(--color-*)`, disable animation, add `sr-only` summary text.
4. E2E: assert the region, the caption text, and a structural count.

**Add a persisted field to Workout**

1. Update `SessionItemSchema` / `WorkoutSchema` with a `.default(...)` so old payloads still
   parse.
2. Bump `tabata-workouts` version and rely on `migrate` + `normalizeWorkout`.
3. Update the editor defaults and the E2E seed fixtures.
