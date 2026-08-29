import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLiveMatches } from './liveScores.js';

test('normalizeLiveMatches accepts direct arrays and wrapped payloads', () => {
  const direct = [
    { id: '1', name: 'India vs Australia', status: 'Live', teams: ['India', 'Australia'] }
  ];

  const wrapped = {
    data: {
      matches: [
        { id: '2', name: 'England vs Pakistan', status: 'Innings Break', teams: ['England', 'Pakistan'] }
      ]
    }
  };

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
