/**
 * Match domain types.
 * Sprint 2+ will add: Match entity, MatchResult, team composition types, etc.
 */
export type MatchId = string & { readonly __brand: unique symbol }
