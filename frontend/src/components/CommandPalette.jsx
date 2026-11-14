import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export const COMMANDS = [
  { id: 'dashboard', label: 'Open tournament overview', hint: 'Dashboard', keywords: 'home summary metrics' },
  { id: 'live', label: 'Open live match center', hint: 'Live scores', keywords: 'score feed cricket' },
  { id: 'teams', label: 'Manage tournament teams', hint: 'Teams', keywords: 'roster captain register' },
  { id: 'matches', label: 'Manage fixtures and results', hint: 'Fixtures', keywords: 'schedule match result score' },
  { id: 'standings', label: 'View tournament standings', hint: 'Standings', keywords: 'table ranking points leaderboard' },
];

export default function CommandPalette({ open, activePage, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const matches = COMMANDS.filter((command) => `${command.label} ${command.hint} ${command.keywords}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;
  const choose = (id) => { onNavigate(id); onClose(); };
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && matches[0]) choose(matches[0].id);
  };

  return (
    <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Quick navigation">
        <div className="command-search"><span aria-hidden="true">⌕</span><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Where would you like to go?" aria-label="Search pages and actions" /><kbd>ESC</kbd></div>
        <div className="command-heading">QUICK NAVIGATION</div>
        <div className="command-list" role="listbox" aria-label="Navigation results">
          {matches.length ? matches.map((command) => (
            <button type="button" role="option" aria-selected={activePage === command.id} className={'command-option' + (activePage === command.id ? ' current' : '')} key={command.id} onClick={() => choose(command.id)}>
              <span className="command-option-icon"><Icon name={command.id === 'live' ? 'activity' : command.id === 'teams' ? 'users' : command.id === 'matches' ? 'calendar' : command.id === 'standings' ? 'trophy' : 'grid'} size={16} /></span>
              <span className="command-option-copy"><strong>{command.label}</strong><small>{command.hint}</small></span>
              {activePage === command.id ? <span className="command-current">CURRENT</span> : <span className="command-enter">↵</span>}
            </button>
          )) : <p className="command-empty">No pages match “{query}”. Try “fixtures” or “standings”.</p>}
        </div>
        <div className="command-footer"><span><kbd>↑</kbd> <kbd>↓</kbd> browse</span><span><kbd>↵</kbd> open page</span><span><kbd>⌘ K</kbd> toggle</span></div>
      </section>
    </div>
  );
}
