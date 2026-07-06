import type {
  TournamentFormat,
  TournamentLifecycle,
  FormatRecommendation,
  FormatWithRecommendation,
  FormatRecommendationContext,
} from './types'

// ── Lifecycle definitions ──────────────────────────────────────────────────────
// Shared "generate upfront" graph: setup → fixture-generation → court-assignment
// → match-play → result-recording → standings-update → termination-check
// (loop to match-play, or completion). Used by Americano and Round Robin.

const upfrontScheduleLifecycle = (
  finalOutputs: TournamentLifecycle['steps'][number]['producedOutputs'],
  completionActions: TournamentLifecycle['steps'][number]['allowedActions'],
): TournamentLifecycle => ({
  steps: [
    {
      id:              'setup',
      label:           'Setup',
      description:     'Organiser confirms attendance, format settings, and court count.',
      requiredInputs:  ['confirmed-attendance', 'format-settings', 'court-count'],
      producedOutputs: [],
      allowedActions:  ['confirm-format-settings'],
      nextSteps:       ['fixture-generation'],
    },
    {
      id:              'fixture-generation',
      label:           'Fixture Generation',
      description:     'The full match schedule is computed up front for the whole session.',
      requiredInputs:  ['confirmed-attendance', 'format-settings'],
      producedOutputs: ['fixture-list'],
      allowedActions:  ['generate-schedule'],
      nextSteps:       ['court-assignment'],
    },
    {
      id:              'court-assignment',
      label:           'Court Assignment',
      description:     'Generated matches are assigned to available courts for the round.',
      requiredInputs:  ['fixture-list', 'court-count'],
      producedOutputs: ['court-assignments'],
      allowedActions:  ['assign-courts'],
      nextSteps:       ['match-play'],
    },
    {
      id:              'match-play',
      label:           'Match Play',
      description:     'Assigned matches are actively being played on court.',
      requiredInputs:  ['court-assignments'],
      producedOutputs: [],
      allowedActions:  ['start-session'],
      nextSteps:       ['result-recording'],
    },
    {
      id:              'result-recording',
      label:           'Result Recording',
      description:     'The organiser records the outcome of a completed match.',
      requiredInputs:  ['raw-match-score'],
      producedOutputs: ['match-result'],
      allowedActions:  ['record-match-result'],
      nextSteps:       ['standings-update'],
    },
    {
      id:              'standings-update',
      label:           'Standings Update',
      description:     'Standings are recomputed from the newly recorded result.',
      requiredInputs:  ['match-result'],
      producedOutputs: ['updated-standings'],
      allowedActions:  ['recompute-standings'],
      nextSteps:       ['termination-check'],
    },
    {
      id:              'termination-check',
      label:           'Termination Check',
      description:     'Decide whether more matches remain or the session should end.',
      requiredInputs:  ['updated-standings', 'fixture-list'],
      producedOutputs: [],
      allowedActions:  [],
      nextSteps:       ['match-play', 'completion'],
    },
    {
      id:              'completion',
      label:           'Completion',
      description:     'The session has ended; final results are read.',
      requiredInputs:  ['updated-standings'],
      producedOutputs: finalOutputs,
      allowedActions:  completionActions,
      nextSteps:       [],
    },
  ],
})

// Shared "generate per round" graph: setup → round-generation → court-assignment
// → match-play → result-recording → standings-update → termination-check
// (loop to round-generation, or completion). Used by Mexicano, King of the
// Court, and Custom — each supplies its own round-generation inputs/actions.

