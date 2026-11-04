export function normalizeLiveMatches(payload) {
  if (!payload) return [];

  let matches = [];
  if (Array.isArray(payload)) matches = payload;
  else if (Array.isArray(payload.matches)) matches = payload.matches;
  else if (Array.isArray(payload.data)) matches = payload.data;
  else if (Array.isArray(payload.data?.matches)) matches = payload.data.matches;
  else if (Array.isArray(payload.results)) matches = payload.results;
  else if (Array.isArray(payload.data?.results)) matches = payload.data.results;
  else if (payload.match) matches = Array.isArray(payload.match) ? payload.match : [payload.match];
  else if (payload.data?.match) matches = Array.isArray(payload.data.match) ? payload.data.match : [payload.data.match];

  return matches.filter(Boolean).map((match, index) => {
    const { home, away } = normalizeTeams(match);
    const score = match.score || match.scorecard || match.liveScore || match.current_score || {};
    const homeTeam = extractTeamName(home);
    const awayTeam = extractTeamName(away);
    const fallbackName = homeTeam !== "Unknown" || awayTeam !== "Unknown"
      ? `${homeTeam} vs ${awayTeam}`
      : `Match ${index + 1}`;

    return {
      id: match.id || match.match_id || match.matchId || `live-${index}`,
      name: match.name || match.title || match.match_name || match.series || fallbackName,
      status: match.status || match.matchStatus || match.state || "Live",
      subtitle: match.subtitle || match.stage || match.description || "",
      startTime: match.startTime || match.start_time || match.date || match.matchDate || "",
      homeTeam,
      awayTeam,
      homeScore: extractScore(score, "home") || match.homeScore || match.score1 || match.team1Score || "",
      awayScore: extractScore(score, "away") || match.awayScore || match.score2 || match.team2Score || "",
      venue: match.venue || match.location || "",
      series: match.series || match.tournament || "",
    };
  });
}

function normalizeTeams(match) {
  const rawTeams = match.teams ?? match.team_names ?? match.teamNames ?? match.teamList ?? [];
  let home = match.homeTeam || match.team1 || match.localTeam || match.home || match.teamA || {};
  let away = match.awayTeam || match.team2 || match.visitorTeam || match.away || match.teamB || {};

  if (typeof rawTeams === "string") {
    const parts = rawTeams.split(/\s+vs\.?\s+|\s+-\s+/i).map((part) => part.trim()).filter(Boolean);
    if (parts[0] && isEmptyTeam(home)) home = { name: parts[0] };
    if (parts[1] && isEmptyTeam(away)) away = { name: parts[1] };
  } else if (Array.isArray(rawTeams)) {
    if (rawTeams[0] && isEmptyTeam(home)) home = rawTeams[0];
    if (rawTeams[1] && isEmptyTeam(away)) away = rawTeams[1];
  }

  return { home, away };
}

function isEmptyTeam(value) {
  if (!value) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function extractTeamName(value) {
  if (!value) return "Unknown";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.name || value.full_name || value.short_name || value.code || "Unknown";
  }
  return String(value);
}

function extractScore(value, side) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";

  const candidates = side === "home"
    ? [value.home, value.innings1, value.team1, value.score1, value.current?.home, value.homeScore]
    : [value.away, value.innings2, value.team2, value.score2, value.current?.away, value.awayScore];

  const score = candidates.find((item) => item !== undefined && item !== null && item !== "");
  return score === undefined ? "" : String(score);
}
