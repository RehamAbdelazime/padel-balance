# PadelOps — Architecture Reference

## Project Overview

PadelOps is a Live Padel Session Manager. It helps organisers plan, run, and record padel sessions by generating balanced team matchups based on player ratings.

**Stack:** React 19 · TypeScript · Vite · Tailwind · shadcn/ui · Supabase · TanStack Query v5 · Zustand · React Hook Form · Zod

---

## Folder Structure

```
src/
├── app/
│   ├── router/          — React Router v6 route definitions
│   └── store/           — Global Zustand store (app-level state)
│
├── features/            — Feature modules (vertical slices)
│   ├── dashboard/       — Dashboard page
│   ├── matches/         — Match domain types
│   ├── players/         — Player management (CRUD, ratings display)
│   ├── rating/          — Rating engine (TrueSkill-inspired algorithm)
│   ├── reports/         — (Stub — future feature)
│   ├── sessions/        — Session management + schedule planning
│   ├── statistics/      — Player statistics
│   └── team-generator/  — Balanced team generation algorithm
│
├── infrastructure/
│   └── supabase/        — Supabase client + generated DB types
│
└── shared/
    ├── components/      — Reusable UI (layout, shadcn/ui primitives)
    ├── i18n/            — Internationalisation (English + Arabic, RTL)
    └── lib/             — Utility functions
```

---

## Feature Architecture

### `team-generator` — The Core Algorithm

Pure, stateless math layer. Has **zero knowledge** of sessions, UI, or Supabase.

```
team-generator/
├── constants/       — GENERATOR constants (weights, thresholds)
├── math/
│   ├── enumerate.ts  — Generate all valid 4-player splits (3 for 4 players)
│   ├── evaluation.ts — Compute balance metrics per candidate (conservativeDelta, etc.)
│   ├── scoring.ts    — Weighted scoring function (lower = fairer)
│   ├── constraints.ts— Filter candidates (partner cooldown, rating gap, sigma gap)
│   └── analysis.ts   — Aggregate statistics over all candidates
├── services/
│   ├── generator.service.ts — Pipeline: enumerate→evaluate→constrain→score→sort
│   └── generator.facade.ts  — Async wrapper: loads ratings then calls service
└── types/
    └── generator.ts  — GeneratorPlayer, GeneratorResult, GeneratorConfig, etc.
```

**Pipeline:** `enumerateCandidates → evaluateCandidate → satisfiesConstraints → scoreCandidate → analyzeResult`

### `rating` — TrueSkill-Inspired Rating Engine

```
rating/
├── math/             — Pure functions: expected score, uncertainty, form, performance
├── services/
│   ├── rating.service.ts    — RatingService singleton: rebuild, read, wait
│   └── rating-engine.ts     — processMatch(): compute rating updates
└── repository/
    └── rating.repository.ts — Supabase reads/writes for rating persistence
```

`ratingService.rebuildRatings()` replays all match history from Supabase to compute current ratings. Called at app bootstrap and after each recorded match.

### `sessions` — The Main Feature Module

```
sessions/
├── components/    — UI components (read-only in current sprint)
├── formats/       — Tournament Format registry (no scheduling logic)
│   ├── types.ts   — Full format domain model
│   ├── registry.ts— 5 built-in formats + recommendation engine
│   └── index.ts   — Public barrel
├── hooks/
│   ├── useSessions.ts     — TanStack Query: session CRUD
│   ├── useAttendance.ts   — TanStack Query: session players
│   ├── useMatches.ts      — TanStack Query: match history
│   └── useSchedule.ts     — In-memory schedule state manager
├── pages/
│   ├── SessionsPage.tsx      — Session list
│   └── SessionDetailPage.tsx — Main session workspace
├── services/
│   ├── sessions.service.ts      — Supabase CRUD for sessions
│   ├── attendance.service.ts    — Supabase reads/writes for attendees
│   ├── matches.service.ts       — Supabase match creation/reads
│   ├── schedule.service.ts      — Schedule engine (all planning operations)
│   ├── session-team.service.ts  — MatchPlan generation (pre-schedule architecture)
│   └── session-record.service.ts— Match recording pipeline (architecture placeholder)
├── types/
│   ├── index.ts             — Type barrel
│   ├── schedule.ts          — SessionSchedule + all sub-types (Sprint 9)
│   ├── session-generation.ts— Per-match workflow types (legacy, in-use by record service)
│   └── match-plan.ts        — MatchPlan type (legacy, in-use by session-team service)
└── utils/
    ├── planning-context.ts   — PlanningContext: tracks history for fair rotation
    └── result-to-match-data.ts— Converts GeneratorResult → CreateMatchData
```

---

## Tournament Format Architecture

### Format Registry (`sessions/formats/`)

The registry is the **single source of truth** for every tournament format. The scheduling engine never contains `if (format === 'americano')`. Instead, it reads policies from the format definition.

**5 built-in formats:** Americano · Mexicano · Round Robin · King of the Court · Custom

Each `TournamentFormat` contains:

