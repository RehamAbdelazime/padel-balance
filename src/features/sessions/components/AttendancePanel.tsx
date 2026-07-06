import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { UserMinus, UserPlus, X, Coffee, RotateCcw, LogOut, UserX, Repeat } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Separator } from '@/shared/components/ui/separator'
import { useAddAttendanceMutation, useRemoveAttendanceMutation } from '../hooks/useAttendance'
import { ReplacePlayerDialog } from './ReplacePlayerDialog'
import type { ReplaceMode } from './ReplacePlayerDialog'
import { playerRuntimeService } from '../services/player-runtime.service'
import type { SessionAttendee, PlannedMatch, PlayerRuntimeState, PlayerRuntimeStatus } from '../types'
import type { Player } from '@/features/players/types'

/** Only the non-AVAILABLE states are ever shown as a badge. Exported for reuse by Session Reports (Sprint R2). */
export function runtimeStatusLabel(t: TFunction, status: PlayerRuntimeStatus): string {
  switch (status) {
    case 'RESTING':  return t('sessions.runtime.status.resting')
    case 'ABSENT':   return t('sessions.runtime.status.absent')
    case 'LEFT':     return t('sessions.runtime.status.left')
    case 'REPLACED': return t('sessions.runtime.status.replaced')
    case 'AVAILABLE': return ''
  }
}

interface AttendancePanelProps {
  sessionId: string
  attendees: SessionAttendee[]
  /** All non-archived players — fetched by the parent page. */
  allPlayers: Player[]
  /** True once the session is FINISHED — hides add/remove controls entirely. */
  readonly?: boolean
  /** True once the session is LIVE — shows the per-player Runtime menu. */
  isLive?: boolean
  /** Present only once a schedule exists. */
  playerStates?: ReadonlyMap<string, PlayerRuntimeState>
  matches?: readonly PlannedMatch[]
  /** Session's configured Number of Courts — needed to find "this round" for Replace Player. */
  courtCount?: number
  /** True while a runtime action (rest/return/absent/replace/leave) is in flight — disables every runtime button to prevent duplicate-click races. */
  isRuntimeActionPending?: boolean
  onRestNextRound?:    (playerId: string) => void
  onReturnToRotation?: (playerId: string) => void
  onLeaveSession?:     (playerId: string) => void
  onMarkAbsent?:       (playerId: string) => void
  /** `matchId` is present only for THIS_ROUND mode. */
  onReplacePlayer?:    (mode: ReplaceMode, oldPlayerId: string, newPlayerId: string, matchId?: string) => void
}

/**
 * Returns players not yet in the session and matching the search query.
 * Pure function — no side effects.
 */
function filterAvailablePlayers(
  allPlayers: Player[],
  attendees: SessionAttendee[],
  query: string,
): Player[] {
  const attendeeIds = new Set(attendees.map((a) => a.player_id))
  const q = query.toLowerCase()
  return allPlayers.filter(
    (p) => !attendeeIds.has(p.id) && p.name.toLowerCase().includes(q),
  )
}

