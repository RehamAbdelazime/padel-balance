# Tournament Creation Wizard — Redesign Spec (Future)

**Status: design only. No code was changed for this document.**

This is a UX specification for a future sprint, to be implemented **after the
Live Runtime work is complete**. It does not modify `SchedulePlanningWizard.tsx`,
`planner/`, `generators/`, `constraints/`, `schedule.service.ts`, `runtime/`,
or the database schema. Nothing here is wired up yet.

---

## Goal

Get an organiser from "nothing" to a generated schedule in under 15 seconds
of actual input, by asking only for what the organiser must decide and
computing everything else. Every field in the spec below is justified against
one question: *"Why does the organizer actually need to enter this?"* Fields
that fail that test are removed or replaced with a computed default.

---

## Relationship to the current implementation

The current wizard (`SchedulePlanningWizard.tsx` + `planner/`) already has most
of the *data model* this redesign needs — it just doesn't expose all of it in
the UI yet, and it asks a few questions in implementation terms rather than
organiser terms. Concretely, `TournamentPlan` (`planner/planner.types.ts`)
already carries:

- `courtCount`, `reservationDurationMinutes` — exactly the "Number of Courts"
  and "Reserved Court Time" this spec wants surfaced in Step 1.
- `formatId`, `settings` — the format choice and its per-format options,
  already registry-driven (`formats/registry.ts`), already "only show options
  that belong to the selected format" (each format only lists its own
  `settings` array).
- `estimatedRounds`, `estimatedMatches`, `estimatedDuration`,
  `estimatedAverageRest`, `fairnessScoreEstimate`, `warnings`,
  `readyToGenerate` — everything Step 3's preview needs already exists as
  plan fields.

So this redesign is primarily a **UI/flow reorganisation** of data that
already exists, plus a small number of genuinely new organiser-facing
concepts (Match Type as a plain-language toggle, Scheduling Goal as a
3-way choice). See "Backend implications" below for the one place this
isn't quite true yet.

---

## Step 1 — Session

Fields, each justified:

| Field | Why the organiser enters it |
|---|---|
| Session Name | No reasonable default exists. |
| Date | No reasonable default exists. |
| Start Time | Needed for auto-start (already persisted since Sprint F22 — `sessions.start_time`). |
| Reserved Court Time | Needed to compute "Fill Reserved Court Time" scheduling goal (Step 2) and the duration warning already in `TournamentPlan.warnings`. |
| Number of Courts | Needed for match-count/round-count math and court assignment. |
| Notes | Optional, organiser-authored, no default possible. |

Nothing tournament-format-related belongs on this screen — no format choice,
no match type, no scheduling goal. This screen is about the physical booking
(when, where, how long, how many courts), not about how the tournament plays.

**Open question, not resolved by this doc:** today, Session Name/Date/Notes
persist to the `sessions` table, but Reserved Court Time and Number of Courts
exist only as ephemeral `TournamentPlan` fields inside the wizard (created
fresh via `plannerService.createPlan({ playerCount, courtCount })` each time
the wizard opens — see `SchedulePlanningWizard.tsx`). Moving these two fields
to "Step 1 of session creation" is a pure UI reordering as long as they
continue to live only in the in-memory plan. If a future implementer instead
wants them to persist per-session (so they don't have to be re-entered every
time the wizard reopens), that requires two new `sessions` columns and is a
**real backend change** — flag it and get sign-off before doing it, per this
sprint's own instruction. The recommended default is: **don't persist them**;
keep them wizard-local exactly as `courtCount`/`reservationDurationMinutes`
are today. That keeps this entire redesign a frontend-only change.

---

## Step 2 — Tournament

### Format selection

Unchanged in spirit from today: `getFormatsWithRecommendations()` already
sorts Americano/Mexicano/Round Robin/King of the Court/Custom by fit for the
current player/court count. After a format is picked, only that format's own
`TournamentSetting[]` array is shown — this is also already true today
(`SchedulePlanningWizard`'s configure step maps over `selectedFormat.settings`
only). No change needed here beyond the visual redesign.

### Match Type (new organiser-facing framing)

Today, `TournamentSetting` exposes raw settings like Americano's
`points-per-match` (default 24) or Mexicano's `winning-score` (default 21) —
implementation-shaped values. Replace with:

> **Match Type**
> ○ Time-based → **Match Duration (minutes)**
> ○ One Set → **Games per Set** (default 6)

This is a presentation-layer mapping, not a new scheduling capability:
"One Set, Games per Set" still needs to resolve to a points-per-match /
winning-score number under the hood for the formats that use one (Americano,
Mexicano, King of the Court's points-to-win). That mapping (games-per-set →
points target) is a small, format-registry-level concern — likely a new
derived field or lookup table in `formats/registry.ts`'s settings metadata,
**not** a generator or constraint change. Time-based match type is new in the
sense that no current format setting represents "play for N minutes, not to
a score" — King of the Court already has a `time-per-round` setting
(`'none' | '5' | '7' | '10'`) that's the closest existing analogue; a
full Time-based mode for the score-based formats would need the runtime
(match end detection) to support a clock-based end condition. **That is a
Live Runtime concern, out of scope until Runtime lands** — which is exactly
why this whole sprint is deferred.

