# PadelOps Domain Model

Version: 1.0
Status: Draft
Last Updated: 2026-07-06

---

# Purpose

This document is the authoritative source of truth for the PadelOps domain model.
All future database migrations, backend services, frontend features and runtime logic
must comply with this document.

---

# Product Vision

PadelOps is a social platform that enables individuals to organize and participate
in padel groups.

PadelOps is NOT:
- A club ERP
- A court booking system
- A tournament website

PadelOps IS:
- A group management platform
- A session management platform
- A player history platform

---

# Core Principles

1. Organizer First
2. Player != User
3. Groups are the tenant boundary.
4. Phone number is the identity bridge.
5. Runtime never rewrites history.
6. Generator remains pure.
7. Finished matches are historical truth.
8. Soft delete by default.
9. Architecture before features.

---

# Core Entities

## User
Authenticated account.
A user may own multiple groups and join multiple groups.

## Group
Represents an independent padel community.
Every business entity belongs to exactly one Group.

## Membership
Relationship between a User and a Group.
Roles:
- Owner
- Admin
- Member

## Player
Represents a participant inside one specific Group.
A Player may exist without a User account.

## Session
One playing event belonging to a Group.

## Match
Belongs to exactly one Session.
Lifecycle:
Planned -> Live -> Finished

---

# Ownership Model

Every business table must contain `group_id`.

Never use `owner_id` as the business isolation boundary.

Business data:
- Players
- Sessions
- Matches
- Reports
- Runtime
- Statistics

are always scoped to one Group.

---

# Identity

Phone number is the canonical identity used to link a Player
to a User account.

Flow:
1. User joins group.
2. Match by verified phone.
3. Link existing Player if found.
4. Otherwise create a new Player after approval.

---

# Historical Integrity

Only Finished matches participate in:
- Player History
- Statistics
- Reports

Planned, Live and Cancelled matches never become historical records.

---

# Runtime

Runtime controls:
- Live matches
- Replacements
- Rest rotation
- Future regeneration

Runtime may never modify completed history.

---

# Future Direction

This architecture is intentionally designed to support:

- Multiple Groups per User
- Multiple Owners
- Player Accounts
- Notifications
- Rankings
- Subscriptions
- Community Features

without requiring structural redesign.