| Section | Purpose |
|---|---|
| **Metadata** | id, name, description, category, difficulty |
| **Requirements** | minimumPlayers, maximumPlayers, supportsOddPlayers, supportsMultipleCourts |
| **Capabilities** | supportsManualMatches, supportsRegeneration, supportsLiveRanking, etc. |
| **Statistics** | Which stats are tracked and how they rank players |
| **Live Runtime** | State fields that must exist while the tournament is running |
| **Rules (machine-readable)** | `TournamentRules`: 10 policy enums consumed by the scheduling engine |
| **Rule Notes (human-readable)** | Organiser-facing descriptions of the rules |
| **Settings** | Configurable parameters (number-of-rounds, scoring type, etc.) |

**Recommendation engine** (`getFormatsWithRecommendations(context)`):
- Takes `{ playerCount, courtCount, estimatedDurationMinutes? }`
- Returns all formats with a `FormatRecommendation` (fit: great/good/fair/not-recommended + score + reason + warnings)
- Formats are **never disabled** — low scores surface as warnings only

---

## Schedule Architecture

### `SessionSchedule` (Sprint 9 Core Types)

The `SessionSchedule` is the in-memory single source of truth during planning.

```typescript
SessionSchedule {
  sessionId, phase, version,
  matches: PlannedMatch[],
  quality: ScheduleQuality,
  targetCount,
  playerRatings,    // RatingState snapshot for quality computation
  playerStates,     // AVAILABLE | PLAYING | RESTING | LEFT_SESSION | SKIP_NEXT_MATCH
  currentMatchIndex // null during PLANNING
}
```

**Key rules:**
- Every field is `readonly`. All mutations return a new `SessionSchedule`.
- `version` increments exactly once per top-level mutation (for future undo/redo).
- `playerRatings` is captured at creation — stored for immediate balance evaluation.
- The schedule is **ephemeral** (in-memory). Only recorded match data reaches Supabase.

### `PlannedMatch`

```typescript
PlannedMatch {
  id, origin, protection, modified, courtNumber,
  teamA: [string, string], teamB: [string, string],
  balanceScore, explanation, warnings,
  isCompleted, result?
}
```

**Origin:** `AUTO | MANUAL` — how the match was created  
**Protection:** `LOCKED | UNLOCKED` — whether regeneration can overwrite it

**Preservation predicate** (applied by all regeneration operations):
```
preserved(match) = match.isCompleted OR match.protection === 'LOCKED' OR match.origin === 'MANUAL'
```

### Schedule Quality Engine

5 independent dimensions, each 0–100:

| Dimension | Weight | Source |
|---|---|---|
| Rating Balance | 30% | `conservativeRating(mu, sigma)` per player — independent of `balanceScore` |
| Equal Play Time | 25% | Coefficient of variation of `matchesPlayed` |
| Partner Diversity | 20% | Max repeat pairing count across all players |
| Opponent Diversity | 15% | Max repeat opponent count |
| Rest Balance | 10% | Coefficient of variation of `matchesRested` |

Quality is recalculated after every schedule mutation.

### `schedule.service.ts` — 11 Public Operations

| Operation | Async | Effect |
|---|---|---|
| `createSchedule` | ✓ | Loads ratings, generates N matches using PlanningContext |
| `regenerateCurrentMatch` | ✓ | Replaces current slot, preserves all others |
| `regenerateRemainingMatches` | ✓ | Replaces all after current, preserves completed/locked/manual |
| `regenerateEntireSchedule` | ✓ | Replaces all non-preserved |
| `recalculateBalanceOnly` | ✓ | Updates balance scores without changing teams |
| `addManualMatch` | ✗ | Appends MANUAL match; evaluates balance from stored ratings |
| `removeMatch` | ✗ | Removes non-completed non-locked match |
| `swapPlayer` | ✗ | Replaces one player; marks match modified; evaluates balance |
| `lockMatch` | ✗ | Sets protection = LOCKED |
| `unlockMatch` | ✗ | Sets protection = UNLOCKED |
| `setPlayerStatus` | ✗ | Updates runtime availability |

### `PlanningContext`

Accumulated across matches to drive fair player selection:

```
PlayerPlanState {
  matchesPlayed, matchesRested, consecutiveRests,
  partnerFreq: Map<id, count>,
  opponentFreq: Map<id, count>,
  recentPartnerIds: string[]  // sliding window = PARTNER_COOLDOWN = 2
}
```

**Player selection order (per match):**
1. Exclude `LEFT_SESSION`, `PLAYING`
2. Exclude `SKIP_NEXT_MATCH` (reset to AVAILABLE after exclusion)
3. Deprioritise `RESTING`
4. Among eligible: fewest `matchesPlayed` → most `consecutiveRests` → original order

---

## Session Workflow (Current State)

```
SessionsPage
  ↓
SessionDetailPage
  ├── Attendance (add/remove players, ≥ 4 required)
  ├── SessionReadyCard (shown when ≥ 4 players, no schedule yet)
  │     ↓ "Generate Matches"
  │   TournamentFormatDialog
  │     — Reads formats from registry
  │     — Shows fit-based recommendations
  │     — Collects format + settings configuration
  │     — Returns FormatSelectionConfig (stored, not yet consumed by engine)
  │
  ├── ScheduleReviewPanel (shown when schedule !== null)
  │     — Read-only: summary, quality dimensions, player status, match list
  │     — PlannedMatchCard per match (no editing actions yet)
  │
  └── Match History (recorded matches, always visible)
```

