# Database Guidelines

Version: 1.0
Status: Accepted

## Purpose
Defines mandatory database standards for PadelOps.

---

# General Rules

- PostgreSQL is the source of truth.
- UUID primary keys for all business tables.
- UTC timestamps only.
- snake_case naming.
- Foreign keys required where relationships exist.
- Index every foreign key.

---

# Multi-Group Rules

Every business table MUST contain:

- group_id

Business tables include:

- players
- sessions
- matches
- reports
- runtime
- statistics
- attendance

Never isolate data using owner_id.

---

# Security

- Row Level Security (RLS) enabled.
- Every SELECT, INSERT, UPDATE and DELETE policy scoped by group membership.
- Never rely only on frontend validation.

---

# Deletion Policy

Never hard delete historical business entities.

Preferred states:

- archived
- inactive
- left_group

Finished matches must never be deleted.

---

# Data Integrity

- NOT NULL wherever possible.
- CHECK constraints for enums and numeric ranges.
- Unique constraints where required.
- Use transactions for multi-table mutations.

---

# Auditing

Critical operations should be auditable:

- session generation
- runtime changes
- replacements
- exports
- destructive actions

---

# Performance

- Index frequently filtered columns.
- Avoid N+1 queries.
- Paginate large result sets.
- Keep reports derived from Finished matches only.

---

# Migration Rules

- Migrations are additive whenever possible.
- Never modify production data without migration.
- Every migration must be reversible where practical.
- Test migrations on staging before production.

---

# Non-Negotiable

- No cross-group queries.
- No planned matches in statistics.
- No runtime writes to historical records.
- Database rules override frontend assumptions.
