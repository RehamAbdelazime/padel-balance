# Americano

## Overview

Americano is the most widely played social padel format. Its purpose is to maximise
social mixing: every player partners with, and competes against, as many of the
other participants as possible over the course of a session, while every player
plays the same number of matches.

- **Typical number of players:** 8–16 (commonly played from 4 upward, in multiples of 4)
- **Typical number of courts:** 1–4, scaled to player count (4 players per court per match)
- **Popularity:** Very high — the default "social/mixer" format offered by nearly every
  padel club and tournament app (Playtomic, Padel Manager, etc.). Widely regarded as
  the entry-level format for casual and club play.

---

## Official Rules

### Player Rotation
All players rotate through the session. No player sits out for a full round if the
player count is a multiple of 4 and courts are sufficient — everyone plays every round.

### Partner Rotation
Partners change every match (or every round). Over a complete Americano cycle for
`n` players, the pairing table is constructed so that, as far as the number of
rounds allows, no two players are repeated as partners before all other possible
partnerships have been exhausted. A complete "round-trip" for `n` players requires
`n − 1` rounds to guarantee every player has partnered with every other player
exactly once (the classic social round-robin partner rotation).

### Opponent Selection
Opponents are likewise varied every round, determined by the same rotation table
that generates the partner pairings. In a full cycle, each player also faces every
other player as an opponent multiple times.

### Court Usage
Any available court may be used for any match — court assignment is not tied to
ranking or seeding. With multiple courts, all matches in a round are played
simultaneously, then all players rotate together into the next round's pairings.

### Scoring
**Individual scoring**, not team scoring. Even though matches are played by two
pairs of two, each point scored by a team is credited to *both* players on that
team individually. A player's tournament total is the sum of individual points
earned across all matches played.

### Ranking
Players are ranked by total accumulated individual points across the whole event.
This is the single defining characteristic of Americano versus fixed-team formats.

### Tie-break Rules
When two or more players finish with equal total points, the most commonly used
tie-breakers (in order) are:
1. Head-to-head total points when the tied players were direct opponents.
2. Total games/points won across all matches (gross, not net).
3. Coin toss / shared placement, if still tied.

There is no single universal standard tie-break rule for Americano; clubs and
apps vary. This should be treated as an **organiser-configurable** decision, not
a hard rule.

### Tournament Ending Condition
The tournament ends after a fixed, pre-announced number of rounds/matches has been
completed (chosen based on available time and courts) — not by elimination or by
reaching a target score.

---

## Variants

### Standard Americano
Individual scoring, partners rotate every match, as described above. This is the
default and most common variant.

### Team Americano
Partners are fixed for the whole event (like Round Robin) but rounds are still
organised "Americano-style" with all courts playing simultaneously. This is
sometimes marketed as "Team Americano" and is effectively a hybrid with
Round Robin — it should **not** be confused with standard Americano, since
scoring becomes team-based rather than individual.

### Mixed Americano
Same rules as Standard Americano, with the added constraint that pairs must
always consist of one male and one female player (used in mixed social events).
This only affects the pairing constraint, not the scoring or rotation logic.

---

## Organizer Responsibilities

**Must do:**
- Decide total number of rounds/matches based on player count, court count, and
  available time.
- Confirm/seed the initial pairing if not randomly assigned.
- Ensure the rotation table used produces valid partner/opponent variety (no
  player idle unless player count isn't a multiple of 4).
- Record each match's score promptly so individual point totals stay accurate.
- Announce and enforce the tie-break policy in use before the event starts.

**Can be automated:**
- Generating the full partner/opponent rotation table.
- Calculating and updating live individual standings.
- Court assignment for each round.
- Detecting and resolving tie-break ordering according to the configured rule.

---

## Runtime Requirements

- **Current Round** — which round/match number is in progress.
- **Rotation Table / Remaining Matches** — the full or partial schedule of
  upcoming pairings.
- **Standings** — live individual point totals, sorted for ranking.
- **Player Match Count** — matches played per player, to confirm equal play time.
- **Court Assignments** — which match is on which court for the current round.

---

## Statistics

- **Points** — cumulative individual points scored (primary ranking metric).
- **Point Difference** — points scored minus points conceded, summed across matches.
- **Wins** — number of matches on the winning side of the score.
- **Matches Played** — should be equal for all players at the end.

---

## Edge Cases

- **Odd number of players:** Standard Americano requires a number of players
  divisible by 4 for clean full-court rounds. An odd player count, or a count not
  divisible by 4, requires either a sit-out rotation (one or more players resting
  each round in turn) or a modified/incomplete rotation table. There is no single
  official standard for handling this — organiser/app discretion is required.
- **Player leaves mid-session:** Remaining rounds must be re-planned; the departed
  player's partial point total typically stands but is excluded from final ranking,
  or is kept with an asterisk, depending on club policy. Not officially standardised.
- **Late arrival:** A late player is normally slotted into the rotation from their
  arrival round onward, effectively playing fewer matches than others. Some
  organisers add makeup rounds; this is a local decision.
- **Multiple courts:** All courts play simultaneously per round; round transitions
  are synchronised — the next round doesn't start until all current-round matches
  finish (or a time cap is reached).
- **Incomplete tournament:** If the event is cut short before the planned number of
  rounds, final ranking is based on points accumulated so far; because Americano
  guarantees equal play time per round, a clean cutoff after any full round keeps
  standings fair.
- **Tie situations:** See Tie-break Rules above — no single official standard exists.

---

## Notes

- The core, unambiguous rule of Americano is: **individual scoring + partner
  rotation + equal play time**. Everything else (exact rotation table algorithm,
  tie-break order, handling of odd counts) varies by implementation/club and
  should be treated as configurable, not hardcoded.
- Do not assume a specific mathematical rotation algorithm (e.g., a particular
  round-robin partner table) is "the" official one — multiple valid rotation
  tables exist that satisfy "no repeated partner until all combinations are
  exhausted." Implementation should document which algorithm it uses rather than
  claim it is the unique official one.
