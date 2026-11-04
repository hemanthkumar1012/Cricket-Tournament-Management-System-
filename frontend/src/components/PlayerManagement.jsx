import React, { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

const ROLES = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];

export default function PlayerManagement() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Batter");
  const [teamId, setTeamId] = useState("");
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [playerData, teamData] = await Promise.all([api.players(), api.teams()]);
      setPlayers(Array.isArray(playerData) ? playerData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
    } catch (err) {
      setError(err.message || "Unable to load the player roster.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addPlayer(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const created = await api.createPlayer({
        name: name.trim(),
        role,
        team_id: teamId ? Number(teamId) : null,
      });
      setPlayers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setRole("Batter");
      setTeamId("");
      setNotice("Player added to the roster.");
    } catch (err) {
      setError(err.message || "Unable to add player.");
    } finally {
      setSaving(false);
    }
  }

  async function changeTeam(player, nextTeamId) {
    setError("");
    try {
      const updated = await api.updatePlayer(player.id, {
        team_id: nextTeamId ? Number(nextTeamId) : null,
      });
      setPlayers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${player.name}'s team assignment was updated.`);
    } catch (err) {
      setError(err.message || "Unable to update player assignment.");
    }
  }

  async function removePlayer(player) {
    if (confirmingId !== player.id) {
      setConfirmingId(player.id);
      return;
    }
    setError("");
    try {
      await api.deletePlayer(player.id);
      setPlayers((current) => current.filter((item) => item.id !== player.id));
      setConfirmingId(null);
      setNotice(`${player.name} was removed from the roster.`);
    } catch (err) {
      setError(err.message || "Unable to remove player.");
      setConfirmingId(null);
    }
  }

  const visiblePlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players.filter((player) => {
      const teamName = player.team?.teamName || "";
      return !query || player.name.toLowerCase().includes(query) ||
        player.role.toLowerCase().includes(query) || teamName.toLowerCase().includes(query);
    });
  }, [players, search]);

  return (
    <div className="form-layout">
      <section className="card form-card">
        <div className="form-kicker"><span className="stat-icon"><Icon name="users" size={16} /></span><span>Player registration</span></div>
        <h2 className="form-title" style={{ marginTop: 14 }}>Add a player</h2>
        <p className="form-copy">Build each team's playing roster and keep player roles and team assignments up to date.</p>
        <form onSubmit={addPlayer}>
          <div className="field">
            <label htmlFor="player-name">Player name</label>
            <input className="input" id="player-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} placeholder="e.g. Rahul Sharma" required />
          </div>
          <div className="field">
            <label htmlFor="player-role">Playing role</label>
            <select className="select" id="player-role" value={role} onChange={(event) => setRole(event.target.value)}>
              {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="player-team">Team</label>
            <select className="select" id="player-team" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
              <option value="">Unassigned</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.teamName || team.name}</option>)}
            </select>
          </div>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          <button className="btn btn-dark btn-full" style={{ marginTop: 14 }} disabled={saving}>
            {saving ? "Adding player…" : "Add player"} <Icon name="arrow" size={13} />
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <div><h2 className="card-title">Playing roster</h2><p className="card-subtitle">Assign players to teams and manage registrations</p></div>
          <span className="badge badge-neutral">{players.length} players</span>
        </div>
        <div className="player-toolbar">
          <input className="input" aria-label="Search players" placeholder="Search player, role or team…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="button" className="btn btn-soft" onClick={load} disabled={loading}><Icon name="refresh" size={13} /> Refresh</button>
        </div>
        {error && <div style={{ padding: "0 20px" }}><div className="alert alert-error" role="alert">{error}</div></div>}
        {loading ? (
          <div className="empty"><div className="empty-copy">Loading player roster…</div></div>
        ) : visiblePlayers.length === 0 ? (
          <div className="empty"><div className="empty-icon"><Icon name="users" /></div><div className="empty-title">{players.length ? "No matching players" : "No players registered"}</div><div className="empty-copy">Add the first player using the registration form.</div></div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Player</th><th>Role</th><th>Team assignment</th><th>Action</th></tr></thead>
              <tbody>
                {visiblePlayers.map((player) => (
                  <tr key={player.id}>
                    <td><strong>{player.name}</strong></td>
                    <td>{player.role}</td>
                    <td>
                      <select className="select player-team-select" aria-label={`Team for ${player.name}`} value={player.team_id || ""} onChange={(event) => changeTeam(player, event.target.value)}>
                        <option value="">Unassigned</option>
                        {teams.map((team) => <option key={team.id} value={team.id}>{team.teamName || team.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <button type="button" className="btn btn-soft" onClick={() => removePlayer(player)} aria-label={confirmingId === player.id ? `Confirm removal of ${player.name}` : `Remove ${player.name}`}>
                        <Icon name="close" size={13} /> {confirmingId === player.id ? "Confirm?" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
