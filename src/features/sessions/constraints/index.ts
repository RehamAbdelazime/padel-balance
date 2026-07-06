export type {
  PlayerId,
  CourtAssignment,
  PlayerAssignment,
  RoundCandidate,
  ConstraintContext,
  ConstraintWeight,
  ConstraintViolation,
  ConstraintScore,
  ConstraintResult,
  SolverInput,
  SolverOutput,
  RankedCandidate,
} from './constraint.types'

export type { Constraint } from './constraint.interface'

export { CourtAvailabilityConstraint } from './generic-constraints'

export { NeverRepeatPartnerConstraint } from './never-repeat-partner.constraint'
export { NeverRepeatOpponentConstraint } from './never-repeat-opponent.constraint'
export { EqualMatchesConstraint } from './equal-matches.constraint'
export { EqualRestConstraint } from './equal-rest.constraint'

export { scoreForDifference, average, playingPlayers } from './fairness-scoring'

export type { SchedulingHistory, PairKey } from './history/history.index'
export {
  buildSchedulingHistory,
  pairKey,
  partnerCount,
  opponentCount,
  matchesPlayed,
  restCount,
  courtCount,
  previousPartners,
  previousOpponents,
} from './history/history.index'

export { getAllConstraints, getConstraint } from './constraint.registry'
export { generateRoundCandidates, solve } from './constraint.solver'
