export interface MembershipService {
  getCurrent(): Promise<unknown>
  list(): Promise<unknown>
  changeRole(id: string, role: unknown): Promise<unknown>
  remove(id: string): Promise<void>
}
