import { pairKey } from '@/features/team-generator'
import type { GeneratorConfig } from '@/features/team-generator'
import type { PlannedMatch } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Number of recent matches over which the same partner pairing is avoided.
 * With PARTNER_COOLDOWN = 2: if Ahmed+Duaa played together in match N,
 * they will not be paired again until at least match N+2.
 */
const PARTNER_COOLDOWN = 2

// ── Internal types ────────────────────────────────────────────────────────────

/** Accumulated statistics for one player within an in-progress plan. */
type PlayerPlanState = {
  /** Matches this player has played (selected to court). */
  matchesPlayed: number
  /** Matches this player has sat out (not selected). */
  matchesRested: number
  /**
   * How many consecutive matches this player has sat out without playing.
   * Resets to 0 every time they play.
   */
  consecutiveRests: number
  /** How many times this player has been partnered with each other player. */
  partnerFreq: Map<string, number>
  /** How many times this player has faced each other player as an opponent. */
  opponentFreq: Map<string, number>
  /**
   * Partner IDs from the most recent PARTNER_COOLDOWN matches in which
   * this player played. Oldest entry is dropped when a new one is added.
   */
  recentPartnerIds: string[]
}

/**
 * Full accumulated planning context across all processed matches.
 * Drives both player selection (who plays next) and config building
 * (which pairings to avoid).
 */
export type PlanningContext = {
  readonly allPlayerIds: readonly string[]
  readonly matchCount:   number
  /** Keyed by player ID. Every session attendee has an entry. */
  readonly players: ReadonlyMap<string, PlayerPlanState>
}

// ── Factory ───────────────────────────────────────────────────────────────────

/** Creates a blank context for a new plan with no matches processed yet. */
export function emptyPlanningContext(playerIds: readonly string[]): PlanningContext {
  const players = new Map<string, PlayerPlanState>()
  for (const id of playerIds) {
    players.set(id, {
      matchesPlayed:    0,
      matchesRested:    0,
      consecutiveRests: 0,
      partnerFreq:      new Map(),
      opponentFreq:     new Map(),
      recentPartnerIds: [],
    })
  }
  return { allPlayerIds: playerIds, matchCount: 0, players }
}

// ── Config building ───────────────────────────────────────────────────────────

/**
 * Builds a GeneratorConfig from the current planning context.
 * The recentPartners set captures all partner pairs from the last
 * PARTNER_COOLDOWN matches, preventing consecutive same partnerships.
 */
export function buildGeneratorConfig(
  context: PlanningContext,
  baseConfig: GeneratorConfig = {},
): GeneratorConfig {
  const recentPartners = new Set<string>()
  for (const [id, state] of context.players) {
    for (const partnerId of state.recentPartnerIds) {
      recentPartners.add(pairKey(id, partnerId))
    }
  }
  return {
    ...baseConfig,
    recentPartners: recentPartners.size > 0 ? recentPartners : undefined,
  }
}

// ── Context update (shared core) ──────────────────────────────────────────────

/**
 * Applies one match's player assignments to the planning context.
 * Shared core used by updateContextWithPlannedMatch.
 *
 * @param a1 teamA player 1 id
 * @param a2 teamA player 2 id
 * @param b1 teamB player 1 id
 * @param b2 teamB player 2 id
 */
function applyMatchToContext(
  context: PlanningContext,
  a1: string,
  a2: string,
  b1: string,
  b2: string,
  allPlayerIds: readonly string[],
): PlanningContext {
  const playingIds = new Set([a1, a2, b1, b2])

  const partnerOf = new Map<string, string>([
    [a1, a2], [a2, a1],
    [b1, b2], [b2, b1],
  ])

  const opponentsOf = new Map<string, readonly string[]>([
    [a1, [b1, b2]], [a2, [b1, b2]],
    [b1, [a1, a2]], [b2, [a1, a2]],
  ])

  const newPlayers = new Map<string, PlayerPlanState>()

  for (const id of allPlayerIds) {
    const state = context.players.get(id) ?? {
      matchesPlayed:    0,
      matchesRested:    0,
      consecutiveRests: 0,
      partnerFreq:      new Map<string, number>(),
      opponentFreq:     new Map<string, number>(),
      recentPartnerIds: [],
    }

    if (playingIds.has(id)) {
      const partnerId  = partnerOf.get(id)!
      const opponentIds = opponentsOf.get(id)!

      const newPartnerFreq = new Map(state.partnerFreq)
      newPartnerFreq.set(partnerId, (newPartnerFreq.get(partnerId) ?? 0) + 1)

      const newOpponentFreq = new Map(state.opponentFreq)
      for (const oppId of opponentIds) {
        newOpponentFreq.set(oppId, (newOpponentFreq.get(oppId) ?? 0) + 1)
      }

      newPlayers.set(id, {
        matchesPlayed:    state.matchesPlayed + 1,
        matchesRested:    state.matchesRested,
        consecutiveRests: 0,
        partnerFreq:      newPartnerFreq,
        opponentFreq:     newOpponentFreq,
        recentPartnerIds: [partnerId, ...state.recentPartnerIds].slice(0, PARTNER_COOLDOWN),
      })
    } else {
      newPlayers.set(id, {
        ...state,
        matchesRested:    state.matchesRested + 1,
        consecutiveRests: state.consecutiveRests + 1,
      })
    }
  }

  return {
    allPlayerIds,
    matchCount: context.matchCount + 1,
    players:    newPlayers,
  }
}

// ── Public context-update functions ───────────────────────────────────────────

/**
 * Produces a new PlanningContext after processing one PlannedMatch.
 *
 * Applies regardless of PlannedMatch.origin or PlannedMatch.protection:
 * MANUAL and LOCKED matches contribute equally to partner/opponent history.
 *
 * @param allPlayerIds All session attendees, not just the 4 who played.
 */
export function updateContextWithPlannedMatch(
  context: PlanningContext,
  match: PlannedMatch,
  allPlayerIds: readonly string[],
): PlanningContext {
  const [a1, a2] = match.teamA
  const [b1, b2] = match.teamB
  return applyMatchToContext(context, a1, a2, b1, b2, allPlayerIds)
}
