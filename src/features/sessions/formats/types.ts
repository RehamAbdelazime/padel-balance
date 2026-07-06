/**
 * Tournament Format Infrastructure — domain types.
 * Metadata only; no generation logic.
 */

// ── Enumerations ──────────────────────────────────────────────────────────────

/**
 * How strongly a rule is enforced in a tournament format.
 *   strict      — format requires this rule; cannot be overridden
 *   recommended — format suggests this rule; organiser may disable
 *   optional    — informational; off by default
 */
export type RuleLevel = 'strict' | 'recommended' | 'optional'

/**
 * Broad category a tournament format belongs to.
 * Drives UI grouping and icon selection; does not affect generation.
 */
export type TournamentCategory =
  | 'americano'
  | 'mexicano'
  | 'round-robin'
  | 'king-of-court'
  | 'custom'

/**
 * How well a format fits a given session (player count, court count, etc.).
 *   great            — ideal choice for the current configuration
 *   good             — works well; minor trade-offs
 *   fair             — playable but not optimal
 *   not-recommended  — format cannot run with the current configuration
 */
export type FormatFit = 'great' | 'good' | 'fair' | 'not-recommended'

/**
 * How complex the format is to organise and explain to players.
 *   beginner     — simple rules; suitable for first-time players
 *   intermediate — some rotation or scoring complexity
 *   advanced     — requires score-tracking, seeding, or complex rotation
 */
export type FormatDifficulty = 'beginner' | 'intermediate' | 'advanced'

// ── Capabilities ──────────────────────────────────────────────────────────────

export type FormatCapabilities = {
  readonly supportsManualMatches:  boolean
  readonly supportsPlayerSwap:     boolean
  readonly supportsRegeneration:   boolean
  readonly supportsLateJoin:       boolean
  readonly supportsPlayerLeave:    boolean
  readonly supportsMultipleCourts: boolean
  readonly supportsLiveRanking:    boolean
  readonly supportsFixedTeams:     boolean
  readonly supportsDynamicTeams:   boolean
}

// ── Rule policy enumerations ──────────────────────────────────────────────────
// Strongly-typed string literal unions consumed by the scheduling engine.
// The engine never branches on format IDs — it reads these policies instead.

/** How players are assigned to matches across rounds. */
export type PlayerRotationPolicy =
  | 'fixed'               // same players throughout; partners never change (Round Robin)
  | 'rotate-all'          // structured rotation table; everyone plays with everyone (Americano)
  | 'dynamic-by-score'    // pairings regenerated each round by current standings (Mexicano)
  | 'queue-based'         // winner stays; loser joins challenger queue (King of the Court)
  | 'algorithm-balanced'  // engine selects optimal players per match (Custom)

/** How the two players who form a team within a match are chosen. */
export type PartnerSelectionPolicy =
  | 'fixed'               // partners locked for the whole tournament (Round Robin)
  | 'rotate-sequential'   // deterministic Americano rotation table
  | 'score-adjacent'      // 1st + 2nd in standings partner together, etc. (Mexicano)
  | 'queue-challenge'     // two challengers from the front of the queue (King of the Court)
  | 'algorithm-balanced'  // engine maximises partner diversity and rest fairness (Custom)

/** How the opposing team is determined for each match. */
export type OpponentSelectionPolicy =
  | 'rotation-table'      // pre-computed Americano table
  | 'score-adjacent'      // face opponents with the closest cumulative score (Mexicano)
  | 'round-robin-schedule' // predetermined all-vs-all schedule (Round Robin)
  | 'court-defender'      // challengers always face whoever holds the court (King of the Court)
  | 'algorithm-balanced'  // engine maximises opponent diversity and equal play time (Custom)

/** How matches are assigned to physical courts. */
export type CourtAssignmentPolicy =
  | 'single-court'  // format requires exactly one court (King of the Court)
  | 'any-available' // matches placed on whichever court is free next

/** What is tracked to determine individual or team performance. */
export type ScoringPolicy =
  | 'individual-cumulative' // each player's points sum across all matches (Americano, Mexicano)
  | 'team-wins'             // win/loss record per fixed team (Round Robin)
  | 'court-defenses'        // how many consecutive defences a team achieved (King of the Court)
  | 'none'                  // no formal score tracked by the format (Custom)

/** How players or teams are ranked at any point during the session. */
export type StandingsPolicy =
  | 'individual-points' // descending cumulative points per player (Americano, Mexicano)
  | 'team-win-loss'     // wins → point differential → head-to-head (Round Robin)
  | 'court-time'        // total successful court defences (King of the Court)
  | 'none'              // format does not define a ranking (Custom)

