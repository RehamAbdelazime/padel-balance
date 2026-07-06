import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { ReportFiltersState } from '../utils/apply-filters'
import { EMPTY_REPORT_FILTERS, hasActiveFilters } from '../utils/apply-filters'

const ALL = 'all'

interface ReportFiltersProps {
  filters:      ReportFiltersState
  onChange:     (next: ReportFiltersState) => void
  players:      ReadonlyArray<{ id: string; name: string }>
  roundNumbers: readonly number[]
  courtNumbers: readonly number[]
}

/** Section 7 — filters apply to Match Results and the Player Performance table (see apply-filters.ts). */
export function ReportFilters({ filters, onChange, players, roundNumbers, courtNumbers }: ReportFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder={t('reports.filters.searchPlaceholder')}
          className="ps-8"
        />
      </div>

      <Select
        value={filters.playerId ?? ALL}
        onValueChange={value => onChange({ ...filters, playerId: value === ALL ? null : value })}
      >
        <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('reports.filters.player')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('reports.filters.allPlayers')}</SelectItem>
          {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={filters.roundNumber !== null ? String(filters.roundNumber) : ALL}
        onValueChange={value => onChange({ ...filters, roundNumber: value === ALL ? null : Number(value) })}
      >
        <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('reports.filters.round')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('reports.filters.allRounds')}</SelectItem>
          {roundNumbers.map(n => (
            <SelectItem key={n} value={String(n)}>{t('sessions.schedule.round.title', { n })}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.court !== null ? String(filters.court) : ALL}
        onValueChange={value => onChange({ ...filters, court: value === ALL ? null : Number(value) })}
      >
        <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('reports.filters.court')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('reports.filters.allCourts')}</SelectItem>
          {courtNumbers.map(n => (
            <SelectItem key={n} value={String(n)}>{t('sessions.schedule.match.court', { n })}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_REPORT_FILTERS)}>
          <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('reports.filters.clear')}
        </Button>
      )}
    </div>
  )
}
