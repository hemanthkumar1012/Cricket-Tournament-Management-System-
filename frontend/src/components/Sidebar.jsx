import React from 'react';
import Icon from './Icon';

const navItems=[
  ['dashboard','Overview','grid'],
  ['live','Live center','activity'],
  ['teams','Teams','users'],
  ['matches','Fixtures','calendar'],
  ['standings','Standings','trophy']
];

export default function Sidebar({activePage,onNavigate,mobileOpen,onClose}){
  return <aside className={'sidebar '+(mobileOpen?'open':'')}>
    <div className="brand">
      <div className="brand-mark">CP</div>
      <div><div className="brand-name">CricPulse</div><div className="brand-sub">Tournament OS</div></div>
    </div>
    <div className="workspace-label"><span>Workspace</span><span className="shortcut">⌘ K</span></div>
    <nav className="nav-list" aria-label="Tournament navigation">
      {navItems.map(([key,label,icon],index)=><button key={key} className={'nav-item '+(activePage===key?'active':'')} onClick={()=>{onNavigate(key);onClose();}}>
        <span className="nav-index">0{index+1}</span><span className="nav-icon"><Icon name={icon} size={17}/></span><span>{label}</span>{activePage===key&&<span className="nav-pulse"/>}
      </button>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="season-card"><div className="season-kicker">Current season</div><strong>City Premier League</strong><span>2026 · League stage</span></div>
      <div className="system-card"><div className="status-row"><span className="status-dot"/> System online</div><p className="status-copy">All tournament services are responding normally.</p></div>
    </div>
  </aside>;
}