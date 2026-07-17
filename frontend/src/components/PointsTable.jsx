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
      const response = await fetch('/api/teams/standings');
      if (!response.ok) throw new Error('Failed to fetch standings');
      const data = await response.json();
      setStandings(data);
    } catch (err) {
      setError(err.message || 'Error fetching standings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <span>📊</span>
          <span>Points Table Standings</span>
        </h2>
        <button 
          onClick={fetchStandings}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold px-3.5 py-1.5 rounded-full border border-slate-700/60 transition-all flex items-center space-x-1.5"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          <span>Loading standings...</span>
        </div>
      ) : standings.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-sm">No teams registered yet.</p>
          <p className="text-xs text-slate-600 mt-1">Register teams and complete matches to view standings.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="px-6 py-4 text-center w-16">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Captain</th>
                <th className="px-6 py-4 text-center">Played</th>
                <th className="px-6 py-4 text-center">Won</th>
                <th className="px-6 py-4 text-center">Lost</th>
                <th className="px-6 py-4 text-center text-teal-400 font-extrabold w-24">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => {
                const isTopTeam = index === 0;
                return (
                  <tr 
                    key={team.id}
                    className={`border-b border-slate-800/60 hover:bg-slate-900/30 transition-all ${
                      isTopTeam ? 'bg-teal-500/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-center font-bold text-slate-400">
                      {isTopTeam ? (
                        <span className="inline-flex items-center justify-center bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full h-6 w-6 text-xs">
                          1
                        </span>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      <div className="flex items-center space-x-2">
                        {isTopTeam && <span className="text-yellow-500">👑</span>}
                        <span>{team.teamName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{team.captain}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-300">{team.matchesPlayed}</td>
                    <td className="px-6 py-4 text-center text-emerald-400 font-semibold">{team.wins}</td>
                    <td className="px-6 py-4 text-center text-rose-400 font-semibold">{team.losses}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-teal-400 bg-teal-500/5">{team.points}</td>
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
