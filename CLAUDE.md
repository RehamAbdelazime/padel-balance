# Claude Code — PadelOps Development Instructions

## Project Philosophy

This is a **Live Padel Session Manager**. The organiser is always in control. The algorithm suggests; the organiser decides. The scheduling engine never forces outcomes.

---

## How Claude Code Must Respond

- Return **only modified files**, unless explicitly asked for full files.
- Prefer **minimal diffs** with clear insertion/replacement locations.
- Never rewrite unrelated files.
- Never return ZIP files unless explicitly requested.
- Never regenerate entire files unless the change touches > 60% of the file.
- **Explain only the modified files** — not unchanged code.
- Stop after each sprint. Do not continue automatically.
- Run `typecheck + build + lint` before declaring any task complete.
- Never implement features that were not explicitly requested.
- Always wait for confirmation before starting the next sprint.

---

## Architecture Rules

### General
- Keep all business logic in **services**, not hooks or components.
- Hooks are thin wrappers: they call service methods and manage loading/error state.
- Components are thin renderers: they call hook methods and render results.
- No `if (format === 'americano')` anywhere in the engine — read `TournamentRules` policies instead.
- Every domain mutation returns a **new object** — never mutate existing state.

### Session Feature
- `session.service.ts` — Supabase CRUD only
- `schedule.service.ts` — all schedule planning logic
- `useSchedule.ts` — single hook that wraps all schedule operations
- `SessionDetailPage.tsx` — orchestrates everything; no business logic

### Team Generator
- Pure math layer. Zero knowledge of sessions, UI, or Supabase.
- Never modify the algorithm without an explicit sprint approval.
- The engine pipeline: `enumerate → evaluate → constrain → score → analyze`

### Format Registry
- `sessions/formats/` is the single source of truth for all tournament formats.
- Never hardcode format-specific behaviour outside the registry.
- `TournamentRules` policies drive the engine — add new policy variants when new behaviour is needed.
- `FormatStatistics` and `FormatLiveRuntime` describe behaviour — no implementation logic.

### Schedule Architecture
- `SessionSchedule` is ephemeral (in-memory only). Only match results reach Supabase.
- `version` increments exactly once per top-level mutation through `nextSchedule()`.
- `playerRatings` is captured at schedule creation time.
- Quality uses player ratings directly (`conservativeRating`) — NOT `PlannedMatch.balanceScore`.

---

## Coding Rules

- **No magic numbers** — every constant in a constants file.
- **No any** — never use TypeScript `any`.
- **No casts** — avoid `as X` unless explicitly justified.
- **No ESLint suppression** — fix the code, not the warning.
- **Immutable types** — all domain types use `readonly` on every field.
- **Additive only** — no backward-breaking changes without explicit retirement of old code.
- **Single source of truth** — one canonical definition for every piece of logic.
- **No duplicate logic** — if two functions do the same thing, extract a shared helper.
- **RTL-compatible** — use `me-`/`ms-` margin utilities, never `mr-`/`ml-`.

---

## Important Constraints

- Do **not** modify the rating engine without an explicit sprint.
- Do **not** add Supabase tables without a migration and explicit approval.
- Do **not** implement scheduling algorithms inside format definitions.
- Do **not** implement features reserved for future sprints (undo/redo, multi-court assignment, bracket elimination).
- Do **not** add React to service files.
- Do **not** add Supabase calls to hooks — only service calls.
- Keep `session` and `team-generator` features **independent** — no direct cross-imports.

---

## Current Folder Structure

```
src/
├── app/router/             — Route definitions
├── app/store/              — App-level Zustand store
├── features/
│   ├── dashboard/          — Dashboard page
│   ├── players/            — Player CRUD + ratings display
│   ├── rating/             — Rating engine (TrueSkill-inspired)
│   ├── sessions/
│   │   ├── components/     — UI components
│   │   ├── formats/        — Tournament Format registry (types, registry, index)
│   │   ├── hooks/          — useSchedule, useSessions, useAttendance, useMatches
│   │   ├── pages/          — SessionsPage, SessionDetailPage
│   │   ├── services/       — sessions, attendance, matches, schedule, session-team, session-record
│   │   ├── types/          — SessionSchedule, PlannedMatch, MatchPlan (legacy), session-generation (legacy)
│   │   └── utils/          — planning-context, result-to-match-data
│   ├── statistics/         — Player stats
│   └── team-generator/     — Team generation algorithm (pure math)
├── infrastructure/supabase/— Supabase client + DB types
└── shared/                 — UI components, i18n, utils
```

---

## Current Implementation Status

### Completed
- ✅ Player management (CRUD, archiving)
- ✅ Session management (CRUD, archiving)
- ✅ Attendance management (add/remove players)
- ✅ Match recording (manual entry with score)
- ✅ Rating engine (TrueSkill-inspired, rebuilt from history)
- ✅ Team generator (enumerate + evaluate + constrain + score + analyze)
- ✅ Schedule domain types (SessionSchedule, PlannedMatch, ScheduleQuality, PlayerRuntimeStatus)
- ✅ Schedule engine (scheduleService — 11 operations, quality, planning context)
- ✅ Schedule Review UI (read-only panel with quality breakdown and match list)
- ✅ Tournament Format registry (5 formats with full metadata)
- ✅ Format capabilities + context-aware recommendations
- ✅ Format settings (dynamic renderer, validation)
- ✅ Format rule model (TournamentRules — 10 policy enums)
- ✅ Format statistics + live runtime declarations

### In Progress (Sprint A3)
- 🔄 Wire `FormatSelectionConfig` to `scheduleService.createSchedule()`
- 🔄 Map format settings to schedule constraints

### Not Started
- ❌ Editing operations UI (lock, delete, swap, add manual)
- ❌ Start Session gate (PLANNING → LIVE)
- ❌ Live match workflow (record result → advance index)
- ❌ Multi-court support
- ❌ Live ranking display

---

## Key Files

| File | Purpose |
|---|---|
| `sessions/formats/types.ts` | Full format domain model — all types |
| `sessions/formats/registry.ts` | 5 built-in formats + recommendation engine |
| `sessions/types/schedule.ts` | SessionSchedule, PlannedMatch, ScheduleQuality, etc. |
| `sessions/services/schedule.service.ts` | All 11 schedule operations |
| `sessions/utils/planning-context.ts` | PlanningContext + player selection logic |
| `sessions/hooks/useSchedule.ts` | Schedule state manager for React |
| `sessions/pages/SessionDetailPage.tsx` | Main session workspace |
| `sessions/components/ScheduleReviewPanel.tsx` | Read-only schedule panel |
| `sessions/components/TournamentFormatDialog.tsx` | Format selection dialog |
| `team-generator/services/generator.service.ts` | Core team generation pipeline |
| `rating/services/rating.service.ts` | Rating rebuild + read service |

---

## Sprint Workflow

Each sprint must:
1. State its goal and scope before writing any code.
2. Read all relevant files before making changes.
3. Make minimal changes only — no opportunistic refactoring.
4. Run `typecheck + build + lint` after every logical step.
5. Return only modified file paths and diffs.
6. Stop and wait for confirmation.

Never continue to the next sprint automatically.
