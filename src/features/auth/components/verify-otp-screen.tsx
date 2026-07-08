import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { OtpVerificationSchema, type OtpVerification } from '../schemas/otp-verification.schema'
import { useAuth } from '../hooks/use-auth'
import { useBootstrap } from '@/features/app-bootstrap/hooks/use-bootstrap'

interface VerifyOtpScreenProps {
  phone: string
}

export function VerifyOtpScreen({ phone }: VerifyOtpScreenProps) {
  const { verifyOtp } = useAuth()
  const { reload } = useBootstrap()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<OtpVerification, unknown, OtpVerification>({
    resolver: zodResolver(OtpVerificationSchema),
    defaultValues: { phone, token: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await verifyOtp(values)
      await reload()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to verify code.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OTP code</FormLabel>
              <FormControl>
                <Input type="text" inputMode="numeric" placeholder="123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          Verify
        </Button>
      </form>
    </Form>
  )
}
