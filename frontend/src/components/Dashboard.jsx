import React,{useEffect,useState} from 'react';
import Icon from './Icon';
import {api} from '../lib/api';

const normalizeTeam=(team)=>({...team,teamName:team.teamName||team.name||'Unknown Team',captain:team.captain||'TBD'});
const normalizeStandings=(items)=>(Array.isArray(items)?items:[]).map((team)=>({...normalizeTeam(team),matchesPlayed:team.matchesPlayed??team.matches_played??0,wins:team.wins??0,losses:team.losses??0,points:team.points??0}));

export default function Dashboard({onNavigate}){
 const[data,setData]=useState({teams:[],matches:[],standings:[]});const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{const results=await Promise.all([api.teams(),api.matches(),api.standings()]);setData({teams:Array.isArray(results[0])?results[0].map(normalizeTeam):[],matches:Array.isArray(results[1])?results[1]:[],standings:normalizeStandings(results[2])});}catch(err){setError(err.message||'Unable to load tournament overview');}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const completed=data.matches.filter((m)=>m.status==='COMPLETED');const scheduled=data.matches.filter((m)=>m.status!=='COMPLETED');const leader=data.standings[0];
 const completionRate=data.matches.length?Math.round((completed.length/data.matches.length)*100):0;
 return <div className="section-grid">
  <section className="hero">
   <div><p className="hero-kicker">CricPulse command center · League stage</p><h1>Everything the tournament desk needs, in one view.</h1><p className="hero-copy">Monitor competition health, schedule fixtures, register teams and publish results without leaving the control room.</p>
    <div className="hero-actions"><button className="btn btn-primary" onClick={()=>onNavigate('matches')}><Icon name="calendar" size={14}/> Manage fixtures</button><button className="btn btn-soft" onClick={()=>onNavigate('teams')}>Register a team <Icon name="arrow" size={14}/></button></div>
   </div>
   <div className="hero-side"><div className="hero-score"><div className="hero-score-label">Table leader</div><div className="hero-score-value">{loading?'—':(leader?.teamName||'No leader')}</div><div className="hero-score-meta">{leader?leader.points+' points · '+leader.wins+' wins':'Complete a match to populate standings.'}</div></div></div>
  </section>
  {error&&<div className="alert alert-error">{error}</div>}
  <section className="section-grid stats-grid">
   {[['Registered teams',data.teams.length,'Competition roster','users'],['Open fixtures',scheduled.length,'Matches awaiting result','calendar'],['Completed',completed.length,'Results recorded','check'],['Completion',completionRate+'%','Schedule completion','activity']].map(([label,value,note,icon])=><article className="card stat-card" key={label}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon"><Icon name={icon} size={15}/></span></div><div className="stat-value">{loading?'—':value}</div><div className="stat-note">{note}</div></article>)}
  </section>
  <section className="section-grid two-grid">
   <div className="card">
    <div className="card-header"><div><h2 className="card-title">Match desk</h2><p className="card-subtitle">Latest fixture activity</p></div><button className="btn btn-soft" onClick={()=>onNavigate('matches')}>View all</button></div>
    {data.matches.slice(0,4).map((match)=><div className="match-row" key={match.id}><div className="match-meta"><span>Match #{match.id}</span><span className={'badge '+(match.status==='COMPLETED'?'badge-success':'badge-warning')}>{match.status||'SCHEDULED'}</span></div><div className="match-teams"><div className="team-side"><div className="team-name">{match.team1?.teamName||'Team 1'}</div><div className="team-score">{match.status==='COMPLETED'?match.team1Score:'—'}</div></div><div className="vs">VS</div><div className="team-side"><div className="team-name">{match.team2?.teamName||'Team 2'}</div><div className="team-score">{match.status==='COMPLETED'?match.team2Score:'—'}</div></div></div>{match.winner&&<div className="result-note">Winner · <strong>{match.winner.teamName}</strong></div>}</div>)}
    {!loading&&data.matches.length===0&&<div className="empty"><div className="empty-icon"><Icon name="calendar"/></div><div className="empty-title">Schedule is clear</div><div className="empty-copy">Create the first fixture from the match desk.</div></div>}
   </div>
   <div className="card">
    <div className="card-header"><div><h2 className="card-title">Leaderboard</h2><p className="card-subtitle">Current points snapshot</p></div><button className="btn btn-soft" onClick={()=>onNavigate('standings')}>Open table</button></div>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>#</th><th>Team</th><th>W</th><th>Pts</th></tr></thead><tbody>{data.standings.slice(0,5).map((team,index)=><tr key={team.id||team.teamName}><td><span className={'rank '+(index===0?'first':'')}>{index+1}</span></td><td><strong>{team.teamName}</strong></td><td>{team.wins}</td><td><strong>{team.points}</strong></td></tr>)}</tbody></table></div>
    {!loading&&data.standings.length===0&&<div className="empty"><div className="empty-copy">Standings will appear after teams are registered.</div></div>}
   </div>
  </section>
  <section className="card"><div className="card-header"><div><h2 className="card-title">Operations checklist</h2><p className="card-subtitle">A quick read on what needs attention</p></div></div>
   <div className="ops-grid">
    <div className="ops-item"><span className="ops-icon"><Icon name="users" size={15}/></span><div><strong>Roster</strong><small>{data.teams.length} registered teams</small></div><button onClick={()=>onNavigate('teams')}>Open</button></div>
    <div className="ops-item"><span className="ops-icon"><Icon name="calendar" size={15}/></span><div><strong>Fixtures</strong><small>{scheduled.length} open matches</small></div><button onClick={()=>onNavigate('matches')}>Open</button></div>
    <div className="ops-item"><span className="ops-icon"><Icon name="trophy" size={15}/></span><div><strong>Standings</strong><small>{leader?leader.teamName:'Waiting for results'}</small></div><button onClick={()=>onNavigate('standings')}>Open</button></div>
   </div>
  </section>
 </div>;
}