import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { api } from '../lib/api';
import { normalizeLiveMatches } from '../lib/liveScores.js';

export default function LiveScores() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [historyMatches, setHistoryMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setHistoryLoading(true);
    setError('');
    try {
      const [liveData, historyData] = await Promise.all([
        api.liveCricket(),
        api.cricketMatches(0),
      ]);

      const normalizedLive = normalizeLiveMatches(liveData);
      setLiveMatches(normalizedLive);

      const history = Array.isArray(historyData?.matches)
        ? historyData.matches
        : Array.isArray(historyData)
          ? historyData
          : [];
      setHistoryMatches(history);
    } catch (err) {
      setError(err.message || 'Unable to load live scores');
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const detailCards = useMemo(() => {
    return liveMatches.length ? liveMatches : [
      { id: 'demo-live', name: 'India vs Australia', status: 'Live', homeTeam: 'India', awayTeam: 'Australia', homeScore: '173/7', awayScore: '179/8', venue: 'Wankhede Stadium, Mumbai' },
    ];
  }, [liveMatches]);

  return (
    <section className="section-grid">
      <div className="live-banner">
        <div>
          <span className="hero-kicker">Match center</span>
          <h2>Live score room</h2>
          <p>Live cricket scores, recent fixtures, and match narrative in one place.</p>
        </div>
        <button className="btn btn-primary" onClick={load}>
          <Icon name="refresh" size={14} /> Refresh feed
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Live matches</h2>
            <p className="card-subtitle">Current action from the cricket feed</p>
          </div>
        </div>
        {loading ? (
          <div className="empty"><div className="empty-copy">Connecting to live feed…</div></div>
        ) : (
          <div className="live-grid">
            {detailCards.map((match) => (
              <article className="live-card" key={match.id}>
                <div className="live-card-top">
                  <span className="live-tag">{match.status || 'Live'}</span>
                  <span className="live-series">{match.series || 'Match center'}</span>
                </div>
                <div className="live-match-name">{match.name}</div>
                <div className="live-scoreline">
                  <div>
                    <strong>{match.homeTeam}</strong>
                    <span>{match.homeScore || '—'}</span>
                  </div>
                  <span className="versus">vs</span>
                  <div>
                    <strong>{match.awayTeam}</strong>
                    <span>{match.awayScore || '—'}</span>
                  </div>
                </div>
                <div className="live-extra">
                  {match.venue ? <span>{match.venue}</span> : null}
                  {match.startTime ? <span>{match.startTime}</span> : null}
                </div>
                {match.subtitle ? <p className="live-summary">{match.subtitle}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent match history</h2>
            <p className="card-subtitle">Latest completed fixtures and results</p>
          </div>
        </div>
        {historyLoading ? (
          <div className="empty"><div className="empty-copy">Loading recent history…</div></div>
        ) : (
          <div className="history-list">
            {historyMatches.length ? historyMatches.map((match) => (
              <div className="history-row" key={match.id}>
                <div className="history-teams">
                  <span>{match.homeTeam}</span>
                  <span className="history-vs">vs</span>
                  <span>{match.awayTeam}</span>
                </div>
                <div className="history-score">{match.homeScore || '—'} · {match.awayScore || '—'}</div>
                <div className="history-meta">{match.series || 'Series'} · {match.venue || 'Venue TBD'}</div>
                <span className={`badge ${match.status === 'Completed' ? 'success' : 'neutral'}`}>{match.status || 'Completed'}</span>
              </div>
            )) : <div className="empty"><div className="empty-copy">No recent history is available right now.</div></div>}
          </div>
        )}
      </section>
    </section>
  );
}
