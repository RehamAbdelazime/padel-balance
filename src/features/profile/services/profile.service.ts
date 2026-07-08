import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tables, TablesUpdate } from '@/infrastructure/supabase/types'

type Profile = Tables<'profiles'>

type ProfileUpdate = Pick<
  TablesUpdate<'profiles'>,
  'display_name' | 'avatar_url' | 'preferred_language' | 'timezone'
>

export class ProfileService {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
      error: userError,
    } = await this.client.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      return null
    }

    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async updateProfile(updates: ProfileUpdate): Promise<Profile> {
    const {
      data: { user },
      error: userError,
    } = await this.client.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }
}
