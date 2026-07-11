import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/components/ui/badge'
import { getAvatarColor, getInitials } from '../utils/avatar'
import type { Player } from '../types'
import type { PlayerOverviewStats } from '../types/player-history'

interface PlayerProfileHeaderProps {
  player: Player
  overview: PlayerOverviewStats
}

/** Section 1 — the player's identity block. */
export function PlayerProfileHeader({ player, overview }: PlayerProfileHeaderProps) {
  const { t, i18n } = useTranslation()

  const dateLabel = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-start">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${getAvatarColor(player.name)}`}
        >
          {getInitials(player.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{player.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">            <Badge variant={player.archived ? 'secondary' : 'default'}>
            {player.archived ? t('players.profile.archived') : t('players.profile.active')}
          </Badge>
            {player.phone && <span className="text-sm text-muted-foreground">{player.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center text-sm sm:max-w-md sm:text-start">
        <div>
          <p className="font-semibold">{overview.sessionsAttended}</p>
          <p className="text-xs text-muted-foreground">{t('players.profile.sessionsAttended')}</p>
        </div>
        <div>
          <p className="font-semibold">{dateLabel(overview.firstSessionDate)}</p>
          <p className="text-xs text-muted-foreground">{t('players.profile.firstSession')}</p>
        </div>
        <div>
          <p className="font-semibold">{dateLabel(overview.lastSessionDate)}</p>
          <p className="text-xs text-muted-foreground">{t('players.profile.lastSession')}</p>
        </div>
      </div>
    </div>
  )
}
