import React, { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

const RUN_OPTIONS = [0, 1, 2, 3, 4, 6];

function teamName(team) {
  return team?.teamName || team?.name || "Team";
}

function formatRate(value) {
  return Number(value || 0).toFixed(2);
}

export default function ScoringDesk() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [scorecard, setScorecard] = useState(null);
  const [oversLimit, setOversLimit] = useState("20");
  const [battingTeamId, setBattingTeamId] = useState("");
  const [delivery, setDelivery] = useState({
    strikerId: "",
    nonStrikerId: "",
    bowlerId: "",
    batterRuns: "0",
    extraType: "NONE",
    extrasRuns: "0",
    wicket: false,
    dismissalType: "bowled",
    dismissedPlayerId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadScorecard(matchId) {
    if (!matchId) return;
    try {
      const next = await api.scorecard(matchId);
      setScorecard(next);
      setError("");
      return next;
    } catch (err) {
      setError(err.message || "Unable to load the scorecard.");
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [matchData, playerData] = await Promise.all([api.matches(), api.players()]);
        if (!mounted) return;
        const nextMatches = Array.isArray(matchData) ? matchData : [];
        setMatches(nextMatches);
        setPlayers(Array.isArray(playerData) ? playerData : []);
        const candidate = nextMatches.find((item) => item.status === "LIVE")
          || nextMatches.find((item) => item.status !== "COMPLETED");
        if (candidate) {
          setSelectedMatchId(String(candidate.id));
          const next = await api.scorecard(candidate.id);
          if (mounted) setScorecard(next);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load scoring data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const selectedMatch = useMemo(
    () => matches.find((item) => String(item.id) === String(selectedMatchId)),
    [matches, selectedMatchId],
  );
  const innings = scorecard?.innings || [];
  const activeInnings = innings.find((item) => item.status === "IN_PROGRESS");
  const canStartFirst = innings.length === 0 && scorecard?.match?.status !== "COMPLETED";
  const canStartSecond = innings.length === 1
    && innings[0].status === "COMPLETED"
    && scorecard?.match?.status !== "COMPLETED";
  const canFinish = innings.length === 2
    && innings.every((item) => item.status === "COMPLETED")
    && scorecard?.match?.status !== "COMPLETED";

  const battingPlayers = useMemo(
    () => activeInnings ? players.filter((item) => item.team_id === activeInnings.batting_team_id) : [],
    [players, activeInnings],
  );
  const bowlingPlayers = useMemo(
    () => activeInnings ? players.filter((item) => item.team_id === activeInnings.bowling_team_id) : [],
    [players, activeInnings],
  );
  const dismissedIds = useMemo(
    () => new Set(activeInnings?.batting?.filter((item) => item.status === "out").map((item) => item.player_id) || []),
    [activeInnings],
  );
  const availableBatters = battingPlayers.filter((item) => !dismissedIds.has(item.id));

  useEffect(() => {
    if (!activeInnings) return;
    const allowed = new Set(availableBatters.map((item) => String(item.id)));
    const preferredStriker = activeInnings.current_striker_id
      && allowed.has(String(activeInnings.current_striker_id))
      ? String(activeInnings.current_striker_id)
      : allowed.has(delivery.strikerId) ? delivery.strikerId : (availableBatters[0] ? String(availableBatters[0].id) : "");
    const preferredNonStriker = activeInnings.current_non_striker_id
      && allowed.has(String(activeInnings.current_non_striker_id))
      ? String(activeInnings.current_non_striker_id)
      : allowed.has(delivery.nonStrikerId) && delivery.nonStrikerId !== preferredStriker
        ? delivery.nonStrikerId
        : (availableBatters.find((item) => String(item.id) !== preferredStriker)
          ? String(availableBatters.find((item) => String(item.id) !== preferredStriker).id)
          : "");
    const currentBowler = bowlingPlayers.some((item) => String(item.id) === delivery.bowlerId)
      ? delivery.bowlerId
      : (bowlingPlayers[0] ? String(bowlingPlayers[0].id) : "");
    setDelivery((current) => ({
      ...current,
      strikerId: preferredStriker,
      nonStrikerId: preferredNonStriker,
      bowlerId: currentBowler,
    }));
  }, [scorecard, players]);

  async function selectMatch(matchId) {
    setSelectedMatchId(String(matchId));
    setScorecard(null);
    setBattingTeamId("");
    setError("");
    setNotice("");
    await loadScorecard(matchId);
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const [matchData, playerData] = await Promise.all([api.matches(), api.players()]);
      setMatches(Array.isArray(matchData) ? matchData : []);
      setPlayers(Array.isArray(playerData) ? playerData : []);
      await loadScorecard(selectedMatchId);
    } catch (err) {
      setError(err.message || "Unable to refresh scoring data.");
    } finally {
      setLoading(false);
    }
  }

  async function startInnings(event) {
    event.preventDefault();
    if (!selectedMatchId || !scorecard?.match) return;
    const defaultBattingTeam = innings.length ? innings[0].bowling_team_id : scorecard.match.team1?.id;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const next = await api.startInnings(selectedMatchId, {
        batting_team_id: Number(battingTeamId || defaultBattingTeam),
        overs_limit: Number(oversLimit),
      });
      setScorecard(next);
      setNotice("Innings started. The scoring controls are ready.");
    } catch (err) {
      setError(err.message || "Unable to start the innings.");
    } finally {
      setSaving(false);
    }
  }

  async function submitDelivery(event) {
    event.preventDefault();
    if (!activeInnings) return;
    if (!delivery.strikerId || !delivery.nonStrikerId || !delivery.bowlerId) {
      setError("Select two batters and a bowler before recording the delivery.");
      return;
    }
    if (delivery.strikerId === delivery.nonStrikerId) {
      setError("Striker and non-striker must be different players.");
      return;
    }
    if (delivery.wicket && !delivery.dismissedPlayerId) {
      setError("Choose which batter was dismissed.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const next = await api.recordDelivery(activeInnings.id, {
        striker_id: Number(delivery.strikerId),
        non_striker_id: Number(delivery.nonStrikerId),
        bowler_id: Number(delivery.bowlerId),
        batter_runs: delivery.extraType === "WIDE" ? 0 : Number(delivery.batterRuns),
        extra_type: delivery.extraType,
        extras_runs: Number(delivery.extrasRuns),
        wicket: delivery.wicket,
        dismissal_type: delivery.wicket ? delivery.dismissalType : null,
        dismissed_player_id: delivery.wicket ? Number(delivery.dismissedPlayerId) : null,
      });
      setScorecard(next);
      setDelivery((current) => ({
        ...current,
        batterRuns: "0",
        extraType: "NONE",
        extrasRuns: "0",
        wicket: false,
        dismissedPlayerId: "",
      }));
      setNotice("Delivery saved to the official scorecard.");
    } catch (err) {
      setError(err.message || "Unable to record this delivery.");
    } finally {
      setSaving(false);
    }
  }

  async function undoLast() {
    if (!activeInnings) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const next = await api.undoLastDelivery(activeInnings.id);
      setScorecard(next);
      setNotice("The last delivery was removed and the score was recalculated.");
    } catch (err) {
      setError(err.message || "Unable to undo the last delivery.");
    } finally {
      setSaving(false);
    }
  }

  async function finishMatch() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.finishMatch(selectedMatchId);
      setMatches((current) => current.map((item) => item.id === result.id ? result : item));
      const next = await api.scorecard(selectedMatchId);
      setScorecard(next);
      setNotice("Match finalized. Tournament standings have been updated.");
    } catch (err) {
      setError(err.message || "Unable to finalize the match.");
    } finally {
      setSaving(false);
    }
  }

  const nextBattingTeam = innings.length ? innings[0].bowling_team_id : scorecard?.match?.team1?.id;
  const dismissalOptions = delivery.extraType === "NO_BALL"
    ? ["run_out", "obstructing_field"]
    : delivery.extraType === "WIDE"
      ? ["run_out", "stumped", "obstructing_field", "hit_wicket"]
      : ["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "obstructing_field"];

  return (
    <div className="section-grid scoring-page">
      <section className="live-banner score-banner">
        <div>
          <span className="hero-kicker">Tournament operations</span>
          <h2>Ball-by-ball scoring desk</h2>
          <p>Record every delivery, track the innings and publish a verified match result.</p>
        </div>
        <div className="score-banner-actions">
          <span className="live-indicator"><span /> Live scoring enabled</span>
          <button className="btn btn-soft" type="button" onClick={refreshAll} disabled={loading}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
        </div>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <section className="card">
        <div className="card-header">
          <div><h2 className="card-title">Select fixture</h2><p className="card-subtitle">Choose a scheduled or live match to manage its innings</p></div>
          <span className="badge badge-neutral">{matches.length} fixtures</span>
        </div>
        <div className="score-select-row">
          <select className="select" aria-label="Select match" value={selectedMatchId} onChange={(event) => selectMatch(event.target.value)}>
            <option value="">Select a fixture</option>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                Match #{match.id} · {teamName(match.team1)} vs {teamName(match.team2)} · {match.status}
              </option>
            ))}
          </select>
          {selectedMatch && <span className={"badge " + (selectedMatch.status === "COMPLETED" ? "badge-success" : selectedMatch.status === "LIVE" ? "badge-live" : "badge-warning")}>{selectedMatch.status}</span>}
        </div>
        {loading && <div className="empty"><div className="empty-copy">Loading fixtures and players…</div></div>}
        {!loading && matches.length === 0 && <div className="empty"><div className="empty-title">No fixtures available</div><div className="empty-copy">Create a match in Fixtures before opening the scoring desk.</div></div>}
      </section>

      {scorecard && (
        <>
          {innings.map((item) => (
            <section className="card scorecard-panel" key={item.id}>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Innings {item.innings_number} · {teamName(item.batting_team)}</h2>
                  <p className="card-subtitle">{teamName(item.bowling_team)} bowling · {item.overs_limit} overs</p>
                </div>
                <span className={"badge " + (item.status === "COMPLETED" ? "badge-success" : "badge-live")}>{item.status === "COMPLETED" ? "Innings complete" : "In progress"}</span>
              </div>
              <div className="score-metrics">
                <div><small>Score</small><strong>{item.total_runs}/{item.wickets}</strong></div>
                <div><small>Overs</small><strong>{item.overs}</strong></div>
                <div><small>Run rate</small><strong>{formatRate(item.run_rate)}</strong></div>
                <div><small>Extras</small><strong>{item.extras}</strong></div>
                {item.target !== null && <div><small>Target</small><strong>{item.target}</strong></div>}
                {item.runs_required !== null && <div><small>Required</small><strong>{item.runs_required} off {item.balls_remaining}</strong></div>}
              </div>

              <div className="scorecard-tables">
                <div>
                  <h3>Batting</h3>
                  <div className="table-wrap">
                    <table className="data-table score-table">
                      <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr></thead>
                      <tbody>
                        {item.batting.filter((row) => row.status !== "yet to bat").map((row) => (
                          <tr key={row.player_id}>
                            <td><strong>{row.name}</strong><small>{row.dismissal || row.status}</small></td>
                            <td>{row.runs}</td><td>{row.balls_faced}</td><td>{row.fours}</td><td>{row.sixes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3>Bowling</h3>
                  <div className="table-wrap">
                    <table className="data-table score-table">
                      <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th></tr></thead>
                      <tbody>
                        {item.bowling.filter((row) => row.legal_balls > 0 || row.runs_conceded > 0).map((row) => (
                          <tr key={row.player_id}><td><strong>{row.name}</strong></td><td>{row.overs}</td><td>{row.runs_conceded}</td><td>{row.wickets}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="delivery-strip">
                <div className="delivery-strip-title">Recent deliveries</div>
                {item.deliveries.length === 0 ? <span className="muted-copy">No balls recorded yet.</span> : (
                  <div className="delivery-list">
                    {item.deliveries.map((ball) => (
                      <span className={"delivery-chip " + (ball.wicket ? "wicket" : "")} key={ball.id} title={ball.bowler + " to " + ball.striker}>
                        <small>{ball.label}</small><strong>{ball.summary}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}

          {(canStartFirst || canStartSecond) && (
            <section className="card">
              <div className="card-header"><div><h2 className="card-title">{canStartFirst ? "Start first innings" : "Start second innings"}</h2><p className="card-subtitle">Set the batting side and over limit</p></div></div>
              <form className="score-start-form" onSubmit={startInnings}>
                <div className="field">
                  <label htmlFor="innings-team">Batting team</label>
                  <select className="select" id="innings-team" value={battingTeamId || String(nextBattingTeam || "")} onChange={(event) => setBattingTeamId(event.target.value)} required disabled={canStartSecond}>
                    {scorecard.match.team1 && <option value={scorecard.match.team1.id}>{teamName(scorecard.match.team1)}</option>}
                    {scorecard.match.team2 && <option value={scorecard.match.team2.id}>{teamName(scorecard.match.team2)}</option>}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="overs-limit">Overs per innings</label>
                  <select className="select" id="overs-limit" value={oversLimit} onChange={(event) => setOversLimit(event.target.value)}>
                    {[1, 2, 5, 10, 20, 50].map((value) => <option key={value} value={value}>{value} overs</option>)}
                  </select>
                </div>
                <button className="btn btn-dark" disabled={saving}>{saving ? "Starting…" : "Start innings"}</button>
              </form>
            </section>
          )}

          {activeInnings && (
            <section className="card">
              <div className="card-header">
                <div><h2 className="card-title">Record next delivery</h2><p className="card-subtitle">{teamName(activeInnings.batting_team)} batting · {teamName(activeInnings.bowling_team)} bowling</p></div>
                <span className="badge badge-live">Live scorer</span>
              </div>
              <form className="delivery-form" onSubmit={submitDelivery}>
                <div className="delivery-player-grid">
                  <div className="field">
                    <label htmlFor="striker">Striker</label>
                    <select className="select" id="striker" value={delivery.strikerId} onChange={(event) => setDelivery({ ...delivery, strikerId: event.target.value })} required>
                      <option value="">Choose batter</option>
                      {availableBatters.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="non-striker">Non-striker</label>
                    <select className="select" id="non-striker" value={delivery.nonStrikerId} onChange={(event) => setDelivery({ ...delivery, nonStrikerId: event.target.value })} required>
                      <option value="">Choose batter</option>
                      {availableBatters.filter((player) => String(player.id) !== delivery.strikerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="bowler">Bowler</label>
                    <select className="select" id="bowler" value={delivery.bowlerId} onChange={(event) => setDelivery({ ...delivery, bowlerId: event.target.value })} required>
                      <option value="">Choose bowler</option>
                      {bowlingPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="delivery-input-grid">
                  <div className="field">
                    <label htmlFor="batter-runs">Batter runs</label>
                    <select className="select" id="batter-runs" value={delivery.batterRuns} disabled={delivery.extraType === "WIDE"} onChange={(event) => setDelivery({ ...delivery, batterRuns: event.target.value })}>
                      {RUN_OPTIONS.map((run) => <option key={run} value={run}>{run} runs</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="extra-type">Extras</label>
                    <select className="select" id="extra-type" value={delivery.extraType} onChange={(event) => setDelivery({ ...delivery, extraType: event.target.value, batterRuns: event.target.value === "WIDE" ? "0" : delivery.batterRuns, extrasRuns: "0", dismissalType: event.target.value === "NO_BALL" ? "run_out" : event.target.value === "WIDE" ? "stumped" : "bowled" })}>
                      <option value="NONE">No extras</option><option value="WIDE">Wide (+1 penalty)</option><option value="NO_BALL">No-ball (+1 penalty)</option><option value="BYE">Bye</option><option value="LEG_BYE">Leg-bye</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="extras-runs">Extra runs</label>
                    <input className="input" id="extras-runs" type="number" min={delivery.extraType === "BYE" || delivery.extraType === "LEG_BYE" ? 1 : 0} max="6" value={delivery.extrasRuns} onChange={(event) => setDelivery({ ...delivery, extrasRuns: event.target.value })} />
                  </div>
                </div>

                <label className="wicket-toggle">
                  <input type="checkbox" checked={delivery.wicket} onChange={(event) => setDelivery({ ...delivery, wicket: event.target.checked, dismissedPlayerId: "" })} />
                  <span>Wicket on this delivery</span>
                </label>
                {delivery.wicket && (
                  <div className="delivery-input-grid">
                    <div className="field">
                      <label htmlFor="dismissal-type">Dismissal type</label>
                      <select className="select" id="dismissal-type" value={delivery.dismissalType} onChange={(event) => setDelivery({ ...delivery, dismissalType: event.target.value })}>
                        {dismissalOptions.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="dismissed-player">Dismissed batter</label>
                      <select className="select" id="dismissed-player" value={delivery.dismissedPlayerId} onChange={(event) => setDelivery({ ...delivery, dismissedPlayerId: event.target.value })} required>
                        <option value="">Choose dismissed batter</option>
                        {[
                          battingPlayers.find((player) => String(player.id) === delivery.strikerId),
                          battingPlayers.find((player) => String(player.id) === delivery.nonStrikerId),
                        ].filter(Boolean).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <div className="delivery-form-actions">
                  <button className="btn btn-dark" disabled={saving || availableBatters.length < 2 || bowlingPlayers.length < 1}>{saving ? "Saving…" : "Record delivery"}</button>
                  <button className="btn btn-soft" type="button" onClick={undoLast} disabled={saving || activeInnings.deliveries.length === 0}>
                    <Icon name="undo-2" size={13} /> Undo last delivery
                  </button>
                </div>
              </form>
            </section>
          )}

          {canFinish && (
            <section className="card finish-card">
              <div><h2 className="card-title">Both innings are complete</h2><p className="card-subtitle">Finalize the result to update wins, losses and tournament points.</p></div>
              <button className="btn btn-dark" type="button" onClick={finishMatch} disabled={saving}>{saving ? "Finalizing…" : "Finalize match result"}</button>
            </section>
          )}
        </>
      )}

      {!scorecard && selectedMatchId && !loading && (
        <section className="card empty"><div className="empty-title">Scorecard not loaded</div><div className="empty-copy">Refresh the fixture or select it again.</div></section>
      )}
    </div>
  );
}
