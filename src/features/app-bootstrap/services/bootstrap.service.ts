import type { AuthService } from '@/features/auth/services/auth.service'
import type { ProfileService } from '@/features/profile/services/profile.service'
import type { MembershipService } from '@/features/membership/services/membership.service'

type Profile = NonNullable<Awaited<ReturnType<ProfileService['getCurrentProfile']>>>
type Membership = Awaited<ReturnType<MembershipService['list']>>[number]

type BootstrapResult =
  | { state: 'UNAUTHENTICATED' }
  | { state: 'NO_GROUPS'; profile: Profile }
  | { state: 'READY'; profile: Profile; membership: Membership }
  | { state: 'SELECT_GROUP'; profile: Profile; memberships: Membership[] }

export class BootstrapService {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly membershipService: MembershipService,
  ) {}

  async bootstrap(): Promise<BootstrapResult> {
    const session = await this.authService.getCurrentSession()

    if (!session) {
      return { state: 'UNAUTHENTICATED' }
    }

    const profile = await this.profileService.getCurrentProfile()

    if (!profile) {
      throw new Error('Authenticated session has no profile')
    }

    const memberships = await this.membershipService.list()

    if (memberships.length === 0) {
      return { state: 'NO_GROUPS', profile }
    }

    if (memberships.length === 1) {
      return { state: 'READY', profile, membership: memberships[0] }
    }

    return { state: 'SELECT_GROUP', profile, memberships }
  }
}
