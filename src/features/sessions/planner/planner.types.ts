/**
 * Tournament Planner — domain types.
 *
 * TournamentPlan captures the organiser's intent BEFORE any schedule is
 * generated. It is metadata only: no match, pairing, or algorithm ever
 * executes here. This is the future contract between the UI and the
 * Tournament Generators — a generator will eventually receive a
 * TournamentPlan and nothing else, never raw UI state.
 */

import type { EstimatedDuration, FormatRecommendation } from '../formats'

/** Organiser-configured values for the selected format's settings. */
export type PlannerSettingValues = Readonly<Record<string, boolean | number | string>>

/**
 * The organiser's complete tournament intent, prepared for a future
 * Schedule Generator. Every field here is planning metadata — nothing
 * is derived by running a scheduling or balancing algorithm.
 */
export type TournamentPlan = {
  /** Selected format id, or null before the organiser has chosen one. */
  readonly formatId:                   string | null
  readonly playerCount:                number
  readonly courtCount:                 number
  /** How long the organiser has reserved the court(s) for, in minutes. */
  readonly reservationDurationMinutes: number
  /** Organiser-configured values for the selected format's settings. */
  readonly settings:                   PlannerSettingValues

  /** Recommendation engine output for the selected format, or null. */
  readonly recommendation:             FormatRecommendation | null

  // ── Estimates — metadata only, never computed by an algorithm ────────────
  readonly estimatedRounds:            number
  readonly estimatedMatches:           number
  readonly estimatedDuration:          EstimatedDuration
  /** Rough average number of matches a player sits out, across all rounds. */
  readonly estimatedAverageRest:       number
  /** Proxy fairness estimate (0–100) from the recommendation score; not a real balance computation. */
  readonly fairnessScoreEstimate:      number | null

  readonly warnings:                   ReadonlyArray<string>
  /** True once the plan has enough information to hand off to a generator. */
  readonly readyToGenerate:            boolean
}
