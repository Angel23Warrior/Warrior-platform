import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { WW_LOGO, B49_LOGO } from "./logos.js";

const SUPABASE_URL = "https://ntcsjtyiefusaqsehgfl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3NqdHlpZWZ1c2Fxc2VoZ2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MzcsImV4cCI6MjA4NzMwMTgzN30.NRlzdtfR6BiEwZGRe5VJKVlo8i5-qmI9cmUkzHgTgV8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const D = {
  bg:"#070A0F", surface:"#0D1220", surface2:"#111A2D",
  divider:"rgba(255,255,255,0.08)",
  textPrimary:"rgba(255,255,255,0.92)", textSec:"rgba(255,255,255,0.62)", textTert:"rgba(255,255,255,0.38)",
  brand:"#D6B25E", brandMuted:"rgba(214,178,94,0.14)",
  success:"#35C18B", successMuted:"rgba(53,193,139,0.12)",
  danger:"#FF5A5F", warning:"#FFCC66",
  r16:16, r12:12, r10:10, r8:8,
};
const FF="'Barlow Condensed','Oswald',sans-serif";
const FB="-apple-system,'SF Pro Display','Helvetica Neue',sans-serif";
const CORE4=[
  {id:"movement",icon:"⚡",label:"15 Min Movement",desc:"Train, stretch, or sweat."},
  {id:"god",icon:"🙏",label:"15 Min With God",desc:"Prayer, meditation, reflection."},
  {id:"vanity",icon:"💌",label:"2 Vanity Notes",desc:"Express gratitude or love."},
  {id:"business",icon:"📖",label:"Business Listen / Read",desc:"Learn something. Share it."},
];
const GOAL_COLORS=["#D6B25E","#35C18B","#4A9EF5","#E06FBF","#A78BFA","#F59E4A","#F87171","#6EE7B7"];
function todayStr(){return new Date().toISOString().slice(0,10);}

const GS=()=>(
  <style>{`
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    body{margin:0;padding:0;background:${D.bg};font-family:${FB};}
    input,textarea,button{font-family:inherit;}
    ::-webkit-scrollbar{width:0;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    @keyframes popIn{0%{transform:scale(0.85);opacity:0;}70%{transform:scale(1.05);}100%{transform:scale(1);opacity:1;}}
    @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(80px) rotate(360deg);opacity:0;}}
    @keyframes erupt{0%{transform:translateY(60px);opacity:0;}60%{transform:translateY(-10px);opacity:1;}80%{transform:translateY(4px);}100%{transform:translateY(0);opacity:1;}}
    @keyframes rootGrow{from{opacity:0;transform:scaleY(0);transform-origin:top center;}to{opacity:1;transform:scaleY(1);transform-origin:top center;}}
    @keyframes dirtFly{0%{opacity:0;transform:translate(0,0) scale(0);}40%{opacity:1;}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.5);}}
    @keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 8px rgba(214,178,94,0.4));}50%{filter:drop-shadow(0 0 20px rgba(214,178,94,0.9));}}
    .task-row:active{transform:scale(0.98);}
  `}</style>
);

