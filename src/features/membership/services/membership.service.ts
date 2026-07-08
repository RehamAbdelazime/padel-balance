import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tables } from '@/infrastructure/supabase/types'

type Membership = Tables<'group_members'>
type MembershipWithGroup = Membership & { groups: Tables<'groups'> }

export class MembershipService {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<MembershipWithGroup[]> {
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
      .select('*, groups(*)')
      .eq('profile_id', user.id)
      .eq('status', 'ACTIVE')

    if (error) {
      throw error
    }

    const memberships: MembershipWithGroup[] = data ?? []

    return memberships.sort((a, b) => a.groups.name.localeCompare(b.groups.name))
  }

  async getByGroup(groupId: string): Promise<Membership | null> {
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
      .from('group_members')
      .select('*')
      .eq('profile_id', user.id)
      .eq('group_id', groupId)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  }

  async joinByGroupCode(groupCode: string): Promise<Membership> {
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
      .select('id')
      .eq('group_code', groupCode)
      .maybeSingle()

    if (groupError) {
      throw groupError
    }

    if (!group) {
      throw new Error('Group not found')
    }

    const { data: existing, error: existingError } = await this.client
      .from('group_members')
      .select('*')
      .eq('profile_id', user.id)
      .eq('group_id', group.id)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing) {
      return existing
    }

    const { data: membership, error: membershipError } = await this.client
      .from('group_members')
      .insert({
        group_id: group.id,
        profile_id: user.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      })
      .select('*')
      .single()

    if (membershipError) {
      throw membershipError
    }

    return membership
  }

  async leave(groupId: string): Promise<void> {
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

    const { data: membership, error: membershipError } = await this.client
      .from('group_members')
      .select('*')
      .eq('profile_id', user.id)
      .eq('group_id', groupId)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!membership) {
      throw new Error('Membership not found')
    }

    if (membership.role === 'OWNER') {
      const { count, error: ownerCountError } = await this.client
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('role', 'OWNER')
        .eq('status', 'ACTIVE')

      if (ownerCountError) {
        throw ownerCountError
      }

      if (count === 1) {
        throw new Error('Owners cannot leave a group until ownership is transferred.')
      }
    }

    const { error } = await this.client.from('group_members').delete().eq('id', membership.id)

    if (error) {
      throw error
    }
  }
}
