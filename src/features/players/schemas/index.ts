import { z } from 'zod'

/**
 * Validation schema for the player create/edit form.
 *
 * Approved fields: name (required), phone (optional).
 * The `archived` field is never set through the form — archiving is a
 * dedicated action performed via the archive mutation.
 *
 * No `.default()` calls: defaults live in `DEFAULT_VALUES` in the form
 * component to keep Zod input/output types identical (required for
 * react-hook-form v7.80 resolver generic compatibility).
 */
export const playerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),

  phone: z
    .string()
    .trim()
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional(),
})

export type PlayerFormValues = z.infer<typeof playerFormSchema>
