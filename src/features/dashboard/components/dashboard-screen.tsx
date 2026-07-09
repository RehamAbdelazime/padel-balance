import { PageContainer } from '@/shared/components/page/page-container'
import { PageHeader } from '@/shared/components/page/page-header'
import { PageSection } from '@/shared/components/page/page-section'

export function DashboardScreen() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Overview of your group's activity." />

      <PageSection title="Current Group" description="The group you are currently viewing.">
        {/* TODO: Active group name */}

        {/* TODO: Switch group action */}
        <></>
      </PageSection>

      <PageSection title="Quick Actions" description="Shortcuts to common organiser tasks.">
        {/* TODO: Create Session action */}

        {/* TODO: Add Player action */}
        <></>
      </PageSection>

      <PageSection title="Today's Sessions" description="Sessions scheduled for today.">
        {/* TODO: Today's sessions list */}

        {/* TODO: Empty state */}
        <></>
      </PageSection>

      <PageSection title="Recent Sessions" description="The most recently completed sessions.">
        {/* TODO: Recent sessions list */}

        {/* TODO: Empty state */}
        <></>
      </PageSection>

      <PageSection title="Players Summary" description="An overview of the group's players.">
        {/* TODO: Player counts */}

        {/* TODO: Recently active players */}
        <></>
      </PageSection>
    </PageContainer>
  )
}
