# Wahoo Workout Builder

A structured cycling workout builder that exports `.fit` files for Wahoo and Garmin devices.

## What this project does

- Set FTP once and build interval workouts quickly.
- Start from prefilled workouts (threshold, sprint, endurance, recovery).
- Add/edit/reorder steps with targets and intensity.
- Preview workout profile and estimated TSS.
- Export a validated `.fit` workout file from a server-side route.

## Tech stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- `@garmin/fitsdk` for FIT encoding/decoding

## Project layout

- `src/app/page.tsx` - thin app entrypoint
- `src/features/workout-builder/` - feature module (UI, hook, constants, logic, types)
- `src/lib/workout-model.ts` - shared domain model + validation
- `src/lib/fit-export.ts` - FIT message mapping/encoding
- `src/app/api/export-fit/route.ts` - export endpoint (`POST /api/export-fit`)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## How to use

1. Enter your FTP.
2. Choose a prefilled workout or build one step-by-step.
3. Validate/edit intervals and targets.
4. Click **Export .FIT** to download the file.

## Import `.fit` into your bike computer

### Wahoo

- Export from the app.
- Connect your Wahoo via USB.
- Copy the `.fit` file to the device `plans` folder.

#### macOS

- If the device is not visible in Finder, use an MTP tool like Android File Transfer (or OpenMTP).
- Open device storage and copy to `plans`.

#### Windows

- Open File Explorer.
- Open the device storage, then `plans`.
- Paste the `.fit` file and safely eject.

### Garmin

- Export from the app.
- Connect your Garmin via USB.
- Copy the `.fit` file to `Garmin/NewFiles` (common on Edge devices).
- Safely disconnect; the device imports it on restart/sync.

#### macOS

- If storage is not visible in Finder, use Android File Transfer (or OpenMTP).
- Copy into `Garmin/NewFiles`.

#### Windows

- In File Explorer, open device storage.
- Go to `Garmin/NewFiles` and paste the file.

Note: exact folder behavior can vary by device model and firmware.

## Scripts

- `npm run dev` - start local development server
- `npm run lint` - run lint checks
- `npm run build` - production build verification

## Local docs

Detailed planning/security docs are in `docs/` locally.

Important: `/docs` is intentionally listed in `.gitignore`, so files in that folder are local-only by default.
