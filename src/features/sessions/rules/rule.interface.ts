/**
 * Tournament Rules Engine — rule contracts.
 *
 * Every rule exposes only behaviour — no runtime state is stored on the
 * rule itself:
 *   createInitialState() — the state a fresh tournament starts with
 *   apply()               — pure transition to the next state
 *   validate()             — whether the plan gives this rule what it needs
 *
 * Method signatures only; no implementation here.
 */

import type { RuleContext, RuleValidationResult, RuleApplyResult } from './rule.types'

/**
 * Shared base contract every specific rule specialises. `TState` is opaque
 * to the engine — each rule (and each format's rule) defines its own shape.
 */
export interface TournamentRule<TState = unknown> {
  readonly kind: string

  /** The state a fresh tournament starts with, before any round is played. */
  createInitialState(context: RuleContext): TState

  /**
   * Pure transition to the next state. `input` is rule-specific (e.g. a
   * recorded match result for ScoringRule, a completed round for
   * RotationRule) — generators and runtime decide what to pass.
   */
  apply(state: TState, input: unknown, context: RuleContext): RuleApplyResult<TState>

  /** Whether the given plan supplies everything this rule needs to run. */
  validate(context: RuleContext): RuleValidationResult
}

// ── Specific rule contracts ───────────────────────────────────────────────────
// One per behavioural axis. Each narrows `kind` to its own literal; the
// method signatures are inherited from TournamentRule, not redeclared.

/** How players are assigned to matches across rounds. */
export interface RotationRule extends TournamentRule {
  readonly kind: 'rotation'
}

/** How the two players who form a team within a match are chosen. */
export interface PartnerRule extends TournamentRule {
  readonly kind: 'partner'
}

/** How the opposing team is determined for each match. */
export interface OpponentRule extends TournamentRule {
  readonly kind: 'opponent'
}

/** How matches are assigned to physical courts. */
export interface CourtAssignmentRule extends TournamentRule {
  readonly kind: 'court'
}

/** What is tracked to determine individual or team performance. */
export interface ScoringRule extends TournamentRule {
  readonly kind: 'scoring'
}

/** How players or teams are ranked at any point during the session. */
export interface StandingsRule extends TournamentRule {
  readonly kind: 'standings'
}

/** What happens to a team immediately after their match concludes. */
export interface WinnerProgressionRule extends TournamentRule {
  readonly kind: 'winnerProgression'
}

/** How the engine manages which players rest between matches. */
export interface RestRule extends TournamentRule {
  readonly kind: 'rest'
}

/** What event causes the session to end. */
export interface TerminationRule extends TournamentRule {
  readonly kind: 'termination'
}

// ── Rule set ──────────────────────────────────────────────────────────────────

/**
 * The complete behavioural specification for one tournament format — one
 * rule per axis. Mirrors TournamentRules (formats/types.ts) but as
 * executable behaviour contracts rather than descriptive policy enums.
 */
export type TournamentRuleSet = {
  readonly formatId:          string
  readonly rotation:          RotationRule
  readonly partner:           PartnerRule
  readonly opponent:          OpponentRule
  readonly court:             CourtAssignmentRule
  readonly scoring:           ScoringRule
  readonly standings:         StandingsRule
  readonly winnerProgression: WinnerProgressionRule
  readonly rest:              RestRule
  readonly termination:       TerminationRule
}
