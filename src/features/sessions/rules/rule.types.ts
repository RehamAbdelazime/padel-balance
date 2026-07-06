/**
 * Tournament Rules Engine — generic supporting types.
 *
 * Definitions only. Rules describe HOW a tournament behaves; generators
 * execute that behaviour; runtime stores the resulting state. A rule never
 * stores runtime state itself — `apply()` is a pure function that takes a
 * state and returns the next state.
 *
 *   TournamentPlan -> Rules Engine -> Generator -> Runtime
 */

import type { TournamentPlan } from '../planner'

/** The nine behavioural axes a TournamentRuleSet must define. */
export type RuleKind =
  | 'rotation'
  | 'partner'
  | 'opponent'
  | 'court'
  | 'scoring'
  | 'standings'
  | 'winnerProgression'
  | 'rest'
  | 'termination'

/**
 * Everything a rule needs to describe its behaviour for one format.
 * Deliberately just the plan — rules never receive runtime state or UI state.
 */
export type RuleContext = {
  readonly formatId: string
  readonly plan:     TournamentPlan
}

export type RuleValidationResult = {
  readonly valid:  boolean
  readonly errors: ReadonlyArray<string>
}

/** Result of applying a rule once: the next state plus any observations. */
export type RuleApplyResult<TState> = {
  readonly state:    TState
  readonly warnings: ReadonlyArray<string>
}
