import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { api } from '../lib/api';
import { normalizeLiveMatches } from '../lib/liveScores.js';

const refreshEveryMs = 60_000;

function MatchDetails({ match, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('scorecard');

  useEffect(() => {
    let active = true;
    api.cricketMatch(match.id)
      .then((response) => { if (active) setDetail(response?.match || response); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Match details are unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  const innings = detail?.innings || [];
  const ballEvents = detail?.ballByBall || [];
  const batting = detail?.batting || [];
  const bowling = detail?.bowling || [];

  return (
    <div className="match-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="match-detail-modal" role="dialog" aria-modal="true" aria-labelledby="match-detail-title">
        <div className="match-detail-header">
          <div><span className="hero-kicker">{match.series || 'Match center'}</span><h2 id="match-detail-title">{match.name || `${match.homeTeam} vs ${match.awayTeam}`}</h2></div>
          <button type="button" className="detail-close" aria-label="Close match details" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="detail-scoreboard">
          <div><small>{match.homeTeam || 'Home'}</small><strong>{match.homeScore || '—'}</strong></div><span>VS</span><div><small>{match.awayTeam || 'Away'}</small><strong>{match.awayScore || '—'}</strong></div>
        </div>
        <div className="detail-tabs" role="tablist" aria-label="Match detail views">
          {['scorecard', 'commentary'].map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item === 'scorecard' ? 'Scorecard' : 'Ball-by-ball'}</button>)}
        </div>
        {loading ? <div className="empty">Loading match details…</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}
        {!loading && detail && tab === 'scorecard' ? <>
          <p className="detail-summary">{detail.summary || detail.subtitle || 'Scorecard summary'}</p>
          <div className="detail-innings">
            {innings.length ? innings.map((item, index) => <div className="innings-row" key={`${item.team}-${index}`}><span><b>Innings {index + 1}</b><small>{item.team || 'Team'}{item.overs ? ` · ${item.overs} overs` : ''}</small></span><strong>{item.runs || '—'}</strong></div>) : <div className="detail-unavailable">Detailed innings data is not provided by this feed.</div>}
          </div>
          {batting.length ? <div className="scorecard-section"><h3>Batting</h3><div className="scorecard-table"><div className="scorecard-table-head"><span>Batter</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></div>{batting.map((row, index) => <div className="scorecard-table-row" key={`${row.name}-${index}`}><span>{row.name}</span><span>{row.runs}</span><span>{row.balls}</span><span>{row.fours}</span><span>{row.sixes}</span><span>{row.strikeRate}</span></div>)}</div></div> : null}
          {bowling.length ? <div className="scorecard-section"><h3>Bowling</h3><div className="scorecard-table"><div className="scorecard-table-head"><span>Bowler</span><span>O</span><span>R</span><span>W</span><span>ECON</span><span /></div>{bowling.map((row, index) => <div className="scorecard-table-row" key={`${row.name}-${index}`}><span>{row.name}</span><span>{row.overs}</span><span>{row.runs}</span><span>{row.wickets}</span><span>{row.economy}</span><span /></div>)}</div></div> : null}
        </> : null}
        {!loading && detail && tab === 'commentary' ? <div className="commentary-list">
          {ballEvents.length ? ballEvents.map((event, index) => <article className="commentary-event" key={`${event.over}-${event.ball}-${index}`}><span className="commentary-over">{event.over}.{event.ball}</span><span className={`ball-chip ${event.runs === 4 || event.runs === 6 ? 'boundary' : ''}`}>{event.label ?? event.runs ?? '•'}</span><p>{event.commentary || event.description || `${event.batter || 'Batter'} — ${event.runs ?? 0} run${event.runs === 1 ? '' : 's'}${event.bowler ? `, bowled by ${event.bowler}` : ''}`}</p></article>) : <div className="detail-unavailable">Ball-by-ball commentary isn’t available for this match in the current data source.</div>}
        </div> : null}
        {detail?.venue ? <p className="detail-venue">{detail.venue}</p> : null}
      </section>
    </div>
  );
}

export default function LiveScores() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [historyMatches, setHistoryMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState(null);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else { setLoading(true); setHistoryLoading(true); }
    setError('');
    const [liveResult, historyResult] = await Promise.allSettled([api.liveCricket(), api.cricketMatches(0)]);
    if (liveResult.status === 'fulfilled') {
      const payload = liveResult.value;
      setLiveMatches(normalizeLiveMatches(payload));
      setSource(payload?.source || 'provider');
      setUpdatedAt(new Date());
    } else setError(liveResult.reason?.message || 'Live scores could not be loaded.');
    if (historyResult.status === 'fulfilled') {
      const payload = historyResult.value;
      const items = Array.isArray(payload?.matches) ? payload.matches : Array.isArray(payload) ? payload : [];
      setHistoryMatches(items);
      setHasMoreHistory(Boolean(payload?.hasMore) || (typeof payload?.total === 'number' && items.length < payload.total));
    } else setError((current) => current || historyResult.reason?.message || 'Match history could not be loaded.');
    setLoading(false);
    setHistoryLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load({ quiet: true }), refreshEveryMs);
    return () => window.clearInterval(timer);
  }, [load]);

  const loadMoreHistory = async () => {
    if (historyLoadingMore || !hasMoreHistory) return;
    setHistoryLoadingMore(true);
    try {
      const response = await api.cricketMatches(historyMatches.length);
      const items = Array.isArray(response?.matches) ? response.matches : [];
      setHistoryMatches((current) => [...current, ...items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setHasMoreHistory(Boolean(response?.hasMore) || (typeof response?.total === 'number' && historyMatches.length + items.length < response.total));
    } catch (requestError) { setError(requestError.message || 'Could not load more history.'); }
    finally { setHistoryLoadingMore(false); }
  };

  const allMatches = useMemo(() => [...liveMatches, ...historyMatches], [liveMatches, historyMatches]);
  const teams = useMemo(() => [...new Set(allMatches.flatMap((match) => [match.homeTeam, match.awayTeam]).filter(Boolean))].sort(), [allMatches]);
  const series = useMemo(() => [...new Set(allMatches.map((match) => match.series).filter(Boolean))].sort(), [allMatches]);
  const filterMatches = (items) => items.filter((match) => {
    const searchable = `${match.name || ''} ${match.homeTeam || ''} ${match.awayTeam || ''} ${match.series || ''} ${match.venue || ''}`.toLowerCase();
    return searchable.includes(query.toLowerCase().trim()) && (teamFilter === 'all' || match.homeTeam === teamFilter || match.awayTeam === teamFilter) && (seriesFilter === 'all' || match.series === seriesFilter);
  });
  const filteredLive = useMemo(() => filterMatches(liveMatches), [liveMatches, query, teamFilter, seriesFilter]);
  const filteredHistory = useMemo(() => filterMatches(historyMatches), [historyMatches, query, teamFilter, seriesFilter]);
  const demoMode = source === 'demo';

  return (
    <section className="section-grid">
      <div className="live-banner"><div><span className="hero-kicker">Match center</span><h2>Live score room</h2><p>Live match feed, scorecards, and recent results in one place.</p></div><button className="btn btn-primary" onClick={() => load({ quiet: true })} disabled={refreshing} aria-busy={refreshing}><Icon name="refresh" size={14} /> {refreshing ? 'Refreshing…' : 'Refresh feed'}</button></div>
      <div className="score-toolbar">
        <label className="score-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams, series, venue…" aria-label="Search matches" />{query ? <button onClick={() => setQuery('')} aria-label="Clear search">×</button> : null}</label>
        <label className="score-filter"><span>Team</span><select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><option value="all">All teams</option>{teams.map((team) => <option key={team}>{team}</option>)}</select></label>
        <label className="score-filter"><span>Series</span><select value={seriesFilter} onChange={(event) => setSeriesFilter(event.target.value)}><option value="all">All series</option>{series.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      <section className="card">
        <div className="card-header"><div><h2 className="card-title">Live matches <span className="count-pill">{filteredLive.length}</span></h2><p className="card-subtitle">Scores refresh automatically every minute</p></div><div className="feed-meta"><span className={`feed-indicator ${demoMode ? 'demo' : ''}`}>{demoMode ? 'Demo feed' : 'Feed connected'}</span>{updatedAt ? <small>Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small> : null}</div></div>
        {demoMode ? <p className="demo-notice">Sample scores are being shown because a live provider feed is not configured or available. They are not real-time results.</p> : null}
        {loading ? <div className="empty"><div className="empty-copy">Connecting to live feed…</div></div> : filteredLive.length ? <div className="live-grid">{filteredLive.map((match) => <article className="live-card" key={match.id}><div className="live-card-top"><span className="live-tag">{match.status || 'Live'}</span><span className="live-series">{match.series || 'Cricket'}</span></div><div className="live-match-name">{match.name || `${match.homeTeam} vs ${match.awayTeam}`}</div><div className="live-scoreline"><div><strong>{match.homeTeam || 'Home'}</strong><span>{match.homeScore || '—'}</span></div><span className="versus">vs</span><div><strong>{match.awayTeam || 'Away'}</strong><span>{match.awayScore || '—'}</span></div></div><div className="live-extra">{match.venue ? <span>{match.venue}</span> : null}{match.startTime ? <span>{match.startTime}</span> : null}</div>{match.subtitle ? <p className="live-summary">{match.subtitle}</p> : null}<button type="button" className="match-details-button" onClick={() => setSelectedMatch(match)}>View scorecard <Icon name="arrow" size={13} /></button></article>)}</div> : <div className="empty"><div className="empty-copy">{liveMatches.length ? 'No live matches match these filters.' : 'No live matches are available right now.'}</div></div>}
      </section>
      <section className="card">
        <div className="card-header"><div><h2 className="card-title">Match history <span className="count-pill">{filteredHistory.length}</span></h2><p className="card-subtitle">Completed results available from the current data source</p></div></div>
        {historyLoading ? <div className="empty"><div className="empty-copy">Loading recent history…</div></div> : filteredHistory.length ? <><div className="history-list">{filteredHistory.map((match) => <article className="history-row" key={match.id}><div className="history-teams"><span>{match.homeTeam || 'Home'}</span><span className="history-vs">vs</span><span>{match.awayTeam || 'Away'}</span></div><div className="history-score">{match.homeScore || '—'} <span>·</span> {match.awayScore || '—'}</div><div className="history-meta">{match.series || 'Series'}{match.venue ? ` · ${match.venue}` : ''}</div><span className="badge success">{match.status || 'Completed'}</span><button className="history-details" type="button" onClick={() => setSelectedMatch(match)}>Details</button></article>)}</div>{hasMoreHistory ? <div className="history-more"><button className="btn btn-soft" type="button" onClick={loadMoreHistory} disabled={historyLoadingMore}>{historyLoadingMore ? 'Loading…' : 'Load more matches'}</button></div> : null}</> : <div className="empty"><div className="empty-copy">{historyMatches.length ? 'No completed matches match these filters.' : 'No match history is available from the current source.'}</div></div>}
      </section>
      {selectedMatch ? <MatchDetails match={selectedMatch} onClose={() => setSelectedMatch(null)} /> : null}
    </section>
  );
}
