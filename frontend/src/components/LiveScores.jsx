import { useEffect, useState } from 'react';
import { normalizeLiveMatches } from '../lib/liveScores.js';

const apiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || ''}${path}`;

export default function LiveScores() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadLiveMatches = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(apiUrl('/api/live'), {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Live scores request failed (${response.status})`);
        }

        const payload = await response.json();
        const normalized = normalizeLiveMatches(payload);

        if (isMounted) {
          setMatches(normalized);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load live cricket scores');
          setMatches([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLiveMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="card-sheen bg-white border border-neutral-200 rounded-[26px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-neutral-500">Match feed</p>
          <h2 className="mt-2 text-xl font-black text-neutral-950 flex items-center space-x-2">
            <span>🏏</span>
            <span>Live Scores</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs bg-black text-white font-bold px-3.5 py-1.5 rounded-full border border-neutral-800 transition-all hover:bg-neutral-800 shadow-lg shadow-black/10"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl mb-4">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-neutral-500 text-sm">Loading live matches...</div>
      ) : matches.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">
          <span className="text-4xl mb-3 block">🏏</span>
          <p className="text-sm text-neutral-700">No live cricket matches right now.</p>
          <p className="text-xs text-neutral-500 mt-1">Check back later for the latest scores.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match, index) => (
            <article
              key={`${match.id || 'live-match'}-${index}`}
              className="rounded-[22px] border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white font-bold">
                  {match.status || 'Live'}
                </span>
                {match.series && (
                  <span className="text-[10px] text-neutral-500">{match.series}</span>
                )}
              </div>

              <h3 className="text-sm font-black text-neutral-900 mb-3 min-h-[2.5rem] leading-relaxed">{match.name}</h3>

              <div className="space-y-2.5 text-sm text-neutral-700">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2">
                  <span className="font-medium">{match.homeTeam}</span>
                  <span className="font-black text-neutral-950">{match.homeScore || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2">
                  <span className="font-medium">{match.awayTeam}</span>
                  <span className="font-black text-neutral-950">{match.awayScore || '-'}</span>
                </div>
              </div>

              {match.subtitle && (
                <p className="mt-3 text-[11px] text-neutral-500">{match.subtitle}</p>
              )}
              {match.venue && (
                <p className="mt-2 text-[11px] text-neutral-400">{match.venue}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
