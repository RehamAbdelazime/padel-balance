/**
 * Player Profile & History — pure derivation from already-persisted data,
 * aggregated across every session a player has attended (Sprint H1).
 *
 * Reuses the exact same primitives Session Reports use (R2's
 * compute-report.ts): `calculatePlayerStats` (from the `statistics`
 * feature), `toPlayerMatchResults`, `computeRounds`, `computePlayerAnalysis`,
 * `longestStreakFor`. The only new logic here is cross-session
 * concatenation/sorting and the "last played" dates that a single-session
 * report has no reason to track. No ratings, no rankings, no hidden
 * scores — every field is a direct fact from a completed match or a
 * session's attendance record.
 */

import type { Session, SessionAttendee, PlannedMatch } from '@/features/sessions/types'
import {
  computeRounds,
  computePlayerAnalysis,
  toPlayerMatchResults,
  longestStreakFor,
  isDecided,
  playerTeam,
  matchWinner,
} from '@/features/reports/utils/compute-report'
import { calculatePlayerStats } from '@/features/statistics/services/statistics.service'
import type { SessionMatchesSummary } from '@/features/sessions/services/schedule-persistence.service'
import type {
  PlayerOverviewStats,
  PlayerSessionHistoryRow,
  PlayerMatchHistoryRow,
  PlayerUpcomingMatchRow,
  PlayerPartnerHistoryStat,
  PlayerOpponentHistoryStat,
  PlayerAttendanceStats,
  PlayerProfileData,
} from '../types/player-history'

function dedupeByPlayerId(attendees: readonly SessionAttendee[]): SessionAttendee[] {
  const seen = new Map<string, SessionAttendee>()
  for (const attendee of attendees) {
    if (!seen.has(attendee.player_id)) seen.set(attendee.player_id, attendee)
  }
  return [...seen.values()]
}

/** Walks backward from the most recent decided match — a draw breaks any streak. */
function computeCurrentStreak(
  matchesChronological: readonly PlannedMatch[],
  playerId: string,
): { outcome: 'W' | 'L' | null; count: number } {
  let outcome: 'W' | 'L' | null = null
  let count = 0

  for (let i = matchesChronological.length - 1; i >= 0; i--) {
    const match = matchesChronological[i]!
    if (!isDecided(match)) continue
    const team = playerTeam(match, playerId)
    if (!team) continue

    const winner = matchWinner(match)
    if (winner === 'DRAW') break

    const thisOutcome: 'W' | 'L' = winner === team ? 'W' : 'L'
    if (outcome === null) {
      outcome = thisOutcome
      count = 1
    } else if (thisOutcome === outcome) {
      count += 1
    } else {
      break
    }
  }

  return { outcome, count }
}

