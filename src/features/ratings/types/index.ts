/**
 * Rating domain types.
 * Sprint 3+ will add: Rating entity, RatingAlgorithm interface, ELO/Glicko types, etc.
 */
export type RatingId = string & { readonly __brand: unique symbol }
