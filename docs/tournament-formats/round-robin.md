# Round Robin

## Overview

Round Robin is the classical fair-competition tournament format: fixed teams,
every team plays every other team, and the final ranking reflects the true
overall record rather than bracket luck. Its purpose is competitive integrity for
smaller groups where playing every possible matchup is feasible in the available
time.

- **Typical number of players:** 4–8 (2–4 fixed teams); larger groups are
  possible but the match count grows quadratically with the number of teams.
- **Typical number of courts:** 1–2 for small groups; scales with team count.
- **Popularity:** High for club leagues, ladder competitions, and small
  competitive groups. Standard format across almost all racquet and net sports
  when a definitive, non-elimination ranking is desired.

---

## Official Rules

### Player Rotation
None. Players do not rotate individually — they are locked into fixed teams for
the entire event (see Partner Rotation).

### Partner Rotation
**Fixed teams.** Partners are assigned once, before the tournament begins, and do
not change for the duration of the event.

### Opponent Selection
Every team plays every other team exactly once (single round robin) or exactly
twice — typically once per "leg," analogous to home/away — in a double round
robin. The full fixture list is generated in advance using a standard
round-robin scheduling algorithm (e.g., the circle method), which also
determines which round each fixture falls into so that a team plays at most once
per round.

### Court Usage
Any available court can be used for a scheduled fixture; with multiple courts,
several fixtures from the same round may be played simultaneously.

### Scoring
**Team-based**, not individual. Each match produces a win/loss (and typically a
game or point score) credited to the team, not to individual players separately.

### Ranking
Teams are ranked primarily by **match wins**. The standard tie-breaker hierarchy
in racquet-sport round robins is:
1. Total wins.
2. Head-to-head result between tied teams (if they played each other and there
   are exactly two teams tied).
3. Point/game differential (points won minus points conceded) across all
   matches.
4. Total points/games won (gross).

This exact ordering (particularly the placement of head-to-head vs. point
differential) varies between organisations and sports federations — see Notes.

### Tie-break Rules
See Ranking above. When more than two teams are tied and head-to-head is not
mutually conclusive (e.g., a three-way tie where each beat one other), most
rulesets fall back directly to point differential rather than attempting a
mini round-robin sub-table, unless the organiser explicitly sets up a playoff.

### Tournament Ending Condition
Ends when the fixture list is exhausted — i.e., every team has played every other
team the required number of times (once for single round robin, twice for
double). Not time-limited or score-limited; if time runs out before all
fixtures are complete, the tournament is considered incomplete (see Edge Cases).

---

## Variants

### Single Round Robin
Every team plays every other team exactly once. The default and most common
variant for time-constrained club sessions.

### Double Round Robin
Every team plays every other team exactly twice. Used when more matches are
desired or time allows; effectively doubles both the match count and the
scheduling duration.

### Round Robin + Playoff
A round robin phase determines seeding, followed by a knockout playoff (e.g.,
semi-final/final) among the top-ranked teams. This is a hybrid and should be
treated as combining two distinct formats (Round Robin + elimination bracket),
not as a pure Round Robin variant. Elimination-bracket logic is explicitly
out of scope for the pure Round Robin format and is reserved separately in this
codebase (`EliminationPolicy: 'bracket'`).

---

## Organizer Responsibilities

**Must do:**
- Assign fixed teams before the event starts (by seeding, rating, or random
  draw).
- Choose single vs. double round robin based on available time.
- Confirm the number of courts available, since this affects how many rounds are
  needed to complete the fixture list.
- Decide and announce the tie-break rule set in advance, especially the
  head-to-head vs. point-differential precedence.
- Decide how to handle an incomplete tournament if time runs out.

**Can be automated:**
- Generating the full fixture list and grouping fixtures into rounds (round-robin
  scheduling algorithm).
- Assigning fixtures to available courts within each round.
- Calculating live standings (wins, losses, point differential) as results are
  recorded.
- Applying the configured tie-break rules to compute final ranking.

---

## Runtime Requirements

- **Current Round** — which round of fixtures is being played.
- **Remaining Fixtures** — all scheduled matches not yet played.
- **Standings** — team rankings by wins, then the configured tie-break chain.
- **Head-to-Head Record** — results between specific team pairs, needed for
  tie-breaking.
- **Court Assignments** — which fixture is on which court for the current round.

---

## Statistics

- **Wins** — primary ranking metric.
- **Losses** — informational.
- **Point Difference** — points scored minus conceded across all matches; primary
  tie-breaker.
- **Sets Won / Sets Lost** — secondary tie-breaker when matches are played as
  best-of-3 sets.

---

## Edge Cases

- **Odd number of players (teams):** Since teams are fixed pairs, this format
  requires an even number of players to form whole teams; an odd number of
  *teams* (e.g., 3 teams / 6 players) is fine and handled normally by the
  scheduling algorithm (one team rotates a "bye" per round when the team count
  is odd). An odd number of individual *players* that cannot form complete pairs
  is not supported.
- **Player leaves mid-tournament:** No official standard. Common approaches:
  forfeit remaining fixtures for that team (losses recorded), or exclude the
  team retroactively from standings. Organiser decision required.
- **Late arrival:** If a team has not yet played any fixtures, it can typically
  be inserted before generating the schedule. Once the fixture list has been
  generated and rounds have started, adding a team requires regenerating the
  remaining schedule — not officially standardised.
- **Multiple courts:** Fixtures within the same round can be played
  simultaneously across courts; a round is not considered complete until all its
  fixtures are recorded.
- **Incomplete tournament:** If time runs out before all fixtures are played,
  standard practice is to rank by the tie-break chain among completed matches
  only, but the result is considered provisional/incomplete rather than a true
  round-robin champion, since not all teams have faced each other. No official
  universal rule mandates a specific resolution here.
- **Tie situations:** See Tie-break Rules — precedence order (especially
  head-to-head vs. point differential) is organisation-specific, not universal.

---

## Notes

- The single unambiguous core rule: **fixed teams + every team plays every other
  team + team-based win/loss ranking.** Everything downstream of "how are ties
  broken" is organisation/federation-specific and must be an explicit,
  documented setting rather than a hardcoded assumption.
- Do not assume head-to-head always outranks point differential — many
  federations (and most casual club implementations) use point differential as
  the primary tie-breaker specifically because head-to-head doesn't generalise
  cleanly to 3+-way ties. This must be a configurable rule, not baked in as "the"
  official order.
