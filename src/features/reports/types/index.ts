/**
 * Report domain types.
 * Sprint 4+ will add: Report entity, ReportFormat enum, export types, etc.
 */
export type ReportId = string & { readonly __brand: unique symbol }
