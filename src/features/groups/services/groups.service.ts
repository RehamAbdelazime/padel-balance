import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tables, TablesUpdate } from '@/infrastructure/supabase/types'

type Group = Tables<'groups'>

type CreateGroupInput = Pick<Group, 'name' | 'description' | 'image_url'>

type UpdateGroupInput = Pick<TablesUpdate<'groups'>, 'name' | 'description' | 'image_url'>

export class GroupsService {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Group[]> {
    const {
      data: { user },
      error: userError,
    } = await this.client.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      return []
    }

    const { data, error } = await this.client
      .from('group_members')
      .select('groups(*)')
      .eq('profile_id', user.id)
      .eq('status', 'ACTIVE')

    if (error) {
      throw error
    }

    const rows = (data ?? []) as unknown as Array<{ groups: Group | null }>
    const groups = rows
      .map((row) => row.groups)
      .filter((group): group is Group => group !== null)

    return groups.sort((a, b) => a.name.localeCompare(b.name))
  }

  async create(input: CreateGroupInput): Promise<Group> {
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

    const { data: group, error: groupError } = await this.client
      .from('groups')
      .insert(input)
      .select('*')
      .single()

    if (groupError) {
      throw groupError
    }

    const { error: memberError } = await this.client.from('group_members').insert({
      group_id: group.id,
      profile_id: user.id,
      role: 'OWNER',
      status: 'ACTIVE',
    })

    if (memberError) {
      throw memberError
    }

    return group
  }

  async update(groupId: string, updates: UpdateGroupInput): Promise<Group> {
    const { data, error } = await this.client
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async archive(groupId: string): Promise<void> {
    const { error } = await this.client.from('groups').update({ archived: true }).eq('id', groupId)

    if (error) {
      throw error
    }
  }

  async regenerateGroupCode(_groupId: string): Promise<string> {
    throw new Error('Not implemented')
  }
}
