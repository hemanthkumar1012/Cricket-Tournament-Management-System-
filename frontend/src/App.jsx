import React, { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import MatchManagement from './components/MatchManagement';
import PointsTable from './components/PointsTable';
import LiveScores from './components/LiveScores';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CommandPalette from './components/CommandPalette';

const pages = {
  dashboard: { title: 'Tournament overview', eyebrow: 'Operations' },
  live: { title: 'Live match center', eyebrow: 'Match center' },
  teams: { title: 'Team management', eyebrow: 'Competition setup' },
  matches: { title: 'Fixtures & results', eyebrow: 'Match operations' },
  standings: { title: 'Points table', eyebrow: 'Competition rankings' },
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('cricpulse-theme') || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('cricpulse-theme', theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);

  useEffect(() => {
    const handleKeys = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  const navigate = (page) => {
    if (!pages[page]) return;
    setActivePage(page);
    setMobileOpen(false);
    setPaletteOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const page = useMemo(() => {
    switch (activePage) {
      case 'live': return <LiveScores />;
      case 'teams': return <TeamManagement />;
      case 'matches': return <MatchManagement />;
      case 'standings': return <PointsTable />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  }, [activePage]);

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={navigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="app-main">
        <Topbar
          eyebrow={pages[activePage].eyebrow}
          title={pages[activePage].title}
          onMenu={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className="page-content" key={activePage}>{page}</div>
        <footer className="app-footer"><span>CricPulse Tournament OS</span><span>Built for better match days.</span></footer>
      </main>
      <CommandPalette open={paletteOpen} activePage={activePage} onClose={() => setPaletteOpen(false)} onNavigate={navigate} />
    </div>
  );
}
