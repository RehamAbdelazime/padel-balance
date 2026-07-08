import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { OtpRequest } from '../schemas/otp-request.schema'
import type { OtpVerification } from '../schemas/otp-verification.schema'

export class AuthService {
  constructor(private readonly client: SupabaseClient) {}

  async requestOtp(request: OtpRequest): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({ phone: request.phone })

    if (error) {
      throw error
    }
  }

  async verifyOtp(request: OtpVerification): Promise<void> {
    const { error } = await this.client.auth.verifyOtp({
      phone: request.phone,
      token: request.token,
      type: 'sms',
    })

    if (error) {
      throw error
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data, error } = await this.client.auth.getSession()

    if (error) {
      throw error
    }

    return data.session
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser()

    if (error) {
      throw error
    }

    return data.user
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()

    if (error) {
      throw error
    }
  }
}
