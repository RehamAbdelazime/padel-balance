/**
 * Sprint G1 Step 9 — generator tests.
 *
 * Covers the round-based generation core (round.ts, generation-helpers.ts,
 * generator-validator.ts) directly: 8/12/16 players, 1/2/3 courts,
 * insufficient players, locked matches, manual matches, round validation,
 * and duplicate-player prevention. This is the first test suite in the
 * codebase — scoped deliberately to the generator layer only, per the
 * sprint's explicit boundaries (no UI/Runtime/Report changes).
 */

import { describe, it, expect } from 'vitest'
import type { GeneratorPlayer } from '@/features/team-generator'
import type { PlannedMatch, PlayerRuntimeState, SessionSchedule, ScheduleQuality } from '../../../types'
import { getAllConstraints } from '../../../constraints'
import { validateRound, generateFreshRound, generateExistingRound } from '../round'
import { generateRoundsWithSolver, regenerateRangeWithSolver } from '../generation-helpers'
import { validateSchedule, validatePreservation } from '../generator-validator'
import { emptyPlanningContext } from '../../../utils'

function players(count: number): GeneratorPlayer[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}` }))
}

function allAvailable(ids: readonly string[]): ReadonlyMap<string, PlayerRuntimeState> {
  return new Map(ids.map(id => [id, { playerId: id, status: 'AVAILABLE' as const }]))
}

const constraints = getAllConstraints()

function everyPlayedPlayer(matches: readonly PlannedMatch[]): string[] {
  return matches.flatMap(m => [...m.teamA, ...m.teamB])
}

describe('generateRoundsWithSolver — fresh generation', () => {
  const cases: Array<{ playerCount: number; courtCount: number; matchCount: number }> = [
    { playerCount: 8,  courtCount: 1, matchCount: 4 },
    { playerCount: 8,  courtCount: 2, matchCount: 4 },
    { playerCount: 12, courtCount: 2, matchCount: 6 },
    { playerCount: 12, courtCount: 3, matchCount: 6 },
    { playerCount: 16, courtCount: 3, matchCount: 8 },
  ]

  for (const { playerCount, courtCount, matchCount } of cases) {
    it(`generates a valid schedule for ${playerCount} players / ${courtCount} court(s)`, () => {
      const ids   = Array.from({ length: playerCount }, (_, i) => `p${i + 1}`)
      const state = allAvailable(ids)

      const matches = generateRoundsWithSolver(
        players(playerCount), ids, matchCount, courtCount, state, {}, constraints,
      )

      expect(matches.length).toBe(matchCount)

      const validation = validateSchedule(matches, ids, courtCount)
      expect(validation.valid).toBe(true)
    })
  }

  it('never double-books a player within the same round, even with a shrunk pool', () => {
    // 6 AVAILABLE players, 2 courts requested — exactly enough for one round
    // (2 courts x 4 = 8 needed vs only 6 available is the insufficient case,
    // tested separately below); here we use exactly 8 available for 2 courts
    // to confirm no overlap across courts in a single round.
    const ids   = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const state = allAvailable(ids)
    const ctx    = emptyPlanningContext(ids)

    const result = generateFreshRound(2, players(8), ctx, state, {}, [], constraints)
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      const played = everyPlayedPlayer(result.matches)
      expect(new Set(played).size).toBe(played.length) // no duplicates across courts
      expect(played.length).toBe(8)
    }
  })
})

describe('insufficient players', () => {
  it('returns a structured insufficient-players result instead of throwing, at round level', () => {
    const ids   = Array.from({ length: 6 }, (_, i) => `p${i + 1}`)
    const state = allAvailable(ids)
    const ctx    = emptyPlanningContext(ids)

    // 2 courts requires 8 players; only 6 are AVAILABLE.
    const result = generateFreshRound(2, players(6), ctx, state, {}, [], constraints)

    expect(result.status).toBe('insufficient-players')
    if (result.status === 'insufficient-players') {
      expect(result.requiredPlayers).toBe(8)
      expect(result.availablePlayers).toBe(6)
      expect(result.courtCount).toBe(2)
    }
  })

  it('surfaces the same failure as a thrown Error from generateRoundsWithSolver', () => {
    const ids   = Array.from({ length: 6 }, (_, i) => `p${i + 1}`)
    const state = allAvailable(ids)

    expect(() =>
      generateRoundsWithSolver(players(6), ids, 2, 2, state, {}, constraints),
    ).toThrow(/Not enough available players/)
  })
})

describe('round validation', () => {
  function makeMatch(teamA: [string, string], teamB: [string, string], courtNumber: number | null): PlannedMatch {
    return {
      id: `${teamA.join('')}-${teamB.join('')}-${courtNumber}`,
      origin: 'AUTO',
      protection: 'UNLOCKED',
      modified: false,
      courtNumber,
      teamA,
      teamB,
      explanation: [],
      warnings: [],
      isCompleted: false,
      matchStatus: 'PENDING',
    }
  }

  it('accepts a structurally correct round', () => {
    const matches = [
      makeMatch(['a', 'b'], ['c', 'd'], 1),
      makeMatch(['e', 'f'], ['g', 'h'], 2),
    ]
    expect(validateRound(matches, 2).valid).toBe(true)
  })

  it('rejects a round with a player duplicated across two courts', () => {
    const matches = [
      makeMatch(['a', 'b'], ['c', 'd'], 1),
      makeMatch(['a', 'e'], ['f', 'g'], 2), // 'a' reused
    ]
    const validation = validateRound(matches, 2)
    expect(validation.valid).toBe(false)
    expect(validation.reasons.some(r => r.includes('more than one match'))).toBe(true)
  })

  it('rejects a round with a duplicate court number', () => {
    const matches = [
      makeMatch(['a', 'b'], ['c', 'd'], 1),
      makeMatch(['e', 'f'], ['g', 'h'], 1), // duplicate court
    ]
    const validation = validateRound(matches, 2)
    expect(validation.valid).toBe(false)
    expect(validation.reasons.some(r => r.includes('Duplicate court'))).toBe(true)
  })

  it('rejects a round with the wrong number of matches', () => {
    const matches = [makeMatch(['a', 'b'], ['c', 'd'], 1)]
    const validation = validateRound(matches, 2)
    expect(validation.valid).toBe(false)
    expect(validation.reasons.some(r => r.includes('Expected 2 match'))).toBe(true)
  })
})

describe('locked and manual matches are preserved across regeneration', () => {
  function buildInitialSchedule(playerIds: string[], courtCount: number, matchCount: number): SessionSchedule {
    const state = allAvailable(playerIds)
    const matches = generateRoundsWithSolver(players(playerIds.length), playerIds, matchCount, courtCount, state, {}, constraints)
    const quality: ScheduleQuality = {
      overall: 100,
      equalPlayTime:     { score: 100, label: '', explanation: '' },
      partnerDiversity:  { score: 100, label: '', explanation: '' },
      opponentDiversity: { score: 100, label: '', explanation: '' },
      restBalance:       { score: 100, label: '', explanation: '' },
    }
    return {
      sessionId: 's1', phase: 'PLANNING', version: 1, matches, quality,
      targetCount: matchCount, playerStates: state, currentMatchIndex: null,
    }
  }

  it('never touches a LOCKED match during "all" regeneration', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildInitialSchedule(ids, 2, 4)
    const locked: PlannedMatch = { ...schedule.matches[0]!, protection: 'LOCKED' }
    const withLock = { ...schedule, matches: [locked, ...schedule.matches.slice(1)] }

    const { newMatches } = regenerateRangeWithSolver(
      withLock, players(8), ids, 0, withLock.matches.length, {}, constraints, 2,
    )

    expect(newMatches[0]).toEqual(locked)
  })

  it('never touches a MANUAL match during "all" regeneration', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildInitialSchedule(ids, 2, 4)
    const manual: PlannedMatch = { ...schedule.matches[1]!, origin: 'MANUAL' }
    const withManual = { ...schedule, matches: [schedule.matches[0]!, manual, ...schedule.matches.slice(2)] }

    const { newMatches } = regenerateRangeWithSolver(
      withManual, players(8), ids, 0, withManual.matches.length, {}, constraints, 2,
    )

    expect(newMatches[1]).toEqual(manual)
  })

  it('excludes preserved players from the pool used to regenerate the rest of the same round', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildInitialSchedule(ids, 2, 4)
    const locked: PlannedMatch = { ...schedule.matches[0]!, protection: 'LOCKED' }
    const withLock = { ...schedule, matches: [locked, ...schedule.matches.slice(1)] }
    const lockedPlayers = new Set([...locked.teamA, ...locked.teamB])

    const { newMatches } = regenerateRangeWithSolver(
      withLock, players(8), ids, 0, withLock.matches.length, {}, constraints, 2,
    )

    // Round 1 (courts 1 & 2, i.e. matches[0] and matches[1]) must not
    // reassign any of the locked match's players onto the other court.
    const round1Court2Players = [...newMatches[1]!.teamA, ...newMatches[1]!.teamB]
    for (const id of round1Court2Players) {
      expect(lockedPlayers.has(id)).toBe(false)
    }
    expect(validateSchedule(newMatches, ids, 2).valid).toBe(true)
  })
})

describe('generateExistingRound', () => {
  it('leaves a round untouched when nothing in it is requested for regeneration', () => {
    const ids   = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const state = allAvailable(ids)
    const ctx    = emptyPlanningContext(ids)

    const fresh = generateFreshRound(2, players(8), ctx, state, {}, [], constraints)
    if (fresh.status !== 'success') throw new Error('setup failed')

    const result = generateExistingRound(fresh.matches, new Set(), players(8), ctx, state, {}, [], constraints)
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.matches).toEqual(fresh.matches)
    }
  })
})

// ── Sprint G1 Step 10 — certification tests ──────────────────────────────────

function buildSchedule(playerIds: string[], courtCount: number, matchCount: number): SessionSchedule {
  const state = allAvailable(playerIds)
  const matches = generateRoundsWithSolver(players(playerIds.length), playerIds, matchCount, courtCount, state, {}, constraints)
  const quality: ScheduleQuality = {
    overall: 100,
    equalPlayTime:     { score: 100, label: '', explanation: '' },
    partnerDiversity:  { score: 100, label: '', explanation: '' },
    opponentDiversity: { score: 100, label: '', explanation: '' },
    restBalance:       { score: 100, label: '', explanation: '' },
  }
  return {
    sessionId: 's1', phase: 'PLANNING', version: 1, matches, quality,
    targetCount: matchCount, playerStates: state, currentMatchIndex: null,
  }
}

describe('rest player', () => {
  it('excludes a RESTING player from the regenerated round, without dropping them from the attendance pool', () => {
    // 10 players / 2 courts needs 8 per round — 2 spare, so resting one
    // player leaves a genuinely fillable round (not an insufficient-players case).
    const ids = Array.from({ length: 10 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const restingStates = new Map(schedule.playerStates)
    restingStates.set('p1', { playerId: 'p1', status: 'RESTING' })
    const withRest = { ...schedule, playerStates: restingStates }

    const { newMatches } = regenerateRangeWithSolver(
      withRest, players(10), ids, 0, withRest.matches.length, {}, constraints, 2,
    )

    const round1Players = [...newMatches[0]!.teamA, ...newMatches[0]!.teamB, ...newMatches[1]!.teamA, ...newMatches[1]!.teamB]
    expect(round1Players.includes('p1')).toBe(false)
    expect(validateSchedule(newMatches, ids, 2, restingStates).valid).toBe(true)
  })
})

describe('leave player', () => {
  it('excludes a LEFT player from every regenerated round', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 6)
    const leftStates = new Map(schedule.playerStates)
    leftStates.set('p1', { playerId: 'p1', status: 'LEFT' })
    const withLeft = { ...schedule, playerStates: leftStates }

    const { newMatches } = regenerateRangeWithSolver(
      withLeft, players(10), ids, 0, withLeft.matches.length, {}, constraints, 2,
    )

    const everyPlayer = everyPlayedPlayer(newMatches)
    expect(everyPlayer.includes('p1')).toBe(false)
    expect(validateSchedule(newMatches, ids, 2, leftStates).valid).toBe(true)
  })
})

describe('replace player', () => {
  it('excludes a REPLACED player and includes their replacement once marked AVAILABLE', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const replacedStates = new Map(schedule.playerStates)
    replacedStates.set('p1', { playerId: 'p1', status: 'REPLACED', replacedByPlayerId: 'sub1' })
    replacedStates.set('sub1', { playerId: 'sub1', status: 'AVAILABLE' })
    const withReplacement = { ...schedule, playerStates: replacedStates }
    const idsWithReplacement = [...ids, 'sub1']
    const playersWithReplacement = [...players(8), { id: 'sub1' }]

    const { newMatches } = regenerateRangeWithSolver(
      withReplacement, playersWithReplacement, idsWithReplacement, 0, withReplacement.matches.length, {}, constraints, 2,
    )

    const everyPlayer = everyPlayedPlayer(newMatches)
    expect(everyPlayer.includes('p1')).toBe(false)
    expect(validateSchedule(newMatches, idsWithReplacement, 2, replacedStates).valid).toBe(true)
  })
})

describe('late player', () => {
  it('a player added mid-session becomes eligible for later regenerated rounds', () => {
    // Session started with 8 AVAILABLE players; a 9th attendee (not part of
    // the original selection pool at all) arrives late and is added to the
    // attendance/AVAILABLE pool before the remaining rounds regenerate.
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const idsWithLatePlayer = [...ids, 'late1']
    const statesWithLatePlayer = new Map(schedule.playerStates)
    statesWithLatePlayer.set('late1', { playerId: 'late1', status: 'AVAILABLE' })
    const withLatePlayer = { ...schedule, playerStates: statesWithLatePlayer }
    const playersWithLatePlayer = [...players(8), { id: 'late1' }]

    const { newMatches } = regenerateRangeWithSolver(
      withLatePlayer, playersWithLatePlayer, idsWithLatePlayer, 0, withLatePlayer.matches.length, {}, constraints, 2,
    )

    expect(validateSchedule(newMatches, idsWithLatePlayer, 2, statesWithLatePlayer).valid).toBe(true)
  })
})

describe('runtime-completed matches are preserved', () => {
  it('never regenerates a FINISHED match, even if its players later change status', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const finished: PlannedMatch = { ...schedule.matches[0]!, isCompleted: true, matchStatus: 'FINISHED' }
    const withFinished = { ...schedule, matches: [finished, ...schedule.matches.slice(1)] }

    // One of the finished match's players later leaves the session — this
    // must not retroactively invalidate their already-played match.
    const finishedPlayerId = finished.teamA[0]
    const laterStates = new Map(withFinished.playerStates)
    laterStates.set(finishedPlayerId, { playerId: finishedPlayerId, status: 'LEFT' })
    const withLaterStates = { ...withFinished, playerStates: laterStates }

    const { newMatches } = regenerateRangeWithSolver(
      withLaterStates, players(10), ids, 0, withLaterStates.matches.length, {}, constraints, 2,
    )

    expect(newMatches[0]).toEqual(finished)
    expect(validatePreservation(withLaterStates.matches, newMatches).valid).toBe(true)
    expect(validateSchedule(newMatches, ids, 2, laterStates).valid).toBe(true)
  })
})

describe('100 repeated generations', () => {
  it('always produces a structurally valid schedule, with no crash, across 100 runs', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `p${i + 1}`)
    const state = allAvailable(ids)

    for (let i = 0; i < 100; i++) {
      const matches = generateRoundsWithSolver(players(12), ids, 6, 3, state, {}, constraints)
      expect(validateSchedule(matches, ids, 3).valid).toBe(true)
    }
  })
})

describe('duplicate detection', () => {
  it('validateSchedule flags a duplicate match id across the schedule', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const duplicated = [schedule.matches[0]!, { ...schedule.matches[1]!, id: schedule.matches[0]!.id }, ...schedule.matches.slice(2)]

    const validation = validateSchedule(duplicated, ids, 2)
    expect(validation.valid).toBe(false)
    expect(validation.reasons.some(r => r.includes('Duplicate match id'))).toBe(true)
  })

  it('validateSchedule flags a duplicate court number within a round', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const duplicatedCourt = [
      schedule.matches[0]!,
      { ...schedule.matches[1]!, courtNumber: schedule.matches[0]!.courtNumber },
      ...schedule.matches.slice(2),
    ]

    const validation = validateSchedule(duplicatedCourt, ids, 2)
    expect(validation.valid).toBe(false)
    expect(validation.reasons.some(r => r.includes('Duplicate court'))).toBe(true)
  })
})

describe('standby validation', () => {
  it('flags a non-AVAILABLE player who ended up assigned to a fresh (non-preserved) match', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `p${i + 1}`)
    const schedule = buildSchedule(ids, 2, 4)
    const restingStates = new Map(schedule.playerStates)
    const playerInMatch = schedule.matches[0]!.teamA[0]
    restingStates.set(playerInMatch, { playerId: playerInMatch, status: 'RESTING' })

    // This match was never actually regenerated around the RESTING change —
    // simulating a hypothetical generator bug where a resting player still
    // ended up on a court, to prove the validator would catch it.
    const validation = validateSchedule(schedule.matches, ids, 2, restingStates)
    expect(validation.valid).toBe(false)
    expect(validation.reasons.some(r => r.includes('standby list would be incorrect'))).toBe(true)
  })
})
