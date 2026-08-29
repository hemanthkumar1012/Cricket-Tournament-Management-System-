export function normalizeLiveMatches(payload) {
  if (!payload) return [];

  const candidates = [];

  if (Array.isArray(payload)) {
    candidates.push(payload);
  } else if (Array.isArray(payload.matches)) {
    candidates.push(payload.matches);
  } else if (Array.isArray(payload.data)) {
    candidates.push(payload.data);
  } else if (payload.data && Array.isArray(payload.data.matches)) {
    candidates.push(payload.data.matches);
  } else if (payload.results && Array.isArray(payload.results)) {
    candidates.push(payload.results);
  } else if (payload.data && payload.data.results && Array.isArray(payload.data.results)) {
    candidates.push(payload.data.results);
  } else if (payload.match) {
    candidates.push(Array.isArray(payload.match) ? payload.match : [payload.match]);
  } else if (payload.data && payload.data.match) {
    candidates.push(Array.isArray(payload.data.match) ? payload.data.match : [payload.data.match]);
  }

  const matches = candidates[0] || [];

  return matches
    .filter(Boolean)
    .map((match, index) => {
      const teamInfo = normalizeTeams(match);
      const home = teamInfo.home;
      const away = teamInfo.away;
      const score = match.score || match.scorecard || match.liveScore || match.current_score || {};
      const fallbackName = `${extractTeamName(home)} vs ${extractTeamName(away)}`;
      const matchName =
        match.name ||
        match.title ||
        match.match_name ||
        match.series ||
        fallbackName ||
        `Match ${index + 1}`;

      return {
        id: match.id || match.match_id || match.matchId || `live-${index}`,
        name: matchName,
        status: match.status || match.matchStatus || match.state || 'Live',
        subtitle: match.subtitle || match.stage || match.description || match.score || '',
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
    const parts = rawTeams.split(/\s+vs\s+|\s+-\s+|\s+vs\s+/i).map((part) => part.trim()).filter(Boolean);
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

function extractTeamName(teamValue) {
  if (!teamValue) return 'Unknown';
  if (typeof teamValue === 'string') return teamValue;
  if (typeof teamValue === 'object') {
    return teamValue.name || teamValue.full_name || teamValue.short_name || teamValue.code || 'Unknown';
  }
  return String(teamValue);
}

function extractScore(scoreValue, side) {
  if (!scoreValue || typeof scoreValue !== 'object') return '';

  if (typeof scoreValue === 'string') return scoreValue;

  if (side === 'home') {
    return (
      scoreValue.home ||
      scoreValue.innings1 ||
      scoreValue.team1 ||
      scoreValue.score1 ||
      scoreValue.current?.home ||
      scoreValue.homeScore ||
      ''
    );
  }

  return (
    scoreValue.away ||
    scoreValue.innings2 ||
    scoreValue.team2 ||
    scoreValue.score2 ||
    scoreValue.current?.away ||
    scoreValue.awayScore ||
    ''
  );
}