function monthKey(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function computePlayerProfile(
  playerId: string,
  attendedSessions: readonly Session[],
  matchesBySession: ReadonlyMap<string, SessionMatchesSummary>,
  allAttendees: readonly SessionAttendee[],
  /** Every non-archived session in the system (reused from useSessionsQuery) — the denominator for attendance %. */
  allSessions: readonly Session[],
): PlayerProfileData {
  const sortedSessions = [...attendedSessions].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )

  const nameById = new Map<string, string>()
  for (const attendee of allAttendees) nameById.set(attendee.player_id, attendee.players.name)

  const attendeesPerSession = new Map<string, Set<string>>()
  for (const attendee of allAttendees) {
    const set = attendeesPerSession.get(attendee.session_id) ?? new Set<string>()
    set.add(attendee.player_id)
    attendeesPerSession.set(attendee.session_id, set)
  }

  const sessionHistory: PlayerSessionHistoryRow[] = []
  const matchHistory: PlayerMatchHistoryRow[] = []
  const upcomingMatches: PlayerUpcomingMatchRow[] = []
  const allMatchesChronological: PlannedMatch[] = []
  const lastPlayedTogether = new Map<string, string>()
  const lastPlayedAgainst  = new Map<string, string>()

  for (const session of sortedSessions) {
    const summary = matchesBySession.get(session.id)
    if (!summary) continue // attended, but no schedule was ever generated for this session

    const stats = calculatePlayerStats(toPlayerMatchResults(summary.matches, playerId))

    sessionHistory.push({
      sessionId:     session.id,
      sessionName:   session.name,
      scheduledAt:   session.scheduled_at,
      formatId:      summary.formatId,
      totalPlayers:  attendeesPerSession.get(session.id)?.size ?? 0,
      matchesPlayed: stats.matchesPlayed,
      wins:          stats.matchesWon,
      losses:        stats.matchesLost,
      draws:         stats.matchesDraw,
    })

    const rounds = computeRounds(summary.matches, session.court_count)
    for (const round of rounds) {
      for (const match of round.matches) {
        const onTeamA = match.teamA.includes(playerId)
        const onTeamB = match.teamB.includes(playerId)
        if (!onTeamA && !onTeamB) continue
        // Cancelled matches are neither historical fact nor upcoming — they never happened and never will.
        if (match.matchStatus === 'CANCELLED') continue

        const myTeam       = onTeamA ? match.teamA : match.teamB
        const opponentTeam = onTeamA ? match.teamB : match.teamA
        const partnerId    = myTeam.find(id => id !== playerId) ?? ''
        const myScore       = onTeamA ? match.scoreA : match.scoreB
        const opponentScore = onTeamA ? match.scoreB : match.scoreA
        const partnerName   = nameById.get(partnerId) ?? partnerId
        const opponentNames: readonly [string, string] = [
          nameById.get(opponentTeam[0]) ?? opponentTeam[0],
          nameById.get(opponentTeam[1]) ?? opponentTeam[1],
        ]

        // Match History: FINISHED only — a PENDING/LIVE match is not
        // historical fact yet, even if a live, still-editable score has
        // been entered (bug fix: historical statistics integrity).
        if (match.matchStatus === 'FINISHED' && match.winner !== null && myScore !== null && opponentScore !== null) {
          const outcome: 'W' | 'L' | 'DRAW' =
            match.winner === 'DRAW' ? 'DRAW' : (match.winner === 'A') === onTeamA ? 'W' : 'L'

          matchHistory.push({
            matchId:     match.matchId,
            sessionId:   session.id,
            sessionName: session.name,
            scheduledAt: session.scheduled_at,
            formatId:    summary.formatId,
            roundNumber: round.roundNumber,
            courtNumber: match.courtNumber,
            partnerId,
            partnerName,
            opponentIds: [opponentTeam[0], opponentTeam[1]],
            opponentNames,
            myScore,
            opponentScore,
            outcome,
          })

          lastPlayedTogether.set(partnerId, session.scheduled_at)
          for (const opponentId of opponentTeam) lastPlayedAgainst.set(opponentId, session.scheduled_at)
        } else if (match.matchStatus === 'PENDING' || match.matchStatus === 'LIVE') {
          upcomingMatches.push({
            matchId:     match.matchId,
            sessionId:   session.id,
            sessionName: session.name,
            scheduledAt: session.scheduled_at,
            formatId:    summary.formatId,
            roundNumber: round.roundNumber,
            courtNumber: match.courtNumber,
            partnerId,
            partnerName,
            opponentIds: [opponentTeam[0], opponentTeam[1]],
            opponentNames,
            matchStatus: match.matchStatus,
            myScore,
            opponentScore,
          })
        }
      }
    }

    allMatchesChronological.push(...summary.matches)
  }

  const overallStats  = calculatePlayerStats(toPlayerMatchResults(allMatchesChronological, playerId))
  const longestStreak = longestStreakFor(allMatchesChronological, playerId)
  const currentStreak = computeCurrentStreak(allMatchesChronological, playerId)

  const analysis   = computePlayerAnalysis(allMatchesChronological, dedupeByPlayerId(allAttendees))
  const myAnalysis = analysis.find(a => a.playerId === playerId)

  const partners: PlayerPartnerHistoryStat[] = (myAnalysis?.partners ?? [])
    .map(p => ({
      partnerId:          p.partnerId,
      partnerName:        p.partnerName,
      matchesTogether:    p.matchesTogether,
      winsTogether:       p.winsTogether,
      winRateTogether:    p.winRateTogether,
      lastPlayedTogether: lastPlayedTogether.get(p.partnerId) ?? null,
    }))
    .sort((a, b) => b.matchesTogether - a.matchesTogether)

  const opponents: PlayerOpponentHistoryStat[] = (myAnalysis?.opponents ?? [])
    .map(o => ({
      opponentId:   o.opponentId,
      opponentName: o.opponentName,
      matches:      o.timesPlayed,
      wins:         o.wins,
      losses:       o.losses,
      lastPlayed:   lastPlayedAgainst.get(o.opponentId) ?? null,
    }))
    .sort((a, b) => b.matches - a.matches)

  const firstSessionDate = sortedSessions[0]?.scheduled_at ?? null
  const lastSessionDate  = sortedSessions[sortedSessions.length - 1]?.scheduled_at ?? null

  /**
   * Sessions "held" = every non-archived session scheduled from this
   * player's first attended session onward, up to now. A player can't be
   * penalized for sessions that happened before they ever joined.
   */
  const now = Date.now()
  const sessionsHeldSinceFirst = firstSessionDate
    ? allSessions.filter(s => {
        const t = new Date(s.scheduled_at).getTime()
        return t >= new Date(firstSessionDate).getTime() && t <= now
      }).length
    : 0

  const sessionsAttended = sortedSessions.length
  const sessionsMissed = Math.max(0, sessionsHeldSinceFirst - sessionsAttended)
  const attendancePercentage = sessionsHeldSinceFirst > 0
    ? Math.round((sessionsAttended / sessionsHeldSinceFirst) * 100)
    : 0

  const monthlyMap = new Map<string, number>()
  for (const session of sortedSessions) {
    const key = monthKey(session.scheduled_at)
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
  }
  const monthly = [...monthlyMap.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const overview: PlayerOverviewStats = {
    sessionsAttended,
    matchesPlayed:  overallStats.matchesPlayed,
    wins:           overallStats.matchesWon,
    losses:         overallStats.matchesLost,
    draws:          overallStats.matchesDraw,
    gamesWon:       overallStats.gamesWon,
    gamesLost:      overallStats.gamesLost,
    gameDifference: overallStats.gameDifference,
    winPercentage:  overallStats.matchWinPercentage,
    attendancePercentage,
    currentStreak,
    longestStreak,
    firstSessionDate,
    lastSessionDate,
  }

  const attendance: PlayerAttendanceStats = {
    sessionsAttended,
    sessionsMissed,
    attendancePercentage,
    monthly,
  }

  return {
    overview,
    sessionHistory:  [...sessionHistory].reverse(), // most recent first
    matchHistory:    [...matchHistory].reverse(),   // most recent first
    upcomingMatches, // built in chronological (ascending) order already — soonest first
    partners,
    opponents,
    attendance,
  }
}
