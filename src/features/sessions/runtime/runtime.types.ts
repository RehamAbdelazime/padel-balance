/**
 * Tournament Runtime Architecture — generic supporting types.
 *
 * Definitions only. TournamentRuntime is the live state of a running
 * tournament — it comes AFTER a SessionSchedule exists and evolves as
 * results are recorded. Generators produce schedules; they never own
 * standings, queues, or statistics. Those live exclusively here.
 *
 *   TournamentPlan -> TournamentGenerator -> SessionSchedule -> TournamentRuntime
 */

import type { MatchScore } from '../types'

// ── Status ────────────────────────────────────────────────────────────────────

export type TournamentRuntimeStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'FINISHED'

// ── Statistics — live values, keyed generically ──────────────────────────────

/** One statistic's current value per participant (player or team id). */
export type RuntimeStatisticValues = ReadonlyMap<string, number>

/** Every tracked statistic's live values, keyed by the FormatStatistic id. */
export type TournamentRuntimeStatistics = ReadonlyMap<string, RuntimeStatisticValues>

// ── Standings ─────────────────────────────────────────────────────────────────

export type RuntimeStandingEntry = {
  readonly participantId: string
  readonly rank:          number
  /** Statistic id -> value, e.g. { points: 24, wins: 3 }. */
  readonly values:        ReadonlyMap<string, number>
}

export type RuntimeStandings = ReadonlyArray<RuntimeStandingEntry>

// ── Recorded match result — adapter input ────────────────────────────────────

/**
 * A single completed match, as reported to the runtime. Deliberately
 * generic (player id tuples + a score) — reuses the existing MatchScore
 * type rather than redefining a scoring shape.
 */
export type RuntimeMatchResult = {
  readonly matchId: string
  readonly teamA:   readonly [string, string]
  readonly teamB:   readonly [string, string]
  readonly score:   MatchScore
}

// ── Runtime state ─────────────────────────────────────────────────────────────

/**
 * Live state of a running tournament. Format-specific data (challenge
 * queue, next-round pairings, round-position history, …) lives in `state`
 * as an opaque bag — each adapter defines and owns its own shape.
 */
export type TournamentRuntime = {
  readonly formatId:         string
  readonly sessionId:        string
  readonly currentRound:     number
  readonly completedRounds:  number
  /** PlannedMatch ids completed so far, in completion order. */
  readonly completedMatches: ReadonlyArray<string>
  readonly status:           TournamentRuntimeStatus
  readonly statistics:       TournamentRuntimeStatistics
  /** Format-specific opaque state (queue, standings table, streaks, …). */
  readonly state:            Readonly<Record<string, unknown>>
}

// ── Results ───────────────────────────────────────────────────────────────────

/**
 * Outcome of a runtime operation. Placeholder adapters return
 * 'not-implemented' instead of throwing — throwing is also an acceptable
 * placeholder strategy, same convention as TournamentGenerator.
 */
export type RuntimeResult =
  | { readonly status: 'success';         readonly runtime: TournamentRuntime }
  | { readonly status: 'not-implemented'; readonly message: string }
  | { readonly status: 'error';           readonly message: string }