export function AttendancePanel({
  sessionId,
  attendees,
  allPlayers,
  readonly = false,
  isLive = false,
  playerStates,
  matches = [],
  courtCount = 1,
  isRuntimeActionPending = false,
  onRestNextRound,
  onReturnToRotation,
  onLeaveSession,
  onMarkAbsent,
  onReplacePlayer,
}: AttendancePanelProps) {
  const { t } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceTarget, setReplaceTarget] = useState<SessionAttendee | null>(null)

  const addMutation = useAddAttendanceMutation(sessionId)
  const removeMutation = useRemoveAttendanceMutation(sessionId)

  const availablePlayers = filterAvailablePlayers(allPlayers, attendees, searchQuery)

  const showRuntimeMenu = isLive && playerStates !== undefined

  const handleAddPlayer = (playerId: string) => {
    addMutation.mutate(playerId)
    setSearchQuery('')
  }

  const handleCloseSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <section aria-label={t('sessions.detail.attendance')}>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          {t('sessions.detail.attendance')}
          {attendees.length > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              {t('sessions.detail.attendanceCount_other', {
                count: attendees.length,
              })}
            </span>
          )}
        </h2>
        {!readonly && (
          searchOpen ? (
            <Button variant="outline" size="sm" onClick={handleCloseSearch}>
              {t('sessions.detail.doneAdding')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
            >
              <UserPlus className="me-1.5 h-4 w-4" aria-hidden="true" />
              {t('sessions.detail.addPlayer')}
            </Button>
          )
        )}
      </div>

      {/* Attendee list */}
      {attendees.length === 0 && !searchOpen && (
        <p className="text-sm text-muted-foreground">
          {t('sessions.detail.noAttendees')}
        </p>
      )}

      {attendees.length > 0 && (
        <ul className="divide-y rounded-md border">
          {attendees.map((attendee) => {
            const status = playerStates?.get(attendee.player_id)?.status ?? 'AVAILABLE'
            const hasStarted = playerRuntimeService.hasPlayerStarted(matches, attendee.player_id)

            return (
            <li
              key={attendee.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">
                    {attendee.players.name}
                  </p>
                  {showRuntimeMenu && status !== 'AVAILABLE' && (
                    <Badge variant="outline" className="text-xs">
                      {runtimeStatusLabel(t, status)}
                    </Badge>
                  )}
                </div>
                {attendee.players.phone && (
                  <p className="truncate text-xs text-muted-foreground">
                    {attendee.players.phone}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1">
                {showRuntimeMenu && (
                  <>
                    {status === 'AVAILABLE' && onRestNextRound && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => onRestNextRound(attendee.player_id)}
                        disabled={isRuntimeActionPending}
                        aria-label={`${t('sessions.runtime.restNextRound')}: ${attendee.players.name}`}
                      >
                        <Coffee className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {t('sessions.runtime.restNextRound')}
                      </Button>
                    )}
                    {status === 'RESTING' && onReturnToRotation && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => onReturnToRotation(attendee.player_id)}
                        disabled={isRuntimeActionPending}
                        aria-label={`${t('sessions.runtime.returnToRotation')}: ${attendee.players.name}`}
                      >
                        <RotateCcw className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {t('sessions.runtime.returnToRotation')}
                      </Button>
                    )}
                    {(status === 'AVAILABLE' || status === 'RESTING') && onMarkAbsent && !hasStarted && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => onMarkAbsent(attendee.player_id)}
                        disabled={isRuntimeActionPending}
                        aria-label={`${t('sessions.runtime.markAbsent')}: ${attendee.players.name}`}
                      >
                        <UserX className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {t('sessions.runtime.markAbsent')}
                      </Button>
                    )}
                    {(status === 'AVAILABLE' || status === 'RESTING') && onReplacePlayer && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setReplaceTarget(attendee)}
                        disabled={isRuntimeActionPending}
                        aria-label={`${t('sessions.runtime.replacePlayer')}: ${attendee.players.name}`}
                      >
                        <Repeat className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {t('sessions.runtime.replacePlayer')}
                      </Button>
                    )}
                    {(status === 'AVAILABLE' || status === 'RESTING') && onLeaveSession && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onLeaveSession(attendee.player_id)}
                        disabled={isRuntimeActionPending}
                        aria-label={`${t('sessions.runtime.leaveSession')}: ${attendee.players.name}`}
                      >
                        <LogOut className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {t('sessions.runtime.leaveSession')}
                      </Button>
                    )}
                  </>
                )}
                {!readonly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMutation.mutate(attendee.id)}
                    disabled={removeMutation.isPending}
                    aria-label={`${t('sessions.detail.removePlayer')}: ${attendee.players.name}`}
                  >
                    <UserMinus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
            )
          })}
        </ul>
      )}

      {/* Inline player search */}
      {searchOpen && (
        <div className="mt-4 space-y-2">
          <Separator />
          <div className="relative pt-2">
            <Input
              autoFocus
              placeholder={t('sessions.detail.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute end-3 top-1/2 mt-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {availablePlayers.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">
              {searchQuery
                ? t('sessions.detail.noPlayersFound')
                : t('sessions.detail.allPlayersAdded')}
            </p>
          ) : (
            <ul className="rounded-md border">
              {availablePlayers.map((player) => (
                <li key={player.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    onClick={() => handleAddPlayer(player.id)}
                    disabled={addMutation.isPending}
                  >
                    <UserPlus
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{player.name}</p>
                      {player.phone && (
                        <p className="truncate text-xs text-muted-foreground">
                          {player.phone}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ReplacePlayerDialog
        outgoing={replaceTarget}
        attendees={attendees}
        playerStates={playerStates ?? new Map()}
        matches={matches}
        courtCount={courtCount}
        open={replaceTarget !== null}
        onClose={() => setReplaceTarget(null)}
        onConfirm={(mode, oldId, newId, matchId) => onReplacePlayer?.(mode, oldId, newId, matchId)}
      />
    </section>
  )
}