const perRoundLifecycle = (
  roundGenerationInputs: TournamentLifecycle['steps'][number]['requiredInputs'],
  roundGenerationActions: TournamentLifecycle['steps'][number]['allowedActions'],
  resultRecordingOutputs: TournamentLifecycle['steps'][number]['producedOutputs'],
  finalOutputs: TournamentLifecycle['steps'][number]['producedOutputs'],
  completionActions: TournamentLifecycle['steps'][number]['allowedActions'],
): TournamentLifecycle => ({
  steps: [
    {
      id:              'setup',
      label:           'Setup',
      description:     'Organiser confirms attendance, format settings, and court count.',
      requiredInputs:  ['confirmed-attendance', 'format-settings', 'court-count'],
      producedOutputs: [],
      allowedActions:  ['confirm-format-settings'],
      nextSteps:       ['round-generation'],
    },
    {
      id:              'round-generation',
      label:           'Round Generation',
      description:     'The next round is computed dynamically from the current live state.',
      requiredInputs:  roundGenerationInputs,
      producedOutputs: ['next-round-pairings'],
      allowedActions:  roundGenerationActions,
      nextSteps:       ['court-assignment'],
    },
    {
      id:              'court-assignment',
      label:           'Court Assignment',
      description:     'Generated matches are assigned to available courts for the round.',
      requiredInputs:  ['next-round-pairings', 'court-count'],
      producedOutputs: ['court-assignments'],
      allowedActions:  ['assign-courts'],
      nextSteps:       ['match-play'],
    },
    {
      id:              'match-play',
      label:           'Match Play',
      description:     'Assigned matches are actively being played on court.',
      requiredInputs:  ['court-assignments'],
      producedOutputs: [],
      allowedActions:  ['start-session'],
      nextSteps:       ['result-recording'],
    },
    {
      id:              'result-recording',
      label:           'Result Recording',
      description:     'The organiser records the outcome of a completed match.',
      requiredInputs:  ['raw-match-score'],
      producedOutputs: resultRecordingOutputs,
      allowedActions:  ['record-match-result'],
      nextSteps:       ['standings-update'],
    },
    {
      id:              'standings-update',
      label:           'Standings Update',
      description:     'Standings (or queue/rotation state) are recomputed from the latest result.',
      requiredInputs:  ['match-result'],
      producedOutputs: ['updated-standings'],
      allowedActions:  ['recompute-standings'],
      nextSteps:       ['termination-check'],
    },
    {
      id:              'termination-check',
      label:           'Termination Check',
      description:     'Decide whether more rounds remain or the session should end.',
      requiredInputs:  ['updated-standings'],
      producedOutputs: [],
      allowedActions:  ['advance-rotation'],
      nextSteps:       ['round-generation', 'completion'],
    },
    {
      id:              'completion',
      label:           'Completion',
      description:     'The session has ended; final results are read.',
      requiredInputs:  ['updated-standings'],
      producedOutputs: finalOutputs,
      allowedActions:  completionActions,
      nextSteps:       [],
    },
  ],
})

// ── Format definitions ────────────────────────────────────────────────────────

