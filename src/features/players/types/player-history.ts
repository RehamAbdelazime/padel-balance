/**
 * Player Profile & History domain types (Sprint H1) — all derived,
 * read-only view models, aggregated across every session a player has
 * attended. No ratings, no rankings, no hidden scores: every field here is
 * explainable by an actual recorded/completed match or session.
 */

export type PlayerOverviewStats = {
  readonly sessionsAttended:      number
  readonly matchesPlayed:         number
  readonly wins:                  number
  readonly losses:                number
  readonly draws:                 number
  readonly gamesWon:              number
  readonly gamesLost:             number
  readonly gameDifference:        number
  /** Round integer 0–100. Zero when no completed matches. */
  readonly winPercentage:         number
  /** Round integer 0–100. See compute-player-history.ts for the exact denominator. */
  readonly attendancePercentage:  number
  readonly currentStreak:         { readonly outcome: 'W' | 'L' | null; readonly count: number }
  /** Longest run of consecutive wins across the player's entire history. */
  readonly longestStreak:         number
  readonly firstSessionDate:      string | null
  readonly lastSessionDate:       string | null
}

export type PlayerSessionHistoryRow = {
  readonly sessionId:     string
  readonly sessionName:   string
  readonly scheduledAt:   string
  readonly formatId:      string | null
  readonly totalPlayers:  number
  readonly matchesPlayed: number
  readonly wins:          number
  readonly losses:        number
  readonly draws:         number
}

/** A row here is always FINISHED — see compute-player-history.ts. Pending/Live/Cancelled matches never appear (bug fix: historical statistics integrity). */
export type PlayerMatchHistoryRow = {
  readonly matchId:       string
  readonly sessionId:     string
  readonly sessionName:   string
  readonly scheduledAt:   string
  readonly formatId:      string | null
  readonly roundNumber:   number
  readonly courtNumber:   number | null
  readonly partnerId:     string
  readonly partnerName:   string
  readonly opponentIds:   readonly [string, string]
  readonly opponentNames: readonly [string, string]
  readonly myScore:       number
  readonly opponentScore: number
  readonly outcome:       'W' | 'L' | 'DRAW'
}

/** Pending or Live matches this player is scheduled into — shown in a separate "Upcoming Matches" section, never inside Match History. */
export type PlayerUpcomingMatchRow = {
  readonly matchId:       string
  readonly sessionId:     string
  readonly sessionName:   string
  readonly scheduledAt:   string
  readonly formatId:      string | null
  readonly roundNumber:   number
  readonly courtNumber:   number | null
  readonly partnerId:     string
  readonly partnerName:   string
  readonly opponentIds:   readonly [string, string]
  readonly opponentNames: readonly [string, string]
  readonly matchStatus:   'PENDING' | 'LIVE'
  /** Only ever non-null for a LIVE match with a provisional, still-editable score. */
  readonly myScore:       number | null
  readonly opponentScore: number | null
}

export type PlayerPartnerHistoryStat = {
  readonly partnerId:          string
  readonly partnerName:        string
  readonly matchesTogether:    number
  readonly winsTogether:       number
  readonly winRateTogether:    number
  readonly lastPlayedTogether: string | null
}

export type PlayerOpponentHistoryStat = {
  readonly opponentId:   string
  readonly opponentName: string
  readonly matches:      number
  readonly wins:         number
  readonly losses:       number
  readonly lastPlayed:   string | null
}

export type PlayerMonthlyAttendance = {
  /** 'YYYY-MM' */
  readonly month: string
  readonly count: number
}

export type PlayerAttendanceStats = {
  readonly sessionsAttended:     number
  readonly sessionsMissed:       number
  readonly attendancePercentage: number
  readonly monthly:              readonly PlayerMonthlyAttendance[]
}

export type PlayerProfileData = {
  readonly overview:        PlayerOverviewStats
  readonly sessionHistory:  readonly PlayerSessionHistoryRow[]
  readonly matchHistory:    readonly PlayerMatchHistoryRow[]
  readonly upcomingMatches: readonly PlayerUpcomingMatchRow[]
  readonly partners:        readonly PlayerPartnerHistoryStat[]
  readonly opponents:       readonly PlayerOpponentHistoryStat[]
  readonly attendance:      PlayerAttendanceStats
}
