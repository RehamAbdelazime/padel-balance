import { PageContainer } from '@/shared/components/page/page-container'
import { PageHeader } from '@/shared/components/page/page-header'
import { PageSection } from '@/shared/components/page/page-section'

export function PlayersScreen() {
  return (
    <PageContainer>
      <PageHeader title="Players" description="Manage players." />

      <PageSection title="Toolbar">
        {/* TODO: Search */}

        {/* TODO: Filters */}

        {/* TODO: Sort */}
        <></>
      </PageSection>

      <PageSection title="Primary Action">
        {/* TODO: Create Player */}
        <></>
      </PageSection>

      <PageSection title="Players Table">
        {/* TODO: Players table placeholder */}
        <></>
      </PageSection>

      <PageSection title="Empty State">
        {/* TODO: Empty state placeholder */}
        <></>
      </PageSection>

      <PageSection title="Pagination">
        {/* TODO: Pagination placeholder */}
        <></>
      </PageSection>
    </PageContainer>
  )
}
