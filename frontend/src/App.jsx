import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import TeamManagement from "./components/TeamManagement";
import PlayerManagement from "./components/PlayerManagement";
import MatchManagement from "./components/MatchManagement";
import PointsTable from "./components/PointsTable";
import LiveScores from "./components/LiveScores";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./components/Login";
import { api } from "./lib/api";

const pages = {
  dashboard: { title: "Tournament overview", eyebrow: "Operations" },
  live: { title: "Live match center", eyebrow: "Match center" },
  teams: { title: "Team management", eyebrow: "Competition setup" },
  players: { title: "Player roster", eyebrow: "Squad management" },
  matches: { title: "Fixtures & results", eyebrow: "Match operations" },
  standings: { title: "Points table", eyebrow: "Tournament rankings" },
};

export default function App() {
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem("cricpulse_token"));
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleLogout = () => setAuthToken(null);
    window.addEventListener("cricpulse:logout", handleLogout);
    return () => window.removeEventListener("cricpulse:logout", handleLogout);
  }, []);

  useEffect(() => {
    if (authToken) api.me().catch(() => api.logout());
  }, [authToken]);

  if (!authToken) {
    return <Login onLogin={() => setAuthToken(window.localStorage.getItem("cricpulse_token"))} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "live": return <LiveScores />;
      case "teams": return <TeamManagement />;
      case "players": return <PlayerManagement />;
      case "matches": return <MatchManagement />;
      case "standings": return <PointsTable />;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="app-main">
        <Topbar
          eyebrow={pages[activePage].eyebrow}
          title={pages[activePage].title}
          onMenu={() => setMobileOpen(true)}
          onLogout={api.logout}
        />
        <main className="page-content">{renderPage()}</main>
        <footer className="app-footer">
          <span>CricPulse Tournament Control</span>
          <span>Built for fast, clear match operations.</span>
        </footer>
      </div>
    </div>
  );
}
