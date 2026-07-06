import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Pencil, Archive } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/shared/components/ui/card'
import { getAvatarColor, getInitials } from '../utils/avatar'
import type { Player } from '../types'

interface PlayerCardProps {
  player: Player
  onEdit: (player: Player) => void
  onArchive: (player: Player) => void
}

export function PlayerCard({ player, onEdit, onArchive }: PlayerCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleCardClick = () => {
    void navigate(`/players/${player.id}`)
  }

  return (
    <Card
      className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
      onClick={handleCardClick}
      role="link"
      aria-label={player.name}
    >
      <CardContent className="flex flex-1 items-start gap-4 pt-6">
        {/* Avatar */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(player.name)}`}
          aria-hidden="true"
        >
          {getInitials(player.name)}
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate font-semibold leading-none">{player.name}</p>
          {player.phone && (
            <p className="truncate text-sm text-muted-foreground">
              {player.phone}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(player)
          }}
          aria-label={`${t('players.editPlayer')}: ${player.name}`}
        >
          <Pencil className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('players.editPlayer')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onArchive(player)
          }}
          aria-label={`${t('players.archivePlayer')}: ${player.name}`}
        >
          <Archive className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('players.archivePlayer')}
        </Button>
      </CardFooter>
    </Card>
  )
}
