import { z } from 'zod'

export const OtpRequestSchema = z.object({
  phone: z.string().trim().min(8).max(20),
})

export type OtpRequest = z.infer<typeof OtpRequestSchema>
