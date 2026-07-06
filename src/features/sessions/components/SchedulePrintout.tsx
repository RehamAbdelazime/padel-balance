import { forwardRef } from 'react'
import type { PlannedMatch, SessionAttendee } from '../types'
import { groupMatchesIntoRounds, standbyForRound } from '../utils'

/**
 * Dedicated printable schedule — the single source of truth rasterized for
 * PDF/PNG/JPEG export (see utils/schedule-export.ts). Renders only the
 * schedule itself: no buttons, no controls, no toolbars.
 *
 * Rendered off-screen (see ScheduleReviewPanel) purely so html2canvas has a
 * real laid-out DOM node to capture — never shown to the organiser directly.
 */

export interface SchedulePrintoutProps {
  sessionName:  string
  dateLabel:    string
  timeLabel:    string | null
  formatName:   string
  playerCount:  number
  courtCount:   number
  matches:      readonly PlannedMatch[]
  attendees:    readonly SessionAttendee[]
  playerName:   (id: string) => string
  roundLabel:   (n: number) => string
  standbyLabel: string
  teamALabel:   string
  teamBLabel:   string
  vsLabel:      string
}

export const SchedulePrintout = forwardRef<HTMLDivElement, SchedulePrintoutProps>(function SchedulePrintout(
  {
    sessionName,
    dateLabel,
    timeLabel,
    formatName,
    playerCount,
    courtCount,
    matches,
    attendees,
    playerName,
    roundLabel,
    standbyLabel,
    teamALabel,
    teamBLabel,
    vsLabel,
  },
  ref,
) {
  const rounds = groupMatchesIntoRounds(matches, courtCount)

  return (
    <div
      ref={ref}
      style={{
        width:           '794px',
        padding:         '48px',
        backgroundColor: '#ffffff',
        color:           '#111111',
        fontFamily:      'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Session information */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 700 }}>{sessionName}</h1>
        <table style={{ borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr><td style={{ padding: '2px 16px 2px 0', color: '#555555' }}>Date</td><td style={{ fontWeight: 600 }}>{dateLabel}</td></tr>
            {timeLabel && (
              <tr><td style={{ padding: '2px 16px 2px 0', color: '#555555' }}>Time</td><td style={{ fontWeight: 600 }}>{timeLabel}</td></tr>
            )}
            <tr><td style={{ padding: '2px 16px 2px 0', color: '#555555' }}>Tournament format</td><td style={{ fontWeight: 600 }}>{formatName}</td></tr>
            <tr><td style={{ padding: '2px 16px 2px 0', color: '#555555' }}>Number of players</td><td style={{ fontWeight: 600 }}>{playerCount}</td></tr>
            <tr><td style={{ padding: '2px 16px 2px 0', color: '#555555' }}>Number of courts</td><td style={{ fontWeight: 600 }}>{courtCount}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Rounds */}
      {rounds.map(round => {
        const standby = standbyForRound(attendees, round).map(a => a.players.name)
        return (
          <div key={round.roundNumber} style={{ marginBottom: '24px' }}>
            <div style={{ borderTop: '2px solid #111111', margin: '0 0 12px' }} />
            <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700 }}>
              {roundLabel(round.roundNumber)}
            </h2>

            {round.slots.map(slot => (
              <div
                key={slot.match.id}
                style={{
                  marginBottom:  '10px',
                  padding:       '10px 14px',
                  border:        '1px solid #dddddd',
                  borderRadius:  '6px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#555555', marginBottom: '4px' }}>
                  {`Match ${slot.matchIndex + 1}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase' }}>{teamALabel}</div>
                    <div style={{ fontWeight: 600 }}>{playerName(slot.match.teamA[0])}</div>
                    <div style={{ fontWeight: 600 }}>{playerName(slot.match.teamA[1])}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#999999' }}>{vsLabel}</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase' }}>{teamBLabel}</div>
                    <div style={{ fontWeight: 600 }}>{playerName(slot.match.teamB[0])}</div>
                    <div style={{ fontWeight: 600 }}>{playerName(slot.match.teamB[1])}</div>
                  </div>
                </div>
              </div>
            ))}

            {standby.length > 0 && (
              <div style={{ fontSize: '13px', color: '#555555', marginTop: '8px' }}>
                <strong>{standbyLabel}:</strong> {standby.join(', ')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
