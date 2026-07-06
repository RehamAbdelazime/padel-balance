# PadelOps Architecture Principles

Version: 1.0
Status: Accepted

## Purpose
These principles are mandatory. If implementation conflicts with any principle, the implementation must change.

---

## Principle 1 — Organizer First
Optimize every workflow for the organizer before adding player-facing features.

## Principle 2 — Player != User
A Player is a domain entity.
A User is an authenticated account.
Never treat them as the same object.

## Principle 3 — Group is the Security Boundary
Every business entity belongs to exactly one Group.
Every query must be scoped by group_id.

## Principle 4 — Phone is Identity
Verified phone numbers are used to link Players to Users.

## Principle 5 — Generator is Pure
The generator must not know about:
- Database
- UI
- Runtime
- Reports
- Authentication

## Principle 6 — Runtime Never Rewrites History
Runtime may regenerate future rounds only.
Finished matches are immutable.

## Principle 7 — History Represents Reality
Only Finished matches participate in:
- History
- Reports
- Statistics

## Principle 8 — Soft Delete by Default
Archive instead of deleting whenever historical integrity matters.

## Principle 9 — Database Enforces Security
RLS is mandatory.
Frontend validation is never sufficient.

## Principle 10 — Architecture Before Features
Do not introduce features that violate the domain model.
Update the architecture first, then implement.

## Principle 11 — Simplicity Wins
Prefer understandable workflows over clever algorithms.

## Principle 12 — Future Compatibility
Every new feature should be evaluated against:
- Multi-group support
- Player accounts
- Notifications
- Scalability
