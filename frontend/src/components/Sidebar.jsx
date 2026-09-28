import React from 'react';
import Icon from './Icon';
const navItems=[['dashboard','Overview','grid'],['live','Live center','activity'],['teams','Teams','users'],['matches','Fixtures','calendar'],['standings','Standings','trophy']];
export default function Sidebar({activePage,onNavigate,mobileOpen,onClose}){
return <aside className={'sidebar '+(mobileOpen?'open':'')}>
<div className="brand"><div className="brand-mark">CP</div><div><div className="brand-name">CricPulse</div><div className="brand-sub">Tournament OS</div></div></div>
<div className="nav-label">Workspace</div>
<nav className="nav-list" aria-label="Tournament navigation">{navItems.map(([key,label,icon])=><button key={key} className={'nav-item '+(activePage===key?'active':'')} onClick={()=>{onNavigate(key);onClose();}}><span className="nav-icon"><Icon name={icon} size={17}/></span><span>{label}</span></button>)}</nav>
<div className="sidebar-bottom"><div className="system-card"><div className="status-row"><span className="status-dot"/> System online</div><p className="status-copy">Tournament services are ready. Manage teams, fixtures, results and live scores from one workspace.</p></div></div>
</aside>;}