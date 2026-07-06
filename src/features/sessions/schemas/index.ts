import { z } from 'zod'

// ── Session schema ────────────────────────────────────────────────────────────

export const sessionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Session name is required')
    .max(100, 'Session name cannot exceed 100 characters'),

  scheduled_at: z
    .string()
    .min(1, 'Date & time is required')
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid date/time format'),

  court_count: z
    .number({ error: 'Enter a number of courts' })
    .int()
    .min(1, 'At least 1 court is required'),

  booking_duration: z
    .number({ error: 'Enter a court booking duration' })
    .int()
    .min(15, 'Booking duration must be at least 15 minutes'),

  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
})

export type SessionFormValues = z.infer<typeof sessionFormSchema>

// ── Postpone schema (Sprint F22, updated F24.2) ──────────────────────────────

export const postponeSessionSchema = z.object({
  scheduled_at: z
    .string()
    .min(1, 'Date & time is required')
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid date/time format'),
})

export type PostponeSessionValues = z.infer<typeof postponeSessionSchema>

// ── Match schema ──────────────────────────────────────────────────────────────

/**
 * Player IDs are populated programmatically via form.setValue as the organizer
 * taps chips. The refine ensures all four are unique as a safety net.
 *
 * Scores use `{ error }` (Zod v4 constructor API) so that NaN — the sentinel
 * used for an empty score input — produces a human-readable message rather
 * than a raw type-coercion error. NaN is a valid TypeScript `number`, which
 * keeps the form typed correctly without any casting.
 */
const matchFormSchemaBase = z.object({
  team1_player1_id: z.string().min(1, 'Select a player'),
  team1_player2_id: z.string().min(1, 'Select a player'),
  team1_score: z
    .number({ error: 'Enter a score' })
    .int()
    .min(0, 'Score must be 0 or higher'),
  team2_player1_id: z.string().min(1, 'Select a player'),
  team2_player2_id: z.string().min(1, 'Select a player'),
  team2_score: z
    .number({ error: 'Enter a score' })
    .int()
    .min(0, 'Score must be 0 or higher'),
})

export const matchFormSchema = matchFormSchemaBase.refine(
  (data) =>
    new Set([
      data.team1_player1_id,
      data.team1_player2_id,
      data.team2_player1_id,
      data.team2_player2_id,
    ]).size === 4,
  {
    message: 'Each player can only appear once per match',
    path: ['team2_player1_id'],
  },
)

export type MatchFormValues = z.infer<typeof matchFormSchema>

// ── Edit-score schema ─────────────────────────────────────────────────────────

/** Used by EditScoreDialog — only validates the two scores. */
export const editScoreSchema = z.object({
  team1_score: z
    .number({ error: 'Enter a score' })
    .int()
    .min(0, 'Score must be 0 or higher'),
  team2_score: z
    .number({ error: 'Enter a score' })
    .int()
    .min(0, 'Score must be 0 or higher'),
})

export type EditScoreValues = z.infer<typeof editScoreSchema>
