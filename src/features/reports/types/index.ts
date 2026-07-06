/**
 * Session Report domain types — all derived, read-only view models.
 *
 * Nothing here is persisted. A report is computed on demand from a
 * session's existing persisted schedule + attendance (see
 * utils/compute-report.ts) — it never reads or writes Generator/Runtime
 * state of its own (Sprint R2).
 */

import type { MatchRuntimeStatus, PlayerRuntimeStatus } from '@/features/sessions/types'

export type ReportId = string & { readonly __brand: unique symbol }

/** 'DRAW' only occurs if the organiser records equal scores — rare but valid. */
export type MatchWinner = 'A' | 'B' | 'DRAW' | null

export type MatchReportRow = {
  readonly matchId:      string
  readonly courtNumber:  number | null
  readonly teamA:        readonly [string, string]
  readonly teamB:        readonly [string, string]
  readonly scoreA:       number | null
  readonly scoreB:       number | null
  readonly winner:       MatchWinner
  /** True if the organiser manually created or edited this match's composition. */
  readonly isManualEdit: boolean
  readonly matchStatus:  MatchRuntimeStatus
}

export type RoundReportGroup = {
  readonly roundNumber: number
  readonly matches:     readonly MatchReportRow[]
}

export type PlayerReportStats = {
  readonly playerId:         string
  readonly name:             string
  readonly matchesPlayed:    number
  readonly wins:             number
  readonly losses:           number
  readonly draws:            number
  readonly gamesWon:         number
  readonly gamesLost:        number
  readonly gameDifference:   number
  /** Round integer 0–100. Zero when no completed matches. */
  readonly winPercentage:    number
  readonly attendanceStatus: PlayerRuntimeStatus
  /** Rounds this player did not appear on any court — see compute-report.ts for the exact definition. */
  readonly standbyCount:     number
}

export type PartnerStat = {
  readonly partnerId:       string
  readonly partnerName:     string
  readonly matchesTogether: number
  readonly winsTogether:    number
  /** Round integer 0–100. */
  readonly winRateTogether: number
}

export type OpponentStat = {
  readonly opponentId:   string
  readonly opponentName: string
  readonly timesPlayed:  number
  readonly wins:         number
  readonly losses:       number
}

export type PlayerAnalysis = {
  readonly playerId:  string
  readonly name:      string
  /** Sorted by matchesTogether descending. */
  readonly partners:  readonly PartnerStat[]
  /** Sorted by timesPlayed descending. */
  readonly opponents: readonly OpponentStat[]
}

export type SessionInsights = {
  readonly mostActivePlayer: { readonly playerId: string; readonly name: string; readonly matchesPlayed: number } | null
  readonly bestWinPercentage: { readonly playerId: string; readonly name: string; readonly winPercentage: number; readonly matchesPlayed: number } | null
  readonly closestMatch:   MatchReportRow | null
  readonly biggestVictory: MatchReportRow | null
  readonly longestWinningStreak: { readonly playerId: string; readonly name: string; readonly streak: number } | null
  readonly mostUsedPartnerCombination: {
    readonly playerAId: string; readonly playerAName: string
    readonly playerBId: string; readonly playerBName: string
    readonly matchesTogether: number
  } | null
}

export type SessionReportData = {
  readonly rounds:         readonly RoundReportGroup[]
  readonly players:        readonly PlayerReportStats[]
  readonly playerAnalysis: readonly PlayerAnalysis[]
  readonly insights:       SessionInsights
  readonly totalMatches:   number
  readonly totalRounds:    number
  readonly totalPlayers:   number
}
