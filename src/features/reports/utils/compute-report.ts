/**
 * Session Report — pure derivation from already-persisted data.
 *
 * No Supabase, no React, no Generator/constraint-solver imports. Everything
 * here reads facts that already happened (who played whom, what the score
 * was) — it never re-runs or reads scheduling quality/fairness scoring, and
 * never mutates anything (Sprint R2).
 *
 * Win/loss/games-won/games-lost/win% reuse the existing, already-used-in-
 * production `calculatePlayerStats` from the `statistics` feature — the
 * only new code here is the adapter that turns a session's PlannedMatch[]
 * into the `PlayerMatchResult[]` shape that calculator already expects.
 */

import type { PlannedMatch, SessionAttendee, PlayerRuntimeState, PlayerRuntimeStatus } from '@/features/sessions/types'
import { groupMatchesIntoRounds } from '@/features/sessions/utils'
import { calculatePlayerStats } from '@/features/statistics/services/statistics.service'
import type { PlayerMatchResult } from '@/features/statistics/types'
import type {
  MatchWinner,
  MatchReportRow,
  RoundReportGroup,
  PlayerReportStats,
  PartnerStat,
  OpponentStat,
  PlayerAnalysis,
  SessionInsights,
  SessionReportData,
} from '../types'

// ── Shared helpers ────────────────────────────────────────────────────────────

type DecidedMatch = PlannedMatch & { result: { team1: number; team2: number } }

function isDecided(match: PlannedMatch): match is DecidedMatch {
  return match.result !== undefined && match.result.team1 !== null && match.result.team2 !== null
}

function matchWinner(match: DecidedMatch): MatchWinner {
  if (match.result.team1 > match.result.team2) return 'A'
  if (match.result.team2 > match.result.team1) return 'B'
  return 'DRAW'
}

function playerTeam(match: PlannedMatch, playerId: string): 'A' | 'B' | null {
  if (match.teamA.includes(playerId)) return 'A'
  if (match.teamB.includes(playerId)) return 'B'
  return null
}

// ── Section 2 — Match Results, grouped by Round ──────────────────────────────

function toMatchReportRow(match: PlannedMatch): MatchReportRow {
  const decided = isDecided(match)
  return {
    matchId:      match.id,
    courtNumber:  match.courtNumber,
    teamA:        match.teamA,
    teamB:        match.teamB,
    scoreA:       decided ? match.result.team1 : null,
    scoreB:       decided ? match.result.team2 : null,
    winner:       decided ? matchWinner(match) : null,
    isManualEdit: match.origin === 'MANUAL' || match.modified,
    matchStatus:  match.matchStatus,
  }
}

export function computeRounds(matches: readonly PlannedMatch[], courtCount: number): RoundReportGroup[] {
  return groupMatchesIntoRounds(matches, courtCount).map(round => ({
    roundNumber: round.roundNumber,
    matches:     round.slots.map(slot => toMatchReportRow(slot.match)),
  }))
}

// ── Section 3 — Player Performance ───────────────────────────────────────────

function toPlayerMatchResults(matches: readonly PlannedMatch[], playerId: string): PlayerMatchResult[] {
  const results: PlayerMatchResult[] = []
  for (const match of matches) {
    if (!isDecided(match)) continue
    const team = playerTeam(match, playerId)
    if (!team) continue
    results.push({
      matchId:       match.id,
      myScore:       team === 'A' ? match.result.team1 : match.result.team2,
      opponentScore: team === 'A' ? match.result.team2 : match.result.team1,
    })
  }
  return results
}

/** A round counts as "played" for a player if they appear in any of that round's matches, regardless of result. */
function roundsPlayedCount(rounds: readonly RoundReportGroup[], playerId: string): number {
  return rounds.filter(round =>
    round.matches.some(m => m.teamA.includes(playerId) || m.teamB.includes(playerId)),
  ).length
}

