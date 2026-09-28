import React,{useState} from 'react';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import MatchManagement from './components/MatchManagement';
import PointsTable from './components/PointsTable';
import LiveScores from './components/LiveScores';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
const pages={dashboard:{title:'Tournament overview',eyebrow:'Operations'},live:{title:'Live match center',eyebrow:'Match center'},teams:{title:'Team management',eyebrow:'Competition setup'},matches:{title:'Fixtures & results',eyebrow:'Match operations'},standings:{title:'Points table',eyebrow:'Tournament rankings'}};
export default function App(){const[activePage,setActivePage]=useState('dashboard');const[mobileOpen,setMobileOpen]=useState(false);const renderPage=()=>{switch(activePage){case'live':return <LiveScores/>;case'teams':return <TeamManagement/>;case'matches':return <MatchManagement/>;case'standings':return <PointsTable/>;default:return <Dashboard onNavigate={setActivePage}/>;}};return <div className="app-shell"><Sidebar activePage={activePage} onNavigate={setActivePage} mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/><div className="app-main"><Topbar eyebrow={pages[activePage].eyebrow} title={pages[activePage].title} onMenu={()=>setMobileOpen(true)}/><main className="page-content">{renderPage()}</main><footer className="app-footer"><span>CricPulse Tournament Control</span><span>Built for fast, clear match operations.</span></footer></div></div>;}