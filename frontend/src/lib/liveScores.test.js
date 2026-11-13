import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLiveMatches } from './liveScores.js';

test('normalizeLiveMatches accepts direct arrays and wrapped payloads', () => {
  const direct = [{ id: '1', name: 'India vs Australia', status: 'Live', teams: ['India', 'Australia'] }];
  const wrapped = { data: { matches: [{ id: '2', name: 'England vs Pakistan', status: 'Innings Break', teams: ['England', 'Pakistan'] }] } };
  const normalizedDirect = normalizeLiveMatches(direct);
  assert.equal(normalizedDirect.length, 1);
  assert.equal(normalizedDirect[0].homeTeam, 'India');
  assert.equal(normalizedDirect[0].awayTeam, 'Australia');
  const normalizedWrapped = normalizeLiveMatches(wrapped);
  assert.equal(normalizedWrapped.length, 1);
  assert.equal(normalizedWrapped[0].id, '2');
  assert.equal(normalizedWrapped[0].homeTeam, 'England');
  assert.equal(normalizedWrapped[0].awayTeam, 'Pakistan');
});

test('normalizes alternate provider fields, nested team objects and score variants', () => {
  const [match] = normalizeLiveMatches({ results: [{ match_id: 45, team1: { full_name: 'India' }, team2: { code: 'AUS' }, current_score: { innings1: '180/4', innings2: '42/1' }, matchStatus: 'In progress' }] });
  assert.equal(match.id, 45);
  assert.equal(match.homeTeam, 'India');
  assert.equal(match.awayTeam, 'AUS');
  assert.equal(match.homeScore, '180/4');
  assert.equal(match.awayScore, '42/1');
  assert.equal(match.status, 'In progress');
});

test('handles empty, invalid and null entries safely', () => {
  assert.deepEqual(normalizeLiveMatches(null), []);
  assert.deepEqual(normalizeLiveMatches({ matches: [] }), []);
  assert.deepEqual(normalizeLiveMatches({ matches: [null, false, { id: 'x' }] }).map((match) => match.id), ['x']);
});

test('parses team names from matchup strings and keeps a text score as subtitle', () => {
  const [match] = normalizeLiveMatches({ match: { title: 'NZ vs. South Africa', score: 'NZ 95/2' } });
  assert.equal(match.homeTeam, 'NZ');
  assert.equal(match.awayTeam, 'South Africa');
  assert.equal(match.subtitle, 'NZ 95/2');
});