export function computePlayerStats(
  matches: readonly PlannedMatch[],
  rounds: readonly RoundReportGroup[],
  attendees: readonly SessionAttendee[],
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
): PlayerReportStats[] {
  return attendees.map(attendee => {
    const playerId = attendee.player_id
    const stats    = calculatePlayerStats(toPlayerMatchResults(matches, playerId))
    const status: PlayerRuntimeStatus = playerStates.get(playerId)?.status ?? 'AVAILABLE'
    const roundsPlayed = roundsPlayedCount(rounds, playerId)

    return {
      playerId,
      name:             attendee.players.name,
      matchesPlayed:    stats.matchesPlayed,
      wins:             stats.matchesWon,
      losses:           stats.matchesLost,
      draws:            stats.matchesDraw,
      gamesWon:         stats.gamesWon,
      gamesLost:        stats.gamesLost,
      gameDifference:   stats.gameDifference,
      winPercentage:    stats.matchWinPercentage,
      attendanceStatus: status,
      standbyCount:     Math.max(0, rounds.length - roundsPlayed),
    }
  })
}

// ── Sections 4 & 5 — Partner / Opponent analysis ─────────────────────────────

type PartnerAcc  = { matchesTogether: number; winsTogether: number }
type OpponentAcc = { timesPlayed: number; wins: number; losses: number }

function increment<K, V>(map: Map<K, V>, key: K, init: V, update: (v: V) => void): void {
  const existing = map.get(key)
  const value = existing ?? init
  update(value)
  if (!existing) map.set(key, value)
}

export function computePlayerAnalysis(
  matches: readonly PlannedMatch[],
  attendees: readonly SessionAttendee[],
): PlayerAnalysis[] {
  const nameById = new Map(attendees.map(a => [a.player_id, a.players.name]))

  const partnersByPlayer  = new Map<string, Map<string, PartnerAcc>>()
  const opponentsByPlayer = new Map<string, Map<string, OpponentAcc>>()

  function partnerMapFor(playerId: string): Map<string, PartnerAcc> {
    let m = partnersByPlayer.get(playerId)
    if (!m) { m = new Map(); partnersByPlayer.set(playerId, m) }
    return m
  }
  function opponentMapFor(playerId: string): Map<string, OpponentAcc> {
    let m = opponentsByPlayer.get(playerId)
    if (!m) { m = new Map(); opponentsByPlayer.set(playerId, m) }
    return m
  }

  for (const match of matches) {
    if (!isDecided(match)) continue
    const winner = matchWinner(match)

    for (const [team, won] of [[match.teamA, winner === 'A'], [match.teamB, winner === 'B']] as const) {
      const [p1, p2] = team
      increment(partnerMapFor(p1), p2, { matchesTogether: 0, winsTogether: 0 },
        v => { v.matchesTogether += 1; if (won) v.winsTogether += 1 })
      increment(partnerMapFor(p2), p1, { matchesTogether: 0, winsTogether: 0 },
        v => { v.matchesTogether += 1; if (won) v.winsTogether += 1 })
    }

    for (const a of match.teamA) {
      for (const b of match.teamB) {
        increment(opponentMapFor(a), b, { timesPlayed: 0, wins: 0, losses: 0 },
          v => { v.timesPlayed += 1; if (winner === 'A') v.wins += 1; if (winner === 'B') v.losses += 1 })
        increment(opponentMapFor(b), a, { timesPlayed: 0, wins: 0, losses: 0 },
          v => { v.timesPlayed += 1; if (winner === 'B') v.wins += 1; if (winner === 'A') v.losses += 1 })
      }
    }
  }

  return attendees.map(attendee => {
    const playerId = attendee.player_id

    const partners: PartnerStat[] = [...(partnersByPlayer.get(playerId) ?? new Map()).entries()]
      .map(([partnerId, acc]) => ({
        partnerId,
        partnerName:     nameById.get(partnerId) ?? partnerId,
        matchesTogether: acc.matchesTogether,
        winsTogether:     acc.winsTogether,
        winRateTogether:  acc.matchesTogether > 0 ? Math.round((acc.winsTogether / acc.matchesTogether) * 100) : 0,
      }))
      .sort((a, b) => b.matchesTogether - a.matchesTogether)

    const opponents: OpponentStat[] = [...(opponentsByPlayer.get(playerId) ?? new Map()).entries()]
      .map(([opponentId, acc]) => ({
        opponentId,
        opponentName: nameById.get(opponentId) ?? opponentId,
        timesPlayed:  acc.timesPlayed,
        wins:         acc.wins,
        losses:       acc.losses,
      }))
      .sort((a, b) => b.timesPlayed - a.timesPlayed)

    return { playerId, name: attendee.players.name, partners, opponents }
  })
}