const americano: TournamentFormat = {
  id:          'americano',
  name:        'Americano',
  category:    'americano',
  difficulty:  'beginner',

  description:
    'Players rotate partners every match. Everyone plays with and against everyone else.',

  longDescription:
    'Americano is a social padel format where partners change after every match. ' +
    'Points scored by each player accumulate individually, so even though you play ' +
    'in pairs, the final ranking is individual. It is the most popular casual format ' +
    'because everyone interacts with everyone else and no one is eliminated.',

  minimumPlayers:         4,
  maximumPlayers:         16,
  recommendedPlayers:     [4, 6, 8, 10, 12, 16],
  supportsOddPlayers:     false,
  supportsMultipleCourts: true,
  defaultMatchCount:      8,
  estimatedDuration:      { min: 60, max: 120 },

  capabilities: {
    supportsManualMatches:  true,
    supportsPlayerSwap:     true,
    supportsRegeneration:   true,
    supportsLateJoin:       false,
    supportsPlayerLeave:    false,
    supportsMultipleCourts: true,
    supportsLiveRanking:    true,
    supportsFixedTeams:     false,
    supportsDynamicTeams:   true,
  },

  guidelines: [
    'Divide players into pairs for the first match randomly or by seeding.',
    'After each match, rotate partners according to the Americano pairing table.',
    'Track individual points scored — not just wins — across all matches.',
    'The player with the most cumulative points at the end wins.',
  ],

  pros: [
    'Everyone plays with and against everyone else.',
    'No player is eliminated — everyone plays the same number of matches.',
    'Very social; great for mixing groups of different skill levels.',
    'Easy to explain to new players.',
  ],

  cons: [
    'Requires an even number of players.',
    'Fixed pairing tables can be complex to manage manually for large groups.',
    'Individual scoring can feel less team-oriented than other formats.',
  ],

  warnings: [
    'Requires an even number of players. Odd player counts are not supported.',
  ],

  ruleNotes: [
    {
      id:           'rotate-partners',
      label:        'Rotate partners each match',
      description:  'Every player gets a different partner in each round.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'individual-scoring',
      label:        'Individual point accumulation',
      description:  'Points are tracked per player, not per team.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'all-play-equal',
      label:        'Equal play time',
      description:  'Each player plays the same number of matches.',
      level:        'recommended',
      defaultValue: true,
    },
  ],

  rules: {
    playerRotation:       'rotate-all',
    partnerSelection:     'rotate-sequential',
    opponentSelection:    'rotation-table',
    courtAssignment:      'any-available',
    scoring:              'individual-cumulative',
    standings:            'individual-points',
    winnerProgression:    'continue-rotation',
    elimination:          'none',
    restPolicy:           'equal-play-time',
    terminationCondition: 'fixed-round-count',
  },

  statistics: {
    tracked: [
      { id: 'points',           label: 'Points',           description: 'Total points scored across all matches.',           unit: 'pts', aggregation: 'sum',      higherIsBetter: true,  usedForRanking: true,  rankingPriority: 1 },
      { id: 'point-difference', label: 'Point Difference', description: 'Sum of (points scored minus points conceded).',      unit: 'pts', aggregation: 'computed', higherIsBetter: true,  usedForRanking: true,  rankingPriority: 2 },
      { id: 'wins',             label: 'Wins',             description: 'Number of matches won.',                             aggregation: 'count',    higherIsBetter: true,  usedForRanking: false },
      { id: 'matches-played',   label: 'Matches Played',   description: 'Total number of matches participated in.',           aggregation: 'count',    higherIsBetter: false, usedForRanking: false },
    ],
  },

  liveRuntime: {
    fields: [
      { id: 'current-round',     label: 'Current Round',     description: 'Index of the round currently being played (1-based).',                         type: 'counter'       },
      { id: 'current-standings', label: 'Current Standings', description: 'Live ranking table sorted by total points then point difference.',              type: 'ranking-table' },
      { id: 'matches-remaining', label: 'Matches Remaining', description: 'Number of matches still to be played in the current rotation plan.',            type: 'counter'       },
    ],
  },

  settings: [
    {
      id:           'match-type',
      label:        'Session Type',
      description:  'Whether each match is played as one set or within a time limit.',
      type:         'select',
      defaultValue: 'one-set',
      required:     true,
      options:      [
        { value: 'one-set', label: 'One Set'    },
        { value: 'timed',   label: 'Time Based'  },
      ],
    },
    {
      id:           'points-per-match',
      label:        'Winning Score',
      description:  'Score required to win a single set.',
      type:         'number',
      defaultValue: 24,
      min:          10,
      max:          32,
      visibleWhen:  { settingId: 'match-type', value: 'one-set' },
    },
  ],

  lifecycle: upfrontScheduleLifecycle(
    ['final-standings', 'session-complete'],
    ['finalize-standings', 'end-session'],
  ),
}

