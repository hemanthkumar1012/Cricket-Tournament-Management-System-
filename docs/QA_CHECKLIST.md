# CricPulse QA checklist

Run the automated tests before release:

- Backend: `cd python-backend && pytest -q`
- Frontend: `cd frontend && npm test && npm run build`

## Automated backend coverage

- [x] Admin sign-in issues a bearer token.
- [x] Unauthenticated clients cannot create teams.
- [x] Team names are unique, case-insensitively.
- [x] A fixture cannot contain the same team twice.
- [x] Unknown team IDs cannot be scheduled.
- [x] Negative scores are rejected.
- [x] A completed match updates both teams' statistics.
- [x] A tied match awards one point to each team.
- [x] A completed result cannot be applied a second time.
- [x] Standings expose wins, losses, draws, played matches and points.

## Automated frontend coverage

- [x] Live-score normalization accepts direct and wrapped provider payloads.
- [x] String scores and zero scores are preserved.
- [x] Incomplete provider responses receive safe fallback labels.

## Manual release checks

- [ ] Configure a persistent PostgreSQL database in the deployment environment.
- [ ] Replace the local admin password and JWT signing secret.
- [ ] Confirm the production frontend origin is listed in `FRONTEND_ORIGINS`.
- [ ] Register two teams and schedule a fixture with a date and time.
- [ ] Record a win and verify the points table.
- [ ] Record a tie in a separate fixture and verify one point per team.
- [ ] Confirm a completed match cannot be scored again.
- [ ] Confirm the live-score screen handles an empty or unavailable feed.
- [ ] Test sign-out and expired-token behavior.
- [ ] Test the interface at desktop, tablet and mobile widths.
