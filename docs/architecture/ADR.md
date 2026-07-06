# Architecture Decision Records

Version: 1.0

---

# ADR-001
Title: User != Player
Status: Accepted

## Context
Organizers must be able to create players before they install the app.

## Decision
Users represent authenticated accounts.
Players represent participation inside one Group.

## Consequences
Player history survives account creation.
One user may link to multiple player records across groups.

---

# ADR-002
Title: Group is the Tenant
Status: Accepted

## Decision
Every business entity belongs to exactly one Group.
Security and isolation are enforced by group_id and RLS.

---

# ADR-003
Title: Phone Number as Identity
Status: Accepted

## Decision
Verified phone numbers are the primary mechanism for linking Players to Users.

---

# ADR-004
Title: Generator is Pure
Status: Accepted

## Decision
The generator depends only on domain inputs and produces schedules.
No database, UI, runtime or authentication dependencies are allowed.

---

# ADR-005
Title: Runtime is Independent
Status: Accepted

## Decision
Runtime manages execution only.
It never modifies completed history.

---

# ADR-006
Title: Finished Matches are Historical Truth
Status: Accepted

## Decision
Only Finished matches contribute to:
- Player history
- Reports
- Statistics

---

# ADR-007
Title: Soft Delete Policy
Status: Accepted

## Decision
Archive entities instead of permanently deleting historical data.

---

# ADR-008
Title: Multi-Group Architecture
Status: Accepted

## Decision
A user may own many Groups and join many Groups.
Future features must remain compatible with this model.
