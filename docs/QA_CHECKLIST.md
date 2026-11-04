# CricPulse QA checklist

Run the automated tests before release:

- Backend: `cd python-backend && pytest -q`
- Frontend: `cd frontend && npm test && npm run build`

## Automated backend coverage

- [x] Admin sign-in issues a bearer token.
- [x] Unauthenticated clients cannot create teams or players.
- [x] Team names are unique, case-insensitively.
- [x] A fixture cannot contain the same team twice.
- [x] Unknown team IDs cannot be scheduled.
- [x] Negative scores are rejected.
- [x] A completed match updates both teams' statistics.
- [x] A tied match awards one point to each team.
- [x] A completed result cannot be applied a second time.
- [x] Standings expose wins, losses, draws, played matches and points.
- [x] Players can be registered and assigned to a team.
- [x] Players can be reassigned and removed by an administrator.
- [x] Unknown team assignments are rejected.
- [x] An innings can be started only by an administrator.
- [x] Deliveries accept valid run, wide, no-ball, bye and leg-bye inputs.
- [x] Illegal deliveries do not increase the legal-ball count.
- [x] No-ball runs are excluded from the batter's balls-faced count.
- [x] Player/team assignments are checked against the innings teams.
- [x] The last delivery can be undone with totals recalculated.
- [x] A small registered squad can be dismissed all out correctly.
- [x] Manual final-score entry cannot bypass a ball-by-ball scorecard.
- [x] Two completed innings finalize through the standings engine.

## Automated frontend coverage

- [x] Live-score normalization accepts direct and wrapped provider payloads.
- [x] String scores and zero scores are preserved.
- [x] Incomplete provider responses receive safe fallback labels.

## Manual release checks

- [ ] Configure a persistent PostgreSQL database in the deployment environment.
- [ ] Replace the local admin password and JWT signing secret.
- [ ] Set the Vercel project root to the repository root.
- [ ] Confirm the production frontend origin is listed in `FRONTEND_ORIGINS`.
- [ ] Register two teams and add players to each team.
- [ ] Schedule a fixture with a date and time.
- [ ] Use the Scoring desk to record a complete two-innings match and verify its scorecard.
- [ ] Verify wide, no-ball, bye, leg-bye and dismissal workflows manually.
- [ ] Undo a delivery and verify all scorecard totals recalculate.
- [ ] Record a win and verify the points table.
- [ ] Record a tie in a separate fixture and verify one point per team.
- [ ] Confirm a completed match cannot be scored again.
- [ ] Confirm the live-score screen handles an empty or unavailable feed.
- [ ] Test sign-out and expired-token behavior.
- [ ] Test the interface at desktop, tablet and mobile widths.
