import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { OtpRequestSchema, type OtpRequest } from '../schemas/otp-request.schema'
import { useAuth } from '../hooks/use-auth'

const DEFAULT_VALUES: OtpRequest = {
  phone: '',
}

interface LoginScreenProps {
  onOtpRequested: (phone: string) => void
}

export function LoginScreen({ onOtpRequested }: LoginScreenProps) {
  const { requestOtp } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<OtpRequest, unknown, OtpRequest>({
    resolver: zodResolver(OtpRequestSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await requestOtp(values)
      onOtpRequested(values.phone)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send code.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          Continue
        </Button>
      </form>
    </Form>
  )
}
