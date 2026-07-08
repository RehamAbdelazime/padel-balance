import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { useGroups } from '../hooks/use-groups'

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(500).optional(),
})

type CreateGroupValues = z.infer<typeof createGroupSchema>

const DEFAULT_VALUES: CreateGroupValues = {
  name: '',
  description: '',
}

interface CreateGroupScreenProps {
  onCompleted: () => void
}

export function CreateGroupScreen({ onCompleted }: CreateGroupScreenProps) {
  const { create, isCreating } = useGroups()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateGroupValues, unknown, CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await create({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        image_url: null,
      })
      onCompleted()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create group.')
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="My Padel Group" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" disabled={isCreating}>
          Create Group
        </Button>
      </form>
    </Form>
  )
}
