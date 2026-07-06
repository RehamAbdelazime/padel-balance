/**
 * Shared generation mechanics — reusable by any TournamentGenerator.
 *
 * Sprint G1: generation and regeneration both think in rounds (see
 * `./round.ts`), not matches. This file is now orchestration only — it
 * groups a schedule's matches into rounds, walks them in order, and delegates
 * every round's actual player selection / team assignment to round.ts.
 * `regenerateRangeWithSolver` and its call sites' signatures are otherwise
 * unchanged, so nothing above this layer (generators, schedule.service,
 * player-runtime.service — i.e. Runtime) needs to change.
 *
 * Format-agnostic: nothing here knows about Americano, Custom, or any other
 * format. Nothing here reads player rating/skill — team-generator only
 * enumerates candidates, and selection among them is driven entirely by the
 * Constraint Solver's own tournament-fairness rules (partner/opponent
 * diversity, equal matches, rest balance).
 */

import type { GeneratorConfig, GeneratorPlayer } from '@/features/team-generator'
import type { PlannedMatch, PlayerRuntimeState, SessionSchedule } from '../../types'
import { emptyPlanningContext, updateContextWithPlannedMatch, groupMatchesIntoRounds } from '../../utils'
import type { PlanningContext } from '../../utils'
import type { Constraint } from '../../constraints'
import { generateFreshRound, generateExistingRound, commitRoundToContext } from './round'
import { validateSchedule, validatePreservation } from './generator-validator'

// ── Planning context builders ─────────────────────────────────────────────────

export function buildContextFromSchedule(
  matches: readonly PlannedMatch[],
  playerIds: readonly string[],
): PlanningContext {
  let ctx = emptyPlanningContext(playerIds)
  for (const match of matches) {
    ctx = updateContextWithPlannedMatch(ctx, match, playerIds)
  }
  return ctx
}

export function buildContextUpTo(
  matches: readonly PlannedMatch[],
  upToExclusive: number,
  playerIds: readonly string[],
): PlanningContext {
  return buildContextFromSchedule(matches.slice(0, upToExclusive), playerIds)
}

// ── Fresh generation — one full schedule, round by round ─────────────────────

/**
 * Generates `targetCount` matches from scratch, `courtCount` at a time (one
 * round), for a fresh SessionSchedule. Replaces the old "generate one match,
 * update context, generate the next match" loop (Sprint G1, Step 2).
 *
 * @throws {Error} if any round can't find enough AVAILABLE players — this
 *   should not happen at fresh-generation time (the caller's own `validate()`
 *   already checked the total player count), but is not silently swallowed.
 */
export function generateRoundsWithSolver(
  allPlayers: readonly GeneratorPlayer[],
  playerIds: readonly string[],
  targetCount: number,
  courtCount: number,
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  baseConfig: GeneratorConfig,
  constraints: ReadonlyArray<Constraint>,
): PlannedMatch[] {
  let ctx = emptyPlanningContext(playerIds)
  const matches: PlannedMatch[] = []
  let remaining = targetCount

  while (remaining > 0) {
    const courtsThisRound = Math.min(courtCount, remaining)
    const result = generateFreshRound(courtsThisRound, allPlayers, ctx, playerStates, baseConfig, matches, constraints)

    if (result.status !== 'success') {
      throw new Error(
        `Not enough available players to generate a schedule: need ${result.requiredPlayers}, ` +
        `have ${result.availablePlayers} for ${result.courtCount} court(s).`,
      )
    }

    matches.push(...result.matches)
    ctx = commitRoundToContext(ctx, result.matches, playerIds)
    remaining -= courtsThisRound
  }

  const validation = validateSchedule(matches, playerIds, courtCount, playerStates)
  if (!validation.valid) {
    throw new Error(`Generated schedule failed validation: ${validation.reasons.join('; ')}`)
  }

  return matches
}

// ── Regeneration — only the requested rounds, never partial ─────────────────

/**
 * Regenerates matches[from, to) — but always at whole-round granularity
 * internally: any round that has at least one slot inside [from, to) has
 * ITS ENTIRE remaining (non-preserved) slot set regenerated together, using
 * one round-level player selection, so two courts in the same round can
 * never draw an overlapping player (Sprint G1). Rounds entirely before
 * `from` are walked (folded into context) but never modified — identical
 * externally-observable behaviour to the pre-Sprint-G1 implementation, just
 * internally round-aware. `courtCount` is required so round boundaries can
 * be computed; every call site already has this value available.
 *
 * @throws {Error} if a round can't find enough AVAILABLE players — same
 *   external contract as before (callers already catch this, e.g.
 *   player-runtime.service's tryRegenerateRange).
 */
export function regenerateRangeWithSolver(
  schedule: SessionSchedule,
  allPlayers: GeneratorPlayer[],
  playerIds: string[],
  from: number,
  to: number,
  baseConfig: GeneratorConfig,
  constraints: ReadonlyArray<Constraint>,
  courtCount: number,
): { newMatches: PlannedMatch[]; finalStates: ReadonlyMap<string, PlayerRuntimeState> } {
  const boundedTo    = Math.min(to, schedule.matches.length)
  const rounds       = groupMatchesIntoRounds(schedule.matches, courtCount)
  const resultMatches = [...schedule.matches]
  const currentStates = schedule.playerStates
  let ctx = emptyPlanningContext(playerIds)

  for (const round of rounds) {
    const roundStart = round.slots[0]?.matchIndex
    if (roundStart === undefined || roundStart >= boundedTo) break // this and every later round are entirely outside the requested range

    const roundSlots = round.slots.map(s => resultMatches[s.matchIndex]!)
    const regenerateIds = new Set(
      round.slots.filter(s => s.matchIndex >= from && s.matchIndex < boundedTo).map(s => s.match.id),
    )

    if (regenerateIds.size === 0) {
      ctx = commitRoundToContext(ctx, roundSlots, playerIds)
      continue
    }

    const priorMatches = resultMatches.slice(0, roundStart)
    const result = generateExistingRound(
      roundSlots, regenerateIds, allPlayers, ctx, currentStates, baseConfig, priorMatches, constraints,
    )

    if (result.status !== 'success') {
      throw new Error(
        `Not enough available players to regenerate round ${round.roundNumber}: ` +
        `need ${result.requiredPlayers}, have ${result.availablePlayers} for ${result.courtCount} court(s).`,
      )
    }

    for (let i = 0; i < round.slots.length; i++) {
      resultMatches[round.slots[i]!.matchIndex] = result.matches[i]!
    }
    ctx = commitRoundToContext(ctx, result.matches, playerIds)
  }

  const validation = validateSchedule(resultMatches, playerIds, courtCount, currentStates)
  if (!validation.valid) {
    throw new Error(`Regenerated schedule failed validation: ${validation.reasons.join('; ')}`)
  }

  const preservation = validatePreservation(schedule.matches, resultMatches)
  if (!preservation.valid) {
    throw new Error(`Regenerated schedule failed preservation check: ${preservation.reasons.join('; ')}`)
  }

  return { newMatches: resultMatches, finalStates: currentStates }
}