**Current gap (Sprint A3 target):** `FormatSelectionConfig` is collected but not yet passed to `scheduleService.createSchedule()`. The schedule panel shows after `scheduleHook.create(count)` succeeds.

---

## Completed Work

| Sprint | Deliverable |
|---|---|
| S1–S8 | Core CRUD: players, sessions, attendance, matches, ratings |
| S9 | `SessionSchedule` domain types: PlannedMatch, ScheduleQuality, PlayerRuntimeStatus |
| S10 | `scheduleService`: all 11 operations, quality engine, planning context |
| S11 | Schedule Review UI (read-only): ScheduleReviewPanel, PlannedMatchCard |
| F1 | Tournament Format registry: 5 formats, TournamentFormatDialog (replaces count dialog) |
| F2 | Rich format metadata: capabilities, recommendations with context, FormatRecommendationContext |
| F3 | Format Settings: dynamic settings renderer, validation, FormatSelectionConfig |
| F4 | Rule Model: TournamentRules (10 policy enums), per-format behavioural specification |
| A2 | Format domain model: Statistics, Live Runtime sections on all 5 formats |

---

## Future Architecture

### Sprint A3 — Wire Format Selection to Schedule Engine
- Pass `FormatSelectionConfig` to `scheduleService.createSchedule()`
- Map format rules to schedule generation constraints
- The engine reads `TournamentRules` instead of branching on format ID

### Sprint A4 — Editing Operations
- Lock/Unlock, Delete, Swap Player, Add Manual Match (UI layer — service is ready)
- Live quality score updates in panel

### Sprint A5 — Start Session Gate
- PLANNING → LIVE transition
- `currentMatchIndex` set to 0
- Completed matches become immutable

### Sprint A6 — Live Match Workflow
- Record result, update ratings, advance currentMatchIndex
- "Optimize Remaining" post-recording option

### Sprint A7 — Cleanup & Retirement
- Retire `MatchPlan`, `SessionGeneration` discriminated union from top-level state
- Remove `session-team.service.ts` and `session-record.service.ts` (replaced by schedule.service.ts)

---

## Important Design Decisions

### 1. In-Memory Schedule (No DB Persistence)
The `SessionSchedule` is ephemeral. Refreshing the browser during planning resets it. Only match results (via `matchesService.createMatch()`) reach Supabase. Accepted for V1.

### 2. Ratings Rebuilt from Full History
`ratingService.rebuildRatings()` replays ALL recorded matches on every call. Not incremental. Accepted while match counts are small (< 500).

### 3. Quality Uses Player Ratings Directly
`dimRatingBalance` calls `conservativeRating(mu, sigma)` per player — it does NOT use `PlannedMatch.balanceScore`. Quality and match balance are independent analyses.

### 4. `nextSchedule()` = Single Version Increment
Every top-level mutation goes through `nextSchedule(prev, updates)`. This is the only place `version` increments, ensuring monotonicity.

### 5. Format Registry is the Algorithm's Contract
The scheduling engine reads `TournamentRules` policy enums. No `if (formatId === 'americano')` anywhere in the engine. Each format declares its own behaviour.

### 6. `FormatSelectionConfig` Carries Settings but No Match Count
The dialog emits `{ formatId, settings, playerCount, courtCount }`. The match count is derived from `format.defaultMatchCount` or a custom setting — never a hardcoded dialog option.

---

## Known Limitations

1. **No transactions** — `matchesService.createMatch()` runs 5 sequential Supabase inserts. If `rebuildRatings()` fails after a successful insert, the match is in DB but ratings are stale until next rebuild.

2. **Single court only** in current UI — multi-court support is architecturally planned (courtNumber field exists on PlannedMatch) but not wired.

3. **Odd player support** varies by format — `selectPlayersForMatch` handles N > 4 correctly but King of the Court is the only format that explicitly supports odd counts.

4. **Placeholder Supabase credentials** — requires real project credentials to function at runtime.

5. **Schedule lost on refresh** — intentional for V1 (in-memory only).

---

## Postponed Features

- Multi-court scheduling
- Live ranking display during session
- Player elimination bracket formats
- Export / print schedule
- Session templates
- Undo/Redo (version field is ready; reducer not implemented)
- Autosave (version field enables conflict detection when ready)

---

## Coding Principles

- **Additive only**: No backward-breaking changes until old code is explicitly retired
- **Single source of truth**: One canonical definition for every piece of logic
- **No business logic in hooks**: Hooks are thin wrappers — service layer owns all logic
- **Pure factory functions**: Domain state transitions are pure functions returning new objects
- **No magic numbers**: Every constant lives in a dedicated constants file
- **No mutation**: All schedule mutations return new objects; existing objects are never modified
- **Gates always pass**: `typecheck + build + lint` must pass after every logical step
- **Minimal diffs**: Only touch files that need changing
