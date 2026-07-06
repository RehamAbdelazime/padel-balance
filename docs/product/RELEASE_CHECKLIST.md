# Release Checklist

Version: 1.0
Status: Living Document

## Build Quality
- [ ] TypeScript build passes
- [ ] Production build passes
- [ ] Lint passes
- [ ] Tests pass

## Architecture
- [ ] Complies with DOMAIN_MODEL.md
- [ ] Complies with PRINCIPLES.md
- [ ] No ADR violations

## Database
- [ ] Migrations tested
- [ ] RLS verified
- [ ] No cross-group access
- [ ] Backup strategy confirmed

## Generator
- [ ] Constraint validation passes
- [ ] No duplicate players
- [ ] Fairness checks complete
- [ ] Runtime compatibility verified

## Runtime
- [ ] Start/Finish flow verified
- [ ] Replacement flow verified
- [ ] Rest flow verified
- [ ] Regeneration verified
- [ ] Recovery flows tested

## Reports
- [ ] Finished matches only
- [ ] Export verified
- [ ] Statistics validated

## UI / UX
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling
- [ ] Mobile layout
- [ ] Accessibility review

## Security
- [ ] Authentication verified
- [ ] Authorization verified
- [ ] Role permissions verified
- [ ] Sensitive actions confirmed

## Deployment
- [ ] Environment variables configured
- [ ] Production deployment successful
- [ ] Monitoring enabled
- [ ] Rollback available

## Sign-off
- Product Owner
- Architecture
- QA
- Release
