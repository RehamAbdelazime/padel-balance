/**
 * Session Schedule — core domain types for the Live Session Manager.
 *
 * All types are immutable (readonly everywhere). Every mutation produces a
 * new object; nothing is modified in-place.
 *
 * These types replace the previous MatchPlan model, which is retained
 * alongside them and retired in Sprint 15.
 */

// ── Enumerations ──────────────────────────────────────────────────────────────

/**
 * How a match was created.
 *   AUTO   — produced by the generation algorithm
 *   MANUAL — created entirely by the organiser
 */
export type PlannedMatchOrigin = 'AUTO' | 'MANUAL'

/**
 * Whether the match is protected from regeneration.
 *   LOCKED   — preserved by every regeneration operation, regardless of origin
 *   UNLOCKED — eligible for regeneration (subject to origin and isCompleted rules)
 *
 * Protection is an independent axis from origin.
 * Valid combinations: AUTO+UNLOCKED, AUTO+LOCKED, MANUAL+UNLOCKED, MANUAL+LOCKED.
 * Toggling protection does NOT set PlannedMatch.modified.
 */
export type PlannedMatchProtection = 'LOCKED' | 'UNLOCKED'

/**
 * Lifecycle phase of the session.
 *   PLANNING — schedule is being built; no match has started
 *   LIVE     — session is active; completed matches are immutable;
 *              future matches remain fully editable by the organiser
 *   FINISHED — all matches completed; nothing is editable
 */
export type SessionPhase = 'PLANNING' | 'LIVE' | 'FINISHED'

/**
 * Runtime status of a single planned match (Sprint F23.1 foundation).
 *   PENDING   — not yet started
 *   LIVE      — currently being played
 *   FINISHED  — completed, with a validated final score
 *   CANCELLED — organiser cancelled the match; counts as terminal for round
 *               completion purposes but carries no score
 *
 * Set once when the organiser starts the session (see schedule.service.ts
 * `startMatches`): the first N matches (N = distinct courts in use, courts
 * default to 1) become LIVE, everything else becomes PENDING.
 */
export type MatchRuntimeStatus = 'PENDING' | 'LIVE' | 'FINISHED' | 'CANCELLED'

/**
 * Runtime availability of one player during a LIVE session (Sprint F26).
 * Persisted in session_schedule_player_states — attendance only means
 * "belongs to this session"; this is what actually gates selection.
 *
 *   AVAILABLE — fully eligible for future-round selection
 *   RESTING   — organiser-initiated; excluded from future rounds until
 *               Return To Rotation sets this back to AVAILABLE
 *   ABSENT    — never arrived; excluded from all future rounds (only
 *               settable before the player's first match)
 *   LEFT      — departed permanently; excluded from all future rounds;
 *               any round they were already playing when they left is
 *               never touched — they simply finish it
 *   REPLACED  — superseded by another attendee (see PlayerRuntimeState.
 *               replacedByPlayerId); excluded from all future rounds;
 *               their finished-round history is untouched
 */
export type PlayerRuntimeStatus =
  | 'AVAILABLE'
  | 'RESTING'
  | 'ABSENT'
  | 'LEFT'
  | 'REPLACED'

// ── Score model (domain-layer canonical definition) ───────────────────────────

/**
 * The recorded score for a completed match.
 *
 * Defined here (domain layer) rather than in utils so that PlannedMatch.result
 * and all callers share one canonical type. Re-exported from sessions/utils
 * for backward-compatible consumption by existing hooks.
 */
export type MatchScore = {
  readonly team1: number
  readonly team2: number
}

/**
 * A PlannedMatch's score while it may still be a work in progress: either
 * side may be `null` (not yet entered). Distinct from MatchScore (which is
 * always fully populated) — used only for PlannedMatch.result, which is
 * editable while the match is LIVE and finalized (both sides non-null) when
 * the match is FINISHED.
 */
export type LiveMatchScore = {
  readonly team1: number | null
  readonly team2: number | null
}

// ── Match ─────────────────────────────────────────────────────────────────────

/**
 * One entry in a SessionSchedule — the fundamental editable unit.
 *
 * Design rules:
 *   • Every field is readonly. Mutation produces a new PlannedMatch.
 *   • origin + protection are independent axes (four valid combinations).
 *   • modified becomes true when the organiser changes team composition,
 *     court assignment, or any other content field. Locking/unlocking and
 *     recording a result do NOT set modified.
 *   • courtNumber is null for unassigned / single-court sessions.
 *     Future: courtId: string | null when courts are database entities.
 *   • warnings are algorithm observations; they never block organiser actions.
 *   • result is present only when isCompleted === true.
 */