export default function App(){
  const [screen,setScreen]=useState("loading");
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [allLogs,setAllLogs]=useState([]);
  const [goals,setGoals]=useState([]);
  const [goalCompletions,setGoalCompletions]=useState([]);
  const [leaderboard,setLeaderboard]=useState([]);
  const [editRequests,setEditRequests]=useState([]);
  const [selectedDate,setSelectedDate]=useState(todayStr());
  const [calYear,setCalYear]=useState(new Date().getFullYear());
  const [calMonth,setCalMonth]=useState(new Date().getMonth());
  const [showConfetti,setShowConfetti]=useState(false);
  const [showAddGoal,setShowAddGoal]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [uname,setUname]=useState("");
  const [authError,setAuthError]=useState("");
  const [loading,setLoading]=useState(false);
  const [requestReason,setRequestReason]=useState("");
  const [requestMsg,setRequestMsg]=useState("");
  const prevC4=useRef(0);

  useEffect(()=>{
    const minLoad=new Promise(r=>setTimeout(r,2800));
    const sess=supabase.auth.getSession().then(({data:{session}})=>session);
    Promise.all([minLoad,sess]).then(([,session])=>{
      if(session?.user){setUser(session.user);loadUserData(session.user.id);setScreen("dashboard");}
      else setScreen("login");
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
      if(session?.user){setUser(session.user);loadUserData(session.user.id);setScreen("dashboard");}
      else{setUser(null);setScreen("login");}
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadUserData(uid){
    const {data:prof}=await supabase.from("profiles").select("*").eq("id",uid).single();
    setProfile(prof);
    const {data:logs}=await supabase.from("daily_logs").select("*").eq("user_id",uid);
    setAllLogs(logs||[]);
    const {data:g}=await supabase.from("goals").select("*").eq("user_id",uid);
    setGoals(g||[]);
    const {data:gc}=await supabase.from("goal_completions").select("*").eq("user_id",uid);
    setGoalCompletions(gc||[]);
    await loadLeaderboard();
    await loadEditRequests(uid);
  }

  async function loadLeaderboard(){
    const {data:profiles}=await supabase.from("profiles").select("*");
    const {data:logs}=await supabase.from("daily_logs").select("*");
    const {data:gcs}=await supabase.from("goal_completions").select("*");
    if(!profiles)return;
    const board=profiles.map(p=>{
      const uL=(logs||[]).filter(l=>l.user_id===p.id);
      const uG=(gcs||[]).filter(g=>g.user_id===p.id);
      let s=0;
      for(const l of uL){const c4=[l.movement,l.god,l.vanity,l.business].filter(Boolean).length;s+=c4*10;if(c4===4)s+=20;}
      s+=uG.length*5;
      let streak=0;const t=new Date();
      for(let i=0;i<365;i++){const d=new Date(t);d.setDate(t.getDate()-i);const k=d.toISOString().slice(0,10);const l=uL.find(x=>x.log_date===k);if(l&&l.movement&&l.god&&l.vanity&&l.business)streak++;else if(i>0)break;}
      return{...p,score:s,streak,fullDays:uL.filter(l=>l.movement&&l.god&&l.vanity&&l.business).length};
    });
    setLeaderboard(board.sort((a,b)=>b.score-a.score));
  }

  async function loadEditRequests(uid){
    const {data:pd}=await supabase.from("profiles").select("role").eq("id",uid).single();
    if(pd?.role==="manager"){
      const {data:reqs}=await supabase.from("edit_requests").select("*").order("created_at",{ascending:false});
      if(!reqs){setEditRequests([]);return;}
      const {data:profs}=await supabase.from("profiles").select("id,name,email");
      const pm={};(profs||[]).forEach(p=>{pm[p.id]=p;});
      setEditRequests(reqs.map(r=>({...r,profiles:pm[r.user_id]||null})));
    }else{
      const {data}=await supabase.from("edit_requests").select("*").eq("user_id",uid).order("created_at",{ascending:false});
      setEditRequests(data||[]);
    }
  }

  async function handleLogin(){
    if(!email||!password){setAuthError("Please fill in all fields.");return;}
    setLoading(true);setAuthError("");
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)setAuthError(error.message);
    setLoading(false);
  }

  async function handleSignup(){
    if(!email||!password||!uname){setAuthError("Please fill in all fields.");return;}
    setLoading(true);setAuthError("");
    const {error}=await supabase.auth.signUp({email,password,options:{data:{name:uname}}});
    if(error)setAuthError(error.message);
    else setAuthError("✅ Check your email to confirm, then sign in.");
    setLoading(false);
  }

  async function handleLogout(){await supabase.auth.signOut();}

  function isPastDay(d){return d<todayStr();}
  function hasApprovedRequest(d){return editRequests.some(r=>r.requested_date===d&&r.status==="approved");}

  async function toggleCore4(field){
    const dk=selectedDate;
    const cur=allLogs.find(l=>l.log_date===dk)||{};
    const nv=!cur[field];
    if(cur.id){await supabase.from("daily_logs").update({[field]:nv}).eq("id",cur.id);}
    else{
      const {data}=await supabase.from("daily_logs").insert({user_id:user.id,log_date:dk,[field]:nv}).select().single();
      if(data){setAllLogs(prev=>[...prev.filter(l=>l.log_date!==dk),data]);await loadLeaderboard();return;}
    }
    const upd={...cur,[field]:nv};
    setAllLogs(prev=>[...prev.filter(l=>l.log_date!==dk),{...upd,log_date:dk}]);
    const nd=CORE4.filter(c=>c.id===field?nv:!!(allLogs.find(l=>l.log_date===dk)||{})[c.id]).length;
    if(nd===4&&prevC4.current<4){setShowConfetti(true);setTimeout(()=>setShowConfetti(false),2500);}
    prevC4.current=nd;
    await loadLeaderboard();
  }

  async function toggleGoalCompletion(goalId){
    const dk=selectedDate;
    const ex=goalCompletions.find(gc=>gc.goal_id===goalId&&gc.completion_date===dk);
    if(ex){await supabase.from("goal_completions").delete().eq("id",ex.id);setGoalCompletions(prev=>prev.filter(gc=>gc.id!==ex.id));}
    else{const {data}=await supabase.from("goal_completions").insert({user_id:user.id,goal_id:goalId,completion_date:dk}).select().single();if(data)setGoalCompletions(prev=>[...prev,data]);}
    await loadLeaderboard();
  }

  async function togglePrivate(){
    const nv=!profile.is_private;
    await supabase.from("profiles").update({is_private:nv}).eq("id",user.id);
    setProfile(p=>({...p,is_private:nv}));
    await loadLeaderboard();
  }

  async function submitEditRequest(){
    if(!requestReason.trim())return;
    setRequestMsg("");
    const {error}=await supabase.from("edit_requests").insert({user_id:user.id,requested_date:selectedDate,reason:requestReason.trim(),status:"pending"});
    if(error)setRequestMsg("❌ Error submitting.");
    else{setRequestMsg("✅ Request sent!");setRequestReason("");await loadEditRequests(user.id);}
  }

  async function reviewEditRequest(id,status){
    await supabase.from("edit_requests").update({status,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",id);
    await loadEditRequests(user.id);
  }

  const selLog=allLogs.find(l=>l.log_date===selectedDate)||{};
  const core4Done=CORE4.filter(c=>selLog[c.id]).length;
  const streak=(()=>{let s=0;const t=new Date();for(let i=0;i<365;i++){const d=new Date(t);d.setDate(t.getDate()-i);const k=d.toISOString().slice(0,10);const l=allLogs.find(x=>x.log_date===k);if(l&&l.movement&&l.god&&l.vanity&&l.business)s++;else if(i>0)break;}return s;})();
  const score=(()=>{let s=0;for(const l of allLogs){const c4=[l.movement,l.god,l.vanity,l.business].filter(Boolean).length;s+=c4*10;if(c4===4)s+=20;}s+=goalCompletions.length*5;return s;})();
  const now2=new Date();
  const daysInMonth=new Date(now2.getFullYear(),now2.getMonth()+1,0).getDate();
  const monthPrefix=now2.toISOString().slice(0,7);
  const fullDays=allLogs.filter(l=>l.log_date.startsWith(monthPrefix)&&l.movement&&l.god&&l.vanity&&l.business).length;
  const monthPct=Math.round((fullDays/daysInMonth)*100);
  const ringPct=(core4Done/4)*100;

  if(screen==="loading")return <LoadingScreen/>;
  if(screen==="login"||screen==="signup")return(
    <AuthScreen mode={authMode} setMode={setAuthMode} email={email} setEmail={setEmail}
      password={password} setPassword={setPassword} name={uname} setName={setUname}
      onLogin={handleLogin} onSignup={handleSignup} loading={loading} error={authError}/>
  );

  const tabs=[
    {id:"dashboard",label:"Today",icon:"⚡"},
    {id:"calendar",label:"Calendar",icon:"📅"},
    {id:"leaderboard",label:"Board",icon:"🏆"},
    {id:"goals",label:"Goals",icon:"🎯"},
    {id:"settings",label:"Settings",icon:"⚙️"},
    ...(profile?.role==="manager"?[{id:"admin",label:"Admin",icon:"🛡️"}]:[]),
  ];

  return(
    <div style={{minHeight:"100vh",background:D.bg,color:D.textPrimary,fontFamily:FB,paddingBottom:84}}>
      <GS/>

      {/* Confetti */}
      {showConfetti&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:999,pointerEvents:"none",height:200}}>
          {Array.from({length:24},(_,i)=>(
            <div key={i} style={{position:"absolute",left:`${5+Math.random()*90}%`,width:7,height:7,borderRadius:i%2===0?"50%":2,background:[D.brand,D.success,"#4A9EF5","#fff"][i%4],animation:`confettiFall ${0.8+Math.random()*1.2}s ease-out ${Math.random()*0.4}s forwards`}}/>
          ))}
        </div>
      )}

      {/* Top Bar */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,10,15,0.94)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${D.divider}`,padding:"14px 20px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:600,margin:"0 auto"}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:2,lineHeight:1}}>Power Hour</div>
            <div style={{fontSize:12,color:D.textTert,marginTop:3,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{color:D.brand,fontWeight:600}}>{score} pts</span>
              <span style={{opacity:0.4}}>·</span>
              <span>{streak>0?"🔥 ":""}{streak}d streak</span>
              <span style={{opacity:0.4}}>·</span>
              <span>{profile?.name}</span>
            </div>
          </div>
          <button onClick={()=>setScreen("settings")} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${D.divider}`,background:D.surface,color:D.textSec,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
        </div>
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 20px 0"}}>

        {/* TODAY */}
        {screen==="dashboard"&&(
          <div style={{animation:"fadeUp 0.35s ease both"}}>
            {selectedDate!==todayStr()&&(
              <div style={{background:D.surface,borderRadius:D.r12,padding:"10px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${D.divider}`}}>
                <span style={{fontSize:14,color:D.textSec}}>{new Date(selectedDate+"T12:00:00").toLocaleDateString("default",{weekday:"long",month:"long",day:"numeric"})}</span>
                <button onClick={()=>setSelectedDate(todayStr())} style={{background:"none",border:"none",color:D.brand,cursor:"pointer",fontSize:13,fontWeight:600}}>← Today</button>
              </div>
            )}

            {/* Progress Ring Card */}
            <div style={{background:D.surface,borderRadius:D.r16,padding:"28px 20px 24px",marginBottom:16,textAlign:"center",boxShadow:"0 10px 30px rgba(0,0,0,0.35)",border:`1px solid ${D.divider}`}}>
              <ProgressRing pct={ringPct} done={core4Done} goalPct={goals.length>0?Math.round((goalCompletions.filter(gc=>gc.completion_date===selectedDate).length/goals.length)*100):0} monthPct={monthPct}/>
              <div style={{fontSize:14,color:D.textSec,marginTop:14,letterSpacing:0.2}}>
                {core4Done===4?"🔥 You won today.":core4Done===0?"Core 4. No excuses.":"Keep going. Win the day."}
              </div>
              {/* Ring legend */}
              <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:12}}>
                {[
                  {color:ringPct===100?D.success:D.brand, label:"Core 4"},
                  {color:"#4A9EF5", label:"Goals today"},
                  {color:"#E06FBF", label:"Month"},
                ].map(l=>(
                  <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:l.color,boxShadow:`0 0 4px ${l.color}`}}/>
                    <span style={{fontSize:11,color:D.textTert}}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:18,flexWrap:"wrap"}}>
                {[{label:"pts",value:score},{label:"streak",value:`${streak}d`},{label:"logged",value:`${allLogs.length}d`}].map(s=>(
                  <div key={s.label} style={{background:D.bg,borderRadius:D.r12,padding:"8px 16px",border:`1px solid ${D.divider}`}}>
                    <div style={{fontSize:18,fontWeight:700,color:D.brand,fontFamily:FF,lineHeight:1}}>{s.value}</div>
                    <div style={{fontSize:11,color:D.textTert,marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:18,textAlign:"left"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:D.textTert,marginBottom:6}}>
                  <span>{now2.toLocaleString("default",{month:"long"})} — Core 4</span>
                  <span style={{color:D.brand}}>{fullDays} full days · {monthPct}%</span>
                </div>
                <div style={{background:D.bg,borderRadius:4,height:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${monthPct}%`,background:`linear-gradient(90deg,${D.brand},#F0D080)`,borderRadius:4,transition:"width 0.6s ease"}}/>
                </div>
                {goals.length>0&&(()=>{
                  const totalGoalDays=goals.length*daysInMonth;
                  const completedGoalDays=goalCompletions.filter(gc=>gc.completion_date.startsWith(monthPrefix)).length;
                  const goalPct=totalGoalDays>0?Math.round((completedGoalDays/totalGoalDays)*100):0;
                  return(
                    <div style={{marginTop:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:D.textTert,marginBottom:6}}>
                        <span>Custom Goals</span>
                        <span style={{color:D.success}}>{completedGoalDays} hits · {goalPct}%</span>
                      </div>
                      <div style={{background:D.bg,borderRadius:4,height:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${goalPct}%`,background:`linear-gradient(90deg,${D.success},#6EE7B7)`,borderRadius:4,transition:"width 0.6s ease"}}/>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Core 4 */}
            <SectionLabel>Core 4</SectionLabel>
            {isPastDay(selectedDate)&&!hasApprovedRequest(selectedDate)?(
              <EditRequestCard selectedDate={selectedDate} editRequests={editRequests} requestReason={requestReason} setRequestReason={setRequestReason} requestMsg={requestMsg} onSubmit={submitEditRequest}/>
            ):(
              CORE4.map((item,i)=>(
                <TaskRow key={item.id} icon={item.icon} label={item.label} desc={item.desc} checked={!!selLog[item.id]} onClick={()=>toggleCore4(item.id)} delay={i*50}/>
              ))
            )}

            {/* Custom Goals */}
            {goals.length>0&&(
              <>
                <SectionLabel style={{marginTop:22}}>Custom Goals</SectionLabel>
                {isPastDay(selectedDate)&&!hasApprovedRequest(selectedDate)?(
                  <div style={{background:D.surface,borderRadius:D.r12,padding:"12px 16px",fontSize:13,color:D.textTert,border:`1px solid ${D.divider}`}}>
                    {editRequests.some(r=>r.requested_date===selectedDate&&r.status==="pending")?<span style={{color:D.warning}}>⏳ Request pending approval</span>:"Submit an edit request above to unlock goals for this day."}
                  </div>
                ):goals.map((goal,i)=>{
                  const checked=goalCompletions.some(gc=>gc.goal_id===goal.id&&gc.completion_date===selectedDate);
                  const doneCount=goalCompletions.filter(gc=>gc.goal_id===goal.id).length;
                  const pct=Math.min(100,Math.round((doneCount/goal.target)*100));
                  return <TaskRow key={goal.id} icon="🎯" label={goal.name} desc={`${doneCount} / ${goal.target} ${goal.unit}`} checked={checked} onClick={()=>toggleGoalCompletion(goal.id)} accent={goal.color} delay={i*50} progress={pct}/>;
                })}
              </>
            )}
            <button onClick={()=>setShowAddGoal(true)} style={{width:"100%",marginTop:12,padding:"14px",background:"none",border:`1px dashed rgba(214,178,94,0.3)`,color:D.brand,borderRadius:D.r12,cursor:"pointer",fontSize:15,fontWeight:600}}>+ Add Custom Goal</button>
          </div>
        )}

        {/* CALENDAR */}
        {screen==="calendar"&&(()=>{
          const dim=new Date(calYear,calMonth+1,0).getDate();
          const fdow=new Date(calYear,calMonth,1).getDay();
          const mname=new Date(calYear,calMonth,1).toLocaleString("default",{month:"long"});
          const mkey=calYear+"-"+String(calMonth+1).padStart(2,"0");
          const fullThis=allLogs.filter(l=>l.log_date.startsWith(mkey)&&l.movement&&l.god&&l.vanity&&l.business).length;
          const isCurMon=calYear===now2.getFullYear()&&calMonth===now2.getMonth();
          const prevM=()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);};
          const nextM=()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);};
          return(
            <div style={{animation:"fadeUp 0.35s ease both"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <button onClick={prevM} style={{background:"none",border:"none",color:D.textSec,cursor:"pointer",fontSize:24,padding:"4px 8px",lineHeight:1}}>‹</button>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:700,color:D.textPrimary}}>{mname} {calYear}</div>
                  <div style={{fontSize:13,color:D.textTert,marginTop:2}}>Full days: <span style={{color:D.success,fontWeight:600}}>{fullThis}</span></div>
                </div>
                <button onClick={nextM} disabled={isCurMon} style={{background:"none",border:"none",color:isCurMon?D.textTert:D.textSec,cursor:"pointer",fontSize:24,padding:"4px 8px",lineHeight:1,opacity:isCurMon?0.3:1}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
                {["S","M","T","W","T","F","S"].map((d,i)=>(
                  <div key={i} style={{textAlign:"center",fontSize:11,color:D.textTert,fontWeight:600,padding:"4px 0"}}>{d}</div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {Array.from({length:fdow},(_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:dim},(_,i)=>{
                  const dn=i+1;
                  const key=calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(dn).padStart(2,"0");
                  const log=allLogs.find(l=>l.log_date===key)||{};
                  const done=CORE4.filter(c=>log[c.id]).length;
                  const full=done===4;
                  const isCur=key===todayStr();
                  const future=key>todayStr();
                  return(
                    <div key={dn} onClick={()=>{if(!future){setSelectedDate(key);setScreen("dashboard");}}} style={{aspectRatio:"1",background:full?D.successMuted:isCur?D.brandMuted:D.surface,border:isCur?`1px solid ${D.brand}`:full?`1px solid rgba(53,193,139,0.3)`:`1px solid ${D.divider}`,borderRadius:D.r10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:future?"default":"pointer",opacity:future?0.3:1,transition:"all 0.15s"}}>
                      <div style={{fontSize:14,fontWeight:600,color:isCur?D.brand:full?D.success:D.textPrimary,lineHeight:1}}>{dn}</div>
                      {done>0&&done<4&&<div style={{display:"flex",gap:2,marginTop:3}}>{CORE4.map(c=><div key={c.id} style={{width:3,height:3,borderRadius:"50%",background:log[c.id]?D.brand:"rgba(255,255,255,0.12)"}}/>)}</div>}
                      {full&&<div style={{fontSize:9,marginTop:2,color:D.success}}>✓</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:12,fontSize:12,color:D.textTert,textAlign:"center"}}>Tap any past day to check in · Green = full Power Hour</div>
            </div>
          );
        })()}

        {/* LEADERBOARD */}
        {screen==="leaderboard"&&(
          <LeaderboardScreen
            leaderboard={leaderboard}
            allLogs={allLogs}
            goalCompletions={goalCompletions}
            userId={user?.id}
            now2={now2}
          />
        )}

        {/* GOALS */}
        {screen==="goals"&&(
          <GoalsScreen goals={goals} setGoals={setGoals} goalCompletions={goalCompletions} userId={user?.id} onAddGoal={()=>setShowAddGoal(true)}/>
        )}

        {/* SETTINGS */}
        {screen==="settings"&&(
          <div style={{animation:"fadeUp 0.35s ease both"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
              <img src={WW_LOGO} alt="WW" style={{height:38,width:38,objectFit:"contain",borderRadius:8,background:D.surface2,padding:4}}/>
              <span style={{color:D.textTert,fontSize:16}}>×</span>
              <img src={B49_LOGO} alt="B49" style={{height:38,width:38,objectFit:"contain",borderRadius:8,background:D.surface2,padding:4}}/>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:1}}>Warrior Way</div>
                <div style={{fontSize:11,color:D.textTert}}>Power Hour Platform</div>
              </div>
            </div>

            <SettingsGroup title="Account">
              <div style={{padding:"10px 0",borderBottom:`1px solid ${D.divider}`}}>
                <div style={{fontSize:15,fontWeight:600,color:D.textPrimary}}>{profile?.name}</div>
                <div style={{fontSize:12,color:D.textTert,marginTop:2}}>{user?.email} · <span style={{color:D.brand,textTransform:"capitalize"}}>{profile?.role}</span></div>
              </div>
              <SettingsToggle label="Show on Leaderboard" sub="Share your progress with the team" value={!profile?.is_private} onChange={togglePrivate}/>
            </SettingsGroup>

            <SettingsGroup title="My Stats">
              {[{label:"Total Points",value:score},{label:"Current Streak",value:`${streak} days`},{label:"Full Power Hours",value:fullDays},{label:"Days Logged",value:allLogs.length},{label:"Custom Goals",value:goals.length}].map(s=>(
                <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${D.divider}`}}>
                  <div style={{fontSize:14,color:D.textSec}}>{s.label}</div>
                  <div style={{fontSize:16,fontWeight:700,color:D.brand,fontFamily:FF}}>{s.value}</div>
                </div>
              ))}
            </SettingsGroup>

            <SettingsGroup title="Scoring">
              <div style={{fontSize:13,color:D.textTert,lineHeight:2}}>
                <div>Core 4 item → <span style={{color:D.brand}}>10 pts</span></div>
                <div>Full Power Hour bonus → <span style={{color:D.brand}}>+20 pts</span></div>
                <div>Custom goal hit → <span style={{color:D.brand}}>5 pts</span></div>
              </div>
            </SettingsGroup>

            <button onClick={handleLogout} style={{width:"100%",padding:15,marginTop:8,background:"none",border:`1px solid rgba(255,90,95,0.3)`,color:D.danger,borderRadius:D.r12,cursor:"pointer",fontSize:15,fontWeight:600}}>Sign Out</button>
          </div>
        )}

        {/* ADMIN */}
        {screen==="admin"&&profile?.role==="manager"&&(
          <div style={{animation:"fadeUp 0.35s ease both"}}>
            <div style={{fontSize:22,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:1,marginBottom:16}}>Edit Requests</div>
            {editRequests.length===0&&<div style={{background:D.surface,borderRadius:D.r16,padding:40,textAlign:"center",color:D.textTert,border:`1px solid ${D.divider}`}}>All warriors are up to date ✓</div>}
            {editRequests.map(req=>(
              <div key={req.id} style={{background:D.surface,borderRadius:D.r16,padding:16,marginBottom:12,border:req.status==="pending"?"1px solid rgba(214,178,94,0.3)":req.status==="approved"?"1px solid rgba(53,193,139,0.3)":"1px solid rgba(255,90,95,0.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:600,color:D.textPrimary}}>{req.profiles?.name||"Unknown"}</div>
                    <div style={{fontSize:12,color:D.textTert,marginTop:2}}>{new Date(req.requested_date+"T12:00:00").toLocaleDateString("default",{weekday:"short",month:"short",day:"numeric"})}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:req.status==="pending"?D.brandMuted:req.status==="approved"?D.successMuted:"rgba(255,90,95,0.12)",color:req.status==="pending"?D.brand:req.status==="approved"?D.success:D.danger}}>{req.status}</span>
                </div>
                <div style={{fontSize:13,color:D.textSec,background:D.bg,borderRadius:D.r8,padding:"10px 12px",marginBottom:req.status==="pending"?12:0}}>"{req.reason}"</div>
                {req.status==="pending"?(
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>reviewEditRequest(req.id,"approved")} style={{flex:1,padding:10,background:D.successMuted,border:`1px solid rgba(53,193,139,0.3)`,color:D.success,borderRadius:D.r10,cursor:"pointer",fontSize:14,fontWeight:600}}>Approve</button>
                    <button onClick={()=>reviewEditRequest(req.id,"denied")}   style={{flex:1,padding:10,background:"rgba(255,90,95,0.08)",border:`1px solid rgba(255,90,95,0.2)`,color:D.danger,borderRadius:D.r10,cursor:"pointer",fontSize:14,fontWeight:600}}>Deny</button>
                  </div>
                ):(
                  <button onClick={()=>reviewEditRequest(req.id,"pending")} style={{padding:"8px 16px",background:D.surface2,border:`1px solid ${D.divider}`,color:D.textTert,borderRadius:D.r10,cursor:"pointer",fontSize:13,fontWeight:600}}>↩ Reset to Pending</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(7,10,15,0.96)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${D.divider}`,display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0 max(8px,env(safe-area-inset-bottom))"}}>
        {tabs.map(tab=>{
          const active=screen===tab.id;
          return(
            <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 10px",color:active?D.brand:D.textTert,transition:"color 0.2s"}}>
              <span style={{fontSize:20,lineHeight:1}}>{tab.icon}</span>
              <span style={{fontSize:10,fontWeight:600,letterSpacing:0.3}}>{tab.label}</span>
              {active&&<div style={{width:4,height:4,borderRadius:"50%",background:D.brand}}/>}
            </button>
          );
        })}
      </div>

      {showAddGoal&&<AddGoalSheet userId={user?.id} setGoals={setGoals} onClose={()=>setShowAddGoal(false)}/>}
    </div>
  );
}

function ProgressRing({pct,done,goalPct,monthPct}){
  const c4Circ=2*Math.PI*86;
  const c4Offset=c4Circ*(1-pct/100);
  const goalCirc=2*Math.PI*66;
  const goalOffset=goalCirc*(1-((goalPct||0)/100));
  const monCirc=2*Math.PI*48;
  const monOffset=monCirc*(1-((monthPct||0)/100));
  const c4Color=pct===100?D.success:D.brand;
  const c4Filter=pct===100?"drop-shadow(0 0 6px rgba(53,193,139,0.8))":"drop-shadow(0 0 6px rgba(214,178,94,0.6))";
  const trans="stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)";
  return(
    <div style={{position:"relative",width:"min(220px,58vw)",height:"min(220px,58vw)",margin:"0 auto"}}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" style={{transform:"rotate(-90deg)"}}>
        <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13"/>
        <circle cx="100" cy="100" r="86" fill="none" stroke={c4Color} strokeWidth="13" strokeLinecap="round" strokeDasharray={c4Circ} strokeDashoffset={c4Offset} style={{transition:trans,filter:c4Filter}}/>
        <circle cx="100" cy="100" r="66" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11"/>
        <circle cx="100" cy="100" r="66" fill="none" stroke="#4A9EF5" strokeWidth="11" strokeLinecap="round" strokeDasharray={goalCirc} strokeDashoffset={goalOffset} style={{transition:trans,filter:"drop-shadow(0 0 5px rgba(74,158,245,0.6))"}}/>
        <circle cx="100" cy="100" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
        <circle cx="100" cy="100" r="48" fill="none" stroke="#E06FBF" strokeWidth="10" strokeLinecap="round" strokeDasharray={monCirc} strokeDashoffset={monOffset} style={{transition:trans,filter:"drop-shadow(0 0 5px rgba(224,111,191,0.6))"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
        <div style={{fontSize:40,fontWeight:700,color:pct===100?D.success:D.textPrimary,fontFamily:FF,lineHeight:1,animation:pct===100?"popIn 0.4s ease both":"none"}}>{done}/4</div>
        <div style={{fontSize:11,color:D.textTert,letterSpacing:0.5}}>{pct===100?"Won today":"Core 4"}</div>
      </div>
    </div>
  );
}

function TaskRow({icon,label,desc,checked,onClick,accent,delay=0,progress}){
  return(
    <div className="task-row" onClick={onClick} style={{background:checked?"rgba(53,193,139,0.07)":D.surface,border:checked?"1px solid rgba(53,193,139,0.2)":"1px solid "+D.divider,borderRadius:D.r12,padding:"13px 15px",marginBottom:9,display:"flex",alignItems:"center",gap:13,cursor:"pointer",transition:"all 0.18s",animation:`fadeUp 0.3s ease ${delay}ms both`}}>
      <div style={{width:42,height:42,borderRadius:D.r10,flexShrink:0,background:checked?"rgba(53,193,139,0.12)":"rgba(255,255,255,0.04)",border:checked?"1px solid rgba(53,193,139,0.25)":"1px solid "+D.divider,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,transition:"all 0.18s"}}>
        {checked?<span style={{color:D.success,fontSize:17,fontWeight:700}}>✓</span>:icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:600,color:checked?D.success:D.textPrimary,transition:"color 0.18s"}}>{label}</div>
        <div style={{fontSize:12,color:D.textTert,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{desc}</div>
        {progress!==undefined&&<div style={{marginTop:6,background:"rgba(255,255,255,0.05)",borderRadius:2,height:3,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:accent||D.brand,borderRadius:2,transition:"width 0.5s"}}/></div>}
      </div>
      {checked&&<span style={{fontSize:13,flexShrink:0}}>🔥</span>}
    </div>
  );
}

function GoalsScreen({goals,setGoals,goalCompletions,userId,onAddGoal}){
  async function removeGoal(id){await supabase.from("goals").delete().eq("id",id);setGoals(prev=>prev.filter(g=>g.id!==id));}
  return(
    <div style={{animation:"fadeUp 0.35s ease both"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:1}}>Goals</div>
        <button onClick={onAddGoal} style={{background:D.brandMuted,border:`1px solid rgba(214,178,94,0.3)`,color:D.brand,borderRadius:D.r12,padding:"8px 16px",cursor:"pointer",fontSize:14,fontWeight:600}}>+ Add</button>
      </div>
      <div style={{background:D.surface,borderRadius:D.r16,padding:16,marginBottom:16,border:`1px solid ${D.divider}`}}>
        <div style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Core 4 — Daily</div>
        {CORE4.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<3?`1px solid ${D.divider}`:"none"}}>
            <span style={{fontSize:18}}>{item.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:D.textPrimary}}>{item.label}</div>
              <div style={{fontSize:11,color:D.textTert}}>{item.desc}</div>
            </div>
            <div style={{fontSize:11,color:D.brand,fontWeight:600}}>Daily</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Custom Goals</div>
      {goals.length===0&&<div style={{background:D.surface,borderRadius:D.r16,padding:40,textAlign:"center",color:D.textTert,border:`1px solid ${D.divider}`}}>No custom goals yet.<br/><span style={{color:D.brand,cursor:"pointer"}} onClick={onAddGoal}>Add your first goal →</span></div>}
      {goals.map(goal=>{
        const dc=goalCompletions.filter(gc=>gc.goal_id===goal.id).length;
        const pct=Math.min(100,Math.round((dc/goal.target)*100));
        return(
          <div key={goal.id} style={{background:D.surface,borderRadius:D.r16,padding:16,marginBottom:10,border:`1px solid ${D.divider}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:goal.color,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:D.textPrimary}}>{goal.name}</div>
                  <div style={{fontSize:12,color:D.textTert,marginTop:1}}>Target: {goal.target} {goal.unit}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:700,color:goal.color,fontFamily:FF,lineHeight:1}}>{dc}</div><div style={{fontSize:10,color:D.textTert}}>of {goal.target}</div></div>
                <button onClick={()=>removeGoal(goal.id)} style={{background:"none",border:"none",color:D.textTert,cursor:"pointer",fontSize:15,padding:4}}>✕</button>
              </div>
            </div>
            <div style={{background:D.bg,borderRadius:4,height:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:goal.color,borderRadius:4,transition:"width 0.5s"}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:D.textTert,marginTop:6}}><span>Progress</span><span style={{color:goal.color}}>{pct}%</span></div>
          </div>
        );
      })}
    </div>
  );
}

function AddGoalSheet({userId,setGoals,onClose}){
  const [name,setName]=useState("");
  const [target,setTarget]=useState(20);
  const [unit,setUnit]=useState("times");
  const [color,setColor]=useState(GOAL_COLORS[0]);
  const [saving,setSaving]=useState(false);
  async function save(){
    if(!name.trim())return;
    setSaving(true);
    const {data}=await supabase.from("goals").insert({user_id:userId,name:name.trim(),target:Number(target),unit,color}).select().single();
    if(data)setGoals(prev=>[...prev,data]);
    onClose();
  }
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",background:D.surface2,borderRadius:"20px 20px 0 0",padding:"8px 20px 48px",animation:"fadeUp 0.28s ease both",border:`1px solid ${D.divider}`}}>
        <div style={{width:36,height:4,background:D.divider,borderRadius:2,margin:"12px auto 22px"}}/>
        <div style={{fontSize:18,fontWeight:700,color:D.textPrimary,marginBottom:20}}>New Goal</div>
        <label style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:6}}>GOAL NAME</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Go to gym" style={{width:"100%",background:D.bg,border:`1px solid ${D.divider}`,borderRadius:D.r10,padding:"12px 14px",color:D.textPrimary,fontSize:15,outline:"none",marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <label style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:6}}>TARGET</label>
            <input type="number" value={target} onChange={e=>setTarget(e.target.value)} min={1} style={{width:"100%",background:D.bg,border:`1px solid ${D.divider}`,borderRadius:D.r10,padding:"12px 14px",color:D.textPrimary,fontSize:15,outline:"none"}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:6}}>UNIT</label>
            <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="times" style={{width:"100%",background:D.bg,border:`1px solid ${D.divider}`,borderRadius:D.r10,padding:"12px 14px",color:D.textPrimary,fontSize:15,outline:"none"}}/>
          </div>
        </div>
        <label style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:10}}>COLOR</label>
        <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
          {GOAL_COLORS.map(c=>(
            <div key={c} onClick={()=>setColor(c)} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent",boxShadow:color===c?`0 0 0 2px ${c}`:"none",transition:"all 0.15s"}}/>
          ))}
        </div>
        <button onClick={save} disabled={saving||!name.trim()} style={{width:"100%",padding:15,background:D.brand,border:"none",borderRadius:D.r12,cursor:"pointer",color:"#000",fontSize:16,fontWeight:700,opacity:saving||!name.trim()?0.5:1}}>
          {saving?"Saving…":"Save Goal"}
        </button>
      </div>
    </div>
  );
}

function EditRequestCard({selectedDate,editRequests,requestReason,setRequestReason,requestMsg,onSubmit}){
  const pending=editRequests.some(r=>r.requested_date===selectedDate&&r.status==="pending");
  const denied=editRequests.some(r=>r.requested_date===selectedDate&&r.status==="denied");
  return(
    <div style={{background:D.surface,borderRadius:D.r16,padding:20,marginBottom:12,border:`1px solid rgba(214,178,94,0.18)`}}>
      <div style={{fontSize:15,fontWeight:700,color:D.textPrimary,marginBottom:6}}>🔒 Edit Request Required</div>
      <div style={{fontSize:13,color:D.textTert,marginBottom:16,lineHeight:1.6}}>Past days require manager approval. Tell them why you missed logging.</div>
      {pending?<div style={{background:D.brandMuted,borderRadius:D.r10,padding:"10px 14px",fontSize:13,color:D.brand}}>⏳ Request pending — waiting for approval</div>
      :denied?<div style={{background:"rgba(255,90,95,0.08)",borderRadius:D.r10,padding:"10px 14px",fontSize:13,color:D.danger}}>❌ Request denied — contact your manager</div>
      :(
        <>
          <textarea value={requestReason} onChange={e=>setRequestReason(e.target.value)} placeholder="Why do you need to edit this day?" rows={3} style={{width:"100%",background:D.bg,border:`1px solid ${D.divider}`,borderRadius:D.r10,padding:"12px 14px",color:D.textPrimary,fontSize:13,outline:"none",resize:"vertical",marginBottom:10}}/>
          {requestMsg&&<div style={{fontSize:12,color:requestMsg.startsWith("✅")?D.success:D.danger,marginBottom:10}}>{requestMsg}</div>}
          <button onClick={onSubmit} disabled={!requestReason.trim()} style={{padding:"11px 22px",background:D.brandMuted,border:`1px solid rgba(214,178,94,0.3)`,color:D.brand,borderRadius:D.r10,cursor:"pointer",fontSize:14,fontWeight:600,opacity:!requestReason.trim()?0.5:1}}>Send Request</button>
        </>
      )}
    </div>
  );
}

function AuthScreen({mode,setMode,email,setEmail,password,setPassword,name,setName,onLogin,onSignup,loading,error}){
  const isS=mode==="signup";
  const inp={width:"100%",background:D.surface,border:`1px solid ${D.divider}`,borderRadius:D.r12,padding:"14px 16px",color:D.textPrimary,fontSize:15,outline:"none"};
  return(
    <div style={{minHeight:"100vh",background:D.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:FB}}>
      <GS/>
      <div style={{width:"100%",maxWidth:380,animation:"fadeUp 0.5s ease both"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:32}}>
          <img src={WW_LOGO} alt="WW" style={{height:46,width:46,objectFit:"contain",borderRadius:10,background:D.surface,padding:6}}/>
          <span style={{color:D.textTert,fontSize:18}}>×</span>
          <img src={B49_LOGO} alt="B49" style={{height:46,width:46,objectFit:"contain",borderRadius:10,background:D.surface,padding:6}}/>
        </div>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:34,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:3,lineHeight:1}}>POWER HOUR</div>
          <div style={{fontSize:12,color:D.brand,letterSpacing:4,marginTop:8,fontWeight:600}}>#WARRIORSWAY</div>
          <div style={{fontSize:12,color:D.textTert,marginTop:6,letterSpacing:1}}>Real · Raw · Relevant · Results</div>
        </div>
        {isS&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={{...inp,marginBottom:10}}/>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Work email" type="email" style={{...inp,marginBottom:10}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==="Enter"&&(isS?onSignup():onLogin())} style={{...inp,marginBottom:16}}/>
        {error&&<div style={{fontSize:13,color:error.startsWith("✅")?D.success:D.danger,background:error.startsWith("✅")?D.successMuted:"rgba(255,90,95,0.1)",borderRadius:D.r10,padding:"10px 14px",marginBottom:14}}>{error}</div>}
        <button onClick={isS?onSignup:onLogin} disabled={loading} style={{width:"100%",padding:15,background:D.brand,border:"none",borderRadius:D.r12,cursor:"pointer",color:"#000",fontSize:16,fontWeight:700,opacity:loading?0.5:1,marginBottom:14}}>
          {loading?"…":isS?"Join the Arena":"Enter the Arena"}
        </button>
        <div style={{textAlign:"center",fontSize:14,color:D.textTert}}>
          {isS?"Already have an account? ":"New warrior? "}
          <span style={{color:D.brand,cursor:"pointer",fontWeight:600}} onClick={()=>setMode(isS?"login":"signup")}>{isS?"Sign in":"Create account"}</span>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:D.textTert,marginTop:8}}>Use your work email to join the team</div>
      </div>
    </div>
  );
}

function LeaderboardScreen({leaderboard,allLogs,goalCompletions,userId,now2}){
  const [filter,setFilter]=useState("month"); // week | month | alltime

  // Get week start
  const weekStart=new Date(now2);
  weekStart.setDate(now2.getDate()-now2.getDay());
  const weekKey=weekStart.toISOString().slice(0,10);
  const monthKey=now2.toISOString().slice(0,7);

  // We use the precomputed leaderboard but can sort/label differently
  const sorted=[...leaderboard].sort((a,b)=>b.score-a.score);
  const myRank=sorted.findIndex(e=>e.id===userId);
  const me=sorted[myRank];

  const segments=[
    {id:"week",  label:"This Week"},
    {id:"month", label:"This Month"},
    {id:"alltime",label:"All Time"},
  ];

  return(
    <div style={{animation:"fadeUp 0.35s ease both"}}>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:1}}>Leaderboard</div>
        <div style={{fontSize:13,color:D.textTert,marginTop:2}}>{leaderboard.length} warriors competing</div>
      </div>

      {/* Segmented Control */}
      <div style={{display:"flex",background:D.surface,borderRadius:D.r12,padding:4,marginBottom:20,border:`1px solid ${D.divider}`}}>
        {segments.map(seg=>(
          <button key={seg.id} onClick={()=>setFilter(seg.id)} style={{
            flex:1,padding:"9px 4px",border:"none",cursor:"pointer",
            borderRadius:D.r10,fontSize:13,fontWeight:600,letterSpacing:0.2,
            background:filter===seg.id?D.brand:"none",
            color:filter===seg.id?"#000":D.textTert,
            transition:"all 0.2s",
          }}>{seg.label}</button>
        ))}
      </div>

      {/* Filter note */}
      {filter!=="alltime"&&(
        <div style={{fontSize:12,color:D.textTert,marginBottom:14,textAlign:"center"}}>
          {filter==="week"?"Rankings reflect all-time points — weekly filtering coming soon":"Rankings reflect cumulative points this platform"}
        </div>
      )}

      {/* Top 3 podium */}
      {sorted.length>=3&&(
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8,marginBottom:20}}>
          {/* 2nd */}
          <div style={{flex:1,textAlign:"center",animation:"fadeUp 0.4s ease 80ms both"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:D.surface2,border:"2px solid #9E9E9E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#9E9E9E",margin:"0 auto 6px"}}>
              {sorted[1]?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{fontSize:12,fontWeight:600,color:D.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80,margin:"0 auto"}}>{sorted[1]?.name?.split(" ")[0]}</div>
            <div style={{fontSize:16,fontWeight:700,color:"#9E9E9E",fontFamily:FF}}>{sorted[1]?.score}</div>
            <div style={{background:D.surface2,border:"1px solid #9E9E9E44",borderRadius:"6px 6px 0 0",height:60,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>2</div>
          </div>
          {/* 1st */}
          <div style={{flex:1,textAlign:"center",animation:"fadeUp 0.4s ease 0ms both"}}>
            <div style={{fontSize:24,marginBottom:4}}>👑</div>
            <div style={{width:56,height:56,borderRadius:"50%",background:D.brandMuted,border:`2px solid ${D.brand}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:D.brand,margin:"0 auto 6px",boxShadow:`0 0 16px rgba(214,178,94,0.3)`}}>
              {sorted[0]?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{fontSize:13,fontWeight:700,color:D.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90,margin:"0 auto"}}>{sorted[0]?.name?.split(" ")[0]}</div>
            <div style={{fontSize:20,fontWeight:700,color:D.brand,fontFamily:FF}}>{sorted[0]?.score}</div>
            <div style={{background:D.brandMuted,border:`1px solid rgba(214,178,94,0.3)`,borderRadius:"6px 6px 0 0",height:80,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>1</div>
          </div>
          {/* 3rd */}
          <div style={{flex:1,textAlign:"center",animation:"fadeUp 0.4s ease 120ms both"}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:D.surface2,border:"2px solid #A0522D",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#A0522D",margin:"0 auto 6px"}}>
              {sorted[2]?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{fontSize:12,fontWeight:600,color:D.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80,margin:"0 auto"}}>{sorted[2]?.name?.split(" ")[0]}</div>
            <div style={{fontSize:15,fontWeight:700,color:"#A0522D",fontFamily:FF}}>{sorted[2]?.score}</div>
            <div style={{background:D.surface2,border:"1px solid #A0522D44",borderRadius:"6px 6px 0 0",height:44,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>3</div>
          </div>
        </div>
      )}

      {/* Full rankings list (4th+) */}
      <div style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Rankings</div>
      {sorted.map((entry,i)=>{
        const isYou=entry.id===userId;
        const initials=entry.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?";
        return(
          <div key={entry.id} style={{
            background:isYou?`rgba(53,193,139,0.07)`:D.surface,
            border:isYou?"1px solid rgba(53,193,139,0.2)":"1px solid "+D.divider,
            borderRadius:D.r12,padding:"12px 14px",marginBottom:8,
            display:"flex",alignItems:"center",gap:12,
            animation:`fadeUp 0.3s ease ${i*30}ms both`,
          }}>
            {/* Rank number */}
            <div style={{width:26,flexShrink:0,textAlign:"center",fontSize:13,fontWeight:700,color:i===0?D.brand:i===1?"#9E9E9E":i===2?"#A0522D":D.textTert,fontFamily:FF}}>
              {i+1}
            </div>
            {/* Avatar */}
            <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:isYou?"rgba(53,193,139,0.15)":D.surface2,border:isYou?"1px solid rgba(53,193,139,0.3)":"1px solid "+D.divider,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:isYou?D.success:D.textSec}}>
              {initials}
            </div>
            {/* Name + stats */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:isYou?D.success:D.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {entry.name}{isYou&&<span style={{fontSize:10,color:D.textTert,marginLeft:6,fontWeight:400}}>you</span>}
              </div>
              <div style={{fontSize:11,color:D.textTert,marginTop:1,display:"flex",gap:8}}>
                <span>{entry.streak>0?"🔥":"⬜"} {entry.streak}d</span>
                <span>·</span>
                <span>{entry.fullDays} full days</span>
              </div>
            </div>
            {/* Score */}
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:20,fontWeight:700,color:isYou?D.success:D.brand,fontFamily:FF,lineHeight:1}}>{entry.score}</div>
              <div style={{fontSize:10,color:D.textTert}}>pts</div>
            </div>
          </div>
        );
      })}

      {/* Pinned your rank card */}
      {myRank>2&&me&&(
        <div style={{
          position:"sticky",bottom:92,
          background:`rgba(13,18,32,0.96)`,
          backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          borderRadius:D.r12,padding:"12px 14px",
          border:`1px solid rgba(53,193,139,0.3)`,
          display:"flex",alignItems:"center",gap:12,
          marginTop:8,
          boxShadow:"0 -4px 20px rgba(0,0,0,0.4)",
        }}>
          <div style={{fontSize:13,fontWeight:700,color:D.textTert,fontFamily:FF,width:26,textAlign:"center"}}>#{myRank+1}</div>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(53,193,139,0.15)",border:"1px solid rgba(53,193,139,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:D.success}}>
            {me.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:D.success}}>{me.name} <span style={{fontSize:10,color:D.textTert,fontWeight:400}}>you</span></div>
            <div style={{fontSize:11,color:D.textTert}}>{me.streak>0?"🔥 "+me.streak+"d streak":"no streak"} · {me.fullDays} full days</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:20,fontWeight:700,color:D.success,fontFamily:FF,lineHeight:1}}>{me.score}</div>
            <div style={{fontSize:10,color:D.textTert}}>pts</div>
          </div>
        </div>
      )}

      {/* Scoring info */}
      <div style={{marginTop:16,background:D.surface,borderRadius:D.r12,padding:"14px 16px",border:`1px solid ${D.divider}`}}>
        <div style={{fontSize:11,color:D.textTert,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Scoring</div>
        <div style={{display:"flex",gap:0}}>
          {[{label:"Core 4 item",pts:"10"},{label:"Full Power Hour",pts:"+20"},{label:"Custom goal",pts:"5"}].map((s,i)=>(
            <div key={i} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRight:i<2?`1px solid ${D.divider}`:"none"}}>
              <div style={{fontSize:18,fontWeight:700,color:D.brand,fontFamily:FF,lineHeight:1}}>{s.pts}</div>
              <div style={{fontSize:10,color:D.textTert,marginTop:4,lineHeight:1.3}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen(){
  const [dots,setDots]=useState(0);
  const [phase,setPhase]=useState(0);
  const phases=["Initializing","Loading warriors","Entering the arena"];
  useEffect(()=>{
    const d=setInterval(()=>setDots(x=>(x+1)%4),400);
    const p=setInterval(()=>setPhase(x=>Math.min(x+1,phases.length-1)),900);
    return()=>{clearInterval(d);clearInterval(p);};
  },[]);
  return(
    <div style={{minHeight:"100vh",background:D.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FB,overflow:"hidden"}}>
      <GS/>
      <div style={{position:"relative",width:240,height:280,marginBottom:32}}>
        {[{dx:"-42px",dy:"-32px",x:100,y:160},{dx:"52px",dy:"-42px",x:120,y:155},{dx:"-62px",dy:"-22px",x:90,y:170},{dx:"66px",dy:"-16px",x:135,y:165},{dx:"-22px",dy:"-56px",x:108,y:150},{dx:"32px",dy:"-52px",x:115,y:148}].map((p,i)=>(
          <div key={i} style={{position:"absolute",left:p.x,top:p.y,width:6,height:6,borderRadius:"50%",background:"#2a1a08","--dx":p.dx,"--dy":p.dy,animation:`dirtFly 0.8s ease-out ${0.2+i*0.06}s both`}}/>
        ))}
        <svg viewBox="0 0 240 60" style={{position:"absolute",bottom:0,left:0,width:"100%",opacity:0.9}}>
          <ellipse cx="120" cy="45" rx="100" ry="18" fill="#050302"/>
          <ellipse cx="120" cy="40" rx="80"  ry="10" fill="#0a0703"/>
          <line x1="120" y1="26" x2="88"  y2="38" stroke="#150e04" strokeWidth="2"/>
          <line x1="120" y1="26" x2="152" y2="36" stroke="#150e04" strokeWidth="2"/>
          <ellipse cx="120" cy="28" rx="16" ry="5" fill={D.brand} opacity="0.25"/>
        </svg>
        <svg viewBox="0 0 120 100" style={{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",width:120,height:100,animation:"rootGrow 0.6s ease-out 0.4s both"}}>
          <path d="M60 0 Q45 30 25 55 Q15 70 10 90" stroke={D.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
          <path d="M60 0 Q75 28 95 52 Q105 68 110 88" stroke={D.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
          <path d="M60 0 Q58 35 55 70 Q53 82 50 95" stroke={D.brand} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M40 35 Q28 45 18 55" stroke={D.brand} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
          <path d="M80 32 Q92 42 100 54" stroke={D.brand} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
          <path d="M35 55 Q22 62 14 72" stroke={D.brand} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
          <path d="M85 50 Q98 58 106 70" stroke={D.brand} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
        </svg>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",animation:"erupt 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both"}}>
          <svg viewBox="0 0 160 160" width="160" height="160" style={{animation:"glowPulse 2s ease-in-out 1s infinite"}}>
            <rect x="8"  y="62" width="52" height="14" rx="7" fill="#f0e8d0"/>
            <rect x="100" y="62" width="52" height="14" rx="7" fill="#f0e8d0"/>
            <circle cx="12"  cy="69" r="7" fill="#e0d0b0"/>
            <circle cx="148" cy="69" r="7" fill="#e0d0b0"/>
            <rect x="52" y="54" width="56" height="52" rx="10" fill="#f5e6c8"/>
            <rect x="55" y="50" width="12" height="16" rx="6" fill="#f0ddb8"/>
            <rect x="70" y="47" width="13" height="18" rx="6" fill="#f0ddb8"/>
            <rect x="86" y="48" width="12" height="17" rx="6" fill="#f0ddb8"/>
            <rect x="100" y="51" width="10" height="15" rx="5" fill="#f0ddb8"/>
            <ellipse cx="54" cy="74" rx="8" ry="12" fill="#f0ddb8"/>
            <rect x="60" y="100" width="40" height="20" rx="4" fill="#e8d5b0"/>
            <text x="80" y="86" textAnchor="middle" fill={D.bg} style={{fontSize:22,fontWeight:900,fontFamily:FF,letterSpacing:-1}}>49</text>
          </svg>
        </div>
      </div>
      <div style={{textAlign:"center",animation:"fadeUp 0.6s ease 0.9s both"}}>
        <div style={{fontSize:32,fontWeight:700,color:D.textPrimary,fontFamily:FF,letterSpacing:4,marginBottom:6}}>POWER HOUR</div>
        <div style={{fontSize:12,color:D.brand,letterSpacing:4,marginBottom:28,fontWeight:600}}>#WARRIORSWAY</div>
        <div style={{fontSize:12,color:D.textTert,letterSpacing:2,marginBottom:12,height:18}}>{phases[phase]}{".".repeat(dots)}</div>
        <div style={{width:160,height:2,background:D.surface,borderRadius:2,overflow:"hidden",margin:"0 auto"}}>
          <div style={{height:"100%",width:`${((phase+1)/phases.length)*100}%`,background:D.brand,borderRadius:2,transition:"width 0.9s ease"}}/>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({children,style}){
  return <div style={{fontSize:11,fontWeight:600,color:D.textTert,letterSpacing:1,textTransform:"uppercase",marginBottom:10,...style}}>{children}</div>;
}

function SettingsGroup({title,children}){
  return(
    <div style={{background:D.surface,borderRadius:D.r16,padding:16,marginBottom:12,border:`1px solid ${D.divider}`}}>
      <div style={{fontSize:11,fontWeight:600,color:D.textTert,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{title}</div>
      {children}
    </div>
  );
}

function SettingsToggle({label,sub,value,onChange}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}>
      <div>
        <div style={{fontSize:15,fontWeight:600,color:D.textPrimary}}>{label}</div>
        {sub&&<div style={{fontSize:12,color:D.textTert,marginTop:2}}>{sub}</div>}
      </div>
      <button onClick={onChange} style={{width:50,height:28,borderRadius:14,border:"none",cursor:"pointer",position:"relative",background:value?D.brand:D.surface2,transition:"background 0.25s",flexShrink:0}}>
        <div style={{position:"absolute",top:3,left:value?23:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
      </button>
    </div>
  );
}
