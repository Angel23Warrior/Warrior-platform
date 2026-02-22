import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ntcsjtyiefusaqsehgfl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3NqdHlpZWZ1c2Fxc2VoZ2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MzcsImV4cCI6MjA4NzMwMTgzN30.NRlzdtfR6BiEwZGRe5VJKVlo8i5-qmI9cmUkzHgTgV8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { WW_LOGO, B49_LOGO } from "./logos.js";

const CORE4 = [
  { id:"movement", icon:"⚡", label:"15 Min Movement",       desc:"Train, stretch, or sweat — move your body first." },
  { id:"god",      icon:"🙏", label:"15 Min With God",        desc:"Prayer, meditation, or quiet reflection." },
  { id:"vanity",   icon:"💌", label:"2 Vanity Notes",         desc:"Thank someone or express love — 2 notes before the world wakes." },
  { id:"business", icon:"📖", label:"Business Listen / Read", desc:"Consume, capture a key insight, share it." },
];

const GOAL_COLORS = ["#c9a84c","#4caf50","#2196f3","#e91e63","#9c27b0","#00bcd4","#ff5722","#8bc34a"];
const MF = "'Barlow Condensed','Oswald','Impact',sans-serif";
const BF = "'Avenir Next','Avenir','Century Gothic',sans-serif";

// ── Theme definitions ──────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:         "#f7f4ef",
    card:       "#ffffff",
    cardBorder: "#e0d8cc",
    cardBorderTop: "#c9a84c",
    text:       "#1a1a2e",
    textSub:    "#8a7a6a",
    textMuted:  "#aaaaaa",
    sectionText:"#1B3A5C",
    inputBg:    "#ffffff",
    inputBorder:"#dddddd",
    inputText:  "#1a1a2e",
    progressBg: "#e8e0d4",
    rankBg:     "#dddddd",
    rankText:   "#666666",
    youBg:      "linear-gradient(135deg,#eef4fa,#e8f0e8)",
    youBorder:  "#1B6CA8",
    scoringBg:  "#ffffff",
    futureCard: "#f9f7f4",
  },
  dark: {
    bg:         "#0a0a0a",
    card:       "#111111",
    cardBorder: "#2a1e14",
    cardBorderTop: "#c9a84c",
    text:       "#f0e6d3",
    textSub:    "#7a6a5a",
    textMuted:  "#5a4a3a",
    sectionText:"#c9a84c",
    inputBg:    "#1a1410",
    inputBorder:"#3a2a1a",
    inputText:  "#f0e6d3",
    progressBg: "#2a1e14",
    rankBg:     "#2a1a0a",
    rankText:   "#9a7a5a",
    youBg:      "linear-gradient(135deg,#1a2a0a,#1e1410)",
    youBorder:  "#4a7a20",
    scoringBg:  "#111111",
    futureCard: "#0d0d0d",
  }
};

function todayStr() { return new Date().toISOString().slice(0,10); }

