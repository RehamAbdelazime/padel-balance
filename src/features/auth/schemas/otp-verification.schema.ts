import { z } from 'zod'

export const OtpVerificationSchema = z.object({
  phone: z.string().trim().min(8).max(20),
  token: z.string().trim().min(4).max(10),
})

export type OtpVerification = z.infer<typeof OtpVerificationSchema>
