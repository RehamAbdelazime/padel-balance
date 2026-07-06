/**
 * RandomProvider — a single injectable seam around Math.random() for the
 * generator layer (Sprint G1 Step 8).
 *
 * The default implementation is exactly `Math.random()`, so nothing about
 * current behaviour changes. This exists so certification tests can later
 * substitute a seeded/deterministic provider without touching the generator
 * logic itself — no caller does that yet.
 */

export type RandomProvider = { readonly next: () => number }

export const defaultRandom: RandomProvider = { next: () => Math.random() }
