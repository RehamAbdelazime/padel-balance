import type { TournamentRule, TournamentRuleSet } from './rule.interface'

// ── Placeholder rule sets ─────────────────────────────────────────────────────
// Americano, Mexicano, Round Robin, and King of the Court are not
// implemented yet. One factory builds all nine placeholder rules for a
// format so the "not implemented" behaviour isn't duplicated four times.

function placeholderRule<TKind extends string>(
  formatName: string,
  kind:       TKind,
  label:      string,
): TournamentRule & { readonly kind: TKind } {
  return {
    kind,
    createInitialState(_context) {
      throw new Error(`${formatName} ${label}.createInitialState is not implemented yet.`)
    },
    apply(_state, _input, _context) {
      throw new Error(`${formatName} ${label}.apply is not implemented yet.`)
    },
    validate(_context) {
      return { valid: false, errors: [`${formatName} ${label} is not implemented yet.`] }
    },
  }
}

function createPlaceholderRuleSet(formatId: string, formatName: string): TournamentRuleSet {
  return {
    formatId,
    rotation:          placeholderRule(formatName, 'rotation',          'RotationRule'),
    partner:           placeholderRule(formatName, 'partner',           'PartnerRule'),
    opponent:          placeholderRule(formatName, 'opponent',          'OpponentRule'),
    court:             placeholderRule(formatName, 'court',             'CourtAssignmentRule'),
    scoring:           placeholderRule(formatName, 'scoring',           'ScoringRule'),
    standings:         placeholderRule(formatName, 'standings',         'StandingsRule'),
    winnerProgression: placeholderRule(formatName, 'winnerProgression', 'WinnerProgressionRule'),
    rest:              placeholderRule(formatName, 'rest',              'RestRule'),
    termination:       placeholderRule(formatName, 'termination',       'TerminationRule'),
  }
}

// ── CustomRuleSet — the only implemented rule set ────────────────────────────
// Custom's own TournamentRules already declare every axis as
// "algorithm-balanced" / "any-available" / "none" — i.e. "no fixed rule,
// the balanced generator decides directly". So each rule here is a genuine,
// non-throwing, pass-through implementation: no tournament algorithm is
// implemented, since there is no fixed behaviour to encode for this format.

function customRule<TKind extends string>(
  kind: TKind,
): TournamentRule<Readonly<Record<string, unknown>>> & { readonly kind: TKind } {
  return {
    kind,
    createInitialState() {
      return {}
    },
    apply(state) {
      return { state, warnings: [] }
    },
    validate() {
      return { valid: true, errors: [] }
    },
  }
}

const customRuleSet: TournamentRuleSet = {
  formatId:          'custom',
  rotation:          customRule('rotation'),
  partner:           customRule('partner'),
  opponent:          customRule('opponent'),
  court:             customRule('court'),
  scoring:           customRule('scoring'),
  standings:         customRule('standings'),
  winnerProgression: customRule('winnerProgression'),
  rest:              customRule('rest'),
  termination:       customRule('termination'),
}

// ── Registry ──────────────────────────────────────────────────────────────────

const REGISTRY: ReadonlyArray<TournamentRuleSet> = [
  createPlaceholderRuleSet('americano',     'AmericanoRuleSet'),
  createPlaceholderRuleSet('mexicano',      'MexicanoRuleSet'),
  createPlaceholderRuleSet('round-robin',   'RoundRobinRuleSet'),
  createPlaceholderRuleSet('king-of-court', 'KingOfCourtRuleSet'),
  customRuleSet,
]

export function getRuleSet(formatId: string): TournamentRuleSet {
  const ruleSet = REGISTRY.find(r => r.formatId === formatId)
  if (!ruleSet) {
    throw new Error(`getRuleSet: no rule set registered for format "${formatId}".`)
  }
  return ruleSet
}