// ── Section 6 — Session Insights ─────────────────────────────────────────────

function scoreMargin(match: MatchReportRow): number | null {
  return match.scoreA !== null && match.scoreB !== null ? Math.abs(match.scoreA - match.scoreB) : null
}

/** Longest run of consecutive wins for one player, in the session's actual match order. */
function longestStreakFor(matches: readonly PlannedMatch[], playerId: string): number {
  let best = 0
  let current = 0
  for (const match of matches) {
    if (!isDecided(match)) continue
    const team = playerTeam(match, playerId)
    if (!team) continue
    const won = matchWinner(match) === team
    current = won ? current + 1 : 0
    best = Math.max(best, current)
  }
  return best
}

export function computeInsights(
  matches: readonly PlannedMatch[],
  rounds: readonly RoundReportGroup[],
  players: readonly PlayerReportStats[],
  playerAnalysis: readonly PlayerAnalysis[],
): SessionInsights {
  const decidedRows = rounds.flatMap(r => r.matches).filter(m => m.scoreA !== null && m.scoreB !== null)
  const playedPlayers = players.filter(p => p.matchesPlayed > 0)

  const mostActivePlayer = playedPlayers.length > 0
    ? playedPlayers.reduce((best, p) => (p.matchesPlayed > best.matchesPlayed ? p : best))
    : null

  const bestWinPercentage = playedPlayers.length > 0
    ? playedPlayers.reduce((best, p) => (p.winPercentage > best.winPercentage ? p : best))
    : null

  const closestMatch = decidedRows.length > 0
    ? decidedRows.reduce((best, m) => (scoreMargin(m)! < scoreMargin(best)! ? m : best))
    : null

  const decisiveRows = decidedRows.filter(m => m.winner !== 'DRAW')
  const biggestVictory = decisiveRows.length > 0
    ? decisiveRows.reduce((best, m) => (scoreMargin(m)! > scoreMargin(best)! ? m : best))
    : null

  const streaks = playedPlayers
    .map(p => ({ playerId: p.playerId, name: p.name, streak: longestStreakFor(matches, p.playerId) }))
    .filter(s => s.streak > 0)
  const longestWinningStreak = streaks.length > 0
    ? streaks.reduce((best, s) => (s.streak > best.streak ? s : best))
    : null

  let mostUsedPartnerCombination: SessionInsights['mostUsedPartnerCombination'] = null
  for (const analysis of playerAnalysis) {
    for (const partner of analysis.partners) {
      // Each unordered pair appears from both players' perspectives with
      // identical counts — only consider one direction to avoid double-counting.
      if (partner.partnerId <= analysis.playerId) continue
      if (!mostUsedPartnerCombination || partner.matchesTogether > mostUsedPartnerCombination.matchesTogether) {
        mostUsedPartnerCombination = {
          playerAId: analysis.playerId,
          playerAName: analysis.name,
          playerBId: partner.partnerId,
          playerBName: partner.partnerName,
          matchesTogether: partner.matchesTogether,
        }
      }
    }
  }

  return {
    mostActivePlayer: mostActivePlayer
      ? { playerId: mostActivePlayer.playerId, name: mostActivePlayer.name, matchesPlayed: mostActivePlayer.matchesPlayed }
      : null,
    bestWinPercentage: bestWinPercentage
      ? { playerId: bestWinPercentage.playerId, name: bestWinPercentage.name, winPercentage: bestWinPercentage.winPercentage, matchesPlayed: bestWinPercentage.matchesPlayed }
      : null,
    closestMatch,
    biggestVictory,
    longestWinningStreak,
    mostUsedPartnerCombination,
  }
}

// ── Top-level composition ────────────────────────────────────────────────────

export function computeSessionReport(
  matches: readonly PlannedMatch[],
  courtCount: number,
  attendees: readonly SessionAttendee[],
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
): SessionReportData {
  const rounds         = computeRounds(matches, courtCount)
  const players         = computePlayerStats(matches, rounds, attendees, playerStates)
  const playerAnalysis  = computePlayerAnalysis(matches, attendees)
  const insights        = computeInsights(matches, rounds, players, playerAnalysis)

  return {
    rounds,
    players,
    playerAnalysis,
    insights,
    totalMatches: matches.length,
    totalRounds:  rounds.length,
    totalPlayers: attendees.length,
  }
}
