import React, { useState, useEffect } from 'react';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch teams on mount
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      const formatted = (Array.isArray(data) ? data : []).map((team) => ({
        ...team,
        teamName: team.teamName || team.name || 'Unknown Team',
        captain: team.captain || 'TBD',
      }));
      setTeams(formatted);
    } catch (err) {
      setError(err.message || 'Error fetching teams');
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !captain.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, teamName, captain })
      });

      if (!response.ok) throw new Error('Failed to add team');

      const newTeam = await response.json();
      const normalizedTeam = {
        ...newTeam,
        teamName: newTeam.teamName || newTeam.name || teamName,
        captain: newTeam.captain || captain,
      };
      setTeams([...teams, normalizedTeam]);
      setTeamName('');
      setCaptain('');
      setSuccess(`Team "${normalizedTeam.teamName}" added successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error adding team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-5/12 bg-white border border-neutral-200 rounded-[26px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.26em] text-neutral-500">Team management</p>
            <h2 className="mt-2 text-xl font-black text-neutral-950 flex items-center space-x-2">
              <span>🛡️</span>
              <span>Register New Team</span>
            </h2>
          </div>

          <form onSubmit={handleAddTeam} className="space-y-5">
            <div>
              <label htmlFor="teamName" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mumbai Gladiators"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:border-neutral-900 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="captain" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                Captain Name
              </label>
              <input
                id="captain"
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                placeholder="e.g. Rohit Sharma"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:border-neutral-900 transition-colors text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-black/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Add Team'}
            </button>
          </form>
        </div>

        <div className="w-full md:w-7/12 bg-white border border-neutral-200 rounded-[26px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.05)] flex flex-col">
          <h2 className="text-xl font-black text-neutral-950 mb-6 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📋</span>
              <span>Registered Teams</span>
            </span>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full font-semibold">
              {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
            </span>
          </h2>

          {teams.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-neutral-500">
              <span className="text-4xl mb-3">🏟️</span>
              <p className="text-sm text-neutral-700">No teams registered yet.</p>
              <p className="text-xs text-neutral-500 mt-1">Use the registration form to add the first team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
              {teams.map((team) => (
                <div 
                  key={team.id}
                  className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-2xl p-4 flex items-center space-x-4 hover:border-neutral-300 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
                >
                  <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-lg shadow-black/10">
                    {team.teamName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-neutral-900 truncate">{team.teamName}</h3>
                    <p className="text-xs text-neutral-500 truncate">Captain: {team.captain}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