export default function WarriorPlatform() {
  const [screen, setScreen]       = useState("loading");
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [todayLog, setTodayLog]   = useState({});
  const [goals, setGoals]         = useState([]);
  const [goalCompletions, setGoalCompletions] = useState([]);
  const [allLogs, setAllLogs]     = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [authMode, setAuthMode]   = useState("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [name, setName]           = useState("");
  const [authError, setAuthError] = useState("");
  const [calYear, setCalYear]       = useState(new Date().getFullYear());
  const [editRequests, setEditRequests] = useState([]);
  const [requestReason, setRequestReason] = useState("");
  const [requestingDate, setRequestingDate] = useState(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [calMonth, setCalMonth]   = useState(new Date().getMonth());
  const [darkMode, setDarkMode]   = useState(() => {
    try { return localStorage.getItem("warrior-dark") === "true"; } catch { return false; }
  });

  const T = THEMES[darkMode ? "dark" : "light"];

  useEffect(() => {
    try { localStorage.setItem("warrior-dark", darkMode); } catch {}
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadUserData(session.user.id); setScreen("dashboard"); }
      else setScreen("login");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); loadUserData(session.user.id); setScreen("dashboard"); }
      else { setUser(null); setScreen("login"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(uid) {
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(prof);
    const { data: log } = await supabase.from("daily_logs").select("*").eq("user_id", uid).eq("log_date", todayStr()).single();
    setTodayLog(log || {});
    const { data: logs } = await supabase.from("daily_logs").select("*").eq("user_id", uid);
    setAllLogs(logs || []);
    const { data: g } = await supabase.from("goals").select("*").eq("user_id", uid);
    setGoals(g || []);
    const { data: gc } = await supabase.from("goal_completions").select("*").eq("user_id", uid);
    setGoalCompletions(gc || []);
    await loadLeaderboard();
    await loadEditRequests(uid);
  }

  async function loadEditRequests(uid) {
    const { data: profData } = await supabase.from("profiles").select("role").eq("id", uid).single();
    if (profData?.role === "manager") {
      // Load all requests first
      const { data: requests } = await supabase
        .from("edit_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!requests) { setEditRequests([]); return; }
      // Then load profile names separately
      const { data: profiles } = await supabase.from("profiles").select("id, name, email");
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
      const enriched = requests.map(r => ({ ...r, profiles: profileMap[r.user_id] || null }));
      setEditRequests(enriched);
    } else {
      const { data } = await supabase
        .from("edit_requests")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      setEditRequests(data || []);
    }
  }

  async function loadLeaderboard() {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: logs }     = await supabase.from("daily_logs").select("*");
    const { data: gcs }      = await supabase.from("goal_completions").select("*");
    if (!profiles) return;
    const board = profiles.map(p => {
      const uLogs = (logs||[]).filter(l => l.user_id===p.id);
      const uGCs  = (gcs||[]).filter(g => g.user_id===p.id);
      let score = 0;
      for (const l of uLogs) {
        const c4 = [l.movement,l.god,l.vanity,l.business].filter(Boolean).length;
        score += c4*10; if (c4===4) score+=20;
      }
      score += uGCs.length*5;
      let streak=0;
      const today=new Date();
      for(let i=0;i<365;i++){
        const d=new Date(today); d.setDate(today.getDate()-i);
        const k=d.toISOString().slice(0,10);
        const l=uLogs.find(x=>x.log_date===k);
        if(l&&l.movement&&l.god&&l.vanity&&l.business) streak++;
        else if(i>0) break;
      }
      const fullDays = uLogs.filter(l=>l.movement&&l.god&&l.vanity&&l.business).length;
      return { ...p, score, streak, fullDays };
    });
    setLeaderboard(board.sort((a,b)=>b.score-a.score));
  }

  async function handleSignup() {
    if (!email||!password||!name) { setAuthError("Please fill in all fields."); return; }
    setLoading(true); setAuthError("");
    const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ name } } });
    if (error) setAuthError(error.message);
    else setAuthError("✅ Check your email to confirm your account, then sign in.");
    setLoading(false);
  }

  async function handleLogin() {
    if (!email||!password) { setAuthError("Please enter email and password."); return; }
    setLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  function isPastDay(dateStr) {
    return dateStr < todayStr();
  }

  function hasApprovedRequest(dateStr) {
    return editRequests.some(r => r.requested_date === dateStr && r.status === "approved");
  }

  async function toggleCore4(field) {
    const dateKey = selectedDate;
    const currentLog = allLogs.find(l=>l.log_date===dateKey) || {};
    const newVal = !currentLog[field];
    if (currentLog.id) {
      await supabase.from("daily_logs").update({ [field]:newVal }).eq("id", currentLog.id);
    } else {
      const { data } = await supabase.from("daily_logs").insert({ user_id:user.id, log_date:dateKey, [field]:newVal }).select().single();
      if (data) {
        setAllLogs(prev => [...prev.filter(l=>l.log_date!==dateKey), data]);
        if (dateKey===todayStr()) setTodayLog(data);
        await loadLeaderboard();
        return;
      }
    }
    const updated = { ...currentLog, [field]:newVal };
    setAllLogs(prev => [...prev.filter(l=>l.log_date!==dateKey), { ...updated, log_date:dateKey }]);
    if (dateKey===todayStr()) setTodayLog(updated);
    await loadLeaderboard();
  }

  async function toggleGoalCompletion(goalId) {
    const dateKey = selectedDate;
    const exists = goalCompletions.find(gc=>gc.goal_id===goalId&&gc.completion_date===dateKey);
    if (exists) {
      await supabase.from("goal_completions").delete().eq("id", exists.id);
      setGoalCompletions(prev=>prev.filter(gc=>gc.id!==exists.id));
    } else {
      const { data } = await supabase.from("goal_completions").insert({ user_id:user.id, goal_id:goalId, completion_date:dateKey }).select().single();
      if (data) setGoalCompletions(prev=>[...prev,data]);
    }
    await loadLeaderboard();
  }

  async function togglePrivate() {
    const newVal = !profile.is_private;
    await supabase.from("profiles").update({ is_private:newVal }).eq("id", user.id);
    setProfile(p=>({...p,is_private:newVal}));
    await loadLeaderboard();
  }

  async function submitEditRequest() {
    if (!requestReason.trim()) return;
    setRequestMsg("");
    const { error } = await supabase.from("edit_requests").insert({
      user_id: user.id,
      requested_date: requestingDate,
      reason: requestReason.trim(),
      status: "pending"
    });
    if (error) {
      setRequestMsg("❌ Error submitting request. Please try again.");
    } else {
      setRequestMsg("✅ Request sent to your manager!");
      setRequestReason("");
      setRequestingDate(null);
      await loadEditRequests(user.id);
    }
  }

  async function reviewEditRequest(requestId, status) {
    await supabase.from("edit_requests").update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    }).eq("id", requestId);
    await loadEditRequests(user.id);
  }

  const streak     = (() => { let s=0; const t=new Date(); for(let i=0;i<365;i++){const d=new Date(t);d.setDate(t.getDate()-i);const k=d.toISOString().slice(0,10);const l=allLogs.find(x=>x.log_date===k);if(l&&l.movement&&l.god&&l.vanity&&l.business)s++;else if(i>0)break;}return s;})();
  const score      = (() => { let s=0; for(const l of allLogs){const c4=[l.movement,l.god,l.vanity,l.business].filter(Boolean).length;s+=c4*10;if(c4===4)s+=20;} s+=goalCompletions.length*5; return s; })();
  const selectedLog = allLogs.find(l=>l.log_date===selectedDate) || {};
  const core4Done  = ["movement","god","vanity","business"].filter(f=>selectedLog[f]).length;
  const joinDate   = profile?.join_date ? new Date(profile.join_date) : new Date();
  const now2 = new Date();
  const daysInCurrentMonth = new Date(now2.getFullYear(), now2.getMonth()+1, 0).getDate();
  const daysPassed = now2.getDate();
  const journeyPct = Math.round(((daysPassed-1)/daysInCurrentMonth)*100);
  const monthPrefix = now2.toISOString().slice(0,7);
  const fullDays = allLogs.filter(l=>l.log_date.startsWith(monthPrefix)&&l.movement&&l.god&&l.vanity&&l.business).length;
  const completionPct = Math.round((fullDays/daysInCurrentMonth)*100);

  if (screen==="loading") return <Loader />;
  if (screen==="login"||screen==="signup") return (
    <AuthScreen mode={authMode} setMode={setAuthMode} email={email} setEmail={setEmail}
      password={password} setPassword={setPassword} name={name} setName={setName}
      onLogin={handleLogin} onSignup={handleSignup} loading={loading} error={authError} />
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:BF, transition:"background 0.3s, color 0.3s" }}>

      {/* ── HEADER ── */}
      <div style={{ background:"linear-gradient(135deg,#0d1b2a 0%,#1B3A5C 100%)", borderBottom:"3px solid #c9a84c", padding:"18px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:12, flexWrap:"wrap" }}>
          <LogoBox src={WW_LOGO} alt="Warrior Week" />
          <div style={{ fontSize:28, color:"#c9a84c", fontWeight:700, fontFamily:MF }}>×</div>
          <LogoBox src={B49_LOGO} alt="Branch 49" />
        </div>
        <div style={{ textAlign:"center", marginBottom:12 }}>
          <div style={{ fontSize:32, fontFamily:MF, fontWeight:700, letterSpacing:4, color:"#fff", textTransform:"uppercase", textShadow:"0 2px 8px rgba(0,0,0,0.5)" }}>POWER HOUR PLATFORM</div>
          <div style={{ fontSize:13, color:"#c9a84c", letterSpacing:3, textTransform:"uppercase", fontFamily:MF, fontWeight:700 }}>#WARRIORSWAY</div>
          <div style={{ fontSize:11, color:"#8da0b5", letterSpacing:2, marginTop:2 }}>REAL • RAW • RELEVANT • RESULTS</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          <div style={{ fontSize:13, color:"#c9a84c", fontFamily:MF, letterSpacing:1 }}>{profile?.name?.toUpperCase()}</div>
          <GoldChip>🔥 {streak} STREAK</GoldChip>
          <GoldChip>⭐ {score} PTS</GoldChip>
          <button onClick={()=>setDarkMode(d=>!d)} style={{ background:"none", border:"1px solid #c9a84c44", color:"#8da0b5", padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:13, fontFamily:MF, letterSpacing:1 }}>
            {darkMode ? "☀️ LIGHT" : "🌙 DARK"}
          </button>
          <button onClick={togglePrivate} style={{ background:"none", border:"1px solid #c9a84c44", color:"#8da0b5", padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:11, fontFamily:BF }}>
            {profile?.is_private?"🔒 Private":"🌐 Sharing"}
          </button>
          <button onClick={handleLogout} style={{ background:"none", border:"1px solid #ffffff22", color:"#5a7a9a", padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:11, fontFamily:BF }}>
            Sign Out
          </button>
        </div>
        <div style={{ padding:"0 4px" }}>
          <ProgressBar label="30-Day Journey" right={`${now2.toLocaleString("default",{month:"long"})} — Day ${daysPassed} of ${daysInCurrentMonth}`} pct={journeyPct} color="linear-gradient(90deg,#c9a84c,#e8c96c)" />
          <div style={{ marginTop:8 }} />
          <ProgressBar label="Core 4 Completion" right={`${fullDays} full days this month — ${completionPct}%`} pct={completionPct} color="linear-gradient(90deg,#2a7a2a,#4caf50)" />
        </div>
      </div>

      {/* ── NAV ── */}
      <div style={{ display:"flex", background:"#0d1b2a", borderBottom:"1px solid #c9a84c33", overflowX:"auto" }}>
        {[["dashboard","Today"],["calendar","Calendar"],["leaderboard","Leaderboard"],["goals","My Goals"], ...(profile?.role==="manager"?[["admin","⚔️ Admin"]]:[])].map(([id,label])=>(
          <button key={id} onClick={()=>setScreen(id)} style={{
            padding:"12px 20px", border:"none", background:"none",
            color:screen===id?"#c9a84c":"#5a7a9a",
            borderBottom:screen===id?"2px solid #c9a84c":"2px solid transparent",
            cursor:"pointer", fontSize:13, letterSpacing:2, textTransform:"uppercase",
            fontFamily:MF, fontWeight:700, whiteSpace:"nowrap",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"24px 16px" }}>

        {/* ── TODAY ── */}
        {screen==="dashboard" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:24 }}>
              {[
                { label: selectedDate===todayStr()?"Core 4 Today":"That Day", value:`${core4Done}/4`, sub:core4Done===4?"🔥 Full Power Hour!":selectedDate===todayStr()?"keep going":"retroactive" },
                { label:"Streak",       value:`${streak}d`,     sub:"consecutive days" },
                { label:"Points",       value:score,            sub:"warrior points" },
                { label:"Days Logged",  value:allLogs.length,   sub:"total check-ins" },
              ].map(s=>(
                <div key={s.label} style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderTop:`3px solid ${T.cardBorderTop}`, borderRadius:6, padding:"14px 16px", transition:"background 0.3s" }}>
                  <div style={{ fontSize:11, color:T.textSub, textTransform:"uppercase", letterSpacing:2, marginBottom:4, fontFamily:MF, fontWeight:700 }}>{s.label}</div>
                  <div style={{ fontSize:30, fontWeight:700, color:T.sectionText, lineHeight:1, fontFamily:MF }}>{s.value}</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <SectionHeader T={T}>
              ⚡ {selectedDate === todayStr() ? "Core 4 Power Hour — Today" : `Check-In: ${new Date(selectedDate + "T12:00:00").toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric'})}`}
            </SectionHeader>

            {/* Past day gating */}
            {isPastDay(selectedDate) && !hasApprovedRequest(selectedDate) ? (
              <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderLeft:"4px solid #c9a84c", borderRadius:8, padding:24, marginBottom:16 }}>
                <div style={{ fontSize:18, fontFamily:MF, fontWeight:700, color:T.sectionText, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                  🔒 Edit Request Required
                </div>
                <div style={{ fontSize:13, color:T.textSub, marginBottom:16, lineHeight:1.7 }}>
                  To edit a past day you need manager approval. Tell them why you missed logging this day.
                </div>
                {editRequests.some(r=>r.requested_date===selectedDate&&r.status==="pending") ? (
                  <div style={{ background:"#c9a84c22", border:"1px solid #c9a84c55", borderRadius:6, padding:"12px 16px", fontSize:13, color:"#c9a84c", fontFamily:MF, letterSpacing:1 }}>
                    ⏳ REQUEST PENDING — Waiting for manager approval
                  </div>
                ) : editRequests.some(r=>r.requested_date===selectedDate&&r.status==="denied") ? (
                  <div style={{ background:"#ff000015", border:"1px solid #ff000044", borderRadius:6, padding:"12px 16px", fontSize:13, color:"#ff6b6b", fontFamily:MF, letterSpacing:1 }}>
                    ❌ REQUEST DENIED — Contact your manager directly
                  </div>
                ) : (
                  <>
                    <textarea
                      value={requestReason}
                      onChange={e=>setRequestReason(e.target.value)}
                      placeholder="Why do you need to edit this day? (e.g. forgot to log, was traveling...)"
                      rows={3}
                      style={{ width:"100%", background:T.inputBg, border:`1px solid ${T.inputBorder}`, borderRadius:4, padding:"10px 12px", color:T.inputText, fontSize:13, fontFamily:BF, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:12 }}
                    />
                    {requestMsg && <div style={{ fontSize:12, color:requestMsg.startsWith("✅")?"#4caf50":"#ff6b6b", marginBottom:10 }}>{requestMsg}</div>}
                    <button onClick={()=>{ setRequestingDate(selectedDate); submitEditRequest(); }}
                      disabled={!requestReason.trim()}
                      style={{ background:"linear-gradient(135deg,#c9a84c,#e8c96c)", color:"#0d1b2a", border:"none", padding:"10px 24px", borderRadius:4, cursor:"pointer", fontFamily:MF, fontWeight:700, fontSize:15, letterSpacing:2, textTransform:"uppercase", opacity:!requestReason.trim()?0.5:1 }}>
                      SEND REQUEST
                    </button>
                  </>
                )}
              </div>
            ) : (
              CORE4.map(item=>(
                <CheckCard key={item.id} checked={!!(allLogs.find(l=>l.log_date===selectedDate)||{})[item.id]} onClick={()=>toggleCore4(item.id)}
                  icon={item.icon} label={item.label} desc={item.desc} color="#c9a84c" T={T} />
              ))
            )}

            {goals.length>0&&(
              <>
                <SectionHeader T={T} style={{ marginTop:24 }}>🎯 My Custom Goals — Today</SectionHeader>
                {isPastDay(selectedDate) && !hasApprovedRequest(selectedDate) ? (
                  <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderLeft:"4px solid #c9a84c", borderRadius:8, padding:16, fontSize:13, color:T.textSub, fontFamily:BF }}>
                    {editRequests.some(r=>r.requested_date===selectedDate&&r.status==="pending")
                      ? <span style={{ color:"#c9a84c", fontFamily:MF, letterSpacing:1 }}>⏳ REQUEST PENDING — Waiting for manager approval</span>
                      : editRequests.some(r=>r.requested_date===selectedDate&&r.status==="denied")
                      ? <span style={{ color:"#ff6b6b", fontFamily:MF, letterSpacing:1 }}>❌ REQUEST DENIED — Contact your manager directly</span>
                      : "Submit an edit request above to unlock custom goals for this day too."}
                  </div>
                ) : (
                  goals.map(goal=>{
                    const checked=goalCompletions.some(gc=>gc.goal_id===goal.id&&gc.completion_date===selectedDate);
                    const doneCount=goalCompletions.filter(gc=>gc.goal_id===goal.id).length;
                    const pct=Math.min(100,Math.round((doneCount/goal.target)*100));
                    return(
                      <div key={goal.id}>
                        <CheckCard checked={checked} onClick={()=>toggleGoalCompletion(goal.id)}
                          icon="🎯" label={goal.name} desc={`${doneCount}/${goal.target} ${goal.unit} — ${pct}%`} color={goal.color} T={T} />
                        <div style={{ margin:"-8px 0 12px 56px", background:T.progressBg, borderRadius:4, height:5, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:goal.color, borderRadius:4, transition:"width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
            <div style={{ marginTop:20, display:"flex", gap:10, flexDirection:"column" }}>
              {selectedDate!==todayStr()&&(
                <button onClick={()=>setSelectedDate(todayStr())} style={{ width:"100%", padding:12, background:"none", border:`2px solid #c9a84c`, color:"#c9a84c", borderRadius:6, cursor:"pointer", fontSize:16, fontFamily:MF, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>
                  ← BACK TO TODAY
                </button>
              )}
              <button onClick={()=>setScreen("goals")} style={{ width:"100%", padding:14, background:T.card, border:`2px dashed #c9a84c`, color:T.sectionText, borderRadius:6, cursor:"pointer", fontSize:18, fontFamily:MF, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>
                + ADD CUSTOM GOAL
              </button>
            </div>
          </div>
        )}

        {/* ── MONTHLY CALENDAR ── */}
        {screen==="calendar" && (() => {
          const now = new Date();
          const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
          const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
          const monthName = new Date(calYear, calMonth, 1).toLocaleString('default', { month:'long' });
          const DAY_LABELS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
          const monthKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
          const fullThisMonth = allLogs.filter(l=>l.log_date.startsWith(monthKey)&&l.movement&&l.god&&l.vanity&&l.business).length;
          const isCurrentMonth = calYear===now.getFullYear()&&calMonth===now.getMonth();

          const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
          const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

          return (
            <div>
              <SectionHeader T={T}>📅 {monthName} {calYear}</SectionHeader>
              {/* Month nav */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <button onClick={prevMonth} style={{ background:"none", border:`1px solid ${T.cardBorder}`, color:T.text, padding:"6px 14px", borderRadius:4, cursor:"pointer", fontFamily:MF, fontSize:14, letterSpacing:1 }}>← PREV</button>
                <div style={{ fontSize:11, color:T.textSub, fontFamily:MF, letterSpacing:2 }}>{fullThisMonth} FULL DAYS</div>
                <button onClick={nextMonth} disabled={isCurrentMonth} style={{ background:"none", border:`1px solid ${T.cardBorder}`, color:T.text, padding:"6px 14px", borderRadius:4, cursor:"pointer", fontFamily:MF, fontSize:14, letterSpacing:1, opacity:isCurrentMonth?0.3:1 }}>NEXT →</button>
              </div>
              {/* Day headers */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
                {DAY_LABELS.map(d=>(
                  <div key={d} style={{ textAlign:"center", fontSize:10, color:T.textSub, fontFamily:MF, letterSpacing:1, padding:"4px 0" }}>{d}</div>
                ))}
              </div>
              {/* Grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                {Array.from({length:firstDayOfWeek},(_,i)=><div key={`e${i}`} />)}
                {Array.from({length:daysInMonth},(_,i)=>{
                  const dayNum = i+1;
                  const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
                  const log = allLogs.find(l=>l.log_date===key)||{};
                  const full = ["movement","god","vanity","business"].every(f=>log[f]);
                  const isCurrent = key===todayStr();
                  const future = key>todayStr();
                  const isWeekend = [0,6].includes(new Date(calYear,calMonth,dayNum).getDay());
                  return(
                    <div key={dayNum} onClick={()=>{ if(!future){ setSelectedDate(key); setScreen("dashboard"); } }} style={{
                      background:full?(darkMode?"linear-gradient(135deg,#1a3010,#253a10)":"linear-gradient(135deg,#e8f5e8,#d0ead0)"):future?T.futureCard:T.card,
                      border:isCurrent?"2px solid #c9a84c":full?"1px solid #4a7a20":`1px solid ${T.cardBorder}`,
                      borderRadius:6, padding:"8px 2px", textAlign:"center",
                      cursor:future?"default":"pointer", opacity:future?0.35:1, transition:"background 0.3s",
                    }}>
                      <div style={{ fontSize:14, fontWeight:700, fontFamily:MF, lineHeight:1, marginBottom:4,
                        color:isCurrent?"#c9a84c":full?"#4caf50":isWeekend?"#8a9ab5":T.text }}>{dayNum}</div>
                      <div style={{ display:"flex", gap:2, justifyContent:"center" }}>
                        {CORE4.map(c=>(
                          <div key={c.id} style={{ width:4, height:4, borderRadius:"50%", background:log[c.id]?"#c9a84c":T.progressBg }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:16, display:"flex", gap:16, fontSize:11, color:T.textSub, flexWrap:"wrap" }}>
                <span>🟡 dots = Core 4 items</span><span>🟢 green = full day</span><span>🟡 border = today</span>
              </div>
            </div>
          );
        })()}

        {/* ── LEADERBOARD ── */}
        {screen==="leaderboard"&&(
          <div>
            <SectionHeader T={T}>🏆 Team Leaderboard</SectionHeader>
            <div style={{ fontSize:12, color:T.textSub, marginBottom:16 }}>
              {leaderboard.filter(e=>!e.is_private).length} warriors sharing • {leaderboard.filter(e=>e.is_private).length} in private mode
            </div>
            {leaderboard.map((entry,i)=>(
              <div key={entry.id} style={{
                background:entry.id===user?.id?T.youBg:T.card,
                border:entry.id===user?.id?`1px solid ${T.youBorder}`:`1px solid ${T.cardBorder}`,
                borderLeft:`4px solid ${i===0?"#c9a84c":i===1?"#9e9e9e":i===2?"#a0522d":T.cardBorder}`,
                borderRadius:6, padding:"14px 18px", marginBottom:10,
                display:"flex", alignItems:"center", gap:14, transition:"background 0.3s",
              }}>
                <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16, fontFamily:MF,
                  background:i===0?"#c9a84c":i===1?"#9e9e9e":i===2?"#a0522d":T.rankBg,
                  color:i<3?"#fff":T.rankText,
                }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:16, color:entry.id===user?.id?T.sectionText:T.text, fontFamily:MF, letterSpacing:1, textTransform:"uppercase" }}>
                    {entry.is_private?"🔒 Anonymous Warrior":entry.name}
                    {entry.id===user?.id&&<span style={{ fontSize:11, color:"#1B6CA8", marginLeft:8, fontFamily:BF, textTransform:"none", fontWeight:"normal" }}>(you)</span>}
                  </div>
                  <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>
                    {entry.is_private?"Stats hidden":`🔥 ${entry.streak} day streak • ${entry.fullDays} full days`}
                  </div>
                </div>
                {!entry.is_private&&(
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:26, fontWeight:700, color:"#c9a84c", fontFamily:MF }}>{entry.score}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>pts</div>
                  </div>
                )}
              </div>
            ))}
            <div style={{ marginTop:16, background:T.scoringBg, border:`1px solid ${T.cardBorder}`, borderRadius:6, padding:16, fontSize:12, color:T.textSub, transition:"background 0.3s" }}>
              <div style={{ color:T.sectionText, marginBottom:6, fontWeight:700, fontSize:16, fontFamily:MF, letterSpacing:2, textTransform:"uppercase" }}>⭐ Scoring</div>
              Core 4 item = 10 pts &nbsp;|&nbsp; Full Power Hour = +20 bonus &nbsp;|&nbsp; Custom goal = 5 pts
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {screen==="admin" && profile?.role==="manager" && (
          <div>
            <SectionHeader T={T}>⚔️ Edit Requests</SectionHeader>
            {editRequests.length===0 && (
              <div style={{ color:T.textMuted, textAlign:"center", padding:40, background:T.card, borderRadius:8, border:`1px solid ${T.cardBorder}` }}>
                No pending requests — all warriors are up to date!
              </div>
            )}
            {editRequests.map(req=>(
              <div key={req.id} style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderLeft:`4px solid ${req.status==="pending"?"#c9a84c":req.status==="approved"?"#4caf50":"#ff6b6b"}`, borderRadius:8, padding:"16px 18px", marginBottom:12, transition:"background 0.3s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:MF, letterSpacing:1, textTransform:"uppercase" }}>
                      {req.profiles?.name || "Unknown"}
                    </div>
                    <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>
                      Requesting edit for: <span style={{ color:"#c9a84c", fontWeight:700 }}>{new Date(req.requested_date+"T12:00:00").toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:11, fontFamily:MF, letterSpacing:1, padding:"4px 10px", borderRadius:20, fontWeight:700,
                    background: req.status==="pending"?"#c9a84c22":req.status==="approved"?"#4caf5022":"#ff000022",
                    color: req.status==="pending"?"#c9a84c":req.status==="approved"?"#4caf50":"#ff6b6b",
                    border: `1px solid ${req.status==="pending"?"#c9a84c55":req.status==="approved"?"#4caf5055":"#ff000044"}`
                  }}>
                    {req.status.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize:13, color:T.textSub, background:T.progressBg, borderRadius:4, padding:"10px 12px", marginBottom:req.status==="pending"?12:0, lineHeight:1.6 }}>
                  "{req.reason}"
                </div>
                {req.status==="pending" && (
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>reviewEditRequest(req.id,"approved")} style={{ flex:1, background:"linear-gradient(135deg,#2a7a2a,#4caf50)", color:"#fff", border:"none", padding:"10px", borderRadius:4, cursor:"pointer", fontFamily:MF, fontWeight:700, fontSize:15, letterSpacing:2, textTransform:"uppercase" }}>
                      ✅ APPROVE
                    </button>
                    <button onClick={()=>reviewEditRequest(req.id,"denied")} style={{ flex:1, background:"linear-gradient(135deg,#7a2a2a,#c0392b)", color:"#fff", border:"none", padding:"10px", borderRadius:4, cursor:"pointer", fontFamily:MF, fontWeight:700, fontSize:15, letterSpacing:2, textTransform:"uppercase" }}>
                      ❌ DENY
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── GOALS ── */}
        {screen==="goals"&&(
          <GoalsManager userId={user?.id} goals={goals} setGoals={setGoals} goalCompletions={goalCompletions} T={T} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
}

// ─── Goals Manager ────────────────────────────────────────────────────────────
function GoalsManager({ userId, goals, setGoals, goalCompletions, T, darkMode }) {
  const [name, setName]     = useState("");
  const [target, setTarget] = useState(20);
  const [unit, setUnit]     = useState("times");
  const [color, setColor]   = useState(GOAL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function addGoal() {
    if (!name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("goals").insert({ user_id:userId, name:name.trim(), target:Number(target), unit, color }).select().single();
    if (data) setGoals(prev=>[...prev,data]);
    setName(""); setTarget(20); setUnit("times"); setSaving(false);
  }

  async function removeGoal(id) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals(prev=>prev.filter(g=>g.id!==id));
  }

  const iStyle = { background:T.inputBg, border:`1px solid ${T.inputBorder}`, borderRadius:4, padding:"10px 12px", color:T.inputText, fontSize:13, fontFamily:BF, outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <SectionHeader T={T}>🎯 Custom Goals</SectionHeader>
      <div style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderTop:"3px solid #1B3A5C", borderRadius:6, padding:20, marginBottom:24, transition:"background 0.3s" }}>
        <div style={{ fontSize:18, color:T.sectionText, marginBottom:14, fontWeight:700, fontFamily:MF, letterSpacing:2, textTransform:"uppercase" }}>Add a New Goal</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 110px", gap:10, marginBottom:12 }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Goal name (e.g. Go to gym)" style={iStyle} />
          <input type="number" value={target} onChange={e=>setTarget(e.target.value)} min={1} style={iStyle} />
          <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="times / pages" style={iStyle} />
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:T.textSub, marginBottom:8 }}>Color</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {GOAL_COLORS.map(c=>(
              <div key={c} onClick={()=>setColor(c)} style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer", border:color===c?"3px solid #fff":"3px solid transparent", boxSizing:"border-box" }} />
            ))}
          </div>
        </div>
        <button onClick={addGoal} disabled={saving||!name.trim()} style={{ background:"linear-gradient(135deg,#1B3A5C,#1B6CA8)", color:"#fff", border:"none", padding:"10px 28px", borderRadius:4, cursor:"pointer", fontFamily:MF, fontWeight:700, fontSize:16, letterSpacing:2, textTransform:"uppercase", opacity:saving||!name.trim()?0.5:1 }}>
          {saving?"SAVING…":"ADD GOAL"}
        </button>
      </div>
      {goals.length===0&&<div style={{ color:T.textMuted, textAlign:"center", padding:40, background:T.card, borderRadius:8, border:`1px solid ${T.cardBorder}` }}>No custom goals yet — add your first one above!</div>}
      {goals.map(goal=>{
        const doneCount=goalCompletions.filter(gc=>gc.goal_id===goal.id).length;
        const pct=Math.min(100,Math.round((doneCount/goal.target)*100));
        return(
          <div key={goal.id} style={{ background:T.card, border:`1px solid ${T.cardBorder}`, borderLeft:`4px solid ${goal.color}`, borderRadius:6, padding:"16px 18px", marginBottom:12, transition:"background 0.3s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:4, fontFamily:MF, letterSpacing:1, textTransform:"uppercase" }}>{goal.name}</div>
                <div style={{ fontSize:12, color:T.textSub }}>Target: {goal.target} {goal.unit}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:700, color:goal.color, fontFamily:MF }}>{doneCount}</div>
                  <div style={{ fontSize:10, color:T.textMuted }}>of {goal.target}</div>
                </div>
                <button onClick={()=>removeGoal(goal.id)} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:18 }}>✕</button>
              </div>
            </div>
            <div style={{ marginTop:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textSub, marginBottom:4 }}>
                <span>Progress</span><span style={{ color:goal.color }}>{pct}%</span>
              </div>
              <div style={{ background:T.progressBg, borderRadius:4, height:8, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:goal.color, borderRadius:4, transition:"width 0.5s" }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ mode, setMode, email, setEmail, password, setPassword, name, setName, onLogin, onSignup, loading, error }) {
  const isSignup = mode==="signup";
  const aInput = { background:"#ffffff15", border:"1px solid #c9a84c33", borderRadius:4, padding:"12px 16px", color:"#fff", fontSize:14, fontFamily:BF, outline:"none", width:"100%", boxSizing:"border-box" };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0d1b2a,#1B3A5C)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:BF }}>
      <div style={{ textAlign:"center", maxWidth:400, padding:40, width:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:24 }}>
          <LogoBox src={WW_LOGO} alt="Warrior Week" size={68} />
          <div style={{ fontSize:32, color:"#c9a84c", fontWeight:700, fontFamily:MF }}>×</div>
          <LogoBox src={B49_LOGO} alt="Branch 49" size={68} />
        </div>
        <div style={{ fontSize:38, fontFamily:MF, fontWeight:700, letterSpacing:4, color:"#fff", textTransform:"uppercase", lineHeight:1, marginBottom:6, textShadow:"0 3px 12px rgba(0,0,0,0.6)" }}>POWER HOUR</div>
        <div style={{ fontSize:14, color:"#c9a84c", letterSpacing:4, textTransform:"uppercase", fontFamily:MF, fontWeight:700, marginBottom:4 }}>#WARRIORSWAY</div>
        <p style={{ color:"#8da0b5", marginBottom:28, fontSize:12, lineHeight:2, letterSpacing:2, textTransform:"uppercase" }}>REAL • RAW • RELEVANT • RESULTS</p>
        {isSignup&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" style={{ ...aInput, marginBottom:10 }} />}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Work email" type="email" style={{ ...aInput, marginBottom:10 }} />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==="Enter"&&(isSignup?onSignup():onLogin())} style={{ ...aInput, marginBottom:16 }} />
        {error&&<div style={{ color:error.startsWith("✅")?"#4caf50":"#ff6b6b", fontSize:12, marginBottom:12, background:error.startsWith("✅")?"#4caf5015":"#ff000015", padding:"8px 12px", borderRadius:4 }}>{error}</div>}
        <button onClick={isSignup?onSignup:onLogin} disabled={loading} style={{ width:"100%", background:"linear-gradient(135deg,#c9a84c,#e8c96c)", color:"#0d1b2a", border:"none", padding:14, borderRadius:4, fontSize:20, fontWeight:700, cursor:"pointer", fontFamily:MF, letterSpacing:3, textTransform:"uppercase", opacity:loading?0.5:1, marginBottom:14 }}>
          {loading?"…":isSignup?"JOIN THE ARENA":"ENTER THE ARENA"}
        </button>
        <div style={{ fontSize:13, color:"#5a7a9a", cursor:"pointer" }} onClick={()=>setMode(isSignup?"login":"signup")}>
          {isSignup?"Already have an account? ":"New warrior? "}
          <span style={{ color:"#c9a84c", textDecoration:"underline" }}>{isSignup?"Sign in":"Create account"}</span>
        </div>
        <div style={{ marginTop:10, fontSize:11, color:"#3a5a7a" }}>Use your work email to join the team leaderboard</div>
      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function Loader() {
  const [dots, setDots] = useState(0);
  const [phase, setPhase] = useState(0);
  const phases = ["INITIALIZING", "LOADING WARRIORS", "ENTERING THE ARENA"];

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const phaseTimer = setInterval(() => setPhase(p => Math.min(p + 1, phases.length - 1)), 900);
    return () => { clearInterval(dotTimer); clearInterval(phaseTimer); };
  }, []);

  return (
    <div style={{
      minHeight:"100vh", background:"#0d1b2a",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:MF, overflow:"hidden", position:"relative",
    }}>

      <style>{`
        @keyframes erupt {
          0%   { transform: translateY(60px); opacity: 0; }
          60%  { transform: translateY(-12px); opacity: 1; }
          80%  { transform: translateY(6px); }
          100% { transform: translateY(0px); opacity: 1; }
        }
        @keyframes rootGrow {
          0%   { opacity: 0; transform: scaleY(0); transform-origin: top center; }
          100% { opacity: 1; transform: scaleY(1); transform-origin: top center; }
        }
        @keyframes groundPulse {
          0%,100% { opacity: 0.5; transform: scaleX(1); }
          50%     { opacity: 1;   transform: scaleX(1.08); }
        }
        @keyframes glowPulse {
          0%,100% { filter: drop-shadow(0 0 8px #c9a84c66); }
          50%     { filter: drop-shadow(0 0 22px #c9a84ccc); }
        }
        @keyframes textRise {
          0%   { opacity:0; transform:translateY(16px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes barFill {
          from { width: 0%; }
        }
        @keyframes dirtFly {
          0%   { opacity:0; transform: translate(0,0) scale(0); }
          40%  { opacity:1; }
          100% { opacity:0; transform: translate(var(--dx), var(--dy)) scale(1.5); }
        }
      `}</style>

      {/* Ground + eruption scene */}
      <div style={{ position:"relative", width:240, height:280, marginBottom:24 }}>

        {/* Dirt particles flying out */}
        {[
          {dx:"-40px", dy:"-30px", x:100, y:160},
          {dx:"50px",  dy:"-40px", x:120, y:155},
          {dx:"-60px", dy:"-20px", x:90,  y:170},
          {dx:"65px",  dy:"-15px", x:135, y:165},
          {dx:"-20px", dy:"-55px", x:108, y:150},
          {dx:"30px",  dy:"-50px", x:115, y:148},
        ].map((p,i)=>(
          <div key={i} style={{
            position:"absolute", left:p.x, top:p.y,
            width:6, height:6, borderRadius:"50%",
            background:"#5a3a1a",
            "--dx":p.dx, "--dy":p.dy,
            animation:`dirtFly 0.8s ease-out ${0.2+i*0.06}s both`,
          }} />
        ))}

        {/* Ground crack / dirt mound */}
        <svg viewBox="0 0 240 60" style={{
          position:"absolute", bottom:0, left:0, width:"100%",
          animation:"groundPulse 2s ease-in-out infinite",
        }}>
          {/* Ground base */}
          <ellipse cx="120" cy="45" rx="100" ry="18" fill="#1a0e06" />
          <ellipse cx="120" cy="42" rx="85"  ry="12" fill="#2a1a0a" />
          {/* Crack lines */}
          <line x1="120" y1="28" x2="90"  y2="38" stroke="#3a2010" strokeWidth="2" opacity="0.8"/>
          <line x1="120" y1="28" x2="150" y2="36" stroke="#3a2010" strokeWidth="2" opacity="0.8"/>
          <line x1="105" y1="33" x2="85"  y2="44" stroke="#3a2010" strokeWidth="1.5" opacity="0.6"/>
          <line x1="135" y1="31" x2="158" y2="42" stroke="#3a2010" strokeWidth="1.5" opacity="0.6"/>
          {/* Gold glow under break point */}
          <ellipse cx="120" cy="30" rx="18" ry="6" fill="#c9a84c" opacity="0.15"/>
        </svg>

        {/* Roots growing down from fist */}
        <svg viewBox="0 0 120 100" style={{
          position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)",
          width:120, height:100,
          animation:"rootGrow 0.6s ease-out 0.4s both",
        }}>
          {/* Main roots */}
          <path d="M60 0 Q45 30 25 55 Q15 70 10 90" stroke="#c9a84c" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9"/>
          <path d="M60 0 Q75 28 95 52 Q105 68 110 88" stroke="#c9a84c" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9"/>
          <path d="M60 0 Q58 35 55 70 Q53 82 50 95" stroke="#c9a84c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
          {/* Branch roots */}
          <path d="M40 35 Q28 45 18 55" stroke="#c9a84c" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M80 32 Q92 42 100 54" stroke="#c9a84c" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M35 55 Q22 62 14 72" stroke="#c9a84c" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6"/>
          <path d="M85 50 Q98 58 106 70" stroke="#c9a84c" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6"/>
          <path d="M55 65 Q46 75 40 88" stroke="#c9a84c" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55"/>
          <path d="M57 68 Q66 78 70 90" stroke="#c9a84c" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55"/>
        </svg>

        {/* Fist + stick erupting upward */}
        <div style={{
          position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          animation:"erupt 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both",
        }}>
          <svg viewBox="0 0 160 160" width="160" height="160"
            style={{ animation:"glowPulse 2s ease-in-out 1s infinite", filter:"drop-shadow(0 0 10px #c9a84c88)" }}>

            {/* Stick / branch horizontal */}
            <rect x="8"  y="62" width="52" height="14" rx="7" fill="#f0e8d0"/>
            <rect x="100" y="62" width="52" height="14" rx="7" fill="#f0e8d0"/>
            {/* Stick end details */}
            <circle cx="12"  cy="69" r="7" fill="#e0d0b0"/>
            <circle cx="148" cy="69" r="7" fill="#e0d0b0"/>

            {/* Fist body */}
            <rect x="52" y="54" width="56" height="52" rx="10" fill="#f5e6c8"/>
            {/* Knuckle bumps */}
            <rect x="55" y="50" width="12" height="16" rx="6" fill="#f0ddb8"/>
            <rect x="70" y="47" width="13" height="18" rx="6" fill="#f0ddb8"/>
            <rect x="86" y="48" width="12" height="17" rx="6" fill="#f0ddb8"/>
            <rect x="100" y="51" width="10" height="15" rx="5" fill="#f0ddb8"/>
            {/* Thumb */}
            <ellipse cx="54" cy="74" rx="8" ry="12" fill="#f0ddb8"/>
            {/* Finger lines */}
            <line x1="67" y1="56" x2="67" y2="104" stroke="#d4c0a0" strokeWidth="1.5" opacity="0.5"/>
            <line x1="82" y1="54" x2="82" y2="104" stroke="#d4c0a0" strokeWidth="1.5" opacity="0.5"/>
            <line x1="97" y1="55" x2="97" y2="104" stroke="#d4c0a0" strokeWidth="1.5" opacity="0.5"/>
            {/* Wrist */}
            <rect x="60" y="100" width="40" height="20" rx="4" fill="#e8d5b0"/>

            {/* 49 on fist */}
            <text x="80" y="86" textAnchor="middle" fill="#1B3A5C"
              style={{fontSize:22, fontWeight:900, fontFamily:"'Barlow Condensed','Oswald',sans-serif", letterSpacing:-1}}>
              49
            </text>

            {/* Glow ring around fist */}
            <circle cx="80" cy="80" r="74" fill="none" stroke="#c9a84c" strokeWidth="1.5" opacity="0.3"/>
          </svg>
        </div>
      </div>

      {/* Text */}
      <div style={{ animation:"textRise 0.6s ease-out 0.9s both", textAlign:"center" }}>
        <div style={{ fontSize:34, fontWeight:700, color:"#fff", letterSpacing:5, marginBottom:6, textShadow:"0 0 20px #c9a84c66" }}>
          POWER HOUR
        </div>
        <div style={{ fontSize:13, color:"#c9a84c", letterSpacing:4, marginBottom:28 }}>
          #WARRIORSWAY
        </div>
      </div>

      {/* Phase + bar */}
      <div style={{ animation:"textRise 0.6s ease-out 1.1s both", textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#5a7a9a", letterSpacing:3, marginBottom:12, height:18 }}>
          {phases[phase]}{".".repeat(dots)}
        </div>
        <div style={{ width:180, height:2, background:"#1a2a3a", borderRadius:2, overflow:"hidden", margin:"0 auto" }}>
          <div style={{
            height:"100%", background:"linear-gradient(90deg,#c9a84c,#e8c96c)",
            borderRadius:2, transition:"width 0.9s ease",
            width:`${((phase+1)/phases.length)*100}%`,
          }} />
        </div>
      </div>
    </div>
  );
}
function LogoBox({ src, alt, size=60 }) {
  return (
    <div style={{ background:"#ffffff10", border:"2px solid #c9a84c55", borderRadius:10, padding:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <img src={src} alt={alt} style={{ height:size, width:size, objectFit:"contain", display:"block" }} />
    </div>
  );
}
function GoldChip({ children }) {
  return <div style={{ background:"#c9a84c22", border:"1px solid #c9a84c55", borderRadius:20, padding:"4px 12px", fontSize:12, color:"#c9a84c", fontFamily:MF, fontWeight:700, letterSpacing:1 }}>{children}</div>;
}
function ProgressBar({ label, right, pct, color }) {
  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#8da0b5", marginBottom:4, letterSpacing:1, textTransform:"uppercase", fontFamily:MF }}>
        <span>{label}</span><span style={{ color:"#c9a84c" }}>{right}</span>
      </div>
      <div style={{ background:"#0d1b2a", borderRadius:4, height:8, overflow:"hidden", border:"1px solid #c9a84c22" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:4, transition:"width 0.6s" }} />
      </div>
    </>
  );
}
function SectionHeader({ children, T, style }) {
  return <div style={{ fontSize:18, fontFamily:MF, fontWeight:700, letterSpacing:3, color:T.sectionText, textTransform:"uppercase", marginBottom:12, borderLeft:"4px solid #c9a84c", paddingLeft:12, transition:"color 0.3s", ...style }}>{children}</div>;
}
function CheckCard({ checked, onClick, icon, label, desc, color, T }) {
  return (
    <div onClick={onClick} style={{
      background:checked?(T.card==="#ffffff"?"#f0f7ff":"#1a2a1a"):T.card,
      border:checked?`1px solid ${color}`:`1px solid ${T.cardBorder}`,
      borderLeft:`4px solid ${checked?color:T.cardBorder}`,
      borderRadius:6, padding:"16px 18px", marginBottom:10,
      cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s",
    }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:checked?`${color}20`:T.progressBg, border:`2px solid ${checked?color:T.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
        {checked?"✓":icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:16, color:checked?color:T.text, marginBottom:2, fontFamily:MF, letterSpacing:1, textTransform:"uppercase" }}>{label}</div>
        <div style={{ fontSize:12, color:T.textSub, lineHeight:1.4 }}>{desc}</div>
      </div>
      {checked&&<div style={{ fontSize:18 }}>🔥</div>}
    </div>
  );
}