/** What happens to a team immediately after their match concludes. */
export type WinnerProgressionPolicy =
  | 'continue-rotation'      // proceed to next round per the rotation table (Americano, Mexicano)
  | 'stay-on-court'          // winner defends; loser queues (King of the Court)
  | 'next-scheduled-match'   // play the pre-built round-robin fixture (Round Robin)
  | 'continue-schedule'      // advance to the next slot in the algorithm's schedule (Custom)

/** Whether and how players are removed from the tournament. */
export type EliminationPolicy =
  | 'none'    // no player is ever eliminated; everyone plays all matches
  | 'bracket' // reserved: single/double elimination bracket (future format)

/** How the engine manages which players rest between matches. */
export type RestPolicy =
  | 'equal-play-time'    // engine ensures all players play the same number of matches
  | 'queue-wait'         // players wait in a physical queue; rest is implicit (King of the Court)
  | 'none'               // no rest management; all players play every match (Round Robin, 4p)
  | 'algorithm-optimized' // engine minimises max consecutive rests (Custom)

/** What event causes the session to end. */
export type TerminationCondition =
  | 'fixed-round-count'    // session ends after N complete rounds (Americano, Mexicano)
  | 'all-vs-all-complete'  // session ends when every team has faced every other team (Round Robin)
  | 'fixed-match-count'    // session ends after N total matches (King of the Court, Custom)
  | 'time-limit'           // reserved: ends after a wall-clock duration
  | 'score-threshold'      // reserved: ends when a player/team reaches a total score target

/**
 * The complete machine-readable rule model for a tournament format.
 *
 * The scheduling engine reads ONLY these policies — it never branches on
 * format IDs. Each format populates all fields; nothing is optional so the
 * engine always has a complete behavioural specification.
 */
export type TournamentRules = {
  readonly playerRotation:       PlayerRotationPolicy
  readonly partnerSelection:     PartnerSelectionPolicy
  readonly opponentSelection:    OpponentSelectionPolicy
  readonly courtAssignment:      CourtAssignmentPolicy
  readonly scoring:              ScoringPolicy
  readonly standings:            StandingsPolicy
  readonly winnerProgression:    WinnerProgressionPolicy
  readonly elimination:          EliminationPolicy
  readonly restPolicy:           RestPolicy
  readonly terminationCondition: TerminationCondition
}

// ── Statistics ────────────────────────────────────────────────────────────────

/**
 * How a statistic value accumulates across the session.
 *   sum      — add values from each match (points, wins)
 *   max      — record the highest value reached (longest streak)
 *   count    — count discrete events (matches played, defenses)
 *   ratio    — derived ratio between two statistics (win rate)
 *   computed — derived from other statistics (point difference)
 */
export type StatisticAggregation =
  | 'sum'
  | 'max'
  | 'count'
  | 'ratio'
  | 'computed'

/**
 * A single trackable statistic declared by a tournament format.
 * The engine uses this to know what to record and how to rank players.
 */
export type FormatStatistic = {
  readonly id:             string
  readonly label:          string
  readonly description:    string
  /** Short unit label displayed alongside the value ('pts', 'games', …). */
  readonly unit?:          string
  readonly aggregation:    StatisticAggregation
  /** True when a larger value is better; drives ascending/descending sort. */
  readonly higherIsBetter: boolean
  /** True when this statistic contributes to the official ranking. */
  readonly usedForRanking: boolean
  /**
   * 1-based sort priority among ranking statistics.
   * 1 = primary sort key, 2 = first tiebreaker, etc.
   * Omit when usedForRanking is false.
   */
  readonly rankingPriority?: number
}

/**
 * Complete set of statistics a format tracks during a session.
 * The engine records every listed statistic; nothing else is guaranteed.
 */
export type FormatStatistics = {
  readonly tracked: ReadonlyArray<FormatStatistic>
}

// ── Live Runtime ──────────────────────────────────────────────────────────────

/**
 * The kind of data a live runtime field holds.
 *   counter        — a running integer (round number, streak count)
 *   ordered-list   — a queue or sequence of player/team identifiers
 *   ranking-table  — a sortable table of players/teams with live stat values
 *   player-ref     — reference to a single active player (e.g. current king)
 *   team-ref       — reference to a single active team (e.g. court holder)
 *   match-schedule — list of upcoming or remaining planned matches
 *   boolean        — a simple true/false flag
 */
export type RuntimeFieldType =
  | 'counter'
  | 'ordered-list'
  | 'ranking-table'
  | 'player-ref'
  | 'team-ref'
  | 'match-schedule'
  | 'boolean'

/**
 * One piece of state that must be maintained while this format is live.
 * The runtime engine allocates and updates every field declared here.
 */
export type LiveRuntimeField = {
  readonly id:          string
  readonly label:       string
  readonly description: string
  readonly type:        RuntimeFieldType
}

/**
 * Complete description of the state the runtime engine must maintain
 * while a session of this format is in progress.
 * Definition only — no implementation.
 */
