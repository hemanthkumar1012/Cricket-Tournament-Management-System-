export function normalizeLiveMatches(payload) {
  if (!payload) return [];

  const candidates = [];
  if (Array.isArray(payload)) candidates.push(payload);
  else if (Array.isArray(payload.matches)) candidates.push(payload.matches);
  else if (Array.isArray(payload.data)) candidates.push(payload.data);
  else if (payload.data && Array.isArray(payload.data.matches)) candidates.push(payload.data.matches);
  else if (payload.results && Array.isArray(payload.results)) candidates.push(payload.results);
  else if (payload.data && Array.isArray(payload.data.results)) candidates.push(payload.data.results);
  else if (payload.match) candidates.push(Array.isArray(payload.match) ? payload.match : [payload.match]);
  else if (payload.data && payload.data.match) candidates.push(Array.isArray(payload.data.match) ? payload.data.match : [payload.data.match]);

  return (candidates[0] || []).filter(Boolean).map((match, index) => {
    const { home, away } = normalizeTeams(match);
    const score = match.score || match.scorecard || match.liveScore || match.current_score || {};
    return {
      id: match.id || match.match_id || match.matchId || `live-${index}`,
      name: match.name || match.title || match.match_name || match.series || `${extractTeamName(home)} vs ${extractTeamName(away)}` || `Match ${index + 1}`,
      status: match.status || match.matchStatus || match.state || 'Live',
      subtitle: match.subtitle || match.stage || match.description || (typeof match.score === 'string' ? match.score : ''),
      startTime: match.startTime || match.start_time || match.date || match.matchDate || '',
      homeTeam: extractTeamName(home),
      awayTeam: extractTeamName(away),
      homeScore: extractScore(score, 'home') || match.homeScore || match.score1 || match.team1Score || '',
      awayScore: extractScore(score, 'away') || match.awayScore || match.score2 || match.team2Score || '',
      venue: match.venue || match.location || '',
      series: match.series || match.tournament || '',
    };
  });
}

function normalizeTeams(match) {
  const rawTeams = match.teams ?? match.team_names ?? match.teamNames ?? match.teamList ?? [];
  let home = match.homeTeam || match.team1 || match.localTeam || match.home || match.teamA || {};
  let away = match.awayTeam || match.team2 || match.visitorTeam || match.away || match.teamB || {};
  if (typeof rawTeams === 'string') {
    const parts = rawTeams.split(/\s+vs\.?\s+|\s+-\s+/i).map((part) => part.trim()).filter(Boolean);
    if (parts[0] && isEmptyTeam(home)) home = { name: parts[0] };
    if (parts[1] && isEmptyTeam(away)) away = { name: parts[1] };
  } else if (Array.isArray(rawTeams)) {
    if (rawTeams[0] && isEmptyTeam(home)) home = { name: rawTeams[0] };
    if (rawTeams[1] && isEmptyTeam(away)) away = { name: rawTeams[1] };
  }
  return { home, away };
}

function isEmptyTeam(value) {
  if (!value) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function extractTeamName(value) {
  if (!value) return 'Unknown';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value.name || value.full_name || value.short_name || value.code || 'Unknown';
  return String(value);
}

function extractScore(value, side) {
  if (typeof value === 'string') return side === 'home' ? value : '';
  if (!value || typeof value !== 'object') return '';
  if (side === 'home') return value.home || value.innings1 || value.team1 || value.score1 || value.current?.home || value.homeScore || '';
  return value.away || value.innings2 || value.team2 || value.score2 || value.current?.away || value.awayScore || '';
}
