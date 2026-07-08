export interface GroupsService {
  list(): Promise<unknown>
  create(input: unknown): Promise<unknown>
  update(id: string, input: unknown): Promise<unknown>
  archive(id: string): Promise<void>
  getByCode(code: string): Promise<unknown>
  regenerateCode(id: string): Promise<unknown>
}
