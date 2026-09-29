import React from 'react';
import Icon from './Icon';

export default function Topbar({eyebrow,title,onMenu}){
  const date=new Intl.DateTimeFormat('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date());
  return <header className="topbar">
    <div className="topbar-left">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Icon name="menu" size={18}/></button>
      <div><p className="eyebrow"><span className="eyebrow-dot"/> {eyebrow}</p><h1 className="page-title">{title}</h1></div>
    </div>
    <div className="topbar-actions">
      <div className="date-pill"><Icon name="calendar" size={13}/>{date}</div>
      <div className="user-pill"><span className="avatar">HK</span><span><b>Hemanth</b><small>Administrator</small></span><Icon name="chevron" size={14}/></div>
    </div>
  </header>;
}