import React, { useState } from 'react';
import TeamManagement from './components/TeamManagement';
import MatchManagement from './components/MatchManagement';
import PointsTable from './components/PointsTable';
import LiveScores from './components/LiveScores';

const tabData = [
  { key: 'live', label: 'Live', icon: '🏏' },
  { key: 'teams', label: 'Teams', icon: '🛡️' },
  { key: 'matches', label: 'Matches', icon: '⚔️' },
  { key: 'standings', label: 'Standings', icon: '📊' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="min-h-screen bg-[#f4f4f3] text-neutral-900 flex flex-col justify-between selection:bg-black selection:text-white">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-xl text-white shadow-lg shadow-black/10">
              🏏
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Tournament hub</p>
              <span className="text-xl font-black tracking-tight text-neutral-950">
                CricPulse
              </span>
            </div>
          </div>

          <nav className="flex space-x-1.5 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 flex-wrap gap-2 shadow-inner shadow-white/60">
            {tabData.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === tab.key
                    ? 'bg-black text-white font-bold shadow-lg shadow-black/10'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-grow">
        <section className="mb-8 rounded-[28px] bg-gradient-to-r from-neutral-950 via-neutral-900 to-zinc-800 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-300">Cricket dashboard</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Professional tournament control center</h1>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-neutral-200">
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm">Live scores</div>
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm">Team analytics</div>
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm">Match results</div>
            </div>
          </div>
        </section>

        {activeTab === 'live' && <LiveScores />}
        {activeTab === 'teams' && <TeamManagement />}
        {activeTab === 'matches' && <MatchManagement />}
        {activeTab === 'standings' && <PointsTable />}
      </main>

      <footer className="border-t border-neutral-200 bg-white py-8 text-center text-xs text-neutral-600">
        <p>&copy; {new Date().getFullYear()} CricPulse. Built for modern cricket tournament management.</p>
      </footer>
    </div>
  );
}
