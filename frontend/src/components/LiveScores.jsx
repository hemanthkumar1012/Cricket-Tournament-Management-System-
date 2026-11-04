import React, { useEffect, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";
import { normalizeLiveMatches } from "../lib/liveScores.js";

export default function LiveScores() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setMatches(normalizeLiveMatches(await api.live()));
    } catch (err) {
      setError(err.message || "Unable to load live scores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load({ silent: true }), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="section-grid">
      <div className="live-banner">
        <div>
          <span className="hero-kicker">Match center</span>
          <h2>Live score room</h2>
          <p>Live scores refresh automatically every 60 seconds.</p>
        </div>
        <div className="live-indicator"><span /> {matches.length ? "Feed connected" : "No active matches"}</div>
      </div>
      <section className="card">
        <div className="card-header">
          <div><h2 className="card-title">Live matches</h2><p className="card-subtitle">Latest available score feed</p></div>
          <button className="btn btn-soft" type="button" onClick={() => load({ silent: true })} disabled={refreshing}>
            <Icon name="refresh" size={13} /> {refreshing ? "Refreshing…" : "Refresh feed"}
          </button>
        </div>
        {error && <div style={{ padding: "0 20px" }}><div className="alert alert-error" role="alert">{error}</div></div>}
        {loading ? (
          <div className="empty"><div className="empty-copy">Connecting to live feed…</div></div>
        ) : matches.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="activity" /></div>
            <div className="empty-title">No live matches right now</div>
            <div className="empty-copy">The feed is empty or unavailable. It will be checked again automatically.</div>
          </div>
        ) : (
          <div className="live-grid">
            {matches.map((match, index) => (
              <article className="live-card" key={(match.id || "live") + "-" + index}>
                <div className="live-top">
                  <span className="badge badge-live">{match.status || "Live"}</span>
                  <span className="card-subtitle">{match.series || "Cricket feed"}</span>
                </div>
                <div className="team-name" style={{ marginTop: 14 }}>{match.name}</div>
                <div className="live-score">
                  <div className="live-team"><span>{match.homeTeam}</span><strong>{match.homeScore || "—"}</strong></div>
                  <div className="live-team"><span>{match.awayTeam}</span><strong>{match.awayScore || "—"}</strong></div>
                </div>
                {match.venue && <div className="result-note">{match.venue}</div>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
