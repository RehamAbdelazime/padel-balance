import { PageContainer } from '@/shared/components/page/page-container'
import { PageHeader } from '@/shared/components/page/page-header'
import { PageSection } from '@/shared/components/page/page-section'

export function SettingsScreen() {
  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage group settings." />

      <PageSection title="Appearance">
        {/* TODO: Appearance placeholder */}
        <></>
      </PageSection>

      <PageSection title="Notifications">
        {/* TODO: Notifications placeholder */}
        <></>
      </PageSection>

      <PageSection title="Language">
        {/* TODO: Language placeholder */}
        <></>
      </PageSection>

      <PageSection title="About">
        {/* TODO: About placeholder */}
        <></>
      </PageSection>

      <PageSection title="Danger Zone">
        {/* TODO: Danger zone placeholder */}
        <></>
      </PageSection>
    </PageContainer>
  )
}
