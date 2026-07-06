# Mexicano

## Overview

Mexicano is a dynamic, self-seeding social padel format. Its purpose is to keep
matches competitive throughout the event by re-pairing players according to their
live performance, rather than a fixed rotation table — so that, as the event
progresses, players of similar current standing increasingly face each other.

- **Typical number of players:** 8–16 (in multiples of 4)
- **Typical number of courts:** 1–4, scaled to player count
- **Popularity:** High, and growing — offered as a variant alongside Americano by
  most major padel tournament platforms (Playtomic, Padel Manager). Preferred by
  organisers who want matches to stay balanced/competitive as the event unfolds,
  rather than being fixed by a pre-set table.

---

## Official Rules

### Player Rotation
All players play every round (subject to player count divisible by 4 per court).
There is no elimination — everyone continues through all planned rounds.

### Partner Rotation
- **Round 1:** Pairings are random or seeded (e.g., by initial rating if known).
- **Subsequent rounds:** Players are ranked by cumulative individual points scored
  so far. Re-pairing groups players who are adjacent in this live ranking:
  typically rank 1 partners rank 4, rank 2 partners rank 3 within each "block of
  four" adjacent in the standings (commonly described as "1+4 vs 2+3" within each
  group), or the closest-ranked players are grouped together for that round's
  matches. The precise adjacent-grouping formula varies between implementations —
  see Variants below.

### Opponent Selection
Determined by the same score-based grouping as partner selection: opponents are
also drawn from players with a similar current point total, so match strength is
self-balancing round over round.

### Court Usage
Any available court can host any match generated for the round; multiple courts
run simultaneously per round the same way as Americano.

### Scoring
**Individual scoring.** As in Americano, points scored during a match are credited
to each player on the scoring team individually. Cumulative individual points
across rounds both determine ranking and drive future pairings.

### Ranking
Final ranking is by total accumulated individual points, identical in principle to
Americano — the difference from Americano is entirely in *how pairings are
generated*, not in how the final ranking is computed.

### Tie-break Rules
No single official standard exists. Commonly used tie-breakers, in order:
1. Head-to-head result if the tied players met directly.
2. Total points scored across the event (gross).
3. Coin toss / shared placement.
Organiser-configurable, same caveat as Americano.

### Tournament Ending Condition
Ends after a fixed, pre-announced number of rounds — chosen in advance based on
courts and available time, not by reaching a target score or by elimination.

---

## Variants

### Standard Mexicano ("winners together")
After round 1, the top-ranked and 2nd-ranked player in each grouping of four are
paired together against the 3rd- and 4th-ranked ("1+2 vs 3+4"), so that
higher performers cluster together and lower performers cluster together in
subsequent rounds. This variant tends to separate skill tiers quickly.

### Alternative Mexicano ("balanced pairing")
The 1st- and 4th-ranked players are paired together against the 2nd- and 3rd-ranked
("1+4 vs 2+3"), producing more evenly balanced matches by combining a stronger and
a weaker player on each team. This variant is common when the organiser wants
closer, more competitive matches rather than segregating by skill.

**These two pairing conventions are the primary documented variants of Mexicano
and must not be conflated** — they produce materially different pairings from the
same standings and represent different design goals (skill separation vs. match
balance).

### No-repeat-partner Constraint
Many implementations additionally forbid pairing the same two players together in
consecutive rounds, even if they are score-adjacent, to preserve social mixing.
This is a common but not universal addition, and should be treated as an optional
rule rather than a core Mexicano requirement.

---

## Organizer Responsibilities

**Must do:**
- Decide the number of rounds in advance based on court/time availability.
- Choose (and be consistent about) which pairing convention is used
  ("1+2 vs 3+4" or "1+4 vs 2+3").
- Ensure round 1 seeding is fair (random or by known rating).
- Record match scores immediately after each round — pairings for the next round
  cannot be generated until all current-round scores are known.
- Decide whether the no-repeat-partner constraint is enforced.

**Can be automated:**
- Computing live standings after each round.
- Generating next-round pairings from the chosen convention.
- Enforcing the no-repeat-partner constraint if enabled.
- Court assignment per round.

---

## Runtime Requirements

- **Current Round** — round/match number in progress.
- **Current Standings** — live individual point ranking, required input to
  generate the next round's pairings.
- **Next Round Pairings** — cannot be pre-computed before the current round's
  scores are in; must be generated live, round by round.
- **Remaining Matches** — count of rounds still to be played.
- **Partner History** — required only if the no-repeat-partner constraint is used.

---

## Statistics

- **Points** — cumulative individual points scored (primary ranking metric).
- **Point Difference** — points scored minus conceded, summed.
- **Matches Played** — should be equal across all players.
- **Round Position History** — a player's standing position after each round;
  useful to show competitive trajectory but not part of final ranking.

---

## Edge Cases

- **Odd number of players:** Same constraint as Americano — clean rounds require
  player count divisible by 4. No official standard for odd counts; requires a
  sit-out rotation or organiser/app-specific handling.
- **Player leaves mid-session:** Breaks the score-adjacency grouping for the
  remaining players in their group of four; remaining players must be
  re-grouped for subsequent rounds. Not officially standardised — organiser
  discretion required.
- **Late arrival:** A late player has no score yet, so cannot be ranked for
  pairing purposes until they've played at least one round. Typically inserted at
  the bottom of the standings, or into the first round where an empty slot
  exists. Not officially standardised.
- **Multiple courts:** Rounds are synchronised across all courts, exactly as in
  Americano — a round cannot conclude (and next-round pairings cannot generate)
  until every court's match in that round is scored.
- **Incomplete tournament:** Cutting the event short is safe after any completed
  round because rankings and play time stay equal per round played.
- **Tie situations:** See Tie-break Rules — no universal official standard.

---

## Notes

- The single most important ambiguity to flag explicitly in any implementation:
  **which pairing convention is used ("1+2 vs 3+4" vs "1+4 vs 2+3")**. These are
  both legitimately called "Mexicano" in the real world and produce different
  results. The engine/documentation must make this an explicit, named setting —
  never assume one is "the" official rule.
- Do not invent a specific grouping-block size (e.g., assuming groups of exactly
  4 adjacent-ranked players) as the only possible mechanism; some implementations
  perform full-field adjacent-rank pairing across all players rather than
  chunking into blocks of four. Clarify this choice explicitly rather than
  guessing.