const mexicano: TournamentFormat = {
  id:          'mexicano',
  name:        'Mexicano',
  category:    'mexicano',
  difficulty:  'intermediate',

  description:
    'Dynamic pairings based on live standings. Players with similar scores are matched each round.',

  longDescription:
    'Mexicano starts like Americano but diverges in how future pairings are decided. ' +
    'After the first round, players are re-paired so that those with similar cumulative ' +
    'scores play each other. This self-seeding mechanism means the competition naturally ' +
    'levels itself — strong players face strong players and weaker players are not ' +
    'overwhelmed. The format rewards consistency across all matches.',

  minimumPlayers:         4,
  maximumPlayers:         16,
  recommendedPlayers:     [4, 6, 8, 12, 16],
  supportsOddPlayers:     false,
  supportsMultipleCourts: true,
  defaultMatchCount:      6,
  estimatedDuration:      { min: 60, max: 90 },

  capabilities: {
    supportsManualMatches:  false,
    supportsPlayerSwap:     false,
    supportsRegeneration:   true,
    supportsLateJoin:       false,
    supportsPlayerLeave:    false,
    supportsMultipleCourts: true,
    supportsLiveRanking:    true,
    supportsFixedTeams:     false,
    supportsDynamicTeams:   true,
  },

  guidelines: [
    'First round: pair players randomly or by initial seeding.',
    'After each round, rank all players by cumulative points.',
    'Re-pair: 1st plays with 2nd, 3rd with 4th, etc. across the ranking.',
    'Partners from the previous round cannot be paired again in the next round.',
    'Continue until all rounds are complete; the overall ranking is final.',
  ],

  pros: [
    'Competition self-balances — strong players naturally face each other.',
    'Every match is meaningful; scores affect future pairings.',
    'Works well for groups with mixed skill levels.',
    'Creates exciting end-of-tournament matches between top players.',
  ],

  cons: [
    'Requires real-time score tracking to generate pairings.',
    'More complex to run manually than Americano.',
    'Requires an even number of players.',
  ],

  warnings: [
    'Requires an even number of players.',
    'Pairings depend on live scores — matches must be recorded promptly.',
  ],

  ruleNotes: [
    {
      id:           'score-based-pairing',
      label:        'Score-based pairing',
      description:  'Players are paired against others with the closest total score after round 1.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'cumulative-score',
      label:        'Cumulative individual scoring',
      description:  'Individual points accumulate across all matches to determine ranking.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'no-repeat-partners',
      label:        'No immediate partner repeat',
      description:  'You cannot play with the same partner in consecutive rounds.',
      level:        'recommended',
      defaultValue: true,
    },
  ],

  rules: {
    playerRotation:       'dynamic-by-score',
    partnerSelection:     'score-adjacent',
    opponentSelection:    'score-adjacent',
    courtAssignment:      'any-available',
    scoring:              'individual-cumulative',
    standings:            'individual-points',
    winnerProgression:    'continue-rotation',
    elimination:          'none',
    restPolicy:           'equal-play-time',
    terminationCondition: 'fixed-round-count',
  },

  statistics: {
    tracked: [
      { id: 'points',                   label: 'Points',                    description: 'Cumulative points scored across all matches.',                      unit: 'pts', aggregation: 'sum',      higherIsBetter: true,  usedForRanking: true,  rankingPriority: 1 },
      { id: 'point-difference',         label: 'Point Difference',          description: 'Sum of (points scored minus points conceded).',                      unit: 'pts', aggregation: 'computed', higherIsBetter: true,  usedForRanking: true,  rankingPriority: 2 },
      { id: 'matches-played',           label: 'Matches Played',            description: 'Total number of matches participated in.',                            aggregation: 'count',    higherIsBetter: false, usedForRanking: false },
      { id: 'round-position-history',   label: 'Round Position History',    description: 'Ranking position at the end of each completed round.',                aggregation: 'computed', higherIsBetter: false, usedForRanking: false },
    ],
  },

  liveRuntime: {
    fields: [
      { id: 'current-round',        label: 'Current Round',         description: 'Index of the rotation currently being played (1-based).',                          type: 'counter'       },
      { id: 'current-standings',    label: 'Current Standings',     description: 'Live ranking table sorted by cumulative points; drives next-round pairings.',       type: 'ranking-table' },
      { id: 'next-round-pairings',  label: 'Next Round Pairings',   description: 'Pre-computed pairings for the upcoming round, derived from current standings.',     type: 'match-schedule'},
    ],
  },

  settings: [
    {
      id:           'number-of-rotations',
      label:        'Number of rotations',
      description:  'How many rounds are played. After each round, pairings update based on scores.',
      type:         'number',
      defaultValue: 6,
      required:     true,
      min:          2,
      max:          20,
    },
    {
      id:           'winning-score',
      label:        'Winning score',
      description:  'Points needed to win a single match.',
      type:         'number',
      defaultValue: 21,
      required:     true,
      min:          11,
      max:          32,
    },
  ],

  lifecycle: perRoundLifecycle(
    ['current-standings', 'confirmed-attendance'],
    ['generate-next-round-pairings'],
    ['match-result'],
    ['final-standings', 'session-complete'],
    ['finalize-standings', 'end-session'],
  ),
}