export type PlannedMatch = {
  /** Client-side UUID. Not a database ID; assigned before any DB write. */
  readonly id:           string
  readonly origin:       PlannedMatchOrigin
  readonly protection:   PlannedMatchProtection
  /**
   * True when the organiser has changed team composition, court, or any
   * other content field since the match was created or last generated.
   * False for pure algorithm output and fresh manual creations.
   */
  readonly modified:     boolean
  /**
   * Court assignment. null = unassigned or single-court session.
   * Named courtNumber (integer) in V1; will become courtId: string | null
   * when court management is introduced.
   */
  readonly courtNumber:  number | null
  /** Player IDs assigned to Team A. Positional tuple: [player1, player2]. */
  readonly teamA:        readonly [string, string]
  /** Player IDs assigned to Team B. Positional tuple: [player1, player2]. */
  readonly teamB:        readonly [string, string]
  /** Algorithm explanation for this match. Array of i18n strings. */
  readonly explanation:  readonly string[]
  /**
   * Algorithm observations (e.g. "These players have partnered 4 times").
   * Never blocks the organiser. Display only.
   */
  readonly warnings:     readonly string[]
  readonly isCompleted:  boolean
  /**
   * The organiser-entered score. Editable (autosaved) while matchStatus is
   * LIVE — either side may be null until both are entered. Finalized (both
   * sides non-null, both integers >= 0) and locked once isCompleted === true.
   */
  readonly result?:      LiveMatchScore
  /** Runtime status (Sprint F23.1). PENDING until the session is started. */
  readonly matchStatus:  MatchRuntimeStatus
}

// ── Quality ───────────────────────────────────────────────────────────────────

/**
 * One quality dimension with its score and a concrete, data-driven explanation.
 *
 * The explanation is NOT a generic label. It uses real schedule data:
 *   "Highest repeat pairing: Ahmed + Duaa appear together 3 times."
 *   "3 players have played 4 matches; 2 players have played 3 matches."
 */
export type ScheduleQualityDimension = {
  /** 0–100. Higher is better. */
  readonly score:       number
  /** i18n key for the dimension label ("Partner Diversity", etc.). */
  readonly label:       string
  /**
   * Concrete explanation string. May be a pre-formatted sentence or an
   * i18n key with interpolated values — determined by the quality service.
   */
  readonly explanation: string
}

/**
 * Overall quality of a SessionSchedule, broken down by four independent
 * tournament-fairness dimensions. No player rating/skill is involved —
 * scheduling and rating are fully independent subsystems.
 *
 * Dimension weights (used to compute overall):
 *   Equal Play Time    35 %
 *   Partner Diversity  30 %
 *   Opponent Diversity 20 %
 *   Rest Balance       15 %
 *
 * courtUsage is reserved; computed when multi-court support is introduced.
 */
export type ScheduleQuality = {
  /** Weighted mean of all active dimensions. 0–100. */
  readonly overall:           number
  readonly equalPlayTime:     ScheduleQualityDimension
  readonly partnerDiversity:  ScheduleQualityDimension
  readonly opponentDiversity: ScheduleQualityDimension
  readonly restBalance:       ScheduleQualityDimension
}

// ── Player runtime ────────────────────────────────────────────────────────────

/**
 * Runtime availability of one player during the session.
 * Stored in SessionSchedule.playerStates and persisted (session_schedule_player_states).
 */
export type PlayerRuntimeState = {
  readonly playerId: string
  readonly status:   PlayerRuntimeStatus
  /** Present only when status === 'REPLACED' — who took over their remaining rounds. */
  readonly replacedByPlayerId?: string
}

// ── Session schedule ──────────────────────────────────────────────────────────

/**
 * The complete in-memory live session state — the single source of truth
 * for the session workflow.
 *
 * Persistence: entirely ephemeral (lost on browser refresh). Intentional for V1.
 * Only recorded match data is written to Supabase.
 *
 * Mutation discipline:
 *   • Every field is readonly. Every mutation returns a new SessionSchedule.
 *   • version is incremented by exactly 1 in every top-level mutation function.
 *     Internal helpers (producing a PlannedMatch or PlanningContext) never
 *     touch version. This allows future undo/redo and autosave detection.
 *
 * Preservation predicate (applied by all regeneration operations):
 *   preserved(match) = match.isCompleted
 *                   OR match.protection === 'LOCKED'
 *                   OR match.origin === 'MANUAL'
 *
 * currentMatchIndex:
 *   null during PLANNING.
 *   Set to the first uncompleted match index when the session goes LIVE.
 *   Advances by 1 after each successful match recording.
 */
export type SessionSchedule = {
  readonly sessionId:          string
  readonly phase:              SessionPhase
  /**
   * Monotonically increasing mutation counter. Starts at 0.
   * Incremented by 1 on every top-level schedule mutation.
   * Enables future: undo/redo, autosave, conflict detection.
   */
  readonly version:            number
  readonly matches:            readonly PlannedMatch[]
  readonly quality:            ScheduleQuality
  readonly targetCount:        number
  /** Runtime availability of every session attendee, keyed by player ID. */
  readonly playerStates:       ReadonlyMap<string, PlayerRuntimeState>
  /**
   * Index into matches[] of the currently active match.
   * null during PLANNING phase and after FINISHED.
   */
  readonly currentMatchIndex:  number | null
}
