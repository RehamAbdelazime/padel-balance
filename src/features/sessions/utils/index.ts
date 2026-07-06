/**
 * Session utilities — pure, synchronous domain helpers.
 * No Supabase. No React. No async.
 */
export {
  emptyPlanningContext,
  buildGeneratorConfig,
  updateContextWithPlannedMatch,
} from './planning-context'
export type { PlanningContext } from './planning-context'

export { matchId, isPreserved, nextSchedule } from './schedule-helpers'

export { shouldAutoStartSession } from './session-lifecycle'

export { friendlyScheduleErrorMessage } from './schedule-errors'
export { friendlySessionErrorMessage } from './session-errors'
export { friendlyAttendanceErrorMessage } from './attendance-errors'
export { friendlyMatchErrorMessage } from './match-errors'

export { groupMatchesIntoRounds, standbyForRound, deriveRoundStatus } from './schedule-rounds'
export type { RoundSlot, ScheduleRound, RoundStatus } from './schedule-rounds'

export { formatSessionDate, formatSessionTime, toDatetimeLocalValue } from './format-session-date'
