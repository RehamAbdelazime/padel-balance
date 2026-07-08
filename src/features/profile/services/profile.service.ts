export interface ProfileService {
  getCurrent(): Promise<unknown>
  update(input: unknown): Promise<unknown>
}
