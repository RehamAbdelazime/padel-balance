# King of the Court

## Overview

King of the Court is a fast-paced, continuous-play format built around a single
court: a defending team holds the court against a rotating queue of challengers.
Its purpose is maximum action with minimal downtime, and it naturally
accommodates uneven or fluctuating player counts since players simply wait in a
queue rather than needing to be split into a fixed number of complete groups.

- **Typical number of players:** 5–10 (works with both even and odd counts)
- **Typical number of courts:** 1 (this is a defining characteristic of the
  format — see Variants for multi-court adaptations)
- **Popularity:** Popular as a warm-up activity, a fast filler format, or for
  informal club sessions where time is short and a single court is available.
  Less common as a headline competitive format compared to Americano/Mexicano.

---

## Official Rules

### Player Rotation
Players not currently on court wait in a challenge queue. Rotation into and out
of play is driven entirely by match outcomes, not by a fixed schedule.

### Partner Rotation
Partnerships are typically formed dynamically as players reach the front of the
queue in pairs (queue-based challenge pairing), rather than through a
pre-computed rotation table. Some implementations fix the challenging pair for
their entire queue wait; others reshuffle challengers each time they return to
the queue.

### Opponent Selection
The team currently on court (the "defenders") faces whichever team is next at
the front of the challenge queue. There is no seeding or balancing of
opponents by skill — matchups are purely determined by queue order and match
outcome.

### Court Usage
Single court by design. The defending team remains on court between matches;
only the challenging team changes.

### Scoring
Matches are typically played to a short target score (commonly around 11
points, not a full padel set) to keep matches quick and maximise the number of
challenges within the session. The scoring **outcome that matters for ranking**
is not the point total within a match, but whether the team won or lost the
match (i.e., successfully defended, or was dethroned).

### Ranking
Ranking is based on **court time / defenses**, not on points scored during
matches:
- **Winners stay on court:** if the defending team wins, they remain, and the
  challengers rotate to the back of the queue.
- **Losers rotate out:** if the challengers win, they take over the court as
  the new defenders, and the previous defending team joins the back of the
  queue.
- The team (or player, depending on scoring approach — see Variants) with the
  most total successful defenses / most total time spent as the court holder
  by the end of the session is declared the winner.

### Tie-break Rules
No universal official standard exists for ties in total defenses. Commonly used
approaches:
1. Longest single defending streak (most consecutive wins on court).
2. Total matches won (including the winning challenge itself, not just
   subsequent defenses).
3. Coin toss / shared placement.

### Tournament Ending Condition
Ends after a fixed, pre-announced number of matches/rounds, or after a fixed
time limit — chosen by the organiser based on available time. There is no
"final" or elimination — the game simply stops and standings are read off.

---

## Variants

### Team King of the Court
Teams stay fixed for a challenge cycle: a pair defends together, and if
dethroned, that same pair returns to the queue together. Statistics (defenses,
streaks) are tracked per team.

### Individual King of the Court
Rather than fixed teams, individual players queue up and are paired
dynamically each time they reach the front (e.g., next two in queue become
partners for that challenge). Statistics are tracked per player rather than per
team, since teammates change constantly. This variant blurs into a queue-based
version of Americano and is the source of most implementation ambiguity —
whether "the King" refers to a team or an individual must be explicitly decided.

### Multi-Court King of the Court
An adaptation (not the traditional format) where multiple independent King of
the Court courts run in parallel, each with its own queue, and results/defenses
are compared across courts at the end. This is a non-standard extension; the
traditional/official format assumes a single court.

---

## Organizer Responsibilities

**Must do:**
- Decide team-based vs. individual variant before starting.
- Set the per-match target score (or time cap) — traditionally short (e.g., 11
  points) to keep the queue moving.
- Randomly assign (or seed) the first defending team/pair.
- Decide the total number of matches or overall time limit for the session.
- Decide and announce the tie-break rule for total defenses.

**Can be automated:**
- Tracking queue order and advancing it after each match.
- Recording each match outcome and updating defense counts / streaks.
- Determining the current "king" (leader) live throughout the session.
- Detecting session end (match count or time limit reached) and computing final
  ranking.

---

## Runtime Requirements

- **Court Owner** — the team/player currently holding and defending the court.
- **Challenger Queue** — ordered list of teams/players waiting to challenge;
  front of queue is next up.
- **Current King** — whoever currently has the most defenses/court time so far.
- **Current Streak** — consecutive defenses by the current court holder in
  their present run.
- **Remaining Matches / Time** — how much of the planned session remains.

---

## Statistics

- **Court Defenses** — total number of times successfully defended the court
  (primary ranking metric).
- **Longest Defense Streak** — highest number of consecutive defenses achieved.
- **Wins** — total matches won, including the initial dethroning win.
- **Matches Played** — total matches participated in (informational — this is
  not equal across players by design, since defenders play more consecutively
  than a queued challenger who loses immediately).

---

## Edge Cases

- **Odd number of players:** Naturally supported — an unpaired player simply
  waits at the back of the individual queue until paired with the next
  available player (individual variant), or sits out a round in the team
  variant until a partner is free. This is one of the format's defining
  strengths.
- **Player leaves mid-session:** The player is simply removed from the queue
  (or, if currently on court, their team forfeits the court to the next
  challenger). No official standard for how partial defense counts are
  credited — organiser discretion.
- **Late arrival:** New players join at the back of the queue at any point; no
  disruption to the format, since there's no pre-computed schedule to
  regenerate.
- **Multiple courts:** Not part of the traditional single-court format — see
  Multi-Court variant above. Traditional King of the Court assumes exactly one
  court, and this is treated as a hard constraint unless the organiser
  explicitly opts into a non-standard multi-court adaptation.
- **Incomplete tournament:** Because ranking is a running tally of defenses,
  the session can be stopped at any point and standings remain meaningful
  (unlike Round Robin, there's no "everyone must play everyone" requirement).
- **Tie situations:** See Tie-break Rules — no universal official standard;
  longest streak is the most commonly cited secondary metric.

---

## Notes

- The most important ambiguity to flag explicitly: **team-based vs.
  individual-based** King of the Court are both real-world variants with
  different partner/statistics semantics, and an implementation must pick one
  explicitly and document it rather than assume a single "official" version.
- Traditional King of the Court is fundamentally single-court. Any multi-court
  extension is a deliberate house-rule adaptation, not the base official
  format, and should be labelled as such if implemented.
- The exact target score per match (11 points is the most commonly cited
  convention) is a convention, not a universally fixed rule — organiser should
  be able to configure it.
