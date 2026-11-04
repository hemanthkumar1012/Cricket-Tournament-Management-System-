import React from "react";
import Icon from "./Icon";

export default function Topbar({ eyebrow, title, onMenu, onLogout }) {
  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation" type="button">
          <Icon name="menu" size={18} />
        </button>
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</p>
          <h1 className="page-title">{title}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="date-pill"><Icon name="calendar" size={13} />{date}</div>
        <div className="user-pill">
          <span className="avatar">AD</span>
          <span><b>Administrator</b><small>Signed in</small></span>
        </div>
        <button className="btn btn-soft" type="button" onClick={onLogout} aria-label="Sign out">
          <Icon name="log-out" size={13} /> Sign out
        </button>
      </div>
    </header>
  );
}