const roundRobin: TournamentFormat = {
  id:          'round-robin',
  name:        'Round Robin',
  category:    'round-robin',
  difficulty:  'intermediate',

  description:
    'Every pair of players competes against every other pair at least once. Final ranking by wins.',

  longDescription:
    'In a Round Robin tournament, teams are fixed for the entire event and every team ' +
    'plays against every other team. This guarantees the fairest competition because ' +
    'results are not affected by bracket luck. The team with the most wins (and best ' +
    'point differential as a tie-breaker) wins the tournament. Best suited for smaller ' +
    'groups where scheduling all matchups is feasible.',

  minimumPlayers:         4,
  maximumPlayers:         12,
  recommendedPlayers:     [4, 6, 8],
  supportsOddPlayers:     false,
  supportsMultipleCourts: true,
  defaultMatchCount:      6,
  estimatedDuration:      { min: 90, max: 180 },

  capabilities: {
    supportsManualMatches:  false,
    supportsPlayerSwap:     false,
    supportsRegeneration:   false,
    supportsLateJoin:       false,
    supportsPlayerLeave:    false,
    supportsMultipleCourts: true,
    supportsLiveRanking:    false,
    supportsFixedTeams:     true,
    supportsDynamicTeams:   false,
  },

  guidelines: [
    'Divide players into fixed teams of two before the tournament starts.',
    'Generate a full round-robin schedule — every team plays every other team once.',
    'Record wins, losses, and points for each match.',
    'Rank teams by wins, then by point differential as a tie-breaker.',
    'Consider a final or semi-final for the top teams if time allows.',
  ],

  pros: [
    'The fairest format — every team plays every other team.',
    'No elimination; all teams play until the end.',
    'Results are not affected by bracket luck.',
    'Clear, objective ranking.',
  ],

  cons: [
    'Requires the most matches of any format — time-intensive.',
    'Works best with small groups (4–8 players / 2–4 teams).',
    'Larger groups produce too many matches to complete in a single session.',
    'Fixed teams mean no partner rotation.',
  ],

  warnings: [
    'Match count grows quadratically with team count. Verify you have enough time.',
    'Not recommended for more than 12 players in a single session.',
  ],

  ruleNotes: [
    {
      id:           'all-vs-all',
      label:        'All vs all',
      description:  'Every team faces every other team at least once.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'fixed-partners',
      label:        'Fixed partners',
      description:  'Partners are fixed for the duration of the tournament.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'point-differential',
      label:        'Point differential tie-breaker',
      description:  'Teams with equal wins are ranked by total points scored.',
      level:        'recommended',
      defaultValue: true,
    },
  ],

  rules: {
    playerRotation:       'fixed',
    partnerSelection:     'fixed',
    opponentSelection:    'round-robin-schedule',
    courtAssignment:      'any-available',
    scoring:              'team-wins',
    standings:            'team-win-loss',
    winnerProgression:    'next-scheduled-match',
    elimination:          'none',
    restPolicy:           'none',
    terminationCondition: 'all-vs-all-complete',
  },

  statistics: {
    tracked: [
      { id: 'wins',             label: 'Wins',             description: 'Number of matches won.',                                                                     aggregation: 'count',    higherIsBetter: true,  usedForRanking: true,  rankingPriority: 1 },
      { id: 'losses',           label: 'Losses',           description: 'Number of matches lost.',                                                                    aggregation: 'count',    higherIsBetter: false, usedForRanking: false },
      { id: 'point-difference', label: 'Point Difference', description: 'Sum of (points scored minus points conceded) across all matches; first tiebreaker.',        unit: 'pts', aggregation: 'computed', higherIsBetter: true,  usedForRanking: true,  rankingPriority: 2 },
      { id: 'sets-won',         label: 'Sets Won',         description: 'Total number of sets won across all matches.',                                               aggregation: 'sum',      higherIsBetter: true,  usedForRanking: true,  rankingPriority: 3 },
      { id: 'sets-lost',        label: 'Sets Lost',        description: 'Total number of sets lost across all matches.',                                              aggregation: 'sum',      higherIsBetter: false, usedForRanking: false },
    ],
  },

  liveRuntime: {
    fields: [
      { id: 'current-round',       label: 'Current Round',        description: 'The round of fixtures currently being played.',                                        type: 'counter'       },
      { id: 'remaining-fixtures',  label: 'Remaining Fixtures',   description: 'All scheduled matches that have not yet been played.',                                  type: 'match-schedule'},
      { id: 'current-standings',   label: 'Current Standings',    description: 'Team rankings by wins, then point difference, then head-to-head record.',               type: 'ranking-table' },
    ],
  },

  settings: [
    {
      id:           'double-round-robin',
      label:        'Double Round Robin',
      description:  'Each team plays every other team twice instead of once.',
      type:         'boolean',
      defaultValue: false,
    },
    {
      id:           'sets-per-match',
      label:        'Sets per match',
      description:  'How many sets constitute a complete match.',
      type:         'select',
      defaultValue: '1',
      required:     true,
      options:      [
        { value: '1', label: '1 set'      },
        { value: '3', label: 'Best of 3'  },
      ],
    },
  ],

  lifecycle: upfrontScheduleLifecycle(
    ['final-standings', 'session-complete'],
    ['finalize-standings', 'end-session'],
  ),
}

