# Phase 2 Parallel Thread Handoff

Use this in a new thread to start server-side FIT export while Phase 1 UI keeps evolving.

## Current stable base
- Client workout editor is implemented in `src/app/page.tsx`.
- Shared domain model + validation lives in `src/lib/workout-model.ts`.
- Phase 1 passes:
  - `npm run lint`
  - `npm run build`

## Phase 2 objective
- Add server-side export: convert a validated `Workout` model into downloadable `.fit`.

## Contract to reuse (do not change)
- Import `Workout` and `validateWorkout` from `src/lib/workout-model.ts`.
- Only accept payloads that pass validation.

## Minimal server build plan
1. Install FIT SDK
   - `npm install @garmin/fitsdk`
2. Add route handler
   - `src/app/api/export-fit/route.ts`
   - `POST` body: `Workout`
   - Validate payload with `validateWorkout`
   - Encode FIT and return `application/octet-stream` with `Content-Disposition: attachment; filename="<workout-name>.fit"`
3. Add mapper
   - `src/lib/fit-export.ts`
   - Map internal model -> FIT messages (`file_id`, `workout`, `workout_step`)
4. Add smoke test
   - Encode a tiny workout and decode/inspect key message presence.

## Thread starter prompt (copy into new thread)
Build Phase 2 for this Next.js project.
Implement server-side FIT export in `src/app/api/export-fit/route.ts` using `@garmin/fitsdk`.
Reuse the `Workout` model and `validateWorkout` from `src/lib/workout-model.ts`.
Keep changes minimal and production-oriented.
