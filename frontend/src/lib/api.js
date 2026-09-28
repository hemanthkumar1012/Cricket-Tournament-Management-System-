const BASE_URL=import.meta.env.VITE_API_BASE_URL||'';
export class ApiError extends Error{constructor(message,status=0){super(message);this.name='ApiError';this.status=status;}}
async function request(path,options={}){
const response=await fetch(BASE_URL+path,{...options,headers:{Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{data=text;}
if(!response.ok)throw new ApiError(data?.message||data?.error||'Request failed ('+response.status+')',response.status);
return data;
}
export const api={
live:()=>request('/api/live'),
teams:()=>request('/api/teams'),
createTeam:(body)=>request('/api/teams',{method:'POST',body:JSON.stringify(body)}),
standings:()=>request('/api/teams/standings'),
matches:()=>request('/api/matches'),
createMatch:(body)=>request('/api/matches',{method:'POST',body:JSON.stringify(body)}),
updateResult:(id,team1Score,team2Score)=>request('/api/matches/'+id+'/result?team1Score='+encodeURIComponent(team1Score)+'&team2Score='+encodeURIComponent(team2Score),{method:'PUT'})
};