const kingOfTheCourt: TournamentFormat = {
  id:          'king-of-court',
  name:        'King of the Court',
  category:    'king-of-court',
  difficulty:  'beginner',

  description:
    'Winners stay on court and face the next challengers. The team with the most court time wins.',

  longDescription:
    'King of the Court is a fast-paced, energetic format ideal for groups that want ' +
    'continuous action. A defending team holds the court and challenges keep coming. ' +
    'If the defenders win, they stay; if the challengers win, they take the court. ' +
    'The winning team is the one that spent the most time defending the court ' +
    'across all matches. This format naturally rewards consistency and handles ' +
    'odd player counts well.',

  minimumPlayers:         4,
  maximumPlayers:         16,
  recommendedPlayers:     [4, 5, 6, 7, 8, 10, 12],
  supportsOddPlayers:     true,
  supportsMultipleCourts: false,
  defaultMatchCount:      10,
  estimatedDuration:      { min: 45, max: 90 },

  capabilities: {
    supportsManualMatches:  true,
    supportsPlayerSwap:     true,
    supportsRegeneration:   true,
    supportsLateJoin:       true,
    supportsPlayerLeave:    true,
    supportsMultipleCourts: false,
    supportsLiveRanking:    true,
    supportsFixedTeams:     false,
    supportsDynamicTeams:   true,
  },

  guidelines: [
    'Randomly select a team to start as the defenders on court.',
    'The remaining players form the challenge queue.',
    'Play a short match (typically to 11 points).',
    'If defenders win: they stay on court; the challengers go to the back of the queue.',
    'If challengers win: they take the court; the defending team joins the queue.',
    'Track how many matches each team successfully defended.',
    'The team with the most successful defences wins.',
  ],

  pros: [
    'Supports odd player counts — great for uneven groups.',
    'Fast-paced and exciting; continuous action with no waiting.',
    'Easy to understand and run.',
    'Works well as a warm-up or when time is limited.',
  ],

  cons: [
    'Only works on a single court.',
    'Dominant teams can monopolise the court and reduce others\' playing time.',
    'Scoring (court time) is harder to track than points.',
  ],

  warnings: [
    'Designed for a single court only. Multiple courts require a modified format.',
    'Very dominant teams may reduce playing time for weaker players.',
  ],

  ruleNotes: [
    {
      id:           'winners-stay',
      label:        'Winners stay on court',
      description:  'The winning team remains and faces the next challengers.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'losers-rotate',
      label:        'Losers rotate out',
      description:  'The losing team goes to the back of the challenge queue.',
      level:        'strict',
      defaultValue: true,
    },
    {
      id:           'court-time-wins',
      label:        'Court time determines winner',
      description:  'The team that defended the court the most times wins overall.',
      level:        'recommended',
      defaultValue: true,
    },
  ],

  rules: {
    playerRotation:       'queue-based',
    partnerSelection:     'queue-challenge',
    opponentSelection:    'court-defender',
    courtAssignment:      'single-court',
    scoring:              'court-defenses',
    standings:            'court-time',
    winnerProgression:    'stay-on-court',
    elimination:          'none',
    restPolicy:           'queue-wait',
    terminationCondition: 'fixed-match-count',
  },

  statistics: {
    tracked: [
      { id: 'court-defenses',  label: 'Court Defenses',       description: 'Total number of times the team successfully defended the court.',                       aggregation: 'count', higherIsBetter: true,  usedForRanking: true,  rankingPriority: 1 },
      { id: 'longest-streak',  label: 'Longest Defense Streak', description: 'Highest number of consecutive successful defenses achieved in a single run.',         aggregation: 'max',   higherIsBetter: true,  usedForRanking: true,  rankingPriority: 2 },
      { id: 'wins',            label: 'Wins',                  description: 'Total matches won (court holds and successful challenges combined).',                   aggregation: 'count', higherIsBetter: true,  usedForRanking: false },
      { id: 'matches-played',  label: 'Matches Played',        description: 'Total number of matches the team participated in.',                                    aggregation: 'count', higherIsBetter: false, usedForRanking: false },
    ],
  },

  liveRuntime: {
    fields: [
      { id: 'court-owner',      label: 'Court Owner',       description: 'The team currently holding and defending the court.',                                     type: 'team-ref'      },
      { id: 'current-king',     label: 'Current King',      description: 'Player or team with the most court defenses at this point in the session.',               type: 'player-ref'    },
      { id: 'challenger-queue', label: 'Challenger Queue',  description: 'Ordered list of teams waiting to challenge; front of queue is next on court.',            type: 'ordered-list'  },
      { id: 'current-streak',   label: 'Current Streak',    description: 'Number of consecutive defenses by the current court holder in their active run.',         type: 'counter'       },
    ],
  },

  settings: [
    {
      id:           'points-to-win',
      label:        'Points to win a match',
      description:  'Points needed for the defending team to retain the court.',
      type:         'number',
      defaultValue: 11,
      required:     true,
      min:          5,
      max:          21,
    },
    {
      id:           'time-per-round',
      label:        'Time limit per round',
      description:  'Optional time cap per match. "No limit" plays until the points target is reached.',
      type:         'select',
      defaultValue: 'none',
      required:     true,
      options:      [
        { value: 'none', label: 'No limit'   },
        { value: '5',    label: '5 minutes'  },
        { value: '7',    label: '7 minutes'  },
        { value: '10',   label: '10 minutes' },
      ],
    },
  ],

  lifecycle: perRoundLifecycle(
    ['queue-state'],
    ['generate-next-round-pairings', 'advance-queue'],
    ['match-result', 'updated-queue-state'],
    ['final-standings', 'session-complete'],
    ['finalize-standings', 'end-session'],
  ),
}

