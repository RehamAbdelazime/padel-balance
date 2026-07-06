import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { PlayerHistoryFilters } from '../utils/apply-history-filters'
import { EMPTY_PLAYER_HISTORY_FILTERS, hasActiveHistoryFilters } from '../utils/apply-history-filters'

const ALL = 'all'

interface PlayerHistoryFiltersBarProps {
  filters:  PlayerHistoryFilters
  onChange: (next: PlayerHistoryFilters) => void
  sessions:  ReadonlyArray<{ id: string; name: string }>
  formats:   ReadonlyArray<{ id: string; name: string }>
  partners:  ReadonlyArray<{ id: string; name: string }>
  opponents: ReadonlyArray<{ id: string; name: string }>
}

/** Section 8 — filters apply to Match History. */
export function PlayerHistoryFiltersBar({ filters, onChange, sessions, formats, partners, opponents }: PlayerHistoryFiltersBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={filters.fromDate ?? ''}
        onChange={e => onChange({ ...filters, fromDate: e.target.value || null })}
        className="w-[150px]"
        aria-label={t('players.profile.filters.fromDate')}
      />
      <Input
        type="date"
        value={filters.toDate ?? ''}
        onChange={e => onChange({ ...filters, toDate: e.target.value || null })}
        className="w-[150px]"
        aria-label={t('players.profile.filters.toDate')}
      />

      <Select value={filters.sessionId ?? ALL} onValueChange={v => onChange({ ...filters, sessionId: v === ALL ? null : v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('players.profile.filters.session')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('players.profile.filters.allSessions')}</SelectItem>
          {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.formatId ?? ALL} onValueChange={v => onChange({ ...filters, formatId: v === ALL ? null : v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('players.profile.filters.format')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('players.profile.filters.allFormats')}</SelectItem>
          {formats.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.partnerId ?? ALL} onValueChange={v => onChange({ ...filters, partnerId: v === ALL ? null : v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('players.profile.filters.partner')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('players.profile.filters.allPartners')}</SelectItem>
          {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.opponentId ?? ALL} onValueChange={v => onChange({ ...filters, opponentId: v === ALL ? null : v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('players.profile.filters.opponent')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('players.profile.filters.allOpponents')}</SelectItem>
          {opponents.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {hasActiveHistoryFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_PLAYER_HISTORY_FILTERS)}>
          <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('players.profile.filters.clear')}
        </Button>
      )}
    </div>
  )
}
