# PadelOps — Development Roadmap

## Completed Sprints

| Sprint | Title | Status |
|---|---|---|
| S1–S4 | Core CRUD (players, sessions, attendance) | ✅ Complete |
| S5–S6 | Team Generator: enumerate, evaluate, constrain, score, analyze | ✅ Complete |
| S7 | Session Integration: session-team.service, session-record.service, workflow types | ✅ Complete |
| S8 | Session Detail UI: workflow phases, SuggestedMatchPanel, score entry | ✅ Complete |
| S9 | Schedule Domain Types: SessionSchedule, PlannedMatch, ScheduleQuality, PlayerRuntimeStatus | ✅ Complete |
| S10 | Schedule Engine: all 11 service operations, quality engine, PlanningContext | ✅ Complete |
| S11 | Schedule Review UI: read-only ScheduleReviewPanel, PlannedMatchCard | ✅ Complete |
| F1 | Tournament Format Infrastructure: registry, 5 formats, TournamentFormatDialog | ✅ Complete |
| F2 | Format Capabilities + Context-Aware Recommendations | ✅ Complete |
| F3 | Format Settings: dynamic renderer, validation, FormatSelectionConfig | ✅ Complete |
| F4 | Format Rule Model: TournamentRules (10 policy enums) | ✅ Complete |
| A2 | Format Domain Model: Statistics + Live Runtime sections | ✅ Complete |

---

## Current Sprint

**Sprint A3 — Wire Format Selection to Schedule Engine**

Goal: When the organiser confirms a format in `TournamentFormatDialog`, call `scheduleService.createSchedule()` with the right match count and constraints.

Tasks:
- Map `FormatSelectionConfig.settings` to `scheduleService.createSchedule(sessionId, count)` call
- Derive match count from the confirmed format settings
- Transition `SessionDetailPage` to show `ScheduleReviewPanel` after successful creation
- Apply format rules (TournamentRules policies) to constrain generation

Constraints: Do not modify the schedule engine. Do not add new database tables.

---

## Next Sprints

### Sprint A4 — Editing Operations UI
- Lock/Unlock match toggle in `PlannedMatchCard`
- Delete match from schedule
- Swap Player dialog
- Add Manual Match dialog
- Real-time quality score updates after each edit
- Warning display per match

### Sprint A5 — Start Session Gate
- "Start Session" button that transitions PLANNING → LIVE
- `currentMatchIndex` set to 0 on transition
- Completed matches become immutable in the UI
- Future matches remain editable

### Sprint A6 — Live Match Workflow
- Record match result while session is LIVE
- `matchesService.createMatch()` + `ratingService.rebuildRatings()`
- Advance `currentMatchIndex`
- "Keep Schedule / Optimize Remaining" post-recording decision

### Sprint A7 — Cleanup & Retirement
- Retire `MatchPlan`, old `SessionGeneration` top-level usage
- Remove `session-team.service.ts`, `session-record.service.ts` (replaced by `schedule.service.ts`)
- Final audit of stale code

---

## Future Ideas

| Feature | Notes |
|---|---|
| Multi-court scheduling | `courtNumber` field exists on `PlannedMatch`; engine needs assignment logic |
| Live ranking display | `liveRuntime.fields` defined per format; rendering not yet implemented |
| Undo / Redo | `version` field on `SessionSchedule` is ready; reducer pattern needed |
| Session templates | Save a format+settings combination as a named template |
| Export / print schedule | PDF or share-link for the organiser |
| Push notifications | Notify players when it's their turn |
| Automatic rating correction | Handle mis-recorded scores retroactively |
| Player elimination bracket | `EliminationPolicy: 'bracket'` is reserved in the type model |
| Score-threshold termination | `TerminationCondition: 'score-threshold'` is reserved |
| Time-limit termination | `TerminationCondition: 'time-limit'` is reserved |

---

## Technical Debt

| Item | Priority | Notes |
|---|---|---|
| Supabase transaction for match recording | High | Currently 5 sequential inserts with no rollback |
| `rebuildRatings()` replays full history | Medium | O(N) on all matches; will need incremental updates at scale |
| In-memory schedule lost on refresh | Accepted for V1 | Would require a session_schedules table to persist |
| `session-team.service.ts` parallel to `schedule.service.ts` | Low | Both serve overlapping purposes; retire after Sprint A7 |
| `session-generation.ts` types still in use | Low | Required by `session-record.service.ts`; retire in Sprint A7 |
| `match-plan.ts` still in use | Low | Required by `session-team.service.ts`; retire in Sprint A7 |