const custom: TournamentFormat = {
  id:          'custom',
  name:        'Custom',
  category:    'custom',
  difficulty:  'intermediate',

  description:
    'Fully configurable. The balanced team generator picks optimal pairings based on partner history and rest balance.',

  longDescription:
    'The Custom format gives the organiser full control over the session. ' +
    'The balanced team generator will select the most balanced possible pairings ' +
    'for each match based on partner history, opponent history, and rest balance. ' +
    'There are no fixed rotation rules — the organiser can regenerate any match, ' +
    'lock favourite pairings, add manual matches, and adjust player availability ' +
    'at any point. Use this when none of the standard formats fit your group.',

  minimumPlayers:         4,
  maximumPlayers:         32,
  recommendedPlayers:     [4, 6, 8, 10, 12, 16, 20, 24],
  supportsOddPlayers:     true,
  supportsMultipleCourts: true,
  defaultMatchCount:      5,
  estimatedDuration:      { min: 30, max: 180 },

  capabilities: {
    supportsManualMatches:  true,
    supportsPlayerSwap:     true,
    supportsRegeneration:   true,
    supportsLateJoin:       true,
    supportsPlayerLeave:    true,
    supportsMultipleCourts: true,
    supportsLiveRanking:    false,
    supportsFixedTeams:     false,
    supportsDynamicTeams:   true,
  },

  guidelines: [
    'Choose the number of matches you want to play.',
    'The algorithm will generate balanced pairings based on partner history and rest balance.',
    'Review the suggested schedule and lock, swap, or regenerate matches as needed.',
    'Mark players as resting or skip-next if they need a break.',
    'Start the session when the schedule looks good.',
  ],

  pros: [
    'Maximum flexibility — no fixed rules or rotation patterns.',
    'Supports any number of players (4–32) and any player count parity.',
    'Fairness-based generation ensures equal play time and partner/opponent diversity for any group.',
    'Full organiser control at every step.',
  ],

  cons: [
    'No standard format means less predictable rotation for players.',
    'Requires more active management from the organiser.',
    'Results do not follow a recognised competitive format.',
  ],

  warnings: [],

  ruleNotes: [],

  rules: {
    playerRotation:       'algorithm-balanced',
    partnerSelection:     'algorithm-balanced',
    opponentSelection:    'algorithm-balanced',
    courtAssignment:      'any-available',
    scoring:              'none',
    standings:            'none',
    winnerProgression:    'continue-schedule',
    elimination:          'none',
    restPolicy:           'algorithm-optimized',
    terminationCondition: 'fixed-match-count',
  },

  statistics: {
    tracked: [
      { id: 'matches-played', label: 'Matches Played', description: 'Total number of matches the player participated in.',  aggregation: 'count', higherIsBetter: false, usedForRanking: false },
      { id: 'wins',           label: 'Wins',           description: 'Number of matches won.',                               aggregation: 'count', higherIsBetter: true,  usedForRanking: false },
    ],
  },

  liveRuntime: {
    fields: [
      { id: 'current-match-index', label: 'Current Match',      description: 'Position in the generated schedule currently being played (0-based).',  type: 'counter'       },
      { id: 'remaining-schedule',  label: 'Remaining Schedule', description: 'Matches not yet played from the current algorithm-generated plan.',        type: 'match-schedule'},
    ],
  },

  settings: [
    {
      id:           'match-count',
      label:        'Number of matches',
      description:  'Total matches to schedule for this session.',
      type:         'number',
      defaultValue: 5,
      required:     true,
      min:          1,
      max:          100,
    },
  ],

  lifecycle: perRoundLifecycle(
    ['player-availability'],
    [
      'generate-next-round-pairings',
      'regenerate-match',
      'add-manual-match',
      'swap-player',
      'lock-match',
      'unlock-match',
      'remove-match',
      'set-player-status',
    ],
    ['match-result'],
    ['session-complete'],
    ['end-session'],
  ),
}

