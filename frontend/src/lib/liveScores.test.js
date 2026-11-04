import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLiveMatches } from "./liveScores.js";

test("normalizes direct arrays and wrapped API payloads", () => {
  const direct = [
    { id: "1", name: "India vs Australia", status: "Live", teams: ["India", "Australia"] },
  ];
  const wrapped = {
    data: {
      matches: [
        { id: "2", name: "England vs Pakistan", status: "Innings Break", teams: ["England", "Pakistan"] },
      ],
    },
  };

  const normalizedDirect = normalizeLiveMatches(direct);
  assert.equal(normalizedDirect.length, 1);
  assert.equal(normalizedDirect[0].homeTeam, "India");
  assert.equal(normalizedDirect[0].awayTeam, "Australia");

  const normalizedWrapped = normalizeLiveMatches(wrapped);
  assert.equal(normalizedWrapped.length, 1);
  assert.equal(normalizedWrapped[0].id, "2");
  assert.equal(normalizedWrapped[0].homeTeam, "England");
  assert.equal(normalizedWrapped[0].awayTeam, "Pakistan");
});

test("keeps string scores and zero scores", () => {
  const [match] = normalizeLiveMatches({
    matches: [{
      id: "3",
      teams: ["India", "Sri Lanka"],
      score: { home: "185/4 (18.2)", away: 0 },
    }],
  });
  assert.equal(match.homeScore, "185/4 (18.2)");
  assert.equal(match.awayScore, "0");
});

test("uses safe fallback labels for incomplete provider data", () => {
  const [match] = normalizeLiveMatches([{ id: "4" }]);
  assert.equal(match.name, "Match 1");
  assert.equal(match.homeTeam, "Unknown");
  assert.equal(match.awayTeam, "Unknown");
});
