import React,{useEffect,useState} from 'react';
import Icon from './Icon';
import {api} from '../lib/api';
import {normalizeLiveMatches} from '../lib/liveScores.js';

export default function LiveScores(){
 const[matches,setMatches]=useState([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{setMatches(normalizeLiveMatches(await api.live()));}catch(err){setError(err.message||'Unable to load live scores');}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 return <section className="section-grid"><div className="live-banner"><div><span className="hero-kicker">Match center</span><h2>Live score room</h2><p>Real-time matches from the configured cricket score service.</p></div><div className="live-indicator"><span/> Feed active</div></div>
 <section className="card"><div className="card-header"><div><h2 className="card-title">Live matches</h2><p className="card-subtitle">Latest available score feed</p></div><button className="btn btn-soft" onClick={load}><Icon name="refresh" size={13}/> Refresh feed</button></div>
 {error&&<div style={{padding:'0 20px'}}><div className="alert alert-error">{error}</div></div>}{loading?<div className="empty"><div className="empty-copy">Connecting to live feed…</div></div>:matches.length===0?<div className="empty"><div className="empty-icon"><Icon name="activity"/></div><div className="empty-title">No live matches right now</div><div className="empty-copy">The feed is empty. Check again when matches are in progress.</div></div>:<div className="live-grid">{matches.map((match,index)=><article className="live-card" key={(match.id||'live')+'-'+index}><div className="live-top"><span className="badge badge-live">{match.status||'Live'}</span><span className="card-subtitle">{match.series||'Tournament feed'}</span></div><div className="team-name" style={{marginTop:14}}>{match.name}</div><div className="live-score"><div className="live-team"><span>{match.homeTeam}</span><strong>{match.homeScore||'—'}</strong></div><div className="live-team"><span>{match.awayTeam}</span><strong>{match.awayScore||'—'}</strong></div></div>{match.venue&&<div className="result-note">{match.venue}</div>}</article>)}</div>}
 </section></section>;
}