// ── Registry ──────────────────────────────────────────────────────────────────

const REGISTRY: ReadonlyArray<TournamentFormat> = [
  americano,
  mexicano,
  roundRobin,
  kingOfTheCourt,
  custom,
] as const

export function getFormats(): ReadonlyArray<TournamentFormat> {
  return REGISTRY
}

export function getFormat(id: string): TournamentFormat | undefined {
  return REGISTRY.find(f => f.id === id)
}

// ── Recommendation engine ─────────────────────────────────────────────────────

function computeRecommendation(
  format: TournamentFormat,
  context: FormatRecommendationContext,
): FormatRecommendation {
  const { playerCount, courtCount, estimatedDurationMinutes } = context
  const contextWarnings: string[] = []

  const withinBounds =
    playerCount >= format.minimumPlayers &&
    playerCount <= format.maximumPlayers

  if (!withinBounds) {
    const dir   = playerCount < format.minimumPlayers ? 'at least' : 'at most'
    const bound = playerCount < format.minimumPlayers
      ? format.minimumPlayers
      : format.maximumPlayers
    return {
      fit:      'not-recommended',
      score:    0,
      reason:   `${format.name} requires ${dir} ${bound} players.`,
      warnings: [],
    }
  }

  let score = format.recommendedPlayers.includes(playerCount) ? 100 : 70

  const isOdd = playerCount % 2 === 1
  if (isOdd && !format.supportsOddPlayers) {
    contextWarnings.push(`${format.name} works best with an even number of players.`)
    score = Math.min(score, 55)
  }

  if (courtCount > 1 && !format.capabilities.supportsMultipleCourts) {
    contextWarnings.push(
      `${format.name} is designed for a single court. Using multiple courts requires a modified approach.`,
    )
    score = Math.min(score, 60)
  }

  if (
    estimatedDurationMinutes !== undefined &&
    estimatedDurationMinutes < format.estimatedDuration.min
  ) {
    contextWarnings.push(
      `Available time (${estimatedDurationMinutes} min) may be shorter than ` +
      `the recommended minimum (${format.estimatedDuration.min} min).`,
    )
    score = Math.min(score, 65)
  }

  const fit =
    score >= 80 ? 'great' :
    score >= 60 ? 'good'  : 'fair'

  const reason = format.recommendedPlayers.includes(playerCount)
    ? `${playerCount} players is an ideal count for ${format.name}.`
    : `${format.name} works with ${playerCount} players.`

  return { fit, score, reason, warnings: contextWarnings }
}

export function getFormatsWithRecommendations(
  context: FormatRecommendationContext,
): ReadonlyArray<FormatWithRecommendation> {
  const fitOrder: Record<string, number> = {
    'great':           0,
    'good':            1,
    'fair':            2,
    'not-recommended': 3,
  }

  return [...REGISTRY]
    .map(format => ({
      format,
      recommendation: computeRecommendation(format, context),
    }))
    .sort(
      (a, b) =>
        fitOrder[a.recommendation.fit]! - fitOrder[b.recommendation.fit]!,
    )
}
