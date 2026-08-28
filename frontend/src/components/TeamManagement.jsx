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
      setTeams(data);
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
        body: JSON.stringify({ teamName, captain })
      });

      if (!response.ok) throw new Error('Failed to add team');

      const newTeam = await response.json();
      setTeams([...teams, newTeam]);
      setTeamName('');
      setCaptain('');
      setSuccess(`Team "${newTeam.teamName}" added successfully!`);
      
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
        
        {/* Add Team Form */}
        <div className="w-full md:w-5/12 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <span>🛡️</span>
            <span>Register New Team</span>
          </h2>

          <form onSubmit={handleAddTeam} className="space-y-5">
            <div>
              <label htmlFor="teamName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mumbai Gladiators"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="captain" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Captain Name
              </label>
              <input
                id="captain"
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                placeholder="e.g. Rohit Sharma"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-teal-500/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Add Team'}
            </button>
          </form>
        </div>

        {/* Registered Teams List */}
        <div className="w-full md:w-7/12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📋</span>
              <span>Registered Teams</span>
            </span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-semibold">
              {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
            </span>
          </h2>

          {teams.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="text-4xl mb-3">🏟️</span>
              <p className="text-sm">No teams registered yet.</p>
              <p className="text-xs text-slate-600 mt-1">Use the registration form to add the first team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
              {teams.map((team) => (
                <div 
                  key={team.id}
                  className="bg-slate-900/90 border border-slate-800/60 rounded-xl p-4 flex items-center space-x-4 hover:border-slate-700/60 transition-all duration-300 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 text-sm">
                    {team.teamName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{team.teamName}</h3>
                    <p className="text-xs text-slate-400 truncate">Captain: {team.captain}</p>
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
