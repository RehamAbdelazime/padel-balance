# Custom

## Overview

Unlike Americano, Mexicano, Round Robin, and King of the Court, **Custom is not
a recognised real-world padel tournament format** — there is no external
governing convention, club tradition, or published rule set for it. It is an
**application-defined mode** that hands full control to the organiser and the
balanced-team generator (this app's rating-based matchmaking algorithm),
rather than following a named rotation/scoring convention.

This document therefore does not claim official real-world rules (there are
none to research) — it describes the intended *purpose and constraints* of the
mode as an organiser tool, consistent with the project's existing
`team-generator` and `schedule` architecture. No gameplay rule in this
document should be read as an "official" external standard.

- **Typical number of players:** Any (4 and up), including odd counts.
- **Typical number of courts:** Any number the organiser has available.
- **Popularity:** N/A (app-specific feature) — used when none of the four
  standard formats fit the group (mixed skill levels, irregular attendance,
  no fixed rotation desired).

---

## Official Rules

There are no external "official rules" to document for this format. Instead,
its behaviour is entirely defined by this application's own generator and
schedule engine (already implemented — see `team-generator/` and
`schedule.service.ts`). At the level of this documentation set, the only
statements that can be made without guessing are:

- **Player rotation:** Determined match-by-match by the balancing algorithm
  (fairness/rating-based), not by a fixed external rule.
- **Partner rotation:** Same — algorithm-selected per match, subject to
  organiser overrides (lock, swap, manual match).
- **Opponent selection:** Same — algorithm-selected.
- **Court usage:** Any available court; multi-court assignment is supported.
- **Scoring:** No fixed competitive scoring convention is imposed by the format
  itself — organisers may or may not record scores per match, per the app's
  existing match-recording flow.
- **Ranking:** No standings/ranking is defined by the format itself (the
  registry currently declares `standings: 'none'`).
- **Tie-break rules:** Not applicable — there is no ranking to break ties in.
- **Tournament ending condition:** A fixed number of matches, chosen by the
  organiser at setup, exactly as with the other formats' `terminationCondition`.

---

## Variants

Not applicable. Because Custom is not an external standard, there are no
"real-world variants" to separate. Its flexibility (odd players, multi-court,
manual matches, swaps) is itself the entire feature set — it is not itself a
variant of another format.

---

## Organizer Responsibilities

**Must do:**
- Choose the total number of matches to schedule.
- Review each algorithm-generated match and decide whether to accept, lock,
  swap, regenerate, or replace it with a manually created match.
- Manage player availability manually (mark resting / skip-next / left-session)
  since there is no fixed rotation rule driving this automatically.
- Decide whether to record scores/results at all, since no ranking is enforced.

**Can be automated (already implemented elsewhere in this codebase):**
- Balanced pairing generation via the `team-generator` pipeline
  (`enumerate → evaluate → constrain → score → analyze`).
- Schedule quality scoring (`ScheduleQuality`) across rating balance, equal play
  time, partner/opponent diversity, and rest balance.
- Regeneration of the current match, remaining matches, or the entire schedule
  (subject to the preservation predicate for completed/locked/manual matches).

---

## Runtime Requirements

- **Current Match Index** — position in the generated schedule currently being
  played (0-based).
- **Remaining Schedule** — matches not yet played from the current
  algorithm-generated plan.
- **Player Runtime Status** — availability state per player (`AVAILABLE`,
  `PLAYING`, `RESTING`, `LEFT_SESSION`, `SKIP_NEXT_MATCH`), since there is no
  fixed rotation to fall back on.
- **Schedule Quality** — the five-dimension quality score, recalculated after
  every mutation.

---

## Statistics

Since no ranking is defined by the format, the only statistics that are
unambiguously meaningful are participation-based:

- **Matches Played** — total matches a player participated in.
- **Wins** — number of matches won, purely informational (not used for
  ranking, since `standings: 'none'`).

Any additional statistic (points, point difference, etc.) would require the
organiser to have chosen to record scores, and is not guaranteed by the format
itself.

---

## Edge Cases

- **Odd number of players:** Fully supported — this is one of the format's
  defining features (`supportsOddPlayers: true`), handled by the existing
  player-selection logic in `planning-context.ts`.
- **Player leaves:** Fully supported (`supportsPlayerLeave: true`) via
  `setPlayerStatus` — no special-casing needed since there's no fixed rotation
  to break.
- **Late arrival:** Fully supported (`supportsLateJoin: true`) — a newly added
  player is simply eligible for future algorithm-generated matches.
- **Multiple courts:** Fully supported (`supportsMultipleCourts: true`); court
  assignment is "any available," same as Americano/Mexicano/Round Robin.
- **Incomplete tournament:** No issue — since there is no ranking or
  all-vs-all requirement, stopping at any point leaves a valid, if partial,
  match history.
- **Tie situations:** Not applicable — no ranking is computed by this format.

---

## Notes

- **This document intentionally does not invent gameplay rules.** Custom's
  actual behaviour is fully specified by the existing implementation
  (`team-generator`, `schedule.service.ts`, `formats/registry.ts`) rather than
  by any external tournament convention, and this documentation sprint's
  instruction is to research and formalise *official* specifications — there
  is no official specification to formalise for this mode beyond what the app
  itself already defines.
- If a future sprint wants to give "Custom" more format-specific rule
  variants (e.g., a named house rule), that would need to be defined
  explicitly by the organiser/product team rather than sourced from
  real-world research, and should be captured as a new, separate format
  rather than layered ambiguously onto this one.