export type FormatLiveRuntime = {
  readonly fields: ReadonlyArray<LiveRuntimeField>
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
// Definitions only — no engine, service, or runtime behaviour. Describes the
// abstract sequence of steps a format's session workflow goes through, so a
// future sprint's engine can consume a declarative graph instead of branching
// on format IDs.

/**
 * A single stage in a tournament format's lifecycle.
 * Shared vocabulary across all formats; each format assembles its own
 * sequence and graph (via `nextSteps`) from this fixed set of stage kinds.
 */
export type LifecycleStepId =
  | 'setup'               // confirm attendance, settings, and court count
  | 'fixture-generation'  // compute the full match schedule up front (Americano, Round Robin)
  | 'round-generation'    // compute the next round dynamically from live state (Mexicano, King of the Court, Custom)
  | 'court-assignment'    // assign generated matches to physical courts
  | 'match-play'          // matches are actively being played
  | 'result-recording'    // a match result is captured
  | 'standings-update'    // recompute rankings/state from the latest result
  | 'termination-check'   // decide whether to continue or end the session
  | 'completion'          // session has ended; final state is read

/** Data a lifecycle step consumes before it can execute. */
export type LifecycleInput =
  | 'confirmed-attendance'
  | 'format-settings'
  | 'court-count'
  | 'player-availability'
  | 'current-standings'
  | 'queue-state'
  | 'fixture-list'
  | 'next-round-pairings'
  | 'court-assignments'
  | 'raw-match-score'
  | 'match-result'
  | 'updated-standings'

/** Data a lifecycle step produces once it completes. */
export type LifecycleOutput =
  | 'fixture-list'
  | 'next-round-pairings'
  | 'court-assignments'
  | 'match-result'
  | 'updated-standings'
  | 'updated-queue-state'
  | 'final-standings'
  | 'session-complete'

/** Organiser- or engine-triggerable action available while a step is active. */
export type LifecycleAction =
  | 'confirm-format-settings'
  | 'generate-schedule'
  | 'assign-courts'
  | 'start-session'
  | 'generate-next-round-pairings'
  | 'advance-queue'
  | 'record-match-result'
  | 'recompute-standings'
  | 'advance-rotation'
  | 'regenerate-match'
  | 'add-manual-match'
  | 'swap-player'
  | 'lock-match'
  | 'unlock-match'
  | 'remove-match'
  | 'set-player-status'
  | 'finalize-standings'
  | 'end-session'

/**
 * One node in a format's lifecycle graph.
 * Definition only — describes what a step needs, produces, and allows;
 * no engine executes this yet.
 */
export type TournamentLifecycleStep = {
  readonly id:              LifecycleStepId
  readonly label:           string
  readonly description:     string
  readonly requiredInputs:  ReadonlyArray<LifecycleInput>
  readonly producedOutputs: ReadonlyArray<LifecycleOutput>
  readonly allowedActions:  ReadonlyArray<LifecycleAction>
  /** Step ids reachable from this step. Empty when the step is terminal. */
  readonly nextSteps:       ReadonlyArray<LifecycleStepId>
}

/**
 * Complete declarative lifecycle graph for a tournament format.
 * Definition only — no implementation of transitions or side effects.
 */
export type TournamentLifecycle = {
  readonly steps: ReadonlyArray<TournamentLifecycleStep>
}

// ── Recommendation context ────────────────────────────────────────────────────

export type FormatRecommendationContext = {
  readonly playerCount:               number
  readonly courtCount:                number
  readonly estimatedDurationMinutes?: number
}

// ── Sub-models ────────────────────────────────────────────────────────────────

/**
 * Estimated session duration in minutes, expressed as a [min, max] range.
 * Values assume standard padel points-per-match settings.
 */
export type EstimatedDuration = {
  /** Shortest expected duration for the format's defaultMatchCount. */
  readonly min: number
  /** Longest expected duration for the format's defaultMatchCount. */
  readonly max: number
}

/**
 * Context-sensitive recommendation produced by the registry for a specific
 * player count. Not stored on the format itself — computed on demand.
 *
 * `score` runs 0–100: 100 = perfect fit, 0 = format cannot run.
 * `reason` is a short human-readable sentence explaining the score.
 */
export type FormatRecommendation = {
  readonly fit:      FormatFit
  readonly score:    number
  readonly reason:   string
  readonly warnings: ReadonlyArray<string>
}

/**
 * A format paired with its recommendation for a specific context.
 * Returned by getFormatsWithRecommendations().
 */
export type FormatWithRecommendation = {
  readonly format:         TournamentFormat
  readonly recommendation: FormatRecommendation
}

/**
 * The value object emitted by TournamentFormatDialog when the organiser confirms.
 * Passed up to the page; schedule generation happens in a later phase.
 */
export type FormatSelectionConfig = {
  readonly formatId:    string
  readonly settings:    Readonly<Record<string, boolean | number | string>>
  readonly playerCount: number
  readonly courtCount:  number
}

/**
 * A single behavioural rule that governs a tournament format.
 * Rules describe how matches are scheduled, pairings are made, etc.
 * They are descriptive metadata; enforcement comes in a later sprint.
 */
export type TournamentRule = {
  readonly id:           string
  readonly label:        string
  readonly description:  string
  readonly level:        RuleLevel
  readonly defaultValue: boolean | number | string
}

/**
 * A configurable parameter for a tournament format.
 * Settings expose numeric sliders, boolean toggles, or select dropdowns.
 */
export type TournamentSetting = {
  readonly id:           string
  readonly label:        string
  readonly description:  string
  readonly type:         'number' | 'boolean' | 'select'
  readonly defaultValue: boolean | number | string
  readonly required?:    boolean
  readonly options?:     ReadonlyArray<{ readonly value: string; readonly label: string }>
  readonly min?:         number
  readonly max?:         number
  /** When present, this setting is only shown while another setting equals this value. */
  readonly visibleWhen?: { readonly settingId: string; readonly value: boolean | number | string }
}

// ── Core type ─────────────────────────────────────────────────────────────────

/**
 * A tournament format — rich metadata describing how a session is structured.
 *
 * Formats contain no generation logic; they supply default parameters
 * that the schedule engine consumes (targetCount, rules, settings).
 *
 * Field naming conventions:
 *   minimumPlayers / maximumPlayers — hard constraints (format cannot run outside this range)
 *   recommendedPlayers              — optimal counts (used to compute FormatRecommendation)
 */
export type TournamentFormat = {
  /** Unique identifier used as a stable key throughout the app. */
  readonly id:                    string
  /** Short display name. */
  readonly name:                  string
  /** One-sentence summary shown in selection lists. */
  readonly description:           string
  /** Full explanation shown in a detail view. */
  readonly longDescription:       string
  readonly category:              TournamentCategory

  // ── Player count constraints ──────────────────────────────────────────────
  /** Hard lower bound. Format cannot run with fewer players. */
  readonly minimumPlayers:        number
  /** Hard upper bound. Format cannot run with more players. */
  readonly maximumPlayers:        number
  /**
   * Player counts at which this format works best.
   * Used to compute FormatRecommendation.score.
   */
  readonly recommendedPlayers:    ReadonlyArray<number>
  /** Whether the format can accommodate an odd number of players. */
  readonly supportsOddPlayers:    boolean
  /** Whether the format is designed for multiple simultaneous courts. */
  readonly supportsMultipleCourts: boolean

  // ── Session planning ──────────────────────────────────────────────────────
  /** Default number of matches suggested when this format is selected. */
  readonly defaultMatchCount:     number
  /**
   * Estimated session duration in minutes for the defaultMatchCount.
   * Assumes standard points-per-match settings.
   */
  readonly estimatedDuration:     EstimatedDuration
  /** Organiser complexity level. */
  readonly difficulty:            FormatDifficulty

  // ── Informational content ─────────────────────────────────────────────────
  /** Step-by-step setup and run guidelines for the organiser. */
  readonly guidelines:            ReadonlyArray<string>
  /** Key advantages of the format. */
  readonly pros:                  ReadonlyArray<string>
  /** Known drawbacks or limitations. */
  readonly cons:                  ReadonlyArray<string>
  /**
   * Important caveats the organiser must know before choosing this format.
   * Shown prominently in the selection UI.
   */
  readonly warnings:              ReadonlyArray<string>

  // ── Capabilities ──────────────────────────────────────────────────────────
  readonly capabilities:           FormatCapabilities

  // ── Statistics ────────────────────────────────────────────────────────────
  /** Every statistic tracked during a session of this format. */
  readonly statistics:             FormatStatistics

  // ── Live Runtime ──────────────────────────────────────────────────────────
  /** State the runtime engine must maintain while this format is live. */
  readonly liveRuntime:            FormatLiveRuntime

  // ── Rules and settings ────────────────────────────────────────────────────
  /**
   * Human-readable rule descriptions for the organiser UI.
   * Distinct from `rules` (the machine-readable scheduling model).
   */
  readonly ruleNotes:              ReadonlyArray<TournamentRule>
  /**
   * Machine-readable behavioural specification consumed by the scheduling engine.
   * All fields are required; the engine never branches on format IDs.
   */
  readonly rules:                  TournamentRules
  readonly settings:               ReadonlyArray<TournamentSetting>

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  /**
   * Declarative lifecycle graph for this format's session workflow.
   * Definitions only — no engine consumes this yet.
   */
  readonly lifecycle:              TournamentLifecycle
}
