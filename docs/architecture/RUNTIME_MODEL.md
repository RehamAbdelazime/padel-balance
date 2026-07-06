# Runtime Model

Version: 1.0
Status: Accepted

## Purpose
Defines the runtime lifecycle, ownership and invariants for live session execution.

---

# Runtime Lifecycle

Planning
    ↓
Ready
    ↓
Live
    ↓
Finished

Only one active runtime exists per Session.

---

# Ownership

Runtime belongs to:

Group
  └── Session
        └── Runtime

Runtime never exists outside a Session.

---

# Match Lifecycle

Planned
    ↓ Start Match
Live
    ↓ Finish Match
Finished

Rules:
- Only one Live match per court.
- Finished matches are immutable.
- Planned matches may be regenerated.
- Live matches cannot be regenerated.

---

# Allowed Runtime Actions

- Start Match
- Finish Match
- Record Score
- Rest Player Next Round
- Return Player
- Replace Player
- Add Guest
- Cancel Future Planned Match
- Regenerate Future Rounds

---

# Forbidden Actions

- Modify Finished Match
- Delete Finished Match
- Change historical score
- Regenerate completed rounds
- Edit reports directly

---

# Regeneration Rules

Runtime may regenerate only future Planned matches.

Locked, Manual and Finished matches must be preserved.

Regeneration must validate:
- No duplicate player in a round
- Four players per match
- Court capacity
- Available players only

---

# Player States

Available
Resting
Guest
Left
Injured
Absent

Only Available players may be scheduled automatically.

---

# Recovery

If runtime becomes invalid:
1. Detect issue.
2. Explain issue.
3. Offer recovery actions.
4. Validate before applying.

Runtime must never silently repair data.

---

# History

History is created only when a match reaches Finished.

Planned and Live matches never appear in:
- Player History
- Statistics
- Reports

---

# Invariants

- Runtime never rewrites history.
- Finished is terminal.
- Future regeneration only.
- One live match per court.
- Generator remains independent.
