import type { SupabaseClient } from '@supabase/supabase-js'

export class AuthService {
  constructor(private readonly client: SupabaseClient) {}

  async requestOtp(phone: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async verifyOtp(phone: string, token: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async getCurrentSession(): Promise<void> {
    throw new Error('Not implemented')
  }

  async getCurrentUser(): Promise<void> {
    throw new Error('Not implemented')
  }

  async signOut(): Promise<void> {
    throw new Error('Not implemented')
  }
}
