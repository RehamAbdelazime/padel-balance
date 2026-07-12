import { forwardRef } from 'react'
import type { Player } from '../types'
import type { PlayerProfileData } from '../types/player-history'

import { PlayerProfileHeader } from './PlayerProfileHeader'
import { PlayerOverviewCards } from './PlayerOverviewCards'
import { PlayerSessionHistoryTable } from './PlayerSessionHistoryTable'
import { PlayerMatchHistoryTable } from './PlayerMatchHistoryTable'
import { PlayerPartnerHistoryTable } from './PlayerPartnerHistoryTable'
import { PlayerOpponentHistoryTable } from './PlayerOpponentHistoryTable'
import { PlayerAttendanceSection } from './PlayerAttendanceSection'
import { PlayerUpcomingMatchesTable } from './PlayerUpcomingMatchesTable'

interface Props {
  player: Player
  profile: PlayerProfileData
}

export const PlayerProfilePrintout = forwardRef<HTMLDivElement, Props>(
  function PlayerProfilePrintout({ player, profile }, ref) {

    return (
      <div
        ref={ref}
        className="bg-white p-10 space-y-6"
        style={{
          width: '794px',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >

        <PlayerProfileHeader
          player={player}
          overview={profile.overview}
        />

        <PlayerOverviewCards
          overview={profile.overview}
        />


        <PlayerSessionHistoryTable
          sessions={profile.sessionHistory}
        />


        <PlayerUpcomingMatchesTable
          matches={profile.upcomingMatches}
        />


        <PlayerMatchHistoryTable
          matches={profile.matchHistory}
        />


        <PlayerPartnerHistoryTable
          partners={profile.partners}
        />


        <PlayerOpponentHistoryTable
          opponents={profile.opponents}
        />


        <PlayerAttendanceSection
          attendance={profile.attendance}
        />


      </div>
    )
  }
)