### Scheduling Goal (replaces "Number of rounds")

> **Scheduling Goal**
> ○ Fill Reserved Court Time *(Recommended)*
> ○ Fixed Number of Matches → shows **Matches** field
> ○ Fixed Number of Rounds → shows **Rounds** field

Mapping to today's model:
- "Fixed Number of Matches" is exactly today's existing settings
  (`number-of-rounds` for Americano, `match-count` for Custom, etc.) — same
  field, renamed/regrouped under this radio choice.
- "Fixed Number of Rounds" is new terminology for multi-court formats where
  round count ≠ match count (`estimatedRounds` already exists on
  `TournamentPlan` and is already computed as
  `ceil(estimatedMatches / courtCount)` in `planner.service.ts`— the reverse
  direction, "solve for matches given desired rounds," is a one-line change
  to that same function once this is implemented).
- "Fill Reserved Court Time" is the only genuinely new computation: given
  `reservationDurationMinutes`, `courtCount`, and the match type's expected
  duration, compute the match count that fills the window. This is planner
  arithmetic (`plannerService.estimate()`), not a generator or constraint
  change — it's the same category of computation `estimatedDuration` already
  does today, just solved in the opposite direction (duration → match count
  instead of match count → duration).

None of the above requires touching `generators/`, `constraints/`, or
`schedule.service.ts` — the generator still only ever receives a final
`estimatedMatches` number via `TournamentPlan`, exactly as it does today.

---

## Step 3 — Preview (no configuration)

Read-only. Every value already exists on `TournamentPlan` today:

| Displayed | Source (today) |
|---|---|
| Players | `plan.playerCount` |
| Courts | `plan.courtCount` |
| Matches | `plan.estimatedMatches` |
| Rounds | `plan.estimatedRounds` |
| Estimated Duration | `plan.estimatedDuration` |
| Average Rest | `plan.estimatedAverageRest` |
| Fairness | `plan.fairnessScoreEstimate` (see presentation redesign below) |
| Warnings | `plan.warnings` |
| Generate button | `plan.readyToGenerate` gates it, same as today |

No new plan fields are needed for this step — only new presentation.

### Fairness presentation

Keep `fairnessScoreEstimate: number | null` as the internal value — nothing
about `plannerService.estimate()` changes. Add a presentation layer that maps
the number to a qualitative summary, e.g.:

```
score >= 90 → ★★★★★ Excellent
score >= 75 → ★★★★☆ Good
score >= 55 → ★★★☆☆ Fair
score >= 35 → ★★☆☆☆ Uneven
else        → ★☆☆☆☆ Poor
```

Below the stars, show 2–3 short generated sentences derived from the same
data already driving `plan.warnings` and `plan.recommendation.reason` (e.g.
partner-repeat likelihood, rest balance, opponent repetition) — this is
string composition in the UI layer, not a new scoring computation. The raw
number can still be shown small/secondary for organisers who want it.

---

## Future Defaults Wizard (explicitly deferred — not this sprint, not the next one either)

On first app launch, ask once and persist as organiser-level defaults:

- Preferred match type (Time-based / One Set)
- Typical match duration
- Typical set size (games per set)
- Golden Point? (yes/no)
- Tie-break rules
- Default court count
- Default reserved duration

Once set, session creation collapses to: **Session Name → Date → Tournament
Format → Generate**, with everything else pre-filled from the saved defaults
(still editable per-session via the full wizard if the organiser wants to
override for one event).

This requires a new persisted "organiser preferences" concept — almost
certainly a new table or a settings blob, since there is currently no
per-organiser (as opposed to per-session) storage anywhere in the schema.
**This is a real backend change and is explicitly out of scope until it is
its own sprint**, per the instructions for this document.

---

## Summary: what would need to change when this is implemented

**No changes needed to:** `generators/`, `constraints/`, `rules/`,
`schedule.service.ts`, `runtime/`, rating engine, database schema (assuming
the "don't persist court count/reserved time" recommendation above is
followed).

**Frontend-only changes when implemented:** `SchedulePlanningWizard.tsx`
restructured into the 3 steps above; `formats/registry.ts` settings metadata
extended with a Match-Type presentation mapping (games-per-set ↔
points-per-match) and enough metadata for "Fill Reserved Time" to compute a
match count; `planner.service.ts` gains the reverse duration→matches
computation and the rounds→matches computation described above; a small
fairness-presentation helper (score → stars + sentences) added to the UI
layer only.

**Explicitly deferred, real backend work, needs its own sprint and sign-off:**
the Future Defaults Wizard (organiser-level persisted preferences), and a
true Time-based match-end condition (depends on Live Runtime).
