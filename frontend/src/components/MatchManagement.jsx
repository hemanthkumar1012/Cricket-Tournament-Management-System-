import React, { useState, useEffect } from 'react';

export default function MatchManagement() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Score update modal/state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err.message || 'Error fetching matches');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err.message || 'Error fetching teams');
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!team1Id || !team2Id) {
      setError('Please select both teams');
      return;
    }
    if (team1Id === team2Id) {
      setError('A team cannot play against itself');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: { id: parseInt(team1Id) },
          team2: { id: parseInt(team2Id) }
        })
      });

      if (!response.ok) throw new Error('Failed to schedule match');

      const newMatch = await response.json();
      setMatches([newMatch, ...matches]);
      setTeam1Id('');
      setTeam2Id('');
      setSuccess('Match scheduled successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error scheduling match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (team1Score === '' || team2Score === '') {
      setError('Please enter scores for both teams');
      return;
    }
    setSubmittingScore(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${selectedMatch.id}/result?team1Score=${team1Score}&team2Score=${team2Score}`, {
        method: 'PUT'
      });

      if (!response.ok) throw new Error('Failed to update scores');

      const updatedMatch = await response.json();
      setMatches(matches.map(m => m.id === updatedMatch.id ? updatedMatch : m));
      setSelectedMatch(null);
      setTeam1Score('');
      setTeam2Score('');
      setSuccess('Match result updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating result');
    } finally {
      setSubmittingScore(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Create Match Form */}
        <div className="w-full md:w-5/12 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <span>⚔️</span>
            <span>Schedule Match</span>
          </h2>

          <form onSubmit={handleCreateMatch} className="space-y-5">
            <div>
              <label htmlFor="team1" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Team 1 (Home)
              </label>
              <select
                id="team1"
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors text-sm"
              >
                <option value="">Select Team 1</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.teamName}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="team2" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Team 2 (Away)
              </label>
              <select
                id="team2"
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors text-sm"
              >
                <option value="">Select Team 2</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.teamName}</option>
                ))}
              </select>
            </div>

            {error && !selectedMatch && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                ⚠️ {error}
              </div>
            )}

            {success && !selectedMatch && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-teal-500/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Match'}
            </button>
          </form>
        </div>

        {/* Matches List */}
        <div className="w-full md:w-7/12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📅</span>
              <span>Fixtures & Results</span>
            </span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-semibold">
              {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
            </span>
          </h2>

          {matches.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="text-4xl mb-3">⚔️</span>
              <p className="text-sm">No matches scheduled yet.</p>
              <p className="text-xs text-slate-600 mt-1">Select teams on the left to create a fixture.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {matches.map((match) => (
                <div 
                  key={match.id}
                  className="bg-slate-900/90 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700/60 transition-all duration-300 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Match #{match.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      match.status === 'COMPLETED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {match.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    {/* Team 1 info */}
                    <div className="w-5/12 text-left">
                      <h4 className="text-sm font-bold text-white truncate">{match.team1.teamName}</h4>
                      {match.status === 'COMPLETED' && (
                        <p className="text-lg font-extrabold text-teal-400 mt-1">{match.team1Score}</p>
                      )}
                    </div>

                    {/* VS divider */}
                    <div className="w-2/12 text-center text-xs font-bold text-slate-600">VS</div>

                    {/* Team 2 info */}
                    <div className="w-5/12 text-right">
                      <h4 className="text-sm font-bold text-white truncate">{match.team2.teamName}</h4>
                      {match.status === 'COMPLETED' && (
                        <p className="text-lg font-extrabold text-teal-400 mt-1">{match.team2Score}</p>
                      )}
                    </div>
                  </div>

                  {match.status === 'COMPLETED' && (
                    <div className="mt-3 pt-3 border-t border-slate-800/40 text-center text-xs text-slate-400 font-medium">
                      🎉 Winner: <span className="text-emerald-400 font-bold">{match.winner ? match.winner.teamName : 'Draw'}</span>
                    </div>
                  )}

                  {match.status === 'SCHEDULED' && (
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => setSelectedMatch(match)}
                        className="bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-700/60"
                      >
                        Enter Score
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score Entry Dialog */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6">Enter Match Scores</h3>
            <p className="text-xs text-slate-400 mb-6">
              Record final scores for: <br/>
              <span className="text-slate-200 font-bold">{selectedMatch.team1.teamName}</span> vs <span className="text-slate-200 font-bold">{selectedMatch.team2.teamName}</span>
            </p>

            <form onSubmit={handleUpdateScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {selectedMatch.team1.teamName} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    placeholder="Runs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {selectedMatch.team2.teamName} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    placeholder="Runs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setSelectedMatch(null); setError(''); }}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="w-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-teal-500/10 text-xs disabled:opacity-50"
                >
                  {submittingScore ? 'Updating...' : 'Save Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
