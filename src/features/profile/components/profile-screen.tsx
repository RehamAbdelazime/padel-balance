import { PageContainer } from '@/shared/components/page/page-container'
import { PageHeader } from '@/shared/components/page/page-header'
import { PageSection } from '@/shared/components/page/page-section'

export function ProfileScreen() {
  return (
    <PageContainer>
      <PageHeader title="Profile" description="Manage your profile." />

      <PageSection title="Avatar">
        {/* TODO: Avatar placeholder */}
        <></>
      </PageSection>

      <PageSection title="Personal Information">
        {/* TODO: Personal information placeholder */}
        <></>
      </PageSection>

      <PageSection title="Preferences">
        {/* TODO: Preferences placeholder */}
        <></>
      </PageSection>

      <PageSection title="Language">
        {/* TODO: Language placeholder */}
        <></>
      </PageSection>

      <PageSection title="Account Actions">
        {/* TODO: Account actions placeholder */}
        <></>
      </PageSection>
    </PageContainer>
  )
}
