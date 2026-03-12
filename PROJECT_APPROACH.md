# Mini Project Approach: Next.js Workout Builder for Wahoo

## Goal
Build a small Next.js app where you create structured, time-based bike workouts and export them as `.fit` files that you copy to your Wahoo over USB.

## MVP Scope (keep it minimal)
- Build workout in browser (name, steps, duration, target).
- Export valid `workout.fit`.
- User copies the file to the Wahoo `plans` folder over USB.
- No account sync, no cloud integration, no mobile app integration.

## Confirmed device constraints
- Wahoo ELEMNT ACE/BOLT 3/ROAM 3 accept planned workout `.FIT` files over USB.
- Structured workouts go in the `plans` folder.
- On newer devices, USB access is disabled by default and must be enabled in the Wahoo app.

## Recommended stack
- Framework: `next` (App Router) + `react` + `typescript`
- UI: `tailwindcss` + simple component library (`shadcn/ui` optional)
- Forms/validation: `react-hook-form` + `zod`
- FIT encoding/decoding: `@garmin/fitsdk` (official Garmin JS SDK, includes `Encoder`)
- Local persistence (optional in phase 2): JSON file or SQLite (`better-sqlite3`) if you want saved workouts
- Testing: `vitest` for mapper/encoder logic

## Data model (internal app model)
```ts
type Target =
  | { type: "none" }
  | { type: "power_pct_ftp"; low: number; high: number }
  | { type: "power_watts"; low: number; high: number }
  | { type: "hr_zone"; zone: 1 | 2 | 3 | 4 | 5 };

type WorkoutStep = {
  name: string;
  durationSec: number;
  target: Target;
  intensity: "warmup" | "active" | "recovery" | "cooldown";
};

type Workout = {
  name: string;
  sport: "cycling";
  steps: WorkoutStep[];
};
```

## FIT export strategy
- Convert app model -> FIT messages (`file_id`, `workout`, `workout_step`).
- Use `@garmin/fitsdk` `Encoder` in a Next.js server action or route handler.
- Return binary as downloadable `.fit`.
- Add a decode check (same SDK `Decoder`) in tests to verify exported messages look correct.

## Project phases
1. Setup and basic UI
   - New Next.js app
   - Workout step list editor (add/remove/reorder)
   - Live workout summary (total duration, interval count)
2. Export pipeline
   - Mapper from UI model to FIT message objects
   - `.fit` download button
   - Basic validation (duration > 0, sane ranges)
3. Compatibility pass
   - Test with your sample `.fit` files for shape comparison
   - Load exported file on Wahoo via USB -> `plans` folder
4. Nice-to-have
   - Workout templates (e.g., threshold, VO2, endurance)
   - Workout library (save/load JSON in app)

## Suggested package install (after scaffolding)
```bash
npx create-next-app@latest .
npm install @garmin/fitsdk react-hook-form zod @hookform/resolvers
npm install -D vitest
```

## What not to build yet
- Direct USB write from browser
- TrainingPeaks/Intervals APIs
- Multi-user auth
- Full calendar/planner

This keeps the project focused on learning the Next.js stack while still delivering practical `.fit` files for Wahoo.
