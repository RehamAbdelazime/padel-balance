export interface AuthService {
  requestOtp(phone: string): Promise<void>
  verifyOtp(phone: string, token: string): Promise<unknown>
  getCurrentSession(): Promise<unknown>
  getCurrentUser(): Promise<unknown>
  signOut(): Promise<void>
}
