import React, { useState } from 'react';
import TeamManagement from './components/TeamManagement';
import MatchManagement from './components/MatchManagement';
import PointsTable from './components/PointsTable';

export default function App() {
  const [activeTab, setActiveTab] = useState('teams');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏏</span>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              CricketTournament
            </span>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'teams'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ Teams
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'matches'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚔️ Matches
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'standings'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Standings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-grow">
        {activeTab === 'teams' && <TeamManagement />}
        {activeTab === 'matches' && <MatchManagement />}
        {activeTab === 'standings' && <PointsTable />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 bg-slate-950 py-8 text-center text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} Cricket Tournament Manager. Built with Spring Boot & React.</p>
      </footer>
    </div>
  );
}
