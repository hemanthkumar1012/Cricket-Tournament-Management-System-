import React, { useState, useEffect } from 'react';

export default function PointsTable() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/teams/standings`);
      if (!response.ok) throw new Error('Failed to fetch standings');
      const data = await response.json();
      const formatted = (Array.isArray(data) ? data : []).map((team) => ({
        ...team,
        teamName: team.teamName || team.name || 'Unknown Team',
        captain: team.captain || 'TBD',
        matchesPlayed: team.matchesPlayed ?? team.matches_played ?? 0,
        wins: team.wins ?? 0,
        losses: team.losses ?? 0,
        points: team.points ?? 0,
      }));
      setStandings(formatted);
    } catch (err) {
      setError(err.message || 'Error fetching standings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-sheen bg-white border border-neutral-200 rounded-[26px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-neutral-500">Leaderboard</p>
          <h2 className="mt-2 text-xl font-black text-neutral-950 flex items-center space-x-2">
            <span>📊</span>
            <span>Points Table Standings</span>
          </h2>
        </div>
        <button 
          onClick={fetchStandings}
          className="text-xs bg-black text-white font-bold px-3.5 py-1.5 rounded-full border border-neutral-800 transition-all hover:bg-neutral-800 shadow-lg shadow-black/10 flex items-center space-x-1.5"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl mb-4">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-neutral-500 text-sm">
          <span>Loading standings...</span>
        </div>
      ) : standings.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-sm text-neutral-700">No teams registered yet.</p>
          <p className="text-xs text-neutral-500 mt-1">Register teams and complete matches to view standings.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 font-semibold">
                <th className="px-6 py-4 text-center w-16">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Captain</th>
                <th className="px-6 py-4 text-center">Played</th>
                <th className="px-6 py-4 text-center">Won</th>
                <th className="px-6 py-4 text-center">Lost</th>
                <th className="px-6 py-4 text-center text-neutral-900 font-extrabold w-24">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => {
                const isTopTeam = index === 0;
                return (
                  <tr 
                    key={team.id}
                    className={`border-b border-neutral-200 hover:bg-neutral-50 transition-all ${
                      isTopTeam ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-center font-black text-neutral-500">
                      {isTopTeam ? (
                        <span className="inline-flex items-center justify-center bg-black text-white rounded-full h-7 w-7 text-xs">
                          1
                        </span>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-neutral-900">
                      <div className="flex items-center space-x-2">
                        {isTopTeam && <span className="text-amber-500">👑</span>}
                        <span>{team.teamName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{team.captain}</td>
                    <td className="px-6 py-4 text-center font-semibold text-neutral-700">{team.matchesPlayed}</td>
                    <td className="px-6 py-4 text-center text-emerald-700 font-bold">{team.wins}</td>
                    <td className="px-6 py-4 text-center text-red-600 font-bold">{team.losses}</td>
                    <td className="px-6 py-4 text-center font-black text-neutral-900 bg-neutral-100">{team.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
