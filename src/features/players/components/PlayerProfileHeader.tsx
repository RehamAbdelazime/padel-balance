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
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${getAvatarColor(player.name)}`}
          aria-hidden="true"
        >
          {getInitials(player.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={player.archived ? 'secondary' : 'default'}>
              {player.archived ? t('players.profile.archived') : t('players.profile.active')}
            </Badge>
            {player.phone && <span className="text-sm text-muted-foreground">{player.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm sm:max-w-md">
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
