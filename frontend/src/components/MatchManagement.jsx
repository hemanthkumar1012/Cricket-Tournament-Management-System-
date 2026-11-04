import React, { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

function formatScheduledAt(value) {
  if (!value) return "Time not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function MatchManagement() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selected, setSelected] = useState(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const results = await Promise.all([api.matches(), api.teams()]);
      setMatches(Array.isArray(results[0]) ? results[0] : []);
      setTeams(Array.isArray(results[1]) ? results[1] : []);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to load fixtures" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const schedule = async (event) => {
    event.preventDefault();
    if (!team1Id || !team2Id) return setMessage({ type: "error", text: "Select both teams." });
    if (team1Id === team2Id) return setMessage({ type: "error", text: "A team cannot play itself." });
    if (!scheduledAt) return setMessage({ type: "error", text: "Select a match date and time." });

    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const created = await api.createMatch({
        team1_id: Number(team1Id),
        team2_id: Number(team2Id),
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      setMatches((current) => [created, ...current]);
      setTeam1Id("");
      setTeam2Id("");
      setScheduledAt("");
      setMessage({ type: "success", text: "Fixture scheduled." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to schedule fixture" });
    } finally {
      setSaving(false);
    }
  };

  const saveResult = async (event) => {
    event.preventDefault();
    if (score1 === "" || score2 === "") return setMessage({ type: "error", text: "Enter both final scores." });
    setSaving(true);
    try {
      const updated = await api.updateResult(selected.id, score1, score2);
      setMatches((current) => current.map((match) => match.id === updated.id ? updated : match));
      setSelected(null);
      setScore1("");
      setScore2("");
      setMessage({ type: "success", text: "Match result saved. Points table updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to save result" });
    } finally {
      setSaving(false);
    }
  };

  const visible = useMemo(
    () => matches.filter((match) => filter === "ALL" || (filter === "OPEN" ? match.status !== "COMPLETED" : match.status === "COMPLETED")),
    [matches, filter],
  );

  return (
    <div className="section-grid">
      <div className="card">
        <div className="card-header">
          <div><h2 className="card-title">Fixture builder</h2><p className="card-subtitle">Create the next tournament matchup</p></div>
          <span className="badge badge-neutral">{matches.length} total</span>
        </div>
        <form className="form-card" onSubmit={schedule}>
          <div className="fixture-form">
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor="home-team">Home team</label>
              <select className="select" id="home-team" value={team1Id} onChange={(event) => setTeam1Id(event.target.value)} required>
                <option value="">Select team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.teamName || team.name}</option>)}
              </select>
            </div>
            <div className="fixture-vs">VS</div>
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor="away-team">Away team</label>
              <select className="select" id="away-team" value={team2Id} onChange={(event) => setTeam2Id(event.target.value)} required>
                <option value="">Select team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.teamName || team.name}</option>)}
              </select>
            </div>
            <div className="field fixture-date-field" style={{ marginTop: 0 }}>
              <label htmlFor="match-date">Match date &amp; time</label>
              <input className="input" id="match-date" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required />
            </div>
            <button className="btn btn-dark" disabled={saving || teams.length < 2}>
              <Icon name="plus" size={13} /> Schedule match
            </button>
          </div>
          {message.text && <div className={"alert " + (message.type === "error" ? "alert-error" : "alert-success")} role="status">{message.text}</div>}
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <div><h2 className="card-title">Fixtures &amp; results</h2><p className="card-subtitle">Every scheduled match and recorded result</p></div>
          <div className="filter-tabs">
            {[["ALL", "All"], ["OPEN", "Open"], ["COMPLETED", "Results"]].map(([value, label]) => (
              <button type="button" key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>
            ))}
            <button type="button" className="refresh-btn" onClick={load} aria-label="Refresh fixtures"><Icon name="refresh" size={13} /></button>
          </div>
        </div>
        {loading ? (
          <div className="empty"><div className="empty-copy">Loading fixtures…</div></div>
        ) : visible.length === 0 ? (
          <div className="empty"><div className="empty-icon"><Icon name="calendar" /></div><div className="empty-title">No matches in this view</div><div className="empty-copy">Adjust the filter or create a new fixture above.</div></div>
        ) : visible.map((match) => (
          <div className="match-row" key={match.id}>
            <div className="match-meta">
              <span>Match #{match.id} · {formatScheduledAt(match.scheduled_at)}</span>
              <span className={"badge " + (match.status === "COMPLETED" ? "badge-success" : "badge-warning")}>{match.status || "SCHEDULED"}</span>
            </div>
            <div className="match-teams">
              <div className="team-side"><div className="team-name">{match.team1?.teamName || "Team 1"}</div><div className="team-score">{match.status === "COMPLETED" ? match.team1Score : "—"}</div></div>
              <div className="vs">VS</div>
              <div className="team-side"><div className="team-name">{match.team2?.teamName || "Team 2"}</div><div className="team-score">{match.status === "COMPLETED" ? match.team2Score : "—"}</div></div>
            </div>
            {match.status === "COMPLETED" ? (
              <div className="result-note">Result · <strong>{match.winner?.teamName || "Match tied"}</strong></div>
            ) : match.status === "LIVE" ? (
              <div className="result-note">Ball-by-ball scoring is active · use the Scoring desk to continue.</div>
            ) : (
              <button type="button" className="btn btn-soft" style={{ marginTop: 12 }} onClick={() => setSelected(match)}>
                Enter final score <Icon name="arrow" size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="score-title">
            <div className="card-header" style={{ padding: "0 0 14px" }}>
              <div><h2 id="score-title" className="card-title">Record final score</h2><p className="card-subtitle">{selected.team1?.teamName} vs {selected.team2?.teamName}</p></div>
              <button type="button" className="btn btn-soft" onClick={() => setSelected(null)} aria-label="Close"><Icon name="close" size={14} /></button>
            </div>
            <form onSubmit={saveResult}>
              <div className="field"><label htmlFor="team1-score">{selected.team1?.teamName} score</label><input className="input" id="team1-score" type="number" min="0" step="1" value={score1} onChange={(event) => setScore1(event.target.value)} required /></div>
              <div className="field"><label htmlFor="team2-score">{selected.team2?.teamName} score</label><input className="input" id="team2-score" type="number" min="0" step="1" value={score2} onChange={(event) => setScore2(event.target.value)} required /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-soft" onClick={() => setSelected(null)}>Cancel</button>
                <button className="btn btn-dark" disabled={saving}>{saving ? "Saving…" : "Publish result"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
