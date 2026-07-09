import { PageContainer } from '@/shared/components/page/page-container'
import { PageHeader } from '@/shared/components/page/page-header'
import { PageSection } from '@/shared/components/page/page-section'

export function SessionsScreen() {
  return (
    <PageContainer>
      <PageHeader title="Sessions" description="Manage sessions." />

      <PageSection title="Quick Actions">
        {/* TODO: Create Session */}
        <></>
      </PageSection>

      <PageSection title="Filters">
        {/* TODO: Filters placeholder */}
        <></>
      </PageSection>

      <PageSection title="Upcoming Sessions">
        {/* TODO: Upcoming sessions placeholder */}
        <></>
      </PageSection>

      <PageSection title="Live Sessions">
        {/* TODO: Live sessions placeholder */}
        <></>
      </PageSection>

      <PageSection title="Finished Sessions">
        {/* TODO: Finished sessions placeholder */}
        <></>
      </PageSection>

      <PageSection title="Empty State">
        {/* TODO: Empty state placeholder */}
        <></>
      </PageSection>
    </PageContainer>
  )
}
