import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ============================================================
//  ⚙️  CONFIGURAÇÃO — Substitua com suas credenciais
// ============================================================

// 1. SUPABASE — encontre em supabase.com > Settings > API
const SUPABASE_URL = "https://xdnlowogfhwcrvwueups.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkbmxvd29nZmh3Y3J2d3VldXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTcxMzYsImV4cCI6MjA5MDE3MzEzNn0.EVybcOK9Y25sEyGpaZPSkRR7_UfNB21kPVwSNmWgvbY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────────────────────
// 2. ANTHROPIC IA — Cole SUA CHAVE entre as aspas na linha abaixo:
const ANTHROPIC_KEY = "COLE_SUA_CHAVE_AQUI"; // ex: sk-ant-api03-...
// ─────────────────────────────────────────────────────────────

// ─── THEME ───────────────────────────────────────────────────
var DEFAULT_T = {
  bg:"#0D0F14",surface:"#13161E",card:"#181C26",border:"#252A38",
  accent:"#3B82F6",accentGlow:"#3B82F620",green:"#10B981",red:"#EF4444",
  yellow:"#F59E0B",orange:"#F59E0B",purple:"#8B5CF6",
  text:"#F1F5F9",muted:"#64748B",sub:"#94A3B8",
};
function loadTheme() {
  try {
    const saved = localStorage.getItem("krcf_theme");
    if (saved) {
      const t = JSON.parse(saved);
      return { ...DEFAULT_T, ...t, accentGlow: (t.accent||DEFAULT_T.accent)+"20", orange: t.yellow||DEFAULT_T.yellow };
    }
  } catch(e) {}
  return { ...DEFAULT_T };
}
var T = loadTheme(); // var avoids TDZ in bundled output

// ─── GLOBAL LISTS CONTEXT ────────────────────────────────────
const ListsContext = React.createContext({ segments:[], origins:[], reload:()=>{} });
function useLists(){ return React.useContext(ListsContext); }
function ListsProvider({ children }){
  const[segments,setSegments]=useState([]);
  const[origins,setOrigins]=useState([]);
  const reload=useCallback(async()=>{
    const[s,o]=await Promise.all([supabase.from("segments").select("*").order("name"),supabase.from("origins").select("*").order("name")]);
    const dbSegs=(s.data||[]).map(x=>x.name);
    const dbOrigs=(o.data||[]).map(x=>x.name);
    // Always include "Cliente da Base" in origins
    const defaultOrigs=["Lead","Indicação","Prospecção ativa","Site","Evento","Parceiro","Cliente da Base","Pesquisa de Leads"];
    const mergedOrigs=[...new Set([...dbOrigs,...defaultOrigs])];
    setSegments(dbSegs.length>0?dbSegs:["Varejo","Indústria","Serviços","Tecnologia","Saúde","Educação","Agronegócio","Outro"]);
    setOrigins(mergedOrigs);
  },[]);
  useEffect(()=>{reload();},[reload]);
  return <ListsContext.Provider value={{segments,origins,reload}}>{children}</ListsContext.Provider>;
}
function getSegments(){return["Varejo","Indústria","Serviços","Tecnologia","Saúde","Educação","Agronegócio","Outro"];}
function getOrigins(){return["Lead","Indicação","Prospecção ativa","Site","Evento","Parceiro","Cliente da Base"];}

// Status system - supports objects {name,color} stored in localStorage
function getStatusList(){
  try{
    const s=localStorage.getItem("krcf_statuses_v2");
    if(s) return JSON.parse(s);
    return [{name:"Lead",color:"#3B82F6"},{name:"Em contato",color:"#10B981"},{name:"Cliente da Base",color:"#3B82F6"},{name:"Prospecção",color:"#F59E0B"},{name:"Sem contato",color:"#64748B"},{name:"Whats",color:"#8B5CF6"},{name:"Caixa Postal",color:"#F59E0B"},{name:"Telefone não existe",color:"#EF4444"}];
  }catch{return [{name:"Lead",color:"#3B82F6"},{name:"Em contato",color:"#10B981"},{name:"Sem contato",color:"#64748B"}];}
}
const STATUS_OPTIONS=getStatusList().map(s=>s.name);
function getStatusNames(){return getStatusList().map(s=>s.name);}
function getStatusColor(name){const f=getStatusList().find(s=>s.name===name);return f?.color||T.accent;}
const STATUS_COLORS=Object.fromEntries(getStatusList().map(s=>[s.name,s.color]));
const CALL_TYPES=["Atendida","Não atendida","Caixa Postal"];
const CALL_RESULTS=["Interesse","Sem interesse","Retornar"];
const FOLLOWUP_TYPES=["Ligação","WhatsApp","Reunião"];
const WHATS_TYPES=["Enviado","Recebido"];
const MEETING_STATUS=["Agendada","Realizada","Cancelada","Reagendada"];

const today=()=>new Date().toISOString().slice(0,10);
const toUpper=(s)=>(s||"").toUpperCase();
function getChannels(){
  try{const c=localStorage.getItem("krcf_channels");
    return c?JSON.parse(c):[
      {name:"Ligação",code:"LIGACAO",icon:"📞",color:"#3B82F6"},
      {name:"WhatsApp",code:"WHATSAPP",icon:"💬",color:"#10B981"}
    ];
  }catch{return [
    {name:"Ligação",code:"LIGACAO",icon:"📞",color:"#3B82F6"},
    {name:"WhatsApp",code:"WHATSAPP",icon:"💬",color:"#10B981"}
  ];}
}
function maskCNPJ(v){
  const n=v.replace(/[^\d]/g,"").slice(0,14);
  if(n.length<=11){
    if(n.length<=3) return n;
    if(n.length<=6) return n.slice(0,3)+"."+n.slice(3);
    if(n.length<=9) return n.slice(0,3)+"."+n.slice(3,6)+"."+n.slice(6);
    return n.slice(0,3)+"."+n.slice(3,6)+"."+n.slice(6,9)+"-"+n.slice(9);
  }
  if(n.length<=2) return n;
  if(n.length<=5) return n.slice(0,2)+"."+n.slice(2);
  if(n.length<=8) return n.slice(0,2)+"."+n.slice(2,5)+"."+n.slice(5);
  if(n.length<=12) return n.slice(0,2)+"."+n.slice(2,5)+"."+n.slice(5,8)+"/"+n.slice(8);
  return n.slice(0,2)+"."+n.slice(2,5)+"."+n.slice(5,8)+"/"+n.slice(8,12)+"-"+n.slice(12);
}
const nowTime=()=>new Date().toTimeString().slice(0,5);
function weekRange(){const n=new Date();const s=new Date(n);s.setDate(n.getDate()-n.getDay());const e=new Date(n);e.setDate(n.getDate()+(6-n.getDay()));return[s.toISOString().slice(0,10),e.toISOString().slice(0,10)];}

// ─── UI PRIMITIVES ───────────────────────────────────────────
function Badge({color,children}){
  color=color||T.accent;return<span style={{background:color+"22",color,border:`1px solid ${color}40`,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{children}</span>;}
function Card({children,style}){return<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:20,...style}}>{children}</div>;}
function Btn({children,onClick,variant="primary",size="md",disabled,style,title}){
  const sz={sm:{padding:"5px 12px",fontSize:12},md:{padding:"9px 18px",fontSize:13},lg:{padding:"12px 28px",fontSize:15}};
  const vr={primary:{background:T.accent,color:"#fff"},ghost:{background:"transparent",color:T.sub,border:`1px solid ${T.border}`},danger:{background:T.red,color:"#fff"},success:{background:T.green,color:"#fff"}};
  return<button title={title} style={{border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .15s",opacity:disabled?0.5:1,...sz[size],...vr[variant],...style}} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Input({label,value,onChange,type="text",options,style,required,placeholder,min,max}){
  const s={background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box",...style};
  return(
    <div style={{marginBottom:14}}>
      {label&&<div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>{label}{required&&<span style={{color:T.red}}> *</span>}</div>}
      {options?<select style={s} value={value} onChange={e=>onChange(e.target.value)}><option value="">Selecione...</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
      :<input style={s} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} max={max}/>}
    </div>
  );
}
function Modal({open,title,onClose,children,width=520}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:28,width,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:17,fontWeight:700,color:T.text}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Spinner(){return<div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:36,height:36,border:`3px solid ${T.border}`,borderTop:`3px solid ${T.accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>;}
function StatCard({label,value,color,icon,sub}){
  color=color||T.accent;
  return(
    <Card style={{flex:1,minWidth:140}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{color:T.muted,fontSize:10,fontWeight:600,marginBottom:6}}>{label}</div><div style={{fontSize:26,fontWeight:800,color}}>{value}</div></div>
        {icon&&<span style={{fontSize:20,opacity:.7}}>{icon}</span>}
      </div>
    </Card>
  );
}
function ProgressBar({value,max,color}){
  color=color||T.accent;
  const pct=Math.min(100,max>0?(value/max)*100:0);
  return<div style={{background:T.border,borderRadius:99,height:8,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:pct>=100?T.green:pct>=70?color:T.yellow,borderRadius:99,transition:"width .4s"}}/></div>;
}
function DonutRing({real,meta,color,size=110}){
  const pct=meta>0?Math.min(100,(real/meta)*100):0;
  const r=(size/2)-10,circ=2*Math.PI*r,dash=(pct/100)*circ;
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={10}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:size>100?18:14,fontWeight:800,color:pct>=100?T.green:T.text}}>{Math.round(pct)}%</span>
        <span style={{fontSize:10,color:T.muted,marginTop:1}}>{real}/{meta}</span>
      </div>
    </div>
  );
}
function ThFilter({label,value,onChange,options}){
  return(
    <th style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,borderBottom:`1px solid ${T.border}`,background:T.surface}}>
      <div style={{marginBottom:4}}>{label}</div>
      {options&&<select value={value} onChange={e=>onChange(e.target.value)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,color:T.sub,padding:"3px 6px",fontSize:10,fontFamily:"inherit",width:"100%"}}>
        <option value="">Todos</option>{options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>}
    </th>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────
function Login({onLogin}){
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");
  const[err,setErr]=useState("");const[loading,setLoading]=useState(false);const[mode,setMode]=useState("login");
  async function handleLogin(){
    setLoading(true);setErr("");
    const{data,error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error){setErr("E-mail ou senha incorretos.");setLoading(false);return;}
    const{data:profile}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();
    onLogin({...data.user,...profile});setLoading(false);
  }
  async function handleReset(){
    setLoading(true);
    const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(error)setErr(error.message);else{alert("E-mail de recuperação enviado!");setMode("login");}
    setLoading(false);
  }
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:44,width:380,maxWidth:"95vw",boxShadow:"0 20px 60px #00000060"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:38,marginBottom:10}}>📞</div>
          <div style={{fontSize:26,fontWeight:900,color:T.text,letterSpacing:"-0.5px"}}><span style={{color:T.accent}}>KR</span> CALLFLOW</div>
          <div style={{color:T.muted,fontSize:11,marginTop:5,letterSpacing:2,textTransform:"uppercase"}}>Gestão Comercial Inteligente</div>
        </div>
        {mode==="reset"?(<>
          <div style={{color:T.sub,fontSize:13,marginBottom:16}}>Digite seu e-mail para receber o link de recuperação.</div>
          <Input label="E-mail" value={email} onChange={setEmail} type="email"/>
          {err&&<div style={{color:T.red,fontSize:12,marginBottom:12}}>{err}</div>}
          <Btn style={{width:"100%"}} onClick={handleReset} disabled={loading}>{loading?"Enviando...":"Enviar link"}</Btn>
          <div style={{textAlign:"center",marginTop:14}}><button onClick={()=>setMode("login")} style={{background:"none",border:"none",color:T.accent,fontSize:12,cursor:"pointer"}}>← Voltar ao login</button></div>
        </>):(<>
          <Input label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com"/>
          <Input label="Senha" value={pass} onChange={setPass} type="password" placeholder="••••••••"/>
          {err&&<div style={{color:T.red,fontSize:12,marginBottom:12}}>{err}</div>}
          <Btn style={{width:"100%"}} onClick={handleLogin} disabled={loading}>{loading?"Entrando...":"Entrar"}</Btn>
          <div style={{textAlign:"center",marginTop:14}}><button onClick={()=>setMode("reset")} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer"}}>Esqueci minha senha</button></div>
        </>)}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({user,profiles,onNav}){
  // ── ALL HOOKS FIRST (React rules of hooks) ──
  const{origins:allOrigins}=useLists();
  const[calls,setCalls]=useState([]);
  const[clients,setClients]=useState([]);
  const[followups,setFollowups]=useState([]);
  const[goals,setGoals]=useState([]);
  const[loading,setLoading]=useState(true);
  const[volFilter,setVolFilter]=useState("week");
  const[goalFilter,setGoalFilter]=useState("day");
  const[dashMonth,setDashMonth]=useState(new Date().toISOString().slice(0,7));
  const[specificDate,setSpecificDate]=useState(new Date().toISOString().slice(0,10));
  const[dateMode,setDateMode]=useState("month"); // month | specific
  const[campaigns,setDashCampaigns]=useState([]);
  const[dashClients,setDashClients]=useState([]);
  const[dashActs,setDashActs]=useState(new Set());
  useEffect(()=>{
    async function load(){
      const[ac,cl,f,g,camp]=await Promise.all([
        supabase.from("acionamentos").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("followups").select("*"),
        supabase.from("goals").select("*"),
        supabase.from("campaigns").select("*"),
      ]);
      setCalls(ac.data||[]);   // reusing 'calls' state for acionamentos
      setClients(cl.data||[]);
      setFollowups(f.data||[]);
      setGoals(g.data||[]);
      setDashCampaigns(camp.data||[]);
      // Build client sets
      const allAc = ac.data||[];
      const ids=new Set(allAc.map(a=>a.client_id));
      setDashActs(ids);
      setLoading(false);
    }
    load();
  },[]);
  // ── COMPUTED VALUES (after hooks) ──
  // calls = acionamentos data (reusing state name)
  const allAc=user.role==="vendedor"?calls.filter(a=>a.user_id===user.id):calls;
  const filteredAc=dateMode==="specific"
    ?allAc.filter(a=>a.date===specificDate)
    :allAc.filter(a=>a.date?.startsWith(dashMonth));
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myFU=user.role==="vendedor"?followups.filter(f=>f.user_id===user.id):followups;
  const pendFU=myFU.filter(f=>f.status==="Pendente"&&f.date<=today());
  // Unique acionamentos per client/day/canal
  // 1 acionamento por CNPJ por dia por canal
  const ligKeys=new Set(filteredAc.filter(a=>a.canal==="LIGACAO").map(a=>`${a.client_id}_${a.date}`));
  const whaKeys=new Set(filteredAc.filter(a=>a.canal==="WHATSAPP").map(a=>`${a.client_id}_${a.date}`));
  const totalAcKeys=new Set(filteredAc.map(a=>`${a.client_id}_${a.date}`));
  const convRate=filteredAc.length>0?Math.round((filteredAc.filter(a=>a.result==="Interesse").length/filteredAc.length)*100):0;
  // Status-based counting - find clients and their status
  const clientMap=Object.fromEntries(clients.map(c=>[c.id,c]));
  const baseClientIds=new Set(clients.filter(c=>c.status==="Cliente da Base").map(c=>c.id));
  const prospClientIds=new Set(clients.filter(c=>c.status==="Prospecção").map(c=>c.id));
  // Unique acionamentos per CNPJ per day for each status group
  const baseAcKeys=new Set(filteredAc.filter(a=>baseClientIds.has(a.client_id)).map(a=>`${a.client_id}_${a.date}`));
  const prospAcKeys=new Set(filteredAc.filter(a=>prospClientIds.has(a.client_id)).map(a=>`${a.client_id}_${a.date}`));
  // Clients never contacted (no acionamentos ever)
  const everContactedIds=new Set(allAc.map(a=>a.client_id));
  const neverContacted=visibleClients.filter(c=>!everContactedIds.has(c.id)).length;
  const visibleClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const monthActIds=new Set(allAc.filter(a=>a.date?.startsWith(dashMonth)).map(a=>a.client_id));
  const acionadosCount=visibleClients.filter(c=>monthActIds.has(c.id)).length;
  const semAcionamento=visibleClients.length-acionadosCount;
  const myCalls=filteredAc; // alias for volumetria compat
  if(loading)return<Spinner/>;
  const now=new Date();
  const targetDay=dateMode==="specific"?specificDate:today();
  let volLig=[],volWha=[];
  if(volFilter==="day"){
    volLig=Array.from({length:now.getHours()+2},(_,i)=>({name:`${i}h`,value:allAc.filter(a=>a.date===targetDay&&a.canal==="LIGACAO"&&parseInt((a.time||"00").split(":")[0])===i).length}));
    volWha=Array.from({length:now.getHours()+2},(_,i)=>({name:`${i}h`,value:allAc.filter(a=>a.date===targetDay&&a.canal==="WHATSAPP"&&parseInt((a.time||"00").split(":")[0])===i).length}));
  }else if(volFilter==="week"){
    volLig=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+i);const k=d.toISOString().slice(0,10);return{name:d.toLocaleDateString("pt-BR",{weekday:"short"}),value:allAc.filter(a=>a.date===k&&a.canal==="LIGACAO").length};});
    volWha=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+i);const k=d.toISOString().slice(0,10);return{name:d.toLocaleDateString("pt-BR",{weekday:"short"}),value:allAc.filter(a=>a.date===k&&a.canal==="WHATSAPP").length};});
  }else{
    const [yr,mo]=dashMonth.split("-");const dim=new Date(parseInt(yr),parseInt(mo),0).getDate();
    volLig=Array.from({length:dim},(_,i)=>{const k=`${dashMonth}-${String(i+1).padStart(2,"0")}`;return{name:String(i+1),value:allAc.filter(a=>a.date===k&&a.canal==="LIGACAO").length};});
    volWha=Array.from({length:dim},(_,i)=>{const k=`${dashMonth}-${String(i+1).padStart(2,"0")}`;return{name:String(i+1),value:allAc.filter(a=>a.date===k&&a.canal==="WHATSAPP").length};});
  }
    const originsData=[];
  const period=dashMonth;
  const sellers=profiles.filter(p=>p.role==="vendedor");
  const[ws,we]=weekRange();
  // Para vendedor: mostra só as metas dele. Para admin/gestor: soma a equipe toda
  const relevantGoals = user.role==="vendedor"
    ? goals.filter(g=>g.user_id===user.id&&g.period===period)
    : sellers.map(s=>goals.find(g=>g.user_id===s.id&&g.period===period)).filter(Boolean);
  // For vendedor: filter calls only by own; for admin: team total  
  const filterCallsForGoal = user.role==="vendedor"
    ? (goalFilter==="day"?allAc.filter(a=>a.date===today()):goalFilter==="week"?allAc.filter(a=>a.date>=ws&&a.date<=we):allAc)
    : (goalFilter==="day"?allAc.filter(a=>a.date===today()):goalFilter==="week"?allAc.filter(a=>a.date>=ws&&a.date<=we):allAc.filter(a=>a.date?.startsWith(dashMonth)));
  const totalMeta={
    prosp:relevantGoals.reduce((a,g)=>a+(goalFilter==="day"?g.prosp_day:goalFilter==="week"?g.prosp_week:g.prosp_month),0),
    base:relevantGoals.reduce((a,g)=>a+(goalFilter==="day"?g.base_day:goalFilter==="week"?g.base_week:g.base_month),0),
    get general(){ return this.prosp + this.base; }
  };
  const realGeneral=filterCallsForGoal.length,realProsp=Math.round(realGeneral*.4),realBase=Math.round(realGeneral*.6);
  const FB=[["day","Dia"],["week","Semana"],["month","Mês"]];
  return(
    <div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        <StatCard label="Total Acionamentos" value={totalAcKeys.size} icon="🎯"/>
        <StatCard label="📞 Ligações" value={ligKeys.size} color={T.accent} icon="📞"/>
        <StatCard label="💬 WhatsApp" value={whaKeys.size} color={T.green} icon="💬"/>
        <StatCard label="Taxa de Conversão" value={`${convRate}%`} color={T.purple} icon="📈"/>
        <StatCard label="Follow-ups Pendentes" value={pendFU.length} color={pendFU.length>0?T.yellow:T.green} icon="⏰"/>
        <StatCard label="Nunca Acionados" value={neverContacted} color={neverContacted>0?T.red:T.green} icon="⚠️" sub="sem nenhum registro"/>
      </div>
      {/* ROW 1: Acionamento metrics */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <StatCard label="Total Acionamentos" value={totalAcKeys.size} icon="🎯"/>
        <StatCard label="Por Ligação" value={ligKeys.size} color={T.accent} icon="📞"/>
        <StatCard label="Por WhatsApp" value={whaKeys.size} color={T.green} icon="💬"/>
        <StatCard label="Conversão" value={`${convRate}%`} color={T.purple} icon="📈"/>
        <StatCard label="Follow-ups" value={pendFU.length} color={pendFU.length>0?T.yellow:T.green} icon="⏰"/>
        <StatCard label="Nunca Acionados" value={neverContacted} color={neverContacted>0?T.red:T.green} icon="⚠️"/>
      </div>
      {/* ROW 2: Status-based counting */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <Card style={{flex:1,minWidth:180}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:8,fontWeight:600}}>🏢 CLIENTE DA BASE</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{textAlign:"center",minWidth:50}}>
              <div style={{fontSize:22,fontWeight:800,color:T.accent}}>{baseAcKeys.size}</div>
              <div style={{fontSize:10,color:T.muted}}>Acionados</div>
            </div>
            <div style={{textAlign:"center",minWidth:50}}>
              <div style={{fontSize:22,fontWeight:800,color:T.muted}}>{baseClientIds.size}</div>
              <div style={{fontSize:10,color:T.muted}}>Total</div>
            </div>
            <div style={{flex:1}}>
              <ProgressBar value={baseAcKeys.size} max={Math.max(baseClientIds.size,1)} color={T.accent}/>
              <div style={{fontSize:10,color:T.muted,marginTop:3}}>{baseClientIds.size>0?Math.round((baseAcKeys.size/baseClientIds.size)*100):0}%</div>
            </div>
          </div>
        </Card>
        <Card style={{flex:1,minWidth:180}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:8,fontWeight:600}}>🎯 PROSPECÇÃO</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{textAlign:"center",minWidth:50}}>
              <div style={{fontSize:22,fontWeight:800,color:T.yellow}}>{prospAcKeys.size}</div>
              <div style={{fontSize:10,color:T.muted}}>Acionados</div>
            </div>
            <div style={{textAlign:"center",minWidth:50}}>
              <div style={{fontSize:22,fontWeight:800,color:T.muted}}>{prospClientIds.size}</div>
              <div style={{fontSize:10,color:T.muted}}>Total</div>
            </div>
            <div style={{flex:1}}>
              <ProgressBar value={prospAcKeys.size} max={Math.max(prospClientIds.size,1)} color={T.yellow}/>
              <div style={{fontSize:10,color:T.muted,marginTop:3}}>{prospClientIds.size>0?Math.round((prospAcKeys.size/prospClientIds.size)*100):0}%</div>
            </div>
          </div>
        </Card>
        <Card style={{flex:1,minWidth:160,textAlign:"center"}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:8,fontWeight:600}}>👥 CLIENTES</div>
          <div style={{display:"flex",gap:12,justifyContent:"center"}}>
            <div><div style={{fontSize:20,fontWeight:800,color:T.accent}}>{visibleClients.length}</div><div style={{fontSize:10,color:T.muted}}>Total</div></div>
            <div><div style={{fontSize:20,fontWeight:800,color:T.green}}>{acionadosCount}</div><div style={{fontSize:10,color:T.muted}}>Acionados</div></div>
            <div><div style={{fontSize:20,fontWeight:800,color:T.red}}>{neverContacted}</div><div style={{fontSize:10,color:T.muted}}>Nunca</div></div>
          </div>
        </Card>
      </div>
      <div style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:13,fontWeight:700,color:T.sub}}>🎯 Meta de Equipe</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setDateMode("month")} style={{padding:"6px 12px",borderRadius:8,border:"none",background:dateMode==="month"?T.accent:T.surface,color:dateMode==="month"?"#fff":T.sub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Mês</button>
            <button onClick={()=>setDateMode("specific")} style={{padding:"6px 12px",borderRadius:8,border:"none",background:dateMode==="specific"?T.purple:T.surface,color:dateMode==="specific"?"#fff":T.sub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Data</button>
          </div>
          {dateMode==="month"
            ?<input type="month" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:12,fontFamily:"inherit"}} value={dashMonth} onChange={e=>setDashMonth(e.target.value)}/>
            :<input type="date" style={{background:T.surface,border:`1px solid ${T.purple}60`,borderRadius:8,color:T.text,padding:"6px 12px",fontSize:12,fontFamily:"inherit"}} value={specificDate} onChange={e=>setSpecificDate(e.target.value)}/>}
          {FB.map(([k,v])=><Btn key={k} size="sm" variant={goalFilter===k?"primary":"ghost"} onClick={()=>setGoalFilter(k)}>{v}</Btn>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
        {[
          {label:"Total Ligações",real:realGeneral,meta:totalMeta.general,color:T.purple},
          {label:"Base de Clientes",real:realBase,meta:totalMeta.base,color:T.green},
          {label:"Prospecção",real:realProsp,meta:totalMeta.prosp,color:T.orange},
          ...campaigns.map(camp=>({
            label:camp.name,
            real:realGeneral,
            meta:goalFilter==="day"?camp.day:goalFilter==="week"?camp.week:camp.month,
            color:T.accent,
            isCamp:true
          }))
        ].map(({label,real,meta,color,isCamp})=>(
          <Card key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,border:isCamp?`1px solid ${T.accent}40`:`1px solid ${T.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:isCamp?T.accent:T.sub}}>{isCamp?"🏷 "+label:label}</div>
            {!meta
              ?<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:16}}>Meta não definida</div>
              :<><DonutRing real={real} meta={meta} color={color} size={110}/><div style={{fontSize:11,color:T.muted}}>Meta: {meta}</div></>}
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:T.accent}}>📞 Volumetria — Ligações</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["day","week","month"].map((k,i)=><Btn key={k} size="sm" variant={volFilter===k?"primary":"ghost"} onClick={()=>setVolFilter(k)}>{["Dia","Semana","Mês"][i]}</Btn>)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volLig} margin={{top:18,right:5,left:-22,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fill:T.muted,fontSize:9}}/>
              <YAxis tick={{fill:T.muted,fontSize:9}}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12}}/>
              <Bar dataKey="value" name="Ligações" fill={T.accent} radius={[3,3,0,0]} label={{position:"top",fill:T.sub,fontSize:9}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:T.green}}>💬 Volumetria — WhatsApp</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volWha} margin={{top:18,right:5,left:-22,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fill:T.muted,fontSize:9}}/>
              <YAxis tick={{fill:T.muted,fontSize:9}}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12}}/>
              <Bar dataKey="value" name="WhatsApp" fill={T.green} radius={[3,3,0,0]} label={{position:"top",fill:T.sub,fontSize:9}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {pendFU.length>0&&(
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.yellow,marginBottom:12}}>⏰ Follow-ups Pendentes ({pendFU.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pendFU.slice(0,5).map(f=>(
              <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                <div><span style={{color:T.text,fontWeight:600,fontSize:13}}>{clients.find(c=>c.id===f.client_id)?.name||"—"}</span><span style={{color:T.muted,fontSize:12,marginLeft:10}}>{f.type} · {f.description}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}><Badge color={f.date<today()?T.red:T.yellow}>{f.date}</Badge><Btn size="sm" variant="success" onClick={()=>onNav("followups")}>Ver</Btn></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── CLIENTS ─────────────────────────────────────────────────

// ─── CLIENT QUICK VIEW (hyperlink modal for tables) ──────────
function ClientQuickView({ clientId, clientName, onClose }) {
  const [data, setData] = useState({ calls:[], whats:[], fus:[], meetings:[] });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // {type, item}

  useEffect(() => {
    async function load() {
      const [c,w,f,m] = await Promise.all([
        supabase.from("calls").select("*").eq("client_id", clientId).order("date", {ascending:false}),
        supabase.from("whatsapp_logs").select("*").eq("client_id", clientId).order("date", {ascending:false}),
        supabase.from("followups").select("*").eq("client_id", clientId).order("date", {ascending:false}),
        supabase.from("meetings").select("*").eq("client_id", clientId).order("date", {ascending:false}),
      ]);
      setData({ calls:c.data||[], whats:w.data||[], fus:f.data||[], meetings:m.data||[] });
      setLoading(false);
    }
    load();
  }, [clientId]);

  const all = [
    ...data.calls.map(i=>({...i, _type:"Ligação", _icon:"📞", _color:T.accent, _summary:i.obs, _detail:`Tipo: ${i.type} | Resultado: ${i.result} | Duração: ${i.duration}`})),
    ...data.whats.map(i=>({...i, _type:"WhatsApp", _icon:"💬", _color:T.green, _summary:i.content, _detail:`Tipo: ${i.type} | Status: ${i.status}`})),
    ...data.fus.map(i=>({...i, _type:"Follow-up", _icon:"⏰", _color:T.yellow, _summary:i.description, _detail:`Tipo: ${i.type} | Status: ${i.status}`})),
    ...data.meetings.map(i=>({...i, _type:"Reunião", _icon:"📅", _color:T.purple, _summary:i.notes||i.description, _detail:`Status: ${i.status}${i.proposal_status?" | Proposta: "+i.proposal_status:""}${i.lost_reason?" | Motivo: "+i.lost_reason:""}`})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));

  return (
    <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:24,width:620,maxWidth:"95vw",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:17,fontWeight:700,color:T.text}}>📋 Histórico — {clientName}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>

        {detail ? (
          <div>
            <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:T.accent,fontSize:13,cursor:"pointer",marginBottom:16}}>← Voltar ao histórico</button>
            <Card>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontSize:22}}>{detail.item._icon}</span>
                <div>
                  <div style={{fontWeight:700,color:T.text,fontSize:14}}>{detail.item._type} — {detail.item.date}</div>
                  <div style={{color:T.muted,fontSize:12}}>{detail.item._detail}</div>
                </div>
              </div>
              <div style={{background:T.surface,borderRadius:8,padding:14,color:T.sub,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                {detail.item._summary || <span style={{color:T.muted,fontStyle:"italic"}}>Sem observações registradas.</span>}
              </div>
              {detail.item._type==="Reunião" && detail.item.notes && (
                <div style={{marginTop:12,background:T.surface,borderRadius:8,padding:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6}}>📝 Notas da Reunião</div>
                  <div style={{color:T.sub,fontSize:13,lineHeight:1.7}}>{detail.item.notes}</div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          loading ? <Spinner/> : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {all.length===0 && <div style={{color:T.muted,textAlign:"center",padding:32}}>Nenhuma atividade registrada.</div>}
              {all.map((item,i)=>(
                <button key={i} onClick={()=>setDetail({item})} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",textAlign:"left",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all .15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>{item._icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                        <span style={{background:item._color+"22",color:item._color,borderRadius:5,padding:"1px 8px",fontSize:11,fontWeight:700}}>{item._type}</span>
                        <span style={{color:T.muted,fontSize:11}}>{item.date}</span>
                      </div>
                      <div style={{color:T.sub,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:450}}>
                        {item._summary || <span style={{fontStyle:"italic",color:T.muted}}>Sem observações</span>}
                      </div>
                    </div>
                    <span style={{color:T.accent,fontSize:12}}>Ver →</span>
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Helper hook for client quick view
function useClientView() {
  const [view, setView] = useState(null);
  const open = (clientId, clientName) => setView({clientId, clientName});
  const close = () => setView(null);
  const modal = view ? <ClientQuickView clientId={view.clientId} clientName={view.clientName} onClose={close}/> : null;
  return { open, modal };
}

function ClientHistory({client,profiles,onClose}){
  const[calls,setCalls]=useState([]);const[whats,setWhats]=useState([]);const[fus,setFus]=useState([]);const[meetings,setMeetings]=useState([]);const[loading,setLoading]=useState(true);
  const[detail,setDetail]=useState(null);
  useEffect(()=>{
    async function load(){
      const[c,w,f,m]=await Promise.all([
        supabase.from("calls").select("*").eq("client_id",client.id).order("date",{ascending:false}),
        supabase.from("whatsapp_logs").select("*").eq("client_id",client.id).order("date",{ascending:false}),
        supabase.from("followups").select("*").eq("client_id",client.id).order("date",{ascending:false}),
        supabase.from("meetings").select("*").eq("client_id",client.id).order("date",{ascending:false}),
      ]);
      setCalls(c.data||[]);setWhats(w.data||[]);setFus(f.data||[]);setMeetings(m.data||[]);setLoading(false);
    }
    load();
  },[client.id]);
  const resp=profiles.find(p=>p.id===client.responsible);
  const daysSince=(dateStr)=>{if(!dateStr)return null;const d=new Date(dateStr);const now=new Date();return Math.floor((now-d)/(1000*60*60*24));};

  const allActivities=[
    ...(calls||[]).map(a=>({...a,_type:"Ligação",_icon:"📞",_color:T.accent,
      _title:`${a.type} — ${a.result}`,
      _summary:a.obs,
      _details:[
        {label:"Tipo",val:a.type},{label:"Resultado",val:a.result},
        {label:"Duração",val:a.duration},{label:"Hora",val:a.time}
      ]
    })),
    ...(whats||[]).map(a=>({...a,_type:"WhatsApp",_icon:"💬",_color:T.green,
      _title:`${a.type} — ${a.status}`,
      _summary:a.content,
      _details:[{label:"Tipo",val:a.type},{label:"Status",val:a.status},{label:"Hora",val:a.time}]
    })),
    ...(fus||[]).map(a=>({...a,_type:"Follow-up",_icon:"⏰",_color:T.yellow,
      _title:`${a.type} — ${a.status}`,
      _summary:a.description,
      _details:[{label:"Tipo",val:a.type},{label:"Status",val:a.status}]
    })),
    ...(meetings||[]).map(a=>({...a,_type:"Reunião",_icon:"📅",_color:T.purple,
      _title:`${a.title}`,
      _summary:a.notes||a.description,
      _details:[
        {label:"Status",val:a.status},{label:"Proposta",val:a.proposal_status},
        {label:"Local",val:a.location},{label:"Participantes",val:a.participants},
        ...(a.lost_reason?[{label:"Motivo perda",val:a.lost_reason}]:[]),
        ...(a.post_sale_date?[{label:"Pós-venda",val:a.post_sale_date}]:[]),
      ].filter(d=>d.val)
    })),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));

  const lastActivity=allActivities[0];
  const daysNoContact=lastActivity?daysSince(lastActivity.date):daysSince(client.created_at);

  return(
    <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{if(detail)setDetail(null);else onClose();}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:28,width:700,maxWidth:"95vw",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

        {detail ? (
          /* ── DETAIL VIEW ── */
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:T.accent,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>← Voltar</button>
              <span style={{color:T.muted,fontSize:13}}>|</span>
              <span style={{fontSize:14,fontWeight:700,color:T.text}}>{client.name}</span>
            </div>
            <div style={{background:T.surface,borderRadius:12,padding:20,border:`1px solid ${detail._color}40`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <span style={{fontSize:28}}>{detail._icon}</span>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:T.text}}>{detail._title}</div>
                  <div style={{color:T.muted,fontSize:12,marginTop:2}}>{detail._type} · {detail.date}{detail.time?" às "+detail.time:""}</div>
                </div>
              </div>
              {/* Detail fields */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {(detail._details||[]).map((d,i)=>(
                  <div key={i} style={{background:T.card,borderRadius:8,padding:"6px 12px",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:2}}>{d.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{d.val||"—"}</div>
                  </div>
                ))}
              </div>
              {/* Summary / obs */}
              <div style={{marginTop:8}}>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:8}}>📝 Resumo / Observações</div>
                <div style={{background:T.card,borderRadius:10,padding:16,color:detail._summary?T.sub:T.muted,fontSize:13,lineHeight:1.8,fontStyle:detail._summary?"normal":"italic",minHeight:80,whiteSpace:"pre-wrap"}}>
                  {detail._summary||"Nenhuma observação registrada para esta interação."}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>{client.name}</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {client.phone&&<span style={{color:T.sub,fontSize:12}}>📞 {client.phone}</span>}
                  {client.email&&<span style={{color:T.sub,fontSize:12}}>✉️ {client.email}</span>}
                  {resp&&<span style={{color:T.sub,fontSize:12}}>👤 {resp.name}</span>}
                  <span style={{background:STATUS_COLORS[client.status]+"22",color:STATUS_COLORS[client.status]||T.muted,borderRadius:6,padding:"1px 10px",fontSize:11,fontWeight:700}}>{client.status}</span>
                </div>
              </div>
              <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:24,cursor:"pointer"}}>×</button>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              {[
                {val:calls.length+whats.length+fus.length+meetings.length,label:"Total atividades",color:T.accent},
                {val:(daysNoContact??0)+"d",label:"Sem contato",color:daysNoContact>30?T.red:daysNoContact>7?T.yellow:T.green},
                {val:meetings.filter(m=>m.proposal_status==="Proposta fechada").length,label:"Fechadas",color:T.green},
                {val:daysSince(client.created_at)+"d",label:"Dias cadastrado",color:T.muted},
              ].map(s=>(
                <div key={s.label} style={{flex:1,minWidth:100,background:T.surface,borderRadius:10,padding:12,textAlign:"center",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:3}}>{s.label}</div>
                </div>
              ))}
            </div>
            {loading?<Spinner/>:(
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:10}}>📋 Histórico Completo — clique para ver detalhes</div>
                {allActivities.length===0
                  ?<div style={{color:T.muted,textAlign:"center",padding:32,fontSize:14}}>Nenhuma atividade registrada.</div>
                  :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {allActivities.map((a,i)=>(
                      <button key={i} onClick={()=>setDetail(a)}
                        style={{display:"flex",gap:12,alignItems:"flex-start",background:T.surface,borderRadius:10,padding:"12px 14px",border:`1px solid ${T.border}`,cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"inherit",transition:"border-color .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=a._color}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                        <span style={{fontSize:20,marginTop:2}}>{a._icon}</span>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                            <span style={{background:a._color+"22",color:a._color,borderRadius:5,padding:"1px 8px",fontSize:11,fontWeight:700}}>{a._type}</span>
                            <span style={{color:T.muted,fontSize:11}}>{a.date}{a.time?" às "+a.time:""}</span>
                          </div>
                          <div style={{color:T.text,fontSize:13,fontWeight:600,marginBottom:2}}>{a._title}</div>
                          <div style={{color:T.muted,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:500}}>
                            {a._summary||<span style={{fontStyle:"italic"}}>Sem observações</span>}
                          </div>
                        </div>
                        <span style={{color:T.accent,fontSize:12,marginTop:4,flexShrink:0}}>Ver →</span>
                      </button>
                    ))}
                  </div>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Clients({user,profiles,onQuickAc,onQuickFU}){
  const{segments,origins}=useLists();
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);
  const[historyClient,setHistoryClient]=useState(null);
  const[clientDocFile,setClientDocFile]=useState(null);
  const[clientDocs,setClientDocs]=useState(()=>{try{const s=localStorage.getItem("krcf_client_docs");return s?JSON.parse(s):{};}catch{return{};}});
  const[allCalls,setAllCalls]=useState([]);const[allFUs,setAllFUs]=useState([]);const[allMeetings,setAllMeetings]=useState([]);
  const[search,setSearch]=useState("");const[fStatus,setFStatus]=useState("");const[fSeg,setFSeg]=useState("");const[fOrigin,setFOrigin]=useState("");const[fResp,setFResp]=useState("");
  const emptyForm={name:"",cnpj:"",phone:"",whatsapp:"",email:"",city:"",state:"",segment:"",origin:"",responsible:user.role==="vendedor"?user.id:"",status:"Lead"};
  const[form,setForm]=useState(emptyForm);
  const load=useCallback(async()=>{
    const[{data:cl},{data:ca},{data:fu},{data:mt}]=await Promise.all([
      supabase.from("clients").select("*").order("created_at",{ascending:false}),
      supabase.from("acionamentos").select("client_id,date,canal").order("date",{ascending:false}),
      supabase.from("followups").select("client_id,date").order("date",{ascending:false}),
      supabase.from("meetings").select("client_id,date").order("date",{ascending:false}),
    ]);
    setClients(cl||[]);setAllCalls(ca||[]);setAllFUs(fu||[]);setAllMeetings(mt||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  const visible=clients.filter(c=>{
    const q=search.toLowerCase();
    const mine=user.role==="vendedor"?c.responsible===user.id:true;
    const respMatch=fResp?c.responsible===fResp:true;
    return mine&&respMatch&&(!q||c.name.toLowerCase().includes(q)||(c.cnpj||"").includes(q)||(c.phone||"").includes(q))&&(!fStatus||c.status===fStatus)&&(!fSeg||c.segment===fSeg)&&(!fOrigin||c.origin===fOrigin);
  });
  async function save(){
    if(!form.name?.trim())return alert("Nome é obrigatório.");
    if(!form.phone?.trim())return alert("Telefone é obrigatório.");
    const data={
      name:toUpper(form.name.trim()),
      cnpj:form.cnpj?.trim()||null,
      phone:form.phone.trim(),
      whatsapp:form.whatsapp?.trim()||null,
      email:form.email?.trim().toLowerCase()||null,
      city:toUpper(form.city?.trim()||""),
      state:toUpper(form.state?.trim()||""),
      segment:form.segment||null,
      origin:form.origin||null,
      responsible:form.responsible||user.id,
      status:form.status||"Lead",
    };
    if(edit){
      const{error}=await supabase.from("clients").update({...data,updated_at:new Date().toISOString()}).eq("id",edit.id);
      if(error){alert("Erro ao atualizar: "+error.message);return;}
    }else{
      const{error}=await supabase.from("clients").insert(data);
      if(error){
        if(error.code==="23505")alert("CNPJ já cadastrado em outro cliente!");
        else alert("Erro ao salvar: "+error.message);
        return;
      }
    }
    await load();setModal(false);setEdit(null);
  }
  async function del(id){if(!confirm("Remover cliente?"))return;await supabase.from("clients").delete().eq("id",id);await load();}
  function exportCSV(){
    const rows=[["Nome","CNPJ","Telefone","WhatsApp","Email","Cidade","Estado","Segmento","Origem","Status","Responsável","Criado em"]];
    visible.forEach(c=>rows.push([c.name,c.cnpj,c.phone,c.whatsapp,c.email,c.city,c.state,c.segment,c.origin,c.status,profiles.find(p=>p.id===c.responsible)?.name||"",c.created_at?.slice(0,10)]));
    const blob=new Blob([rows.map(r=>r.join(";")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="krcallflow_clientes.csv";a.click();
  }
  function importCSV(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      const lines=ev.target.result.split("\n").slice(1);let ok=0,err=0;
      for(const line of lines){const[name,phone,email,,city]=line.split(";");if(!name?.trim()||!phone?.trim()){err++;continue;}const dup=clients.find(c=>c.phone===phone.trim());if(dup){err++;continue;}await supabase.from("clients").insert({name:name.trim(),phone:phone.trim(),email:email?.trim(),city:city?.trim(),responsible:user.id,status:"Lead"});ok++;}
      alert(`Importação: ${ok} importados, ${err} ignorados.`);await load();
    };reader.readAsText(file);
  }
  if(loading)return<Spinner/>;
  const sellers=profiles.filter(p=>p.role==="vendedor");
  const visibleAll = clients.filter(c=>user.role==="vendedor"?c.responsible===user.id:true);
  const getLastActivity=(cid)=>{
    const dates=[
      ...(allCalls.filter(a=>a.client_id===cid).map(a=>a.date)),
      ...(allFUs.filter(a=>a.client_id===cid).map(a=>a.date)),
      ...(allMeetings.filter(a=>a.client_id===cid).map(a=>a.date)),
    ].filter(Boolean).sort().reverse();
    return dates[0]||null;
  };
  const getDaysSince=(dateStr)=>{if(!dateStr)return 9999;const d=new Date(dateStr);const now=new Date();return Math.floor((now-d)/(1000*60*60*24));};
  const acionadosCount=visibleAll.filter(c=>getDaysSince(getLastActivity(c.id))<30).length;
  const sem30=visibleAll.filter(c=>{const d=getDaysSince(getLastActivity(c.id));return d>=30&&d<60;}).length;
  const sem60=visibleAll.filter(c=>getDaysSince(getLastActivity(c.id))>=60).length;
  const neverAc=visibleAll.filter(c=>getLastActivity(c.id)===null).length;
  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <Card style={{flex:1,minWidth:130,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:800,color:T.accent}}>{visibleAll.length}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Total de Clientes</div>
        </Card>
        <Card style={{flex:1,minWidth:130,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:800,color:T.green}}>{acionadosCount}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Acionados (últimos 30d)</div>
        </Card>
        <Card style={{flex:1,minWidth:130,textAlign:"center",border:`1px solid ${T.yellow}30`}}>
          <div style={{fontSize:26,fontWeight:800,color:T.yellow}}>{sem30}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Sem Acionamento 30-60d</div>
        </Card>
        <Card style={{flex:1,minWidth:130,textAlign:"center",border:`1px solid ${T.red}30`}}>
          <div style={{fontSize:26,fontWeight:800,color:T.red}}>{sem60}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Sem Acionamento +60d</div>
        </Card>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,flex:1,minWidth:150,fontFamily:"inherit"}} placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="">📋 Todos os Status</option>{getStatusList().map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fSeg} onChange={e=>setFSeg(e.target.value)}>
          <option value="">📁 Todos os Segmentos</option>{segments.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fOrigin} onChange={e=>setFOrigin(e.target.value)}>
          <option value="">🌐 Todas as Origens</option>{origins.map(o=><option key={o}>{o}</option>)}
        </select>
        {user.role!=="vendedor"&&<select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fResp} onChange={e=>setFResp(e.target.value)}>
          <option value="">👤 Todos os Responsáveis</option>{sellers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>}
        <Btn size="sm" onClick={()=>{setEdit(null);setForm(emptyForm);setModal(true);}}>+ Novo Cliente</Btn>
        <Btn size="sm" variant="ghost" onClick={exportCSV}>⬇ Exportar</Btn>
        <label style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>⬆ Importar<input type="file" accept=".csv" style={{display:"none"}} onChange={importCSV}/></label>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 320px)"}}>
        <table style={{width:"max-content",minWidth:"100%",borderCollapse:"collapse",fontSize:12,whiteSpace:"nowrap"}}>
          <thead><tr style={{background:T.surface}}>
            {["Nome","CNPJ/CPF","Telefone","Origem","Segmento","Status","Dias Cadastro","Último Contato","Acionamentos","Resp.",""].map(h=><th key={h} style={{padding:"9px 10px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {visible.length===0&&<tr><td colSpan={11} style={{padding:32,textAlign:"center",color:T.muted}}>Nenhum cliente encontrado.</td></tr>}
            {visible.map(c=>(
              <tr key={c.id} style={{borderBottom:`1px solid ${T.border}15`}}>
                {/* Nome */}
                <td style={{padding:"9px 10px"}}>
                  <button onClick={()=>setHistoryClient(c)} style={{background:"none",border:"none",color:T.accent,fontWeight:700,fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit",textAlign:"left"}}>{c.name}</button>
                </td>
                {/* CNPJ/CPF */}
                <td style={{padding:"9px 10px",color:T.muted,fontSize:11}}>{c.cnpj||"—"}</td>
                {/* Telefone */}
                <td style={{padding:"9px 10px",color:T.sub,fontSize:11}}>{c.phone}</td>
                {/* Origem */}
                <td style={{padding:"9px 10px"}}><Badge color={T.purple}>{c.origin||"—"}</Badge></td>
                {/* Segmento */}
                <td style={{padding:"9px 10px"}}><Badge color={T.accent}>{c.segment||"—"}</Badge></td>
                {/* Status */}
                <td style={{padding:"9px 10px"}}><Badge color={STATUS_COLORS[c.status]||T.muted}>{c.status}</Badge></td>
                {/* Dias Cadastro */}
                <td style={{padding:"9px 10px",textAlign:"center"}}><span style={{color:T.muted,fontSize:11}}>{getDaysSince(c.created_at)}d</span></td>
                {/* Último Contato */}
                <td style={{padding:"9px 10px",textAlign:"center"}}>{(()=>{const last=getLastActivity(c.id);const days=getDaysSince(last);return<span style={{color:days>30?T.red:days>7?T.yellow:T.green,fontWeight:700,fontSize:11}}>{last?days+"d":"—"}</span>;})()}</td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>onQuickAc(c,"LIGACAO")} title="Ligação" style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:13}}>📞</button>
                    <button onClick={()=>onQuickAc(c,"WHATSAPP")} title="WhatsApp" style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:13}}>💬</button>
                    <button onClick={()=>onQuickFU(c)} title="Follow-up" style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:13}}>⏰</button>
                  </div>
                </td>
                <td style={{padding:"10px 12px",color:T.sub,fontSize:12}}>{profiles.find(p=>p.id===c.responsible)?.name||"—"}</td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <Btn size="sm" variant="ghost" onClick={()=>{setEdit(c);setForm({name:c.name,cnpj:c.cnpj||"",phone:c.phone||"",whatsapp:c.whatsapp||"",email:c.email||"",city:c.city||"",state:c.state||"",segment:c.segment||"",origin:c.origin||"",responsible:c.responsible||"",status:c.status});setModal(true);}}>✏️</Btn>
                    {user.role==="admin"&&<Btn size="sm" variant="ghost" onClick={()=>del(c.id)}>🗑</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <Modal open={modal} title={edit?"Editar Cliente":"Novo Cliente"} onClose={()=>setModal(false)} width={580}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Nome / Razão Social" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>CNPJ / CPF</div><input style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} placeholder="00.000.000/0001-00 ou 000.000.000-00" value={form.cnpj} onChange={e=>setForm(f=>({...f,cnpj:maskCNPJ(e.target.value)}))}/></div>
          <Input label="Telefone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} required/>
          <Input label="WhatsApp" value={form.whatsapp} onChange={v=>setForm(f=>({...f,whatsapp:v}))}/>
          <Input label="E-mail" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
          <Input label="Cidade" value={form.city} onChange={v=>setForm(f=>({...f,city:v}))}/>
          <Input label="Estado" value={form.state} onChange={v=>setForm(f=>({...f,state:v}))}/>
          <Input label="Segmento" value={form.segment} onChange={v=>setForm(f=>({...f,segment:v}))} options={segments}/>
          <Input label="Origem" value={form.origin} onChange={v=>setForm(f=>({...f,origin:v}))} options={origins}/>
          <Input label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={getStatusList().map(s=>s.name)}/>
          {user.role!=="vendedor"&&<div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Responsável</div>
            <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.responsible} onChange={e=>setForm(f=>({...f,responsible:e.target.value}))}>
              <option value="">Selecione...</option>{profiles.filter(p=>p.role==="vendedor").map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>📎 Anexar Documento (opcional)</div>
          <input type="file" id="cl_doc_file" onChange={e=>setClientDocFile(e.target.files[0])} style={{color:T.sub,fontSize:12,display:"block"}}/>
          {clientDocFile&&<div style={{color:T.muted,fontSize:11,marginTop:4}}>✅ {clientDocFile.name}</div>}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <Btn variant="ghost" onClick={()=>{setModal(false);setClientDocFile(null);}}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
      {historyClient&&<ClientHistory client={historyClient} profiles={profiles} onClose={()=>setHistoryClient(null)}/>}
    </div>
  );
}

// ─── ACIONAMENTOS ────────────────────────────────────────────
function Acionamentos({user,profiles,preClient,preCanal}){
  const {open:openView,modal:viewModal}=useClientView();
  const [acs,setAcs]=useState([]);
  const [clients,setClients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const channels=getChannels();
  const ch=(code)=>channels.find(c=>c.code===code)||{icon:"📋",color:T.muted,name:code||"Outro"};
  const emptyForm={client_id:"",canal:preCanal||channels[0]?.code||"LIGACAO",date:today(),time:nowTime(),type:"Atendida",result:"Retornar",obs:"",duration_min:"0",duration_sec:"0",status_val:"Enviado",fu_active:false,fu_date:"",fu_type:"Ligação",fu_desc:"",sched_meeting:false};
  const [form,setForm]=useState(emptyForm);
  const [fCanal,setFCanal]=useState("");
  const [fDate,setFDate]=useState("");
  const [fMonth,setFMonth]=useState("");
  const load=useCallback(async()=>{
    const [{data:a},{data:cl}]=await Promise.all([
      supabase.from("acionamentos").select("*").order("created_at",{ascending:false}),
      supabase.from("clients").select("id,name,responsible,whatsapp"),
    ]);
    setAcs(a||[]);setClients(cl||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(preClient){setForm(f=>({...f,client_id:preClient.id,canal:preCanal||f.canal}));setModal(true);}}, [preClient,preCanal]);
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myAcs=(user.role==="vendedor"?acs.filter(a=>a.user_id===user.id):acs)
    .filter(a=>(!fCanal||a.canal===fCanal)&&(!fDate||a.date===fDate)&&(!fMonth||a.date?.startsWith(fMonth)));
  const isLig=form.canal==="LIGACAO";
  async function save(){
    if(!form.client_id)return alert("Selecione um cliente.");
    const duration=`${form.duration_min}min ${form.duration_sec}s`;
    const {error}=await supabase.from("acionamentos").insert({
      client_id:form.client_id,user_id:user.id,canal:form.canal,
      date:form.date,time:form.time,type:form.type,
      result:isLig?(form.result||null):null,
      obs:form.obs||null,duration,
      status_val:!isLig?(form.status_val||null):null,
    });
    if(error){console.error("[Acionamentos]",error);alert("Erro: "+error.message);return;}
    if(form.fu_active&&form.fu_date){
      await supabase.from("followups").insert({client_id:form.client_id,user_id:user.id,date:form.fu_date,type:form.fu_type,description:form.fu_desc,status:"Pendente"});
    }
    await load();setModal(false);setForm(emptyForm);
  }
  function openWA(clientId){const c=clients.find(c=>c.id===clientId);if(!c?.whatsapp)return alert("Sem WhatsApp.");window.open(`https://wa.me/55${c.whatsapp.replace(/\D/g,"")}`);}
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fCanal} onChange={e=>setFCanal(e.target.value)}>
            <option value="">Todos canais</option>
            {channels.map(c=><option key={c.code} value={c.code}>{c.icon} {c.name}</option>)}
          </select>
          <input type="month" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12,fontFamily:"inherit"}} value={fMonth} onChange={e=>setFMonth(e.target.value)}/>
          <input type="date" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12,fontFamily:"inherit"}} value={fDate} onChange={e=>setFDate(e.target.value)}/>
        </div>
        <Btn onClick={()=>{setForm(emptyForm);setModal(true);}}>+ Registrar Acionamento</Btn>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{overflowX:"auto",maxHeight:"calc(100vh - 260px)"}}>
          <table style={{width:"max-content",minWidth:"100%",borderCollapse:"collapse",fontSize:12,whiteSpace:"nowrap"}}>
            <thead><tr style={{background:T.surface}}>
              {["Cliente","Canal","Data","Hora","Tipo","Resultado/Status","Observação",""].map(h=>(
                <th key={h} style={{padding:"9px 12px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:10,borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {myAcs.length===0&&<tr><td colSpan={8} style={{padding:28,textAlign:"center",color:T.muted}}>Nenhum registro.</td></tr>}
              {myAcs.map(a=>{
                const cl=clients.find(c=>c.id===a.client_id);
                const canal=ch(a.canal);
                const res=a.result||a.status_val||null;
                const resColor=a.result==="Interesse"?T.green:a.result==="Sem interesse"?T.red:T.yellow;
                return(
                  <tr key={a.id} style={{borderBottom:`1px solid ${T.border}15`}}>
                    <td style={{padding:"9px 12px"}}>{cl?<button onClick={()=>openView(cl.id,cl.name)} style={{background:"none",border:"none",color:T.accent,fontWeight:700,fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit"}}>{cl.name}</button>:<span style={{color:T.muted}}>—</span>}</td>
                    <td style={{padding:"9px 12px"}}><span style={{background:canal.color+"22",color:canal.color,border:`1px solid ${canal.color}40`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{canal.icon} {canal.name}</span></td>
                    <td style={{padding:"9px 12px",color:T.sub}}>{a.date}</td>
                    <td style={{padding:"9px 12px",color:T.sub}}>{a.time||"—"}</td>
                    <td style={{padding:"9px 12px",color:T.sub}}>{a.type||"—"}</td>
                    <td style={{padding:"9px 12px"}}>{res?<Badge color={resColor}>{res}</Badge>:<span style={{color:T.muted}}>—</span>}</td>
                    <td style={{padding:"9px 12px",color:T.muted,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>{a.obs||"—"}</td>
                    <td style={{padding:"9px 12px"}}>{a.canal==="WHATSAPP"&&<button onClick={()=>openWA(a.client_id)} style={{background:T.green+"22",border:`1px solid ${T.green}40`,borderRadius:6,padding:"3px 9px",fontSize:11,color:T.green,cursor:"pointer",fontWeight:600}}>💬 Abrir</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} title="Registrar Acionamento" onClose={()=>setModal(false)} width={560}>
        <div style={{marginBottom:14}}>
          <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Cliente *</div>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))}>
            <option value="">Selecione...</option>
            {myClients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{color:T.sub,fontSize:12,marginBottom:8,fontWeight:600}}>Canal de Acionamento *</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {channels.map(canal=>(
              <button key={canal.code} onClick={()=>setForm(f=>({...f,canal:canal.code,type:canal.code==="LIGACAO"?"Atendida":"Enviado"}))}
                style={{flex:1,padding:"12px",borderRadius:10,border:`2px solid ${form.canal===canal.code?canal.color:T.border}`,background:form.canal===canal.code?canal.color+"22":"transparent",color:form.canal===canal.code?canal.color:T.sub,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                {canal.icon} {canal.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
          <Input label="Data" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
          <Input label="Hora" value={form.time} onChange={v=>setForm(f=>({...f,time:v}))} type="time"/>
          {isLig&&<>
            <Input label="Tipo" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={["Atendida","Não atendida","Caixa Postal"]}/>
            <Input label="Resultado" value={form.result} onChange={v=>setForm(f=>({...f,result:v}))} options={["Interesse","Sem interesse","Retornar"]}/>
            <Input label="Duração — min" value={form.duration_min} onChange={v=>setForm(f=>({...f,duration_min:v}))} type="number" min="0"/>
            <Input label="Duração — seg" value={form.duration_sec} onChange={v=>setForm(f=>({...f,duration_sec:v}))} type="number" min="0" max="59"/>
          </>}
          {!isLig&&<>
            <Input label="Tipo" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={["Enviado","Recebido"]}/>
            <Input label="Status" value={form.status_val} onChange={v=>setForm(f=>({...f,status_val:v}))} options={["Enviado","Visualizado","Respondido"]}/>
          </>}
        </div>
        <Input label="Observações" value={form.obs} onChange={v=>setForm(f=>({...f,obs:v}))} placeholder="O que foi discutido?"/>
        <div style={{background:T.surface,borderRadius:8,border:`1px solid ${T.border}`,padding:"12px 14px",marginBottom:12}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:form.fu_active?12:0}}>
            <input type="checkbox" checked={form.fu_active} onChange={e=>setForm(f=>({...f,fu_active:e.target.checked}))}/>
            <span style={{color:T.sub,fontSize:13,fontWeight:600}}>📌 Agendar Follow-up</span>
          </label>
          {form.fu_active&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginTop:8}}>
            <Input label="Data" value={form.fu_date} onChange={v=>setForm(f=>({...f,fu_date:v}))} type="date"/>
            <Input label="Tipo" value={form.fu_type} onChange={v=>setForm(f=>({...f,fu_type:v}))} options={["Ligação","WhatsApp","Reunião"]}/>
            <div style={{gridColumn:"1/-1"}}><Input label="Descrição" value={form.fu_desc} onChange={v=>setForm(f=>({...f,fu_desc:v}))} placeholder="O que fazer?"/></div>
          </div>}
        </div>
        <div style={{background:T.surface,borderRadius:8,border:`1px solid ${T.border}`,padding:"10px 14px",marginBottom:14}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
            <input type="checkbox" checked={form.sched_meeting} onChange={e=>setForm(f=>({...f,sched_meeting:e.target.checked}))}/>
            <span style={{color:T.sub,fontSize:13}}>📅 Agendar Reunião após salvar</span>
          </label>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar Acionamento</Btn>
        </div>
      </Modal>
      {viewModal}
    </div>
  );
}

// ─── FOLLOW-UPS ──────────────────────────────────────────────
function Followups({user,preClient}){
  const {open:openView, modal:viewModal} = useClientView();
  const[fus,setFus]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const emptyForm={client_id:"",date:today(),type:"Ligação",description:"",title:"",status:"Pendente"};
  const[form,setForm]=useState(emptyForm);
  const[fType,setFType]=useState("");const[fSt,setFSt]=useState("");const[fDate,setFDate]=useState("");const[fMonth,setFMonth]=useState("");
  // Conclude flow
  const[concludeModal,setConcludeModal]=useState(false);
  const[concludeFU,setConcludeFU]=useState(null);
  const[concludeType,setConcludeType]=useState("");
  const[regModal,setRegModal]=useState(false);
  const[regForm,setRegForm]=useState({type:"Atendida",result:"Interesse",obs:"",content:"",status:"Enviado"});
  const[fuDocs,setFuDocs]=useState(()=>{try{const s=localStorage.getItem("krcf_fu_docs");return s?JSON.parse(s):{};}catch{return{};}});
  const[fuDocFile,setFuDocFile]=useState(null);
  function saveFuDocs(d){setFuDocs(d);localStorage.setItem("krcf_fu_docs",JSON.stringify(d));}
  function attachFuDoc(fuId){
    if(!fuDocFile)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const doc={name:fuDocFile.name,url:ev.target.result,date:today(),size:Math.round(fuDocFile.size/1024)+"KB"};
      const updated={...fuDocs,[fuId]:[...(fuDocs[fuId]||[]),doc]};
      saveFuDocs(updated);setFuDocFile(null);
    };
    reader.readAsDataURL(fuDocFile);
  }
  const load=useCallback(async()=>{
    const[f,c]=await Promise.all([supabase.from("followups").select("*").order("date"),supabase.from("clients").select("id,name,responsible")]);
    setFus(f.data||[]);setClients(c.data||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(preClient){setForm(f=>({...f,client_id:preClient.id}));setModal(true);}}, [preClient]);
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const today_str=today();
  const myFUsRaw=user.role==="vendedor"?fus.filter(f=>f.user_id===user.id):fus;
  const myFUs=myFUsRaw.map(f=>({...f,status:f.status==="Pendente"&&f.date<today_str?"Atrasado":f.status})).filter(f=>(!fType||f.type===fType)&&(!fSt||f.status===fSt)&&(!fDate||f.date===fDate)&&(!fMonth||f.date?.startsWith(fMonth)));
  async function save(){if(!form.client_id)return alert("Selecione um cliente.");await supabase.from("followups").insert({...form,user_id:user.id});await load();setModal(false);}
  async function conclude(f){
    if(f.status==="Concluído"){
      await supabase.from("followups").update({status:"Pendente"}).eq("id",f.id);
      await load();
    } else {
      setConcludeFU(f); setConcludeType(""); setRegForm({type:"Atendida",result:"Interesse",obs:"",content:"",status:"Enviado"});
      setConcludeModal(true);
    }
  }
  async function confirmConclude(){
    if(!concludeType) return alert("Selecione como o follow-up foi finalizado.");
    // Register the activity
    if(concludeType==="Ligação"){
      if(!regForm.obs && !regForm.result) return alert("Preencha ao menos o resultado da ligação.");
      const{error}=await supabase.from("calls").insert({client_id:concludeFU.client_id,user_id:user.id,date:today(),time:nowTime(),type:regForm.type||"Atendida",result:regForm.result||"Interesse",obs:regForm.obs,duration:"0min 0s"});
      if(error){alert("Erro ao registrar ligação: "+error.message);return;}
    } else if(concludeType==="WhatsApp"){
      if(!regForm.content) return alert("Preencha o conteúdo da mensagem.");
      const{error}=await supabase.from("whatsapp_logs").insert({client_id:concludeFU.client_id,user_id:user.id,date:today(),time:nowTime(),type:"Enviado",content:regForm.content,status:regForm.status||"Enviado"});
      if(error){alert("Erro ao registrar WhatsApp: "+error.message);return;}
    }
    await supabase.from("followups").update({status:"Concluído"}).eq("id",concludeFU.id);
    setConcludeModal(false);setConcludeFU(null);setConcludeType("");
    await load();
  }
  function newFU(f){setForm({client_id:f.client_id,date:today(),type:f.type,description:"",status:"Pendente"});setModal(true);}
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input type="month" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 12px",fontSize:12,fontFamily:"inherit"}} value={fMonth} onChange={e=>setFMonth(e.target.value)} placeholder="Mês"/>
          <input type="date" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 12px",fontSize:12,fontFamily:"inherit"}} value={fDate} onChange={e=>setFDate(e.target.value)}/>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fSt} onChange={e=>setFSt(e.target.value)}>
            <option value="">Todos status</option>{["Pendente","Concluído","Atrasado"].map(s=><option key={s}>{s}</option>)}
          </select>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fType} onChange={e=>setFType(e.target.value)}>
            <option value="">Todos tipos</option>{["Ligação","WhatsApp","Reunião"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <Btn onClick={()=>{setForm(emptyForm);setModal(true);}}>+ Agendar Follow-up</Btn>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            <ThFilter label="Cliente" value="" onChange={()=>{}}/>
            <ThFilter label="Data" value={fDate} onChange={setFDate}/>
            <ThFilter label="Tipo" value={fType} onChange={setFType} options={FOLLOWUP_TYPES}/>
            <ThFilter label="Descrição" value="" onChange={()=>{}}/>
            <ThFilter label="Status" value={fSt} onChange={setFSt} options={["Pendente","Concluído"]}/>
            <ThFilter label="Ações" value="" onChange={()=>{}}/>
          </tr></thead>
          <tbody>
            {myFUs.length===0&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:T.muted}}>Nenhum follow-up agendado.</td></tr>}
            {myFUs.map(f=>(
              <tr key={f.id} style={{borderBottom:`1px solid ${T.border}15`,opacity:f.status==="Concluído"?.65:1}}>
                <td style={{padding:"10px 12px"}}>{(()=>{const cl=clients.find(c=>c.id===f.client_id);return cl?<button onClick={()=>openView(cl.id,cl.name)} style={{background:"none",border:"none",color:T.accent,fontWeight:700,fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit"}}>{cl.name}</button>:<span style={{color:T.muted}}>—</span>;})()}</td>
                <td style={{padding:"10px 12px",color:f.date<today()&&f.status==="Pendente"?T.red:T.sub}}>{f.date}</td>
                <td style={{padding:"10px 12px"}}><Badge color={f.type==="Ligação"?T.accent:f.type==="WhatsApp"?T.green:T.purple}>{f.type}</Badge></td>
                <td style={{padding:"10px 12px",color:T.sub,maxWidth:180}}>{f.description}</td>
                <td style={{padding:"10px 12px"}}><Badge color={f.status==="Atrasado"?T.red:f.status==="Pendente"?T.yellow:T.green}>{f.status}</Badge></td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <Btn size="sm" variant={f.status==="Concluído"?"ghost":"success"} onClick={()=>conclude(f)}>{f.status==="Concluído"?"↺ Reabrir":"✓ Concluir"}</Btn>
                    <Btn size="sm" variant="ghost" onClick={()=>newFU(f)}>+ Novo FU</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} title="Agendar Follow-up" onClose={()=>setModal(false)}>
        <div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Cliente *</div>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))}>
            <option value="">Selecione...</option>{myClients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Data" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
          <Input label="Tipo" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={FOLLOWUP_TYPES}/>
        </div>
        <Input label="Título" value={form.title||""} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="Título do follow-up (opcional)"/>
        <Input label="Descrição" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))}/>
        <div style={{marginBottom:14}}>
          <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>📎 Anexar Documento (opcional)</div>
          <input type="file" onChange={e=>setFuDocFile(e.target.files[0])} style={{color:T.sub,fontSize:12,display:"block"}}/>
          {fuDocFile&&<div style={{color:T.muted,fontSize:11,marginTop:4}}>Selecionado: {fuDocFile.name}</div>}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={async()=>{await save();if(fuDocFile)setTimeout(()=>{const last=fus[fus.length-1];if(last)attachFuDoc(last.id);},500);}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Conclude Follow-up Modal */}
      {concludeModal&&concludeFU&&(
        <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setConcludeModal(false)}>
          <div style={{background:T.card,border:`1px solid ${T.green}`,borderRadius:16,padding:28,width:500,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>✅ Concluir Follow-up</div>
            <div style={{color:T.sub,fontSize:13,marginBottom:20}}>
              Cliente: <strong style={{color:T.text}}>{clients.find(c=>c.id===concludeFU.client_id)?.name||"—"}</strong><br/>
              Descrição: {concludeFU.description||concludeFU.title||"—"}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{color:T.sub,fontSize:12,marginBottom:8,fontWeight:600}}>Como foi finalizado? *</div>
              <div style={{display:"flex",gap:10}}>
                {["Ligação","WhatsApp"].map(t=>(
                  <button key={t} onClick={()=>setConcludeType(t)} style={{flex:1,padding:"12px",borderRadius:10,border:`2px solid ${concludeType===t?T.green:T.border}`,background:concludeType===t?T.green+"22":"transparent",color:concludeType===t?T.green:T.sub,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                    {t==="Ligação"?"📞":"💬"} {t}
                  </button>
                ))}
              </div>
            </div>
            {concludeType==="Ligação"&&(
              <div style={{background:T.surface,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:10}}>📞 Dados da Ligação</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                  <div style={{marginBottom:12}}>
                    <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Tipo</div>
                    <select style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,width:"100%",fontFamily:"inherit"}} value={regForm.type} onChange={e=>setRegForm(f=>({...f,type:e.target.value}))}>
                      {["Atendida","Não atendida","Caixa Postal"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Resultado *</div>
                    <select style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,width:"100%",fontFamily:"inherit"}} value={regForm.result} onChange={e=>setRegForm(f=>({...f,result:e.target.value}))}>
                      {["Interesse","Sem interesse","Retornar"].map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:"1/-1",marginBottom:12}}>
                    <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Observações *</div>
                    <textarea style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,width:"100%",fontFamily:"inherit",resize:"vertical",minHeight:70,boxSizing:"border-box"}} placeholder="Como foi a ligação?" value={regForm.obs} onChange={e=>setRegForm(f=>({...f,obs:e.target.value}))}/>
                  </div>
                </div>
              </div>
            )}
            {concludeType==="WhatsApp"&&(
              <div style={{background:T.surface,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:10}}>💬 Dados do WhatsApp</div>
                <div style={{marginBottom:12}}>
                  <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Conteúdo / Resumo *</div>
                  <textarea style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,width:"100%",fontFamily:"inherit",resize:"vertical",minHeight:70,boxSizing:"border-box"}} placeholder="O que foi tratado no WhatsApp?" value={regForm.content} onChange={e=>setRegForm(f=>({...f,content:e.target.value}))}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{color:T.muted,fontSize:11,marginBottom:4}}>Status</div>
                  <select style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,width:"100%",fontFamily:"inherit"}} value={regForm.status} onChange={e=>setRegForm(f=>({...f,status:e.target.value}))}>
                    {["Enviado","Visualizado","Respondido"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setConcludeModal(false)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,padding:"9px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
              <button onClick={confirmConclude} disabled={!concludeType} style={{background:T.green,border:"none",borderRadius:8,color:"#fff",padding:"9px 20px",fontSize:13,fontWeight:600,cursor:concludeType?"pointer":"not-allowed",opacity:concludeType?1:0.5,fontFamily:"inherit"}}>✅ Registrar e Concluir</button>
            </div>
          </div>
        </div>
      )}
      {viewModal}
    </div>
  );
}

// ─── MEETINGS ────────────────────────────────────────────────
function Meetings({user,profiles,preClient,onMarkRealizada}){
  const[meetings,setMeetings]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const emptyForm={client_id:"",title:"",date:today(),time:"09:00",duration_min:"30",location:"",description:"",status:"Agendada",participants:""};
  const[form,setForm]=useState(emptyForm);
  const[meetingDetail,setMeetingDetail]=useState(null);
  const[cancelModal,setCancelModal]=useState(false);
  const[cancelMeetingId,setCancelMeetingId]=useState(null);
  const[cancelReason,setCancelReason]=useState("");
  const[reschedModal,setReschedModal]=useState(false);
  const[reschedId,setReschedId]=useState(null);
  const[reschedDate,setReschedDate]=useState("");
  const[reschedTime,setReschedTime]=useState("09:00");
  const[docs,setDocs]=useState({}); // {meetingId: [{name,url,date}]}
  const[addDocId,setAddDocId]=useState(null); // which meeting to add doc to
  const[docFile,setDocFile]=useState(null);
  const[fStatus,setFStatus]=useState("");const[fDate,setFDate]=useState("");
  const load=useCallback(async()=>{
    const[m,c]=await Promise.all([supabase.from("meetings").select("*").order("date").order("time"),supabase.from("clients").select("id,name,responsible")]);
    setMeetings(m.data||[]);setClients(c.data||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(preClient){setForm(f=>({...f,client_id:preClient.id}));setModal(true);}}, [preClient]);
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myMeetings=(user.role==="vendedor"?meetings.filter(m=>m.user_id===user.id):meetings).filter(m=>(!fStatus||m.status===fStatus)&&(!fDate||m.date===fDate));
  async function save(){
    if(!form.client_id||!form.title)return alert("Título e cliente são obrigatórios.");
    const{error}=await supabase.from("meetings").insert({...form,user_id:user.id});
    if(error){alert("Erro ao salvar. Execute o SQL da tabela meetings no Supabase.");return;}
    await load();setModal(false);
  }
  async function updateStatus(id,status){await supabase.from("meetings").update({status}).eq("id",id);await load();}
  const SC={Agendada:T.accent,Realizada:T.green,Cancelada:T.red,Reagendada:T.yellow};
  // Load docs from localStorage
  useEffect(()=>{
    try{const d=localStorage.getItem("krcf_meeting_docs");if(d)setDocs(JSON.parse(d));}catch{}
  },[]);
  function saveDocs(d){setDocs(d);localStorage.setItem("krcf_meeting_docs",JSON.stringify(d));}
  function addDoc(meetingId){
    if(!docFile)return alert("Selecione um arquivo.");
    const reader=new FileReader();
    reader.onload=ev=>{
      const newDoc={name:docFile.name,url:ev.target.result,date:today(),size:Math.round(docFile.size/1024)+"KB"};
      const updated={...docs,[meetingId]:[...(docs[meetingId]||[]),newDoc]};
      saveDocs(updated);setAddDocId(null);setDocFile(null);
    };
    reader.readAsDataURL(docFile);
  }
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16,gap:8}}>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="">Todos os status</option>{MEETING_STATUS.map(s=><option key={s}>{s}</option>)}
        </select>
        <input type="date" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12,fontFamily:"inherit"}} value={fDate} onChange={e=>setFDate(e.target.value)}/>
        <Btn onClick={()=>{setForm(emptyForm);setModal(true);}}>+ Nova Reunião</Btn>
      </div>
      {myMeetings.length===0?<Card style={{textAlign:"center",padding:48}}><div style={{fontSize:40,marginBottom:12}}>📅</div><div style={{color:T.sub}}>Nenhuma reunião agendada.</div></Card>
      :<div style={{display:"flex",flexDirection:"column",gap:12}}>
        {myMeetings.map(m=>(
          <Card key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <span style={{background:(SC[m.status]||T.muted)+"22",color:SC[m.status]||T.muted,border:`1px solid ${(SC[m.status]||T.muted)}40`,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{m.status}</span>
                <button onClick={()=>setMeetingDetail(m)} style={{background:"none",border:"none",color:T.accent,fontSize:15,fontWeight:700,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit",textAlign:"left"}}>{m.title}</button>
              </div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                <span style={{color:T.sub,fontSize:12}}>👥 {clients.find(c=>c.id===m.client_id)?.name||"—"}</span>
                <span style={{color:T.sub,fontSize:12}}>📅 {m.date} às {m.time}</span>
                <span style={{color:T.sub,fontSize:12}}>⏱ {m.duration_min} min</span>
                {m.location&&<span style={{color:T.sub,fontSize:12}}>📍 {m.location}</span>}
                {m.participants&&<span style={{color:T.sub,fontSize:12}}>👤 {m.participants}</span>}
              </div>
              {m.description&&<div style={{color:T.muted,fontSize:12,marginTop:6}}>{m.description}</div>}
            {/* Documents */}
            {(docs[m.id]||[]).length>0&&(
              <div style={{marginTop:10,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                <div style={{fontSize:11,fontWeight:600,color:T.muted,marginBottom:6}}>📎 Documentos</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(docs[m.id]||[]).map((doc,di)=>(
                    <a key={di} href={doc.url} download={doc.name} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",fontSize:11,color:T.accent,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>
                      📄 {doc.name} <span style={{color:T.muted}}>({doc.size})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0,alignItems:"flex-end"}}>
              {m.status==="Agendada"&&<div style={{display:"flex",gap:6}}>
                <Btn size="sm" variant="success" onClick={()=>{
                      const cn=clients.find(c=>c.id===m.client_id)?.name||"—";
                      if(onMarkRealizada) onMarkRealizada(m,cn);
                      else updateStatus(m.id,"Realizada");
                    }}>✓ Realizada</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>updateStatus(m.id,"Reagendada")}>↺</Btn>
                <Btn size="sm" variant="danger" onClick={()=>{setCancelMeetingId(m.id);setCancelReason("");setCancelModal(true);}}>✕ Cancelar</Btn>
              </div>}
              <Btn size="sm" variant="ghost" onClick={()=>setAddDocId(m.id)} style={{fontSize:11}}>📎 Anexar</Btn>
            </div>
          </Card>
        ))}
      </div>}
      <Modal open={modal} title="Nova Reunião" onClose={()=>setModal(false)} width={560}>
        <Input label="Título da Reunião" value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} required placeholder="Ex: Apresentação de proposta"/>
        <div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Cliente *</div>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))}>
            <option value="">Selecione...</option>{myClients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Data" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
          <Input label="Horário" value={form.time} onChange={v=>setForm(f=>({...f,time:v}))} type="time"/>
          <Input label="Duração (minutos)" value={form.duration_min} onChange={v=>setForm(f=>({...f,duration_min:v}))} type="number" min="5"/>
          <Input label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={MEETING_STATUS}/>
        </div>
        <Input label="Local / Link" value={form.location} onChange={v=>setForm(f=>({...f,location:v}))} placeholder="Ex: Sala 2 / meet.google.com/..."/>
        <Input label="Participantes" value={form.participants} onChange={v=>setForm(f=>({...f,participants:v}))} placeholder="Ex: João, Maria..."/>
        <Input label="Pauta / Descrição" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="O que será discutido..."/>
        <div style={{marginBottom:14}}>
          <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>📎 Anexar Documentos (opcional)</div>
          <input type="file" multiple onChange={e=>setDocFile(e.target.files[0])} style={{color:T.sub,fontSize:12}}/>
          {docFile&&<div style={{color:T.muted,fontSize:11,marginTop:4}}>Arquivo selecionado: {docFile.name}</div>}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
      {/* Reschedule Modal */}
      {reschedModal&&(
        <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setReschedModal(false)}>
          <div style={{background:T.card,border:`1px solid ${T.yellow}`,borderRadius:14,padding:28,width:380,maxWidth:"95vw"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>↺ Reagendar Reunião</div>
            <div style={{color:T.sub,fontSize:13,marginBottom:16}}>Selecione a nova data e horário:</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:20}}>
              <div>
                <div style={{color:T.sub,fontSize:12,marginBottom:4,fontWeight:600}}>Nova Data *</div>
                <input type="date" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"9px 12px",fontSize:13,width:"100%",fontFamily:"inherit"}}
                  value={reschedDate} onChange={e=>setReschedDate(e.target.value)}/>
              </div>
              <div>
                <div style={{color:T.sub,fontSize:12,marginBottom:4,fontWeight:600}}>Horário</div>
                <input type="time" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"9px 12px",fontSize:13,width:"100%",fontFamily:"inherit"}}
                  value={reschedTime} onChange={e=>setReschedTime(e.target.value)}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setReschedModal(false)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,padding:"9px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
              <button onClick={async()=>{
                if(!reschedDate){alert("Selecione a nova data.");return;}
                await supabase.from("meetings").update({date:reschedDate,time:reschedTime,status:"Reagendada"}).eq("id",reschedId);
                setReschedModal(false);setReschedId(null);await load();
              }} style={{background:T.yellow,border:"none",borderRadius:8,color:"#000",padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                Confirmar Reagendamento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Meeting Modal */}
      {cancelModal&&(
        <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setCancelModal(false)}>
          <div style={{background:T.card,border:`1px solid ${T.red}`,borderRadius:14,padding:28,width:420,maxWidth:"95vw"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>❌ Cancelar Reunião</div>
            <div style={{color:T.sub,fontSize:13,marginBottom:16}}>Informe o motivo do cancelamento:</div>
            <textarea style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"10px 12px",fontSize:13,width:"100%",fontFamily:"inherit",resize:"vertical",minHeight:80,boxSizing:"border-box",marginBottom:16}}
              placeholder="Ex: Cliente pediu para reagendar, reunião desnecessária..."
              value={cancelReason} onChange={e=>setCancelReason(e.target.value)}/>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setCancelModal(false)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,padding:"9px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Voltar</button>
              <button onClick={async()=>{
                if(!cancelReason.trim()){alert("Informe o motivo do cancelamento.");return;}
                await supabase.from("meetings").update({status:"Cancelada",lost_reason:cancelReason}).eq("id",cancelMeetingId);
                setCancelModal(false);setCancelMeetingId(null);setCancelReason("");await load();
              }} style={{background:T.red,border:"none",borderRadius:8,color:"#fff",padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Meeting Detail Modal */}
      {meetingDetail&&(
        <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setMeetingDetail(null)}>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:28,width:660,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:4}}>{meetingDetail.title}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span style={{background:(SC[meetingDetail.status]||T.muted)+"22",color:SC[meetingDetail.status]||T.muted,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{meetingDetail.status}</span>
                  {meetingDetail.proposal_status&&<span style={{background:T.purple+"22",color:T.purple,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{meetingDetail.proposal_status}</span>}
                </div>
              </div>
              <button onClick={()=>setMeetingDetail(null)} style={{background:"none",border:"none",color:T.muted,fontSize:24,cursor:"pointer"}}>×</button>
            </div>
            {/* Info grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[
                {label:"📅 Data",val:`${meetingDetail.date} às ${meetingDetail.time}`},
                {label:"⏱ Duração",val:`${meetingDetail.duration_min} min`},
                {label:"📍 Local / Link",val:meetingDetail.location||"—"},
                {label:"👥 Participantes",val:meetingDetail.participants||"—"},
                ...(meetingDetail.lost_reason?[{label:"❌ Motivo Perda",val:meetingDetail.lost_reason}]:[]),
                ...(meetingDetail.post_sale_date?[{label:"🎯 Pós-venda",val:meetingDetail.post_sale_date}]:[]),
              ].map((f,i)=>(
                <div key={i} style={{background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:3}}>{f.label}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{f.val}</div>
                </div>
              ))}
            </div>
            {/* Notes */}
            {(meetingDetail.notes||meetingDetail.description)&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:8}}>📝 Notas / Pauta</div>
                <div style={{background:T.surface,borderRadius:10,padding:16,color:T.sub,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",border:`1px solid ${T.border}`}}>
                  {meetingDetail.notes||meetingDetail.description}
                </div>
              </div>
            )}
            {/* Documents */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,color:T.sub}}>📎 Documentos Anexados</div>
                <button onClick={()=>{setMeetingDetail(null);setAddDocId(meetingDetail.id);}} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,padding:"5px 12px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>+ Anexar</button>
              </div>
              {(docs[meetingDetail.id]||[]).length===0
                ?<div style={{color:T.muted,fontSize:12,padding:"16px 0",fontStyle:"italic"}}>Nenhum documento anexado.</div>
                :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(docs[meetingDetail.id]||[]).map((doc,di)=>(
                    <div key={di} style={{display:"flex",alignItems:"center",gap:12,background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                      <span style={{fontSize:20}}>📄</span>
                      <div style={{flex:1}}>
                        <div style={{color:T.text,fontSize:13,fontWeight:600}}>{doc.name}</div>
                        <div style={{color:T.muted,fontSize:11}}>{doc.size} · {doc.date}</div>
                      </div>
                      <a href={doc.url} download={doc.name} style={{background:T.accent+"22",color:T.accent,border:`1px solid ${T.accent}40`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,textDecoration:"none"}}>⬇ Baixar</a>
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        </div>
      )}
      {/* Add doc modal */}
      {addDocId&&(
        <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setAddDocId(null)}>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:24,width:400,maxWidth:"95vw"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:16}}>📎 Anexar Documento</div>
            <input type="file" onChange={e=>setDocFile(e.target.files[0])} style={{color:T.sub,fontSize:13,marginBottom:16,display:"block"}}/>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setAddDocId(null)}>Cancelar</Btn>
              <Btn onClick={()=>addDoc(addDocId)} disabled={!docFile}>Anexar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GOALS ───────────────────────────────────────────────────
function GoalCategoryCard({categoryLabel,categoryTitle,color,todayReal,todayMeta,weekReal,weekMeta,monthReal,monthMeta}){
  return(
    <Card style={{flex:1,minWidth:220}}>
      <div style={{fontSize:11,fontWeight:700,color,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{categoryLabel}</div>
      <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:14}}>{categoryTitle}</div>
      <div style={{display:"flex",gap:8,justifyContent:"space-around",alignItems:"flex-start",flexWrap:"wrap"}}>
        {[{label:"Hoje",real:todayReal,meta:todayMeta},{label:"Semana",real:weekReal,meta:weekMeta},{label:"Mês",real:monthReal,meta:monthMeta}].map(({label,real,meta})=>(
          <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <DonutRing real={real||0} meta={meta||1} color={color} size={label==="Hoje"?100:82}/>
            <div style={{fontSize:11,fontWeight:700,color:T.sub}}>{label}</div>
            <div style={{fontSize:10,color:T.muted}}>Meta: {meta||0}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Goals({user,profiles}){
  const[goals,setGoals]=useState([]);const[calls,setCalls]=useState([]);const[loading,setLoading]=useState(true);
  const[period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const[timeFilter,setTimeFilter]=useState("month"); // day|week|month
  const[selectedUser,setSelectedUser]=useState("");const[editGoal,setEditGoal]=useState(false);
  const[campaigns,setCampaigns]=useState([]);
  const[campModal,setCampModal]=useState(false);const[campForm,setCampForm]=useState({name:"",day:0,week:0,month:0});
  const sellers=profiles.filter(p=>p.role==="vendedor");
  const targetUser=user.role==="vendedor"?user.id:(selectedUser||sellers[0]?.id);
  const targetProfile=profiles.find(p=>p.id===targetUser);
  const emptyForm={daily:8,weekly:40,monthly:160,prosp_day:3,prosp_week:15,prosp_month:60,base_day:5,base_week:25,base_month:100};
  const[form,setForm]=useState(emptyForm);
  const load=useCallback(async()=>{
    const[g,c,camp]=await Promise.all([
      supabase.from("goals").select("*"),
      supabase.from("acionamentos").select("date,user_id,canal"),
      supabase.from("campaigns").select("*").order("created_at")
    ]);
    setGoals(g.data||[]);setCalls(c.data||[]);setCampaigns(camp.data||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  const current=goals.find(g=>g.user_id===targetUser&&g.period===period);
  const[ws,we]=weekRange();
  const todayCalls=calls.filter(c=>c.user_id===targetUser&&c.date===today()).length;
  const weekCalls=calls.filter(c=>c.user_id===targetUser&&c.date>=ws&&c.date<=we).length;
  const monthCalls=calls.filter(c=>c.user_id===targetUser&&c.date?.startsWith(period)).length;
  const myCalls=calls.filter(c=>c.user_id===targetUser&&c.date?.startsWith(period));
  const filteredReal=timeFilter==="day"?todayCalls:timeFilter==="week"?weekCalls:monthCalls;
  function handleFormChange(key,val){
    setForm(f=>{
      const next={...f,[key]:Number(val)};
      if(["prosp_day","base_day"].includes(key))next.daily=next.prosp_day+next.base_day;
      if(["prosp_week","base_week"].includes(key))next.weekly=next.prosp_week+next.base_week;
      if(["prosp_month","base_month"].includes(key))next.monthly=next.prosp_month+next.base_month;
      return next;
    });
  }
  async function save(){
    if(current)await supabase.from("goals").update({...form}).eq("id",current.id);
    else await supabase.from("goals").insert({...form,user_id:targetUser,period});
    await load();setEditGoal(false);
  }
  async function addCampaign(){
    if(!campForm.name)return alert("Informe o nome.");
    const{error}=await supabase.from("campaigns").insert({name:campForm.name,day:campForm.day,week:campForm.week,month:campForm.month});
    if(error)return alert("Erro ao salvar campanha. Execute o SQL da tabela campaigns.");
    setCampModal(false);setCampForm({name:"",day:0,week:0,month:0});await load();
  }
  async function deleteCampaign(id){
    if(!confirm("Excluir esta campanha?"))return;
    await supabase.from("campaigns").delete().eq("id",id);
    await load();
  }
  async function deleteGoal(){
    if(!current)return;
    if(!confirm("Excluir a meta de "+targetProfile?.name+" para "+periodLabel+"?"))return;
    await supabase.from("goals").delete().eq("id",current.id);
    await load();
  }
  const[yr,mo]=period.split("-");
  const MN=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const periodLabel=`${MN[parseInt(mo)-1]} de ${yr}`;
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:13,color:T.muted}}>Objetivo × Realizado — Dia · Semana · Mês</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {user.role!=="vendedor"&&<select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,fontFamily:"inherit"}} value={targetUser} onChange={e=>setSelectedUser(e.target.value)}>
            {sellers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>}
          <input type="month" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 12px",fontSize:12,fontFamily:"inherit"}} value={period} onChange={e=>setPeriod(e.target.value)}/>
          {[["day","Dia"],["week","Semana"],["month","Mês"]].map(([k,v])=>(
            <button key={k} onClick={()=>setTimeFilter(k)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:timeFilter===k?T.accent:T.surface,color:timeFilter===k?"#fff":T.sub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{v}</button>
          ))}
        </div>
      </div>
      {targetProfile&&<Card style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:T.accent+"33",border:`2px solid ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:T.accent}}>{targetProfile.name?.charAt(0).toUpperCase()}</div>
            <div><div style={{fontSize:16,fontWeight:700,color:T.text}}>{targetProfile.name}</div><div style={{fontSize:12,color:T.muted}}>{targetProfile.role}</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {user.role==="admin"&&<Btn onClick={()=>setCampModal(true)} variant="ghost">+ Campanha</Btn>}
            {user.role==="admin"&&current&&<Btn variant="danger" size="sm" onClick={deleteGoal}>🗑 Meta</Btn>}
            {user.role==="admin"&&<Btn onClick={()=>{
            if(current){
              const f={...current};
              f.daily=f.prosp_day+f.base_day;
              f.weekly=f.prosp_week+f.base_week;
              f.monthly=f.prosp_month+f.base_month;
              setForm(f);
            } else {
              setForm(emptyForm);
            }
            setEditGoal(true);}}>+ {current?"Editar Meta":"Adicionar Meta"}</Btn>}
          </div>
        </div>
      </Card>}
      {current
        ?<div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:campaigns.length>0?20:0}}>
          <GoalCategoryCard categoryLabel="Campanha / Geral" categoryTitle="Total de Ligações" color={T.purple}
            todayReal={filteredReal} todayMeta={timeFilter==="day"?current.prosp_day+current.base_day:timeFilter==="week"?current.prosp_week+current.base_week:current.prosp_month+current.base_month}
            weekReal={filteredReal} weekMeta={timeFilter==="day"?current.prosp_day+current.base_day:timeFilter==="week"?current.prosp_week+current.base_week:current.prosp_month+current.base_month}
            monthReal={filteredReal} monthMeta={timeFilter==="day"?current.prosp_day+current.base_day:timeFilter==="week"?current.prosp_week+current.base_week:current.prosp_month+current.base_month}/>
          <GoalCategoryCard categoryLabel="Prospecção" categoryTitle="Prospecção" color={T.orange}
            todayReal={Math.round(filteredReal*.4)} todayMeta={timeFilter==="day"?current.prosp_day:timeFilter==="week"?current.prosp_week:current.prosp_month}
            weekReal={Math.round(filteredReal*.4)} weekMeta={timeFilter==="day"?current.prosp_day:timeFilter==="week"?current.prosp_week:current.prosp_month}
            monthReal={Math.round(filteredReal*.4)} monthMeta={timeFilter==="day"?current.prosp_day:timeFilter==="week"?current.prosp_week:current.prosp_month}/>
          <GoalCategoryCard categoryLabel="Base de Clientes" categoryTitle="Base de Clientes" color={T.green}
            todayReal={Math.round(filteredReal*.6)} todayMeta={timeFilter==="day"?current.base_day:timeFilter==="week"?current.base_week:current.base_month}
            weekReal={Math.round(filteredReal*.6)} weekMeta={timeFilter==="day"?current.base_day:timeFilter==="week"?current.base_week:current.base_month}
            monthReal={Math.round(filteredReal*.6)} monthMeta={timeFilter==="day"?current.base_day:timeFilter==="week"?current.base_week:current.base_month}/>
        </div>
        :<Card style={{textAlign:"center",padding:40,marginBottom:20}}>
          <div style={{fontSize:44,marginBottom:14}}>🎯</div>
          <div style={{color:T.sub,fontSize:15,marginBottom:20}}>Nenhuma meta para <strong>{periodLabel}</strong>.</div>
          {user.role==="admin"&&<Btn size="lg" onClick={()=>setEditGoal(true)}>+ Adicionar Meta</Btn>}
        </Card>}
      {campaigns.length>0&&<div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8}}>
        {campaigns.map(camp=>(
          <div key={camp.id} style={{position:"relative",flex:1,minWidth:260}}>
            {user.role==="admin"&&<button onClick={()=>deleteCampaign(camp.id)} style={{position:"absolute",top:10,right:10,zIndex:10,background:T.red+"22",border:`1px solid ${T.red}40`,color:T.red,borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer",fontWeight:700}}>🗑 Excluir</button>}
            <GoalCategoryCard categoryLabel="🏷 Campanha" categoryTitle={camp.name} color={T.accent}
              todayReal={todayCalls} todayMeta={camp.day}
              weekReal={weekCalls} weekMeta={camp.week}
              monthReal={myCalls.length} monthMeta={camp.month}/>
          </div>
        ))}
      </div>}
      <Modal open={editGoal} title="Configurar Metas" onClose={()=>setEditGoal(false)} width={600}>
        <div style={{color:T.muted,fontSize:12,marginBottom:12}}>Vendedor: <strong style={{color:T.text}}>{targetProfile?.name}</strong> · <strong style={{color:T.text}}>{periodLabel}</strong></div>
        <div style={{background:T.surface,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.sub}}>💡 A <strong style={{color:T.text}}>Meta Geral</strong> é calculada automaticamente (Prospecção + Base)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"}}>
          <div style={{gridColumn:"1/-1",color:T.orange,fontSize:12,fontWeight:700,marginBottom:8,borderLeft:`3px solid ${T.orange}`,paddingLeft:8}}>PROSPECÇÃO</div>
          <Input label="Meta Diária" value={form.prosp_day} onChange={v=>handleFormChange("prosp_day",v)} type="number"/>
          <Input label="Meta Semanal" value={form.prosp_week} onChange={v=>handleFormChange("prosp_week",v)} type="number"/>
          <Input label="Meta Mensal" value={form.prosp_month} onChange={v=>handleFormChange("prosp_month",v)} type="number"/>
          <div style={{gridColumn:"1/-1",color:T.green,fontSize:12,fontWeight:700,marginBottom:8,marginTop:8,borderLeft:`3px solid ${T.green}`,paddingLeft:8}}>BASE DE CLIENTES</div>
          <Input label="Meta Diária" value={form.base_day} onChange={v=>handleFormChange("base_day",v)} type="number"/>
          <Input label="Meta Semanal" value={form.base_week} onChange={v=>handleFormChange("base_week",v)} type="number"/>
          <Input label="Meta Mensal" value={form.base_month} onChange={v=>handleFormChange("base_month",v)} type="number"/>
          <div style={{gridColumn:"1/-1",background:T.border,borderRadius:8,padding:"10px 14px",marginTop:8}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4,fontWeight:600}}>META GERAL (calculada automaticamente)</div>
            <div style={{display:"flex",gap:24}}><span style={{color:T.purple,fontWeight:700}}>Dia: {form.daily}</span><span style={{color:T.purple,fontWeight:700}}>Semana: {form.weekly}</span><span style={{color:T.purple,fontWeight:700}}>Mês: {form.monthly}</span></div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <Btn variant="ghost" onClick={()=>setEditGoal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar Meta</Btn>
        </div>
      </Modal>
      <Modal open={campModal} title="Nova Campanha" onClose={()=>setCampModal(false)}>
        <Input label="Nome da Campanha" value={campForm.name} onChange={v=>setCampForm(f=>({...f,name:v}))} required placeholder="Ex: Black Friday..."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"}}>
          <Input label="Meta Diária" value={campForm.day} onChange={v=>setCampForm(f=>({...f,day:Number(v)}))} type="number"/>
          <Input label="Meta Semanal" value={campForm.week} onChange={v=>setCampForm(f=>({...f,week:Number(v)}))} type="number"/>
          <Input label="Meta Mensal" value={campForm.month} onChange={v=>setCampForm(f=>({...f,month:Number(v)}))} type="number"/>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setCampModal(false)}>Cancelar</Btn>
          <Btn onClick={addCampaign}>Criar Campanha</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── EDITABLE LIST ───────────────────────────────────────────
function EditableList({title,table,color,icon}){
  const{reload}=useLists();
  const[items,setItems]=useState([]);
  const[newItem,setNewItem]=useState("");
  const[editId,setEditId]=useState(null);
  const[editVal,setEditVal]=useState("");
  const loadItems=useCallback(async()=>{
    const{data}=await supabase.from(table).select("*").order("name");
    setItems(data||[]);
  },[table]);
  useEffect(()=>{loadItems();},[loadItems]);
  async function add(){
    const v=newItem.trim();if(!v)return;
    const{error}=await supabase.from(table).insert({name:v});
    if(error)return alert("Erro: item já existe ou sem permissão.");
    setNewItem("");await loadItems();await reload();
  }
  async function remove(item){
    if(!confirm(`Remover "${item.name}"?`))return;
    await supabase.from(table).delete().eq("id",item.id);
    await loadItems();await reload();
  }
  async function saveEdit(){
    const v=editVal.trim();if(!v)return;
    await supabase.from(table).update({name:v}).eq("id",editId);
    setEditId(null);await loadItems();await reload();
  }
  return(
    <Card>
      <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:16}}>{icon} {title}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
        {items.map((item)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,background:T.surface,borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`}}>
            {editId===item.id
              ?<><input autoFocus style={{flex:1,background:"transparent",border:"none",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}} value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditId(null);}}/><Btn size="sm" onClick={saveEdit}>✓ Salvar</Btn><Btn size="sm" variant="ghost" onClick={()=>setEditId(null)}>✕</Btn></>
              :<><span style={{flex:1,color:T.text,fontSize:13}}>{item.name}</span><button onClick={()=>{setEditId(item.id);setEditVal(item.name);}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:"2px 6px"}}>✏️</button><button onClick={()=>remove(item)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:15,padding:"2px 6px"}}>🗑</button></>}
          </div>
        ))}
        {items.length===0&&<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:16}}>Nenhum item cadastrado.</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input style={{flex:1,background:T.surface,border:`1px solid ${color}40`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}} placeholder={`+ Novo...`} value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add();}}/>
        <Btn onClick={add} disabled={!newItem.trim()}>Adicionar</Btn>
      </div>
      <div style={{color:T.muted,fontSize:11,marginTop:8}}>💡 As alterações refletem para todos os usuários imediatamente</div>
    </Card>
  );
}


// ─── STATUS EDITOR ───────────────────────────────────────────
function StatusEditor(){
  const [statuses,setStatuses]=useState(()=>getStatusList());
  const [newName,setNewName]=useState("");
  const [newColor,setNewColor]=useState("#3B82F6");
  const [editIdx,setEditIdx]=useState(null);
  const [editVal,setEditVal]=useState("");
  const [editColor,setEditColor]=useState("");
  function persist(list){setStatuses(list);localStorage.setItem("krcf_statuses_v2",JSON.stringify(list));}
  function add(){const v=newName.trim();if(!v)return;if(statuses.find(s=>s.name===v))return alert("Já existe!");persist([...statuses,{name:v,color:newColor}]);setNewName("");setNewColor("#3B82F6");}
  function remove(idx){if(!confirm(`Remover "${statuses[idx].name}"?`))return;persist(statuses.filter((_,i)=>i!==idx));}
  function startEdit(idx){setEditIdx(idx);setEditVal(statuses[idx].name);setEditColor(statuses[idx].color);}
  function saveEdit(){const v=editVal.trim();if(!v)return;persist(statuses.map((s,i)=>i===editIdx?{name:v,color:editColor}:s));setEditIdx(null);}
  return(
    <div>
      <Card style={{marginBottom:14,background:T.accent+"0A",border:`1px solid ${T.accent}20`}}>
        <div style={{fontSize:12,color:T.sub,lineHeight:1.7}}>💡 Os status definidos aqui aparecerão nos formulários de clientes. As cores são exibidas como tags visuais.</div>
      </Card>
      <Card>
        <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:14}}>🏷 Status de Clientes</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
          {statuses.map((s,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
              {editIdx===idx?(
                <>
                  <input type="color" value={editColor} onChange={e=>setEditColor(e.target.value)} style={{width:28,height:28,borderRadius:6,border:"none",cursor:"pointer"}}/>
                  <input autoFocus style={{flex:1,background:"transparent",border:"none",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}} value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditIdx(null);}}/>
                  <Btn size="sm" variant="success" onClick={saveEdit}>✓</Btn>
                  <button onClick={()=>setEditIdx(null)} style={{background:"none",border:"none",color:T.muted,fontSize:18,cursor:"pointer"}}>×</button>
                </>
              ):(
                <>
                  <div style={{width:14,height:14,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                  <span style={{flex:1,color:T.text,fontSize:13}}>{s.name}</span>
                  <Badge color={s.color}>{s.name}</Badge>
                  <button onClick={()=>startEdit(idx)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15}}>✏️</button>
                  <button onClick={()=>remove(idx)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:15}}>🗑</button>
                </>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer"}}/>
          <input style={{flex:1,background:T.surface,border:`1px solid ${T.purple}40`,borderRadius:8,color:T.text,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}} placeholder="Novo status... (Enter para adicionar)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}/>
          <Btn disabled={!newName.trim()} onClick={add}>Adicionar</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── CHANNEL EDITOR ──────────────────────────────────────────
function ChannelEditor(){
  const [channels,setChannels]=useState(()=>getChannels());
  const [newName,setNewName]=useState("");
  const [newCode,setNewCode]=useState("");
  const [newIcon,setNewIcon]=useState("📋");
  const [newColor,setNewColor]=useState("#3B82F6");
  function persist(list){setChannels(list);localStorage.setItem("krcf_channels",JSON.stringify(list));}
  function add(){
    const name=newName.trim(),code=newCode.trim().toUpperCase().replace(/\s/g,"_");
    if(!name||!code)return alert("Nome e código são obrigatórios.");
    if(channels.find(c=>c.code===code))return alert("Código já existe!");
    persist([...channels,{name,code,icon:newIcon,color:newColor}]);
    setNewName("");setNewCode("");setNewIcon("📋");setNewColor("#3B82F6");
  }
  function remove(code){
    if(["LIGACAO","WHATSAPP"].includes(code))return alert("Canais padrão não podem ser removidos.");
    if(!confirm("Remover canal?"))return;
    persist(channels.filter(c=>c.code!==code));
  }
  return(
    <Card>
      <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:14}}>📡 Canais de Acionamento</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
        {channels.map(c=>(
          <div key={c.code} style={{display:"flex",alignItems:"center",gap:10,background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
            <span style={{fontSize:20}}>{c.icon}</span>
            <div style={{flex:1}}><div style={{fontWeight:700,color:T.text,fontSize:13}}>{c.name}</div><div style={{color:T.muted,fontSize:11}}>Código: {c.code}</div></div>
            <Badge color={c.color}>{c.name}</Badge>
            {!["LIGACAO","WHATSAPP"].includes(c.code)&&<button onClick={()=>remove(c.code)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:15}}>🗑</button>}
            {["LIGACAO","WHATSAPP"].includes(c.code)&&<span style={{color:T.muted,fontSize:11}}>padrão</span>}
          </div>
        ))}
      </div>
      <div style={{background:T.surface,borderRadius:10,padding:16,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:12}}>+ Novo Canal</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          <Input label="Nome" value={newName} onChange={setNewName} placeholder="Ex: Email, Visita..."/>
          <Input label="Código" value={newCode} onChange={setNewCode} placeholder="Ex: EMAIL, VISITA"/>
          <div style={{marginBottom:12}}>
            <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Ícone (emoji)</div>
            <input style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:20,width:"100%",fontFamily:"inherit",outline:"none"}} value={newIcon} onChange={e=>setNewIcon(e.target.value)} placeholder="📋"/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Cor</div>
            <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{width:"100%",height:38,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer"}}/>
          </div>
        </div>
        <Btn disabled={!newName.trim()||!newCode.trim()} onClick={add}>+ Criar Canal</Btn>
      </div>
    </Card>
  );
}




// ─── THEME PRESETS ───────────────────────────────────────────
const THEME_PRESETS = {
  dark: {
    label:"🌙 Escuro (padrão)",
    bg:"#0D0F14",surface:"#13161E",card:"#181C26",border:"#252A38",
    accent:"#3B82F6",green:"#10B981",red:"#EF4444",yellow:"#F59E0B",
    purple:"#8B5CF6",text:"#F1F5F9",muted:"#64748B",sub:"#94A3B8",
  },
  light: {
    label:"☀️ Claro",
    bg:"#F1F5F9",surface:"#FFFFFF",card:"#FFFFFF",border:"#E2E8F0",
    accent:"#2563EB",green:"#059669",red:"#DC2626",yellow:"#D97706",
    purple:"#7C3AED",text:"#0F172A",muted:"#94A3B8",sub:"#475569",
  },
  ocean: {
    label:"🌊 Oceano",
    bg:"#0C1929",surface:"#112240",card:"#1A2F52",border:"#1E3A5F",
    accent:"#64FFDA",green:"#00E5A0",red:"#FF5370",yellow:"#FFCC02",
    purple:"#C792EA",text:"#CCD6F6",muted:"#8892B0",sub:"#A8B2D8",
  },
  sunset: {
    label:"🌅 Pôr do Sol",
    bg:"#1A0A00",surface:"#2D1500",card:"#3D1F00",border:"#5C3000",
    accent:"#FF6B35",green:"#4CAF50",red:"#FF1744",yellow:"#FFD600",
    purple:"#CE93D8",text:"#FFF3E0",muted:"#A1887F",sub:"#BCAAA4",
  },
  forest: {
    label:"🌿 Floresta",
    bg:"#0A1A0F",surface:"#0D2415",card:"#112B1A",border:"#1A4025",
    accent:"#4CAF50",green:"#00E676",red:"#FF5252",yellow:"#FFEA00",
    purple:"#CE93D8",text:"#E8F5E9",muted:"#81C784",sub:"#A5D6A7",
  },
  corporate: {
    label:"🏢 Corporativo",
    bg:"#F8FAFC",surface:"#F1F5F9",card:"#FFFFFF",border:"#CBD5E1",
    accent:"#0EA5E9",green:"#22C55E",red:"#EF4444",yellow:"#F59E0B",
    purple:"#8B5CF6",text:"#1E293B",muted:"#94A3B8",sub:"#64748B",
  },
};

function ThemeEditor() {
  const [activePreset, setActivePreset] = useState(() => 
    localStorage.getItem("krcf_theme_preset") || "dark"
  );
  const [custom, setCustom] = useState(() => {
    try { const c = localStorage.getItem("krcf_theme_custom"); return c ? JSON.parse(c) : THEME_PRESETS.dark; }
    catch { return THEME_PRESETS.dark; }
  });
  const [tab, setTab] = useState("presets"); // presets | custom

  function applyPreset(key) {
    const preset = THEME_PRESETS[key];
    setActivePreset(key);
    localStorage.setItem("krcf_theme_preset", key);
    localStorage.setItem("krcf_theme", JSON.stringify(preset));
    window.location.reload();
  }

  function applyCustom() {
    const theme = {...custom, accentGlow: custom.accent+"20", orange: custom.yellow};
    localStorage.setItem("krcf_theme_preset", "custom");
    localStorage.setItem("krcf_theme", JSON.stringify(theme));
    window.location.reload();
  }

  const COLOR_FIELDS = [
    {key:"bg",       label:"Fundo Principal",    desc:"Cor de fundo da tela"},
    {key:"surface",  label:"Fundo Secundário",   desc:"Sidebar, cabeçalhos"},
    {key:"card",     label:"Cards",              desc:"Fundo dos cartões"},
    {key:"border",   label:"Bordas",             desc:"Linhas divisórias"},
    {key:"accent",   label:"Destaque (Principal)",desc:"Botões, links, selecionados"},
    {key:"green",    label:"Verde (Sucesso)",    desc:"Confirmações, fechados"},
    {key:"red",      label:"Vermelho (Alerta)",  desc:"Erros, cancelados"},
    {key:"yellow",   label:"Amarelo (Aviso)",    desc:"Atenção, pendentes"},
    {key:"purple",   label:"Roxo",               desc:"Reuniões, premium"},
    {key:"text",     label:"Texto Principal",    desc:"Títulos e textos"},
    {key:"sub",      label:"Texto Secundário",   desc:"Labels e subtítulos"},
    {key:"muted",    label:"Texto Suave",        desc:"Placeholders, metadados"},
  ];

  return (
    <div>
      <Card style={{marginBottom:14,background:T.accent+"0A",border:`1px solid ${T.accent}20`}}>
        <div style={{fontSize:13,color:T.sub,lineHeight:1.7}}>
          🎨 Personalize o visual do KR CALLFLOW. Escolha um tema pronto ou crie o seu próprio.<br/>
          <strong style={{color:T.yellow}}>⚠️ A página será recarregada ao aplicar o tema.</strong>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["presets","🎨 Temas Prontos"],["custom","🖌️ Personalizado"]].map(([k,v])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 16px",borderRadius:8,border:"none",background:tab===k?T.accent:T.surface,color:tab===k?"#fff":T.sub,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            {v}
          </button>
        ))}
      </div>

      {tab==="presets" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {Object.entries(THEME_PRESETS).map(([key,preset])=>(
            <div key={key} onClick={()=>applyPreset(key)} style={{
              cursor:"pointer",borderRadius:12,overflow:"hidden",
              border:`2px solid ${activePreset===key?T.accent:T.border}`,
              transition:"all .2s",transform:activePreset===key?"scale(1.02)":"scale(1)"
            }}>
              {/* Preview */}
              <div style={{background:preset.bg,padding:"14px 16px",height:80,position:"relative"}}>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:preset.accent}}/>
                  <div style={{width:8,height:8,borderRadius:"50%",background:preset.green}}/>
                  <div style={{width:8,height:8,borderRadius:"50%",background:preset.red}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{background:preset.surface,borderRadius:6,width:40,height:36}}/>
                  <div style={{flex:1}}>
                    <div style={{background:preset.card,borderRadius:6,height:14,marginBottom:4,border:`1px solid ${preset.border}`}}/>
                    <div style={{background:preset.accent+"33",borderRadius:4,height:10,width:"60%"}}/>
                  </div>
                </div>
                {activePreset===key&&<div style={{position:"absolute",top:8,right:8,background:T.green,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>✓</div>}
              </div>
              <div style={{background:T.surface,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{preset.label}</div>
                {activePreset===key
                  ?<span style={{fontSize:11,color:T.green,fontWeight:700}}>Ativo</span>
                  :<span style={{fontSize:11,color:T.muted}}>Clique para aplicar</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="custom" && (
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:4}}>🖌️ Tema Personalizado</div>
          <div style={{color:T.muted,fontSize:12,marginBottom:16}}>
            Baseie-se em um tema existente ou crie do zero:
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              {Object.entries(THEME_PRESETS).map(([k,p])=>(
                <button key={k} onClick={()=>setCustom({...p})} style={{background:p.accent+"22",border:`1px solid ${p.accent}60`,color:p.accent,borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                  {p.label.split(" ")[0]} {k}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
            {COLOR_FIELDS.map(({key,label,desc})=>(
              <div key={key} style={{marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
                <input type="color" value={custom[key]||"#000000"} onChange={e=>setCustom(c=>({...c,[key]:e.target.value}))}
                  style={{width:40,height:40,borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",flexShrink:0}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{label}</div>
                  <div style={{fontSize:11,color:T.muted}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div style={{background:custom.bg,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${custom.border}`}}>
            <div style={{fontSize:12,fontWeight:600,color:custom.sub,marginBottom:10}}>👁️ Preview do tema</div>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{background:custom.surface,borderRadius:8,padding:"8px 12px",flex:1,border:`1px solid ${custom.border}`}}>
                <div style={{fontSize:11,color:custom.muted,marginBottom:3}}>Card Surface</div>
                <div style={{fontSize:14,fontWeight:700,color:custom.text}}>Texto Principal</div>
                <div style={{fontSize:12,color:custom.sub}}>Subtexto</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{background:custom.accent,borderRadius:6,padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:600}}>Botão Ação</div>
                <div style={{background:custom.green,borderRadius:6,padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:600}}>Sucesso</div>
                <div style={{background:custom.red,borderRadius:6,padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:600}}>Alerta</div>
              </div>
            </div>
          </div>
          <Btn onClick={applyCustom} style={{width:"100%",padding:"12px"}}>🎨 Aplicar Tema Personalizado</Btn>
        </Card>
      )}
    </div>
  );
}


// ─── AI KEY EDITOR ───────────────────────────────────────────
function AIKeyEditor() {
  const [key, setKey] = useState(() => localStorage.getItem("krcf_anthropic_key") || "");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  function saveKey() {
    const trimmed = key.trim();
    if (!trimmed) {
      localStorage.removeItem("krcf_anthropic_key");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      return;
    }
    if (!trimmed.startsWith("sk-")) {
      alert("A chave deve começar com 'sk-'. Verifique se copiou corretamente da console.anthropic.com");
      return;
    }
    localStorage.setItem("krcf_anthropic_key", trimmed);
    setSaved(true);
    setTestResult("");
    setTimeout(() => setSaved(false), 2500);
  }

  async function testKey() {
    const trimmed = key.trim();
    if (!trimmed) { setTestResult("❌ Cole a chave antes de testar."); return; }
    setTesting(true); setTestResult("🔄 Testando conexão com Anthropic...");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": trimmed,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 5,
          messages: [{ role: "user", content: "OK" }]
        })
      });
      const data = await r.json();
      if (r.ok) {
        setTestResult("✅ IA funcionando! Chave válida.");
        // Auto-save on success
        localStorage.setItem("krcf_anthropic_key", trimmed);
        setSaved(true); setTimeout(() => setSaved(false), 3000);
      } else {
        const msg = data.error?.message || "Erro " + r.status;
        if (r.status === 401) {
          setTestResult("❌ Chave inválida ou expirada. Gere uma nova em console.anthropic.com");
        } else if (r.status === 403) {
          setTestResult("❌ Sem permissão. Verifique se a chave tem acesso à API.");
        } else {
          setTestResult("❌ Erro: " + msg);
        }
      }
    } catch (e) {
      setTestResult("❌ Erro de rede: " + e.message);
    }
    setTesting(false);
  }

  const isPlaceholder = !key || key === "COLE_SUA_CHAVE_AQUI";

  return (
    <div>
      <Card style={{ marginBottom: 14, background: T.accent + "0A", border: `1px solid ${T.accent}20` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>🤖 Configurar Chave da Anthropic (IA)</div>
        <div style={{ color: T.sub, fontSize: 12, lineHeight: 1.8 }}>
          A chave é necessária para usar <strong style={{color:T.text}}>Relatórios IA</strong>, <strong style={{color:T.text}}>Técnicas de Venda</strong> e outros recursos de inteligência artificial.<br/>
          Obtenha sua chave em: <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: T.accent }}>console.anthropic.com</a> → API Keys → Create Key
        </div>
      </Card>
      <Card>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
            Chave da API Anthropic
            {!isPlaceholder && <span style={{ color: T.green, marginLeft: 8, fontSize: 11 }}>● Configurada</span>}
            {isPlaceholder && <span style={{ color: T.yellow, marginLeft: 8, fontSize: 11 }}>● Não configurada</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              style={{ flex: 1, background: T.surface, border: `1px solid ${isPlaceholder ? T.yellow : T.green}60`, borderRadius: 8, color: T.text, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
              placeholder="sk-ant-api03-..."
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveKey()}
            />
            <Btn onClick={saveKey} variant={saved ? "success" : "primary"}>
              {saved ? "✓ Salvo!" : "Salvar"}
            </Btn>
            <Btn onClick={testKey} variant="ghost" disabled={isPlaceholder || testing}>
              {testing ? "Testando..." : "Testar"}
            </Btn>
          </div>
          {testResult && (
            <div style={{ marginTop: 10, padding: "8px 14px", background: T.surface, borderRadius: 8, fontSize: 13, color: testResult.startsWith("✅") ? T.green : T.red }}>
              {testResult}
            </div>
          )}
        </div>
        <div style={{ background: T.surface, borderRadius: 8, padding: 14, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 8 }}>📋 Como obter sua chave:</div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 2 }}>
            1. Acesse <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: T.accent }}>console.anthropic.com</a><br/>
            2. Faça login ou crie uma conta<br/>
            3. Clique em <strong style={{color:T.sub}}>API Keys</strong> no menu lateral<br/>
            4. Clique em <strong style={{color:T.sub}}>Create Key</strong><br/>
            5. Copie a chave que começa com <code style={{background:T.card,padding:"1px 6px",borderRadius:4,color:T.accent}}>sk-ant-api03-</code><br/>
            6. Cole aqui e clique em <strong style={{color:T.sub}}>Salvar</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}


// ─── SETTINGS ────────────────────────────────────────────────
function Settings({user,profiles,loadProfiles}){
  const[tab,setTab]=useState("users");const[modal,setModal]=useState(false);
  const[form,setForm]=useState({name:"",email:"",password:"",role:"vendedor"});
  const[resetModal,setResetModal]=useState(false);
  const[resetConfirm,setResetConfirm]=useState("");
  if(user.role!=="admin")return<Card style={{textAlign:"center",padding:48,color:T.muted}}>Acesso restrito a administradores.</Card>;
  async function createUser(){
    if(!form.name||!form.email||!form.password)return alert("Preencha todos os campos.");
    const{error}=await supabase.auth.admin.createUser({email:form.email,password:form.password,user_metadata:{name:form.name,role:form.role},email_confirm:true});
    if(error)return alert("Erro: "+error.message);
    alert("Usuário criado!");setModal(false);await loadProfiles();
  }
  async function resetSystem(){
    if(resetConfirm!=="RESETAR")return alert("Digite RESETAR para confirmar.");
    if(!confirm("ATENÇÃO: Esta ação apagará TODOS os dados do sistema (clientes, ligações, metas, etc). Deseja continuar?"))return;
    const UUID0="00000000-0000-0000-0000-000000000000";
    const tables=["acionamentos","calls","whatsapp_logs","followups","meetings","goals","campaigns","clients"];
    for(const t of tables){
      const {error:e}=await supabase.from(t).delete().neq("id",UUID0);
      if(e) console.warn(`Reset ${t}:`,e.message);
    }
    alert("Sistema resetado com sucesso!");
    setResetModal(false);setResetConfirm("");
    window.location.reload();
  }
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {[["users","👤 Usuários"],["segments","🗂 Segmentos"],["origins","🌐 Origens"],["statuses","🏷 Status"],["channels","📡 Canais"],["ai","🤖 IA"],["theme","🎨 Visual"],["danger","⚠️ Sistema"]].map(([k,v])=><Btn key={k} variant={tab===k?"primary":"ghost"} onClick={()=>setTab(k)}>{v}</Btn>)}
      </div>
      {tab==="users"&&<>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn size="sm" onClick={()=>{setForm({name:"",email:"",password:"",role:"vendedor"});setModal(true);}}>+ Novo Usuário</Btn></div>
        <Card style={{padding:0,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:T.surface}}>{["Nome","ID","Perfil"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{profiles.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${T.border}15`}}>
              <td style={{padding:"12px 16px",color:T.text,fontWeight:600}}>{p.name}</td>
              <td style={{padding:"12px 16px",color:T.sub}}>{p.id.slice(0,8)}...</td>
              <td style={{padding:"12px 16px"}}><Badge color={p.role==="admin"?T.red:p.role==="gestor"?T.purple:T.accent}>{p.role}</Badge></td>
            </tr>)}</tbody>
          </table>
        </Card>
      </>}
      {tab==="segments"&&<EditableList title="Segmentos" table="segments" color={T.accent} icon="🗂"/>}
      {tab==="origins"&&<EditableList title="Origens de Leads" table="origins" color={T.purple} icon="🌐"/>}
      {tab==="statuses"&&<StatusEditor/>}
      {tab==="channels"&&<ChannelEditor/>}
      {tab==="ai"&&<AIKeyEditor/>}
      {tab==="theme"&&<ThemeEditor/>}
      {tab==="danger"&&<Card style={{border:`1px solid ${T.red}40`}}>
        <div style={{fontSize:15,fontWeight:700,color:T.red,marginBottom:8}}>⚠️ Zona de Perigo</div>
        <div style={{color:T.sub,fontSize:13,marginBottom:20}}>Estas ações são irreversíveis. Use com extremo cuidado.</div>
        <div style={{background:T.surface,borderRadius:10,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
          <div style={{fontWeight:700,color:T.text,marginBottom:6}}>🗑 Resetar todo o sistema</div>
          <div style={{color:T.muted,fontSize:12,marginBottom:14}}>Apaga todos os clientes, ligações, WhatsApp, follow-ups, reuniões, metas e campanhas. Os usuários não são apagados.</div>
          <Btn variant="danger" onClick={()=>setResetModal(true)}>Resetar Sistema</Btn>
        </div>
      </Card>}
      <Modal open={resetModal} title="⚠️ Resetar Sistema" onClose={()=>{setResetModal(false);setResetConfirm("");}}>
        <div style={{background:T.red+"15",border:`1px solid ${T.red}40`,borderRadius:10,padding:16,marginBottom:20}}>
          <div style={{color:T.red,fontWeight:700,fontSize:14,marginBottom:6}}>⚠️ ATENÇÃO — Esta ação é irreversível!</div>
          <div style={{color:T.sub,fontSize:12}}>Todos os dados serão apagados permanentemente: clientes, ligações, WhatsApp, follow-ups, reuniões, metas e campanhas.</div>
        </div>
        <div style={{color:T.sub,fontSize:13,marginBottom:8}}>Para confirmar, digite <strong style={{color:T.red}}>RESETAR</strong> no campo abaixo:</div>
        <input style={{background:T.surface,border:`1px solid ${T.red}60`,borderRadius:8,color:T.text,padding:"10px 14px",fontSize:14,width:"100%",fontFamily:"inherit",outline:"none",marginBottom:20,boxSizing:"border-box"}} placeholder="Digite RESETAR" value={resetConfirm} onChange={e=>setResetConfirm(e.target.value)}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>{setResetModal(false);setResetConfirm("");}}>Cancelar</Btn>
          <Btn variant="danger" onClick={resetSystem} disabled={resetConfirm!=="RESETAR"}>Confirmar Reset</Btn>
        </div>
      </Modal>
      <Modal open={modal} title="Criar Novo Usuário" onClose={()=>setModal(false)}>
        <Input label="Nome completo" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
        <Input label="E-mail" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email" required/>
        <Input label="Senha inicial" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} type="password" required/>
        <Input label="Perfil" value={form.role} onChange={v=>setForm(f=>({...f,role:v}))} options={["admin","gestor","vendedor"]}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={createUser}>Criar Usuário</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────


// ─── CONSTANTES ADICIONAIS ───────────────────────────────────
const PROPOSAL_STATUS = ["Em negociação","Proposta enviada","Proposta fechada","Proposta perdida","Aguardando retorno"];
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// ─── AI CONFIG ───────────────────────────────────────────────
async function callAI(prompt, maxTokens = 1000) {
  // Priority: hardcoded key > localStorage
  const rawKey = (ANTHROPIC_KEY && ANTHROPIC_KEY !== "COLE_SUA_CHAVE_AQUI" && ANTHROPIC_KEY.trim().length > 20)
    ? ANTHROPIC_KEY
    : (localStorage.getItem("krcf_anthropic_key") || "");
  const key = rawKey.trim();
  if (!key || key.length < 20) {
    throw new Error("Chave da Anthropic não configurada. Vá em ⚙️ Configurações → 🤖 IA e cole sua chave.");
  }
  if (!key.startsWith("sk-")) {
    throw new Error("Chave inválida. Deve começar com 'sk-'. Verifique em ⚙️ Configurações → 🤖 IA");
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.error?.message || "Erro " + r.status);
  }
  const d = await r.json();
  return d.content?.map(i => i.text || "").join("\n") || "";
}

// ─── HOOK: NOTIFICAÇÕES 15min ────────────────────────────────
function useAlerts(user) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function checkAlerts() {
      const now = new Date();
      const in15 = new Date(now.getTime() + 15 * 60000);
      const todayStr = now.toISOString().slice(0, 10);
      const nowTime = now.toTimeString().slice(0, 5);
      const in15Time = in15.toTimeString().slice(0, 5);

      const [{ data: meetings }, { data: followups }] = await Promise.all([
        supabase.from("meetings").select("*").eq("date", todayStr).eq("status", "Agendada"),
        supabase.from("followups").select("*,clients(name)").eq("date", todayStr).eq("status", "Pendente"),
      ]);

      const newAlerts = [];

      (meetings || []).forEach(m => {
        if (m.time && m.time >= nowTime && m.time <= in15Time) {
          if (!user?.id) return;
          if (user.role === "vendedor" && m.user_id !== user.id) return;
          newAlerts.push({ id: `m-${m.id}`, type: "meeting", title: `📅 Reunião em 15 min!`, body: m.title, time: m.time });
        }
      });

      (followups || []).forEach(f => {
        const fu_time = f.time || "09:00";
        if (fu_time >= nowTime && fu_time <= in15Time) {
          if (!user?.id) return;
          if (user.role === "vendedor" && f.user_id !== user.id) return;
          newAlerts.push({ id: `f-${f.id}`, type: "followup", title: `⏰ Follow-up em 15 min!`, body: f.description || f.type, time: fu_time });
        }
      });

      if (newAlerts.length > 0) setAlerts(prev => {
        const existingIds = prev.map(a => a.id);
        const novel = newAlerts.filter(a => !existingIds.includes(a.id));
        return [...prev, ...novel];
      });
    }

    if (user?.id) checkAlerts();
    if (!user?.id) return;
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  function dismiss(id) { setAlerts(prev => prev.filter(a => a.id !== id)); }
  return { alerts, dismiss };
}

// ─── COMPONENT: ALERT POPUP ──────────────────────────────────
function AlertPopup({ alerts, dismiss }) {
  if (alerts.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
      {alerts.map(a => (
        <div key={a.id} style={{ background: T.card, border: `1px solid ${a.type === "meeting" ? T.accent : T.yellow}`, borderRadius: 14, padding: "14px 18px", boxShadow: "0 8px 32px #00000060", animation: "slideIn .3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
              <div style={{ color: T.sub, fontSize: 12 }}>{a.body}</div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>🕐 {a.time}</div>
            </div>
            <button onClick={() => dismiss(a.id)} style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── POST-SAVE QUICK FORMS ───────────────────────────────────
function PostSaveFUForm({ client, userId, onSaved, onSkip }) {
  const [date, setDate] = useState("");
  const [type, setType] = useState("Ligação");
  const [desc, setDesc] = useState("");

  async function save() {
    if (!date) return alert("Selecione a data.");
    await supabase.from("followups").insert({
      client_id: client.id, user_id: userId,
      date, type, description: desc, status: "Pendente"
    });
    onSaved();
  }

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Data *</div>
          <input type="date" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
            value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Tipo</div>
          <select style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
            value={type} onChange={e=>setType(e.target.value)}>
            {["Ligação","WhatsApp","Reunião"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Descrição</div>
        <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
          placeholder="O que fazer?" value={desc} onChange={e=>setDesc(e.target.value)} />
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onSkip} style={{ background:"none", border:"none", color:T.muted, fontSize:12, cursor:"pointer" }}>Pular</button>
        <button onClick={save} style={{ background:T.accent, border:"none", borderRadius:8, color:"#fff", padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Salvar Follow-up →
        </button>
      </div>
    </div>
  );
}

function PostSaveMeetingForm({ client, userId, onSaved, onSkip }) {
  const [form, setForm] = useState({ title:"", date:"", time:"09:00", duration_min:"30", location:"", description:"", participants:"", status:"Agendada" });

  async function save() {
    if (!form.title || !form.date) return alert("Título e data são obrigatórios.");
    await supabase.from("meetings").insert({ ...form, client_id: client.id, user_id: userId });
    onSaved();
  }

  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Título *</div>
        <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
          placeholder="Ex: Apresentação de proposta" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Data *</div>
          <input type="date" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
            value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Horário</div>
          <input type="time" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
            value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Duração (min)</div>
          <input type="number" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
            value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} />
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Local / Link</div>
          <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
            placeholder="Sala / meet.google.com/..." value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ color:T.sub, fontSize:12, marginBottom:4, fontWeight:600 }}>Pauta</div>
        <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"8px 12px", fontSize:13, width:"100%", fontFamily:"inherit" }}
          placeholder="O que será discutido?" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onSkip} style={{ background:"none", border:"none", color:T.muted, fontSize:12, cursor:"pointer" }}>Pular</button>
        <button onClick={save} style={{ background:T.purple, border:"none", borderRadius:8, color:"#fff", padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          ✅ Agendar Reunião
        </button>
      </div>
    </div>
  );
}

// ─── COMPONENT: FOLLOW-UP REMINDER (após ligação/whatsapp) ───
function FollowupReminder({ open, clientName, clientId, userId, onClose, onSaved }) {
  const [form, setForm] = useState({ date: "", type: "Ligação", description: "" });
  const [skip, setSkip] = useState(false);

  async function save() {
    if (!form.date) return alert("Selecione a data do follow-up.");
    await supabase.from("followups").insert({ client_id: clientId, user_id: userId, date: form.date, type: form.type, description: form.description, status: "Pendente" });
    onSaved(); onClose();
  }

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.card, border: `1px solid ${T.accent}`, borderRadius: 16, padding: 28, width: 420, maxWidth: "95vw" }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>📌</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Agendar Follow-up</div>
        <div style={{ color: T.sub, fontSize: 13, marginBottom: 20 }}>
          Ótimo contato com <strong style={{ color: T.text }}>{clientName}</strong>! Que tal já agendar o próximo passo?
        </div>

        {!skip ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Data *</div>
                <input type="date" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit" }}
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Tipo</div>
                <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit" }}
                  value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {["Ligação", "WhatsApp", "Reunião"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Descrição</div>
              <input style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit", boxSizing: "border-box" }}
                placeholder="O que fazer neste follow-up?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setSkip(true)} style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer" }}>Pular por agora</button>
              <button onClick={onClose} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.sub, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={save} style={{ background: T.accent, border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Salvar Follow-up</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ color: T.sub, fontSize: 13, marginBottom: 16 }}>Sem problemas! Você pode agendar depois na aba Follow-ups.</div>
            <button onClick={onClose} style={{ background: T.accent, border: "none", borderRadius: 8, color: "#fff", padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>OK, entendi</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENT: MEETING OUTCOME MODAL ────────────────────────
function MeetingOutcomeModal({ open, meeting, clientName, userId, onClose, onSaved }) {
  const [proposalStatus, setProposalStatus] = useState("Em negociação");
  const [lostReason, setLostReason] = useState("");
  const [fuDate, setFuDate] = useState("");
  const [fuDesc, setFuDesc] = useState("");
  const [postSaleDate, setPostSaleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const isLost = proposalStatus === "Proposta perdida";
  const isClosed = proposalStatus === "Proposta fechada";
  const needsFU = !isClosed && !isLost;

  async function save() {
    if (needsFU && !fuDate) return alert("Agende o próximo follow-up para continuar.");
    if (isLost && !lostReason) return alert("Informe o motivo da perda.");
    if (isClosed && !postSaleDate) return alert("Agende a data de pós-venda.");
    setSaving(true);

    // Update meeting status
    await supabase.from("meetings").update({ status: "Realizada", proposal_status: proposalStatus, lost_reason: lostReason, notes, post_sale_date: postSaleDate }).eq("id", meeting.id);

    // Create follow-up if needed
    if (needsFU && fuDate) {
      await supabase.from("followups").insert({ client_id: meeting.client_id, user_id: userId, date: fuDate, type: "Ligação", description: fuDesc || `Follow-up pós reunião: ${meeting.title}`, status: "Pendente" });
    }

    // Create post-sale follow-up if closed
    if (isClosed && postSaleDate) {
      await supabase.from("followups").insert({ client_id: meeting.client_id, user_id: userId, date: postSaleDate, type: "Ligação", description: `Pós-venda: ${meeting.title}`, status: "Pendente" });
    }

    setSaving(false); onSaved(); onClose();
  }

  if (!open) return null;
  const statusColor = { "Proposta fechada": T.green, "Proposta perdida": T.red, "Em negociação": T.accent, "Proposta enviada": T.purple, "Aguardando retorno": T.yellow };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 500, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>📋 Resultado da Reunião</div>
        <div style={{ color: T.sub, fontSize: 13, marginBottom: 20 }}>{meeting?.title} — {clientName}</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 8, fontWeight: 600 }}>Status da Proposta *</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PROPOSAL_STATUS.map(s => (
              <button key={s} onClick={() => setProposalStatus(s)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${proposalStatus === s ? statusColor[s] : T.border}`, background: proposalStatus === s ? statusColor[s] + "22" : "transparent", color: proposalStatus === s ? statusColor[s] : T.sub, fontSize: 12, fontWeight: proposalStatus === s ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Observações da reunião</div>
          <textarea style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} placeholder="O que foi discutido?" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {isLost && (
          <div style={{ marginBottom: 16, padding: 14, background: T.red + "11", borderRadius: 10, border: `1px solid ${T.red}30` }}>
            <div style={{ color: T.red, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Motivo da perda *</div>
            <input style={{ background: T.surface, border: `1px solid ${T.red}40`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit", boxSizing: "border-box" }}
              placeholder="Ex: Preço alto, concorrente, sem budget..." value={lostReason} onChange={e => setLostReason(e.target.value)} />
          </div>
        )}

        {isClosed && (
          <div style={{ marginBottom: 16, padding: 14, background: T.green + "11", borderRadius: 10, border: `1px solid ${T.green}30` }}>
            <div style={{ color: T.green, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>🎉 Data de Pós-venda *</div>
            <input type="date" style={{ background: T.surface, border: `1px solid ${T.green}40`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit" }}
              value={postSaleDate} onChange={e => setPostSaleDate(e.target.value)} />
          </div>
        )}

        {needsFU && (
          <div style={{ marginBottom: 16, padding: 14, background: T.accent + "11", borderRadius: 10, border: `1px solid ${T.accent}30` }}>
            <div style={{ color: T.accent, fontSize: 12, marginBottom: 8, fontWeight: 600 }}>📌 Próximo Follow-up *</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
              <div>
                <div style={{ color: T.muted, fontSize: 11, marginBottom: 4 }}>Data</div>
                <input type="date" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit" }}
                  value={fuDate} onChange={e => setFuDate(e.target.value)} />
              </div>
              <div>
                <div style={{ color: T.muted, fontSize: 11, marginBottom: 4 }}>Descrição</div>
                <input style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit" }}
                  placeholder="O que fazer?" value={fuDesc} onChange={e => setFuDesc(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.sub, padding: "9px 18px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ background: T.green, border: "none", borderRadius: 8, color: "#fff", padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando..." : "✓ Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GUIA: RELATÓRIOS IA ─────────────────────────────────────
function Reports({ user, profiles }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const isVendedor = user.role === "vendedor";
  const [reportType, setReportType] = useState(isVendedor ? "individual" : "lost_reasons");
  const [selectedSeller, setSelectedSeller] = useState(isVendedor ? user.id : "");
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0,7));
  const sellers = profiles.filter(p => p.role === "vendedor");

  async function generateReport() {
    setLoading(true); setReport(""); setSentMsg("");
    try {
      const [{ data: meetings }, { data: acionamentos }, { data: clients }] = await Promise.all([
        supabase.from("meetings").select("*").gte("date",reportMonth+"-01").lte("date",reportMonth+"-31"),
        supabase.from("acionamentos").select("*").gte("date",reportMonth+"-01").lte("date",reportMonth+"-31"),
        supabase.from("clients").select("*"),
      ]);
      const calls = acionamentos; // alias for prompt compatibility

      let prompt = "";
      if (reportType === "lost_reasons") {
        const lostMeetings = (meetings || []).filter(m => m.proposal_status === "Proposta perdida");
        const reasons = lostMeetings.map(m => m.lost_reason).filter(Boolean);
        prompt = `Você é um analista comercial especialista. Analise os seguintes motivos de proposta perdida de uma equipe de vendas e gere um relatório executivo em português com:
1. Principais padrões identificados
2. Top 3 motivos mais frequentes com análise
3. Recomendações estratégicas para reduzir perdas
4. Insights sobre o mercado/clientes

Motivos registrados: ${JSON.stringify(reasons)}
Total de reuniões: ${meetings?.length || 0}
Total de perdas: ${lostMeetings.length}
Taxa de perda: ${meetings?.length ? Math.round((lostMeetings.length / meetings.length) * 100) : 0}%

Seja objetivo e use dados concretos. Formate com seções claras.`;
      } else {
        const sellerId = selectedSeller || (sellers[0]?.id);
        const seller = profiles.find(p => p.id === sellerId);
        const todayStr = new Date().toISOString().slice(0, 10);
        const sellerCalls = (calls || []).filter(c => c.user_id === sellerId && c.date === todayStr);
        const sellerMeetings = (meetings || []).filter(m => m.user_id === sellerId);
        const closed = sellerMeetings.filter(m => m.proposal_status === "Proposta fechada").length;
        const lost = sellerMeetings.filter(m => m.proposal_status === "Proposta perdida").length;

        prompt = `Você é um coach de vendas especialista. Analise a performance do vendedor e gere um relatório individual em português com insights e dicas de melhoria.

Vendedor: ${seller?.name}
Data: ${todayStr}
Ligações hoje: ${sellerCalls.length}
Atendidas: ${sellerCalls.filter(c => c.type === "Atendida").length}
Com interesse: ${sellerCalls.filter(c => c.result === "Interesse").length}
Propostas fechadas (total): ${closed}
Propostas perdidas (total): ${lost}
Taxa de conversão: ${sellerMeetings.length ? Math.round((closed / sellerMeetings.length) * 100) : 0}%

Gere:
1. Resumo da performance de hoje
2. Pontos fortes identificados
3. 3 insights específicos de melhoria com exemplos práticos
4. Meta motivacional para amanhã
5. Uma técnica de vendas específica para aplicar

Seja encorajador mas direto. Use dados específicos.`;
      }

      const text = await callAI(prompt, 1200);
      setReport(text);
    } catch (e) {
      setReport("Erro ao gerar relatório: " + e.message);
    }
    setLoading(false);
  }

  async function sendByEmail() {
    if (!report) return;
    setSending(true);
    const seller = profiles.find(p => p.id === selectedSeller);
    const gestor = profiles.find(p => p.role === "gestor");
    const toEmail = seller?.email || user.email;
    const ccEmail = gestor?.email;
    // Open email client with report
    const subject = encodeURIComponent(`KR CALLFLOW - Relatório de Performance - ${seller?.name || user.name}`);
    const body = encodeURIComponent(report);
    const cc = ccEmail ? `&cc=${ccEmail}` : "";
    window.open(`mailto:${toEmail}?subject=${subject}${cc}&body=${body}`);
    setSentMsg(`✅ Abrindo cliente de e-mail para: ${toEmail}${ccEmail?" (CC: "+ccEmail+")":""}`);
    setSending(false);
  }

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 16 }}>⚙️ Configurar Relatório</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {!isVendedor && (
            <div>
              <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Tipo</div>
              <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 14px", fontSize: 13, fontFamily: "inherit" }}
                value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="lost_reasons">📊 Análise de Propostas Perdidas</option>
                <option value="individual">👤 Performance Individual do Vendedor</option>
              </select>
            </div>
          )}
          {(reportType === "individual" && !isVendedor) && (
            <div>
              <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Vendedor</div>
              <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 14px", fontSize: 13, fontFamily: "inherit" }}
                value={selectedSeller} onChange={e => setSelectedSeller(e.target.value)}>
                <option value="">Selecione...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {isVendedor && (
            <div style={{color:T.sub,fontSize:13,padding:"8px 14px",background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
              📊 Relatório de performance: <strong style={{color:T.text}}>{user.name}</strong>
            </div>
          )}
          <div>
            <div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Mês do Relatório</div>
            <input type="month" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 14px",fontSize:13,fontFamily:"inherit"}} value={reportMonth} onChange={e=>setReportMonth(e.target.value)}/>
          </div>
          <button onClick={generateReport} disabled={loading} style={{ background: T.accent, border: "none", borderRadius: 8, color: "#fff", padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
            {loading ? "🤖 Gerando..." : "🤖 Gerar com IA"}
          </button>
          {report && (
            <button onClick={sendByEmail} disabled={sending} style={{ background: T.green, border: "none", borderRadius: 8, color: "#fff", padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {sending ? "Enviando..." : "📧 Enviar por E-mail"}
            </button>
          )}
        </div>
        {sentMsg && <div style={{ color: T.green, fontSize: 13, marginTop: 12, fontWeight: 600 }}>{sentMsg}</div>}
      </Card>

      {loading && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ color: T.sub, fontSize: 14 }}>Analisando dados com IA...</div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Isso pode levar alguns segundos</div>
        </Card>
      )}

      {report && !loading && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>📄 Relatório Gerado pela IA</div>
            <div style={{ fontSize: 11, color: T.muted }}>{new Date().toLocaleString("pt-BR")}</div>
          </div>
          <div style={{ color: T.sub, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>{report}</div>
        </Card>
      )}

      {!report && !loading && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ color: T.sub, fontSize: 14 }}>Selecione o tipo de relatório e clique em Gerar com IA</div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>A IA analisa os dados do sistema e gera insights automáticos</div>
        </Card>
      )}
    </div>
  );
}

// ─── GUIA: TÉCNICAS DE VENDAS IA ─────────────────────────────
function SalesTech({ user }) {
  const [product, setProduct] = useState("");
  const [frameworks, setFrameworks] = useState([]);
  const [loadingFW, setLoadingFW] = useState(false);
  const [savedFrameworks, setSavedFrameworks] = useState(() => {
    try { const s = localStorage.getItem("krcf_frameworks"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeScript, setActiveScript] = useState(null);
  const [scriptContent, setScriptContent] = useState("");
  const [loadingScript, setLoadingScript] = useState(false);

  useEffect(() => { localStorage.setItem("krcf_frameworks", JSON.stringify(savedFrameworks)); }, [savedFrameworks]);

  async function searchFrameworks() {
    if (!product.trim()) return alert("Digite o que pretende vender.");
    setLoadingFW(true); setFrameworks([]);
    try {
      const prompt = `Você é um especialista em vendas B2B e B2C. Para o produto/serviço "${product}", liste as 5 melhores metodologias/frameworks de venda. 
Responda APENAS em JSON válido, sem markdown, sem texto adicional, no formato:
[{"name":"Nome do Framework","description":"O que é em 1 frase","bestFor":"Melhor para...","steps":"Passo 1, Passo 2, Passo 3"}]`;
      const text = await callAI(prompt, 1000);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setFrameworks(parsed);
    } catch (e) {
      alert("Erro ao buscar frameworks: " + e.message);
    }
    setLoadingFW(false);
  }

  function saveFramework(fw) {
    const already = savedFrameworks.find(f => f.name === fw.name && f.product === product);
    if (already) return alert("Este framework já foi salvo!");
    setSavedFrameworks(prev => [...prev, { ...fw, product, id: Date.now() }]);
  }

  function deleteFramework(id) {
    if (!confirm("Remover este framework?")) return;
    setSavedFrameworks(prev => prev.filter(f => f.id !== id));
  }

  async function openScript(fw) {
    setActiveScript(fw); setScriptContent(""); setLoadingScript(true);
    try {
      const prompt = `Você é um especialista em vendas. Crie um guia completo em português para vender "${fw.product}" usando a metodologia ${fw.name}.

## 🎯 SCRIPT DE VENDA — ${fw.name}
Produto: ${fw.product}

### 📝 Roteiro passo a passo
[script detalhado com falas reais]

### ⚡ Principais Objeções e Respostas
Objeção 1: [objeção comum] - Resposta: [como responder]
Objeção 2: [objeção comum] - Resposta: [como responder]
Objeção 3: [objeção comum] - Resposta: [como responder]

### 💡 Exemplos Práticos
[2 exemplos de situações reais aplicando o framework]

### ✅ Checklist de Fechamento
[5 pontos para verificar antes de fechar]

Seja específico, use linguagem natural brasileira e exemplos concretos.`;
      const text = await callAI(prompt, 1500);
      setScriptContent(text);
    } catch (e) {
      setScriptContent("Erro: " + e.message);
    }
    setLoadingScript(false);
  }

  const FW_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

  return (
    <div>
      {/* Search */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 12 }}>🔍 Buscar Metodologias de Venda</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none" }}
            placeholder="O que você pretende vender? Ex: Software de gestão, Plano de saúde, Consultoria..."
            value={product} onChange={e => setProduct(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchFrameworks()} />
          <button onClick={searchFrameworks} disabled={loadingFW} style={{ background: T.purple, border: "none", borderRadius: 8, color: "#fff", padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {loadingFW ? "🤖 Buscando..." : "🤖 Buscar com IA"}
          </button>
        </div>
      </Card>

      {/* Results from search */}
      {loadingFW && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
          <div style={{ color: T.sub }}>Analisando o produto e buscando as melhores metodologias...</div>
        </Card>
      )}

      {frameworks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 12 }}>📚 Metodologias sugeridas para: <span style={{ color: T.accent }}>{product}</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {frameworks.map((fw, i) => (
              <Card key={i} style={{ border: `1px solid ${FW_COLORS[i % FW_COLORS.length]}30` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ background: FW_COLORS[i % FW_COLORS.length] + "22", color: FW_COLORS[i % FW_COLORS.length], borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Framework</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fw.name}</span>
                    </div>
                    <div style={{ color: T.sub, fontSize: 13, marginBottom: 4 }}>{fw.description}</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>✅ {fw.bestFor}</div>
                    <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Passos: {fw.steps}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => saveFramework(fw)} style={{ background: FW_COLORS[i % FW_COLORS.length] + "22", border: `1px solid ${FW_COLORS[i % FW_COLORS.length]}40`, color: FW_COLORS[i % FW_COLORS.length], borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      + Salvar
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Saved frameworks as buttons */}
      {savedFrameworks.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 12 }}>⭐ Meus Frameworks Salvos</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {savedFrameworks.map((fw, i) => (
              <div key={fw.id} style={{ position: "relative" }}>
                <button onClick={() => openScript(fw)} style={{ background: FW_COLORS[i % FW_COLORS.length] + "22", border: `1px solid ${FW_COLORS[i % FW_COLORS.length]}60`, color: FW_COLORS[i % FW_COLORS.length], borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", maxWidth: 200 }}>
                  <div>{fw.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>{fw.product}</div>
                </button>
                <button onClick={() => deleteFramework(fw.id)} style={{ position: "absolute", top: -6, right: -6, background: T.red, border: "none", borderRadius: "50%", color: "#fff", width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
              </div>
            ))}
          </div>

          {/* Script Modal */}
          {activeScript && (
            <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setActiveScript(null)}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 680, maxWidth: "95vw", maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{activeScript.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Produto: {activeScript.product}</div>
                  </div>
                  <button onClick={() => setActiveScript(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 24, cursor: "pointer" }}>×</button>
                </div>
                {loadingScript ? (
                  <div style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
                    <div style={{ color: T.sub }}>Gerando script personalizado...</div>
                  </div>
                ) : (
                  <div style={{ color: T.sub, fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{scriptContent}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {frameworks.length === 0 && savedFrameworks.length === 0 && !loadingFW && (
        <Card style={{ textAlign: "center", padding: 56 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🧠</div>
          <div style={{ color: T.sub, fontSize: 15, marginBottom: 8 }}>Digite o que você vende e deixe a IA sugerir as melhores metodologias</div>
          <div style={{ color: T.muted, fontSize: 12 }}>SPIN Selling, BANT, Challenger Sale, MEDDIC e muito mais</div>
        </Card>
      )}
    </div>
  );
}


// ─── GUIA: PESQUISA DE LEADS (Google My Maps) ───────────────
function LeadsSearch({ user }) {
  const [mapUrl, setMapUrl] = useState(() => {
    try { return localStorage.getItem("krcf_mymap_url") || ""; } catch { return ""; }
  });
  const [inputUrl, setInputUrl] = useState(mapUrl);
  const [editingUrl, setEditingUrl] = useState(!mapUrl);
  const [saveModal, setSaveModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name:"", phone:"", email:"", city:"", segment:"", origin:"Pesquisa de Leads" });
  const [saved, setSaved] = useState("");

  function saveUrl() {
    if (!inputUrl.trim()) return alert("Cole o link do Google My Maps.");
    // Accept both embed and regular URLs
    let url = inputUrl.trim();
    if (url.includes("/maps/d/") && !url.includes("/embed")) {
      url = url.replace("/view", "/embed").replace("/edit", "/embed");
      if (!url.includes("/embed")) url = url + (url.includes("?") ? "&" : "?") + "embedded=true";
    }
    localStorage.setItem("krcf_mymap_url", url);
    setMapUrl(url);
    setEditingUrl(false);
  }

  async function saveLead() {
    if (!leadForm.name) return alert("Nome é obrigatório.");
    const { error } = await supabase.from("clients").insert({
      ...leadForm,
      responsible: user.id,
      status: "Lead",
    });
    if (error && error.code !== "23505") return alert("Erro: " + error.message);
    setSaved(leadForm.name + " salvo como Lead! ✅");
    setLeadForm({ name:"", phone:"", email:"", city:"", segment:"", origin:"Pesquisa de Leads" });
    setSaveModal(false);
    setTimeout(() => setSaved(""), 4000);
  }

  const segments = (() => { try { const s = localStorage.getItem("krcf_segments"); return s ? JSON.parse(s) : []; } catch { return []; }})();
  const origins  = (() => { try { const s = localStorage.getItem("krcf_origins");  return s ? JSON.parse(s) : []; } catch { return []; }})();

  return (
    <div>
      {/* Header bar */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, fontSize:13, color:T.muted }}>
          {mapUrl ? "🗺 Google My Maps incorporado" : "Configure o link do seu Google My Maps"}
        </div>
        {saved && <div style={{ color:T.green, fontWeight:700, fontSize:13 }}>{saved}</div>}
        <button onClick={()=>setSaveModal(true)} style={{ background:T.green, border:"none", borderRadius:8, color:"#fff", padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          + Salvar Cliente do Mapa
        </button>
        {user.role==="admin" && (
          <button onClick={()=>setEditingUrl(v=>!v)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.sub, padding:"8px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            ⚙️ {editingUrl ? "Cancelar" : "Configurar Mapa"}
          </button>
        )}
        {mapUrl && (
          <a href={mapUrl.replace("/embed","").replace("embedded=true","")} target="_blank" rel="noreferrer"
            style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.sub, padding:"8px 14px", fontSize:12, textDecoration:"none", fontFamily:"inherit" }}>
            ↗ Abrir no My Maps
          </a>
        )}
      </div>

      {/* URL Config (admin only) */}
      {editingUrl && (
        <div style={{ background:T.card, border:`1px solid ${T.accent}40`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:8 }}>🗺 Configurar Google My Maps</div>
          <div style={{ color:T.sub, fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            <strong style={{color:T.text}}>Como obter o link:</strong><br/>
            1. Acesse <a href="https://mymaps.google.com" target="_blank" rel="noreferrer" style={{color:T.accent}}>mymaps.google.com</a><br/>
            2. Abra ou crie seu mapa<br/>
            3. Clique nos <strong style={{color:T.text}}>3 pontinhos ⋮</strong> ao lado do nome do mapa<br/>
            4. Clique em <strong style={{color:T.text}}>"Incorporar no meu site"</strong><br/>
            5. Copie a URL que começa com <code style={{background:T.surface,padding:"1px 6px",borderRadius:4,fontSize:11}}>https://www.google.com/maps/d/...</code>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <input
              style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"10px 14px", fontSize:13, fontFamily:"inherit", outline:"none" }}
              placeholder="https://www.google.com/maps/d/embed?mid=..."
              value={inputUrl} onChange={e=>setInputUrl(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveUrl()}
            />
            <button onClick={saveUrl} style={{ background:T.accent, border:"none", borderRadius:8, color:"#fff", padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      {mapUrl ? (
        <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${T.border}`, background:T.surface }}>
          <iframe
            src={mapUrl}
            width="100%"
            height="620"
            style={{ border:"none", display:"block" }}
            allowFullScreen
            loading="lazy"
            title="Google My Maps"
          />
        </div>
      ) : (
        <div style={{ background:T.card, border:`2px dashed ${T.border}`, borderRadius:14, padding:64, textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🗺</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>Google My Maps</div>
          <div style={{ color:T.sub, fontSize:14, marginBottom:24 }}>
            Configure o link do seu mapa personalizado para visualizar aqui dentro da plataforma
          </div>
          {user.role==="admin" ? (
            <button onClick={()=>setEditingUrl(true)} style={{ background:T.accent, border:"none", borderRadius:8, color:"#fff", padding:"12px 28px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              ⚙️ Configurar Mapa Agora
            </button>
          ) : (
            <div style={{ color:T.muted, fontSize:13 }}>Solicite ao administrador para configurar o mapa.</div>
          )}
        </div>
      )}

      {/* Tips */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:16 }}>
        {[
          { icon:"📍", title:"Adicione seus leads", desc:"No Google My Maps, adicione pinos com as informações dos prospects que encontrar" },
          { icon:"💾", title:"Salve no sistema", desc:"Clique em '+ Salvar Cliente do Mapa' para adicionar um lead diretamente na sua base de clientes" },
          { icon:"🔄", title:"Sincronize sua equipe", desc:"Compartilhe o mesmo My Maps com toda a equipe para todos verem os leads no mapa" },
        ].map(tip => (
          <div key={tip.title} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{tip.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{tip.title}</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>{tip.desc}</div>
          </div>
        ))}
      </div>

      {/* Save Lead Modal */}
      {saveModal && (
        <div style={{ position:"fixed", inset:0, background:"#00000090", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setSaveModal(false)}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:28, width:500, maxWidth:"95vw" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.text }}>💾 Salvar Cliente do Mapa</div>
              <button onClick={()=>setSaveModal(false)} style={{ background:"none", border:"none", color:T.muted, fontSize:22, cursor:"pointer" }}>×</button>
            </div>
            <div style={{ color:T.sub, fontSize:13, marginBottom:16 }}>
              Preencha as informações do cliente que você encontrou no mapa:
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <div style={{ color:T.sub, fontSize:12, marginBottom:5, fontWeight:600 }}>Nome / Empresa <span style={{color:T.red}}>*</span></div>
                <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:13, width:"100%", fontFamily:"inherit", marginBottom:14, boxSizing:"border-box" }}
                  placeholder="Nome da empresa ou pessoa" value={leadForm.name} onChange={e=>setLeadForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <div style={{ color:T.sub, fontSize:12, marginBottom:5, fontWeight:600 }}>Telefone</div>
                <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:13, width:"100%", fontFamily:"inherit", marginBottom:14, boxSizing:"border-box" }}
                  placeholder="(11) 99999-9999" value={leadForm.phone} onChange={e=>setLeadForm(f=>({...f,phone:e.target.value}))} />
              </div>
              <div>
                <div style={{ color:T.sub, fontSize:12, marginBottom:5, fontWeight:600 }}>Cidade</div>
                <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:13, width:"100%", fontFamily:"inherit", marginBottom:14, boxSizing:"border-box" }}
                  placeholder="Cidade" value={leadForm.city} onChange={e=>setLeadForm(f=>({...f,city:e.target.value}))} />
              </div>
              <div>
                <div style={{ color:T.sub, fontSize:12, marginBottom:5, fontWeight:600 }}>E-mail</div>
                <input style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:13, width:"100%", fontFamily:"inherit", marginBottom:14, boxSizing:"border-box" }}
                  placeholder="email@empresa.com" value={leadForm.email} onChange={e=>setLeadForm(f=>({...f,email:e.target.value}))} />
              </div>
              <div>
                <div style={{ color:T.sub, fontSize:12, marginBottom:5, fontWeight:600 }}>Segmento</div>
                <select style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:13, width:"100%", fontFamily:"inherit", marginBottom:14 }}
                  value={leadForm.segment} onChange={e=>setLeadForm(f=>({...f,segment:e.target.value}))}>
                  <option value="">Selecione...</option>
                  {segments.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color:T.sub, fontSize:12, marginBottom:5, fontWeight:600 }}>Origem</div>
                <select style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 12px", fontSize:13, width:"100%", fontFamily:"inherit", marginBottom:14 }}
                  value={leadForm.origin} onChange={e=>setLeadForm(f=>({...f,origin:e.target.value}))}>
                  <option value="Pesquisa de Leads">Pesquisa de Leads</option>
                  {origins.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button onClick={()=>setSaveModal(false)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.sub, padding:"9px 18px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={saveLead} style={{ background:T.green, border:"none", borderRadius:8, color:"#fff", padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>💾 Salvar como Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MENU E APP ATUALIZADOS ───────────────────────────────────
const MENU = [
  { id: "dashboard",    label: "Dashboard",        icon: "📊" },
  { id: "clients",      label: "Clientes",          icon: "👥" },
  { id: "acionamentos", label: "Acionamentos",      icon: "🎯" },
  { id: "followups",    label: "Follow-ups",        icon: "⏰" },
  { id: "meetings",     label: "Reuniões",          icon: "📅" },
  { id: "goals",     label: "Metas",            icon: "🎯" },
  { id: "reports",   label: "Relatórios IA",    icon: "🤖" },
  { id: "sales",     label: "Técnicas de Venda",icon: "🧠" },
  { id: "leads",     label: "Pesquisa Leads",   icon: "🗺" },
  { id: "settings",  label: "Configurações",    icon: "⚙️" },
];

const PT = {
  dashboard: "📊 Dashboard", clients: "👥 Clientes", acionamentos: "🎯 Acionamentos",
  followups: "⏰ Follow-ups", meetings: "📅 Reuniões",
  goals: "🎯 Metas", reports: "🤖 Relatórios IA", sales: "🧠 Técnicas de Venda",
  leads: "🗺 Pesquisa Leads", settings: "⚙️ Configurações"
};

// ─── ERROR BOUNDARY ─────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",background:"#0D0F14",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
          <div style={{background:"#181C26",border:"1px solid #EF4444",borderRadius:16,padding:32,maxWidth:560,width:"95vw"}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:18,fontWeight:700,color:"#F1F5F9",marginBottom:8}}>Erro no Sistema</div>
            <div style={{color:"#94A3B8",fontSize:13,marginBottom:16,lineHeight:1.7}}>
              {this.state.error?.message || "Erro desconhecido"}<br/><br/>
              Verifique se:<br/>
              • As credenciais Supabase estão corretas (linhas 10-11)<br/>
              • A tabela <code style={{background:"#252A38",padding:"1px 6px",borderRadius:4}}>acionamentos</code> foi criada no Supabase<br/>
              • O SQL <code style={{background:"#252A38",padding:"1px 6px",borderRadius:4}}>fix_constraints.sql</code> foi executado
            </div>
            <button onClick={()=>window.location.reload()} style={{background:"#3B82F6",border:"none",borderRadius:8,color:"#fff",padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              🔄 Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [profiles, setProfiles] = useState([]);
  const [pendingFU, setPendingFU] = useState(0);
  const [quickClient, setQuickClient] = useState(null);
  const [quickTarget, setQuickTarget] = useState(null);

  // Follow-up reminder state
  const [fuReminder, setFuReminder] = useState({ open: false, clientName: "", clientId: null, userId: null });

  // Meeting outcome state
  const [meetingOutcome, setMeetingOutcome] = useState({ open: false, meeting: null, clientName: "" });

  // Post-save flow: open FU or Meeting form after saving call/whats
  const [postSaveFlow, setPostSaveFlow] = useState(null); // {type:'fu'|'meeting', client}
  const [postSaveMeetingOpen, setPostSaveMeetingOpen] = useState(false);
  const [postSaveFUOpen, setPostSaveFUOpen] = useState(false);
  const [postSaveClient, setPostSaveClient] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) setAuthUser({ ...session.user, ...profile });
      }
      setChecking(false);
    });
  }, []);

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  }, []);

  useEffect(() => {
    if (authUser) {
      loadProfiles();
      supabase.from("followups").select("id,status,date,user_id").then(({ data }) => {
        const fu = data || [];
        const mine = authUser.role === "vendedor" ? fu.filter(f => f.user_id === authUser.id) : fu;
        setPendingFU(mine.filter(f => f.status === "Pendente" && f.date <= today()).length);
      });
    }
  }, [authUser, loadProfiles]);

  // Alerts hook - always called (React rules of hooks)
  const { alerts, dismiss } = useAlerts(authUser || { id: null, role: "vendedor" });

  function handleQuick(client, target) {
    setQuickClient(client);
    setQuickTarget(target);
    setPage(target);
  }

  function showFuReminder(client, openMeeting = false) {
    if (!client) return;
    setPostSaveClient(client);
    if (openMeeting) {
      setPostSaveFUOpen(true);
    } else {
      setPostSaveFUOpen(true);
    }
  }

  function showMeetingOutcome(meeting, clientName) {
    setMeetingOutcome({ open: true, meeting, clientName });
  }

  if (checking) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!authUser) return <Login onLogin={setAuthUser} />;

  async function logout() { await supabase.auth.signOut(); setAuthUser(null); }
  const preClient = quickTarget === page ? quickClient : null;

  return (
    <ErrorBoundary>
    <ListsProvider>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans','Inter',system-ui,sans-serif", color: T.text, display: "flex" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} *{box-sizing:border-box}`}</style>

        {/* SIDEBAR */}
        <div style={{ width: 220, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "22px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: "-0.3px" }}><span style={{ color: T.accent }}>KR</span> CALLFLOW</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 3, letterSpacing: 1.5, textTransform: "uppercase" }}>Gestão Comercial</div>
          </div>
          <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            {MENU.map(m => (
              <button key={m.id} onClick={() => { setPage(m.id); setQuickClient(null); setQuickTarget(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", borderRadius: 10, border: "none", background: page === m.id ? T.accentGlow : "transparent", color: page === m.id ? T.accent : T.sub, fontWeight: page === m.id ? 700 : 500, fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "inherit", position: "relative" }}>
                <span>{m.icon}</span>{m.label}
                {m.id === "followups" && pendingFU > 0 && <span style={{ marginLeft: "auto", background: T.red, color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "2px 6px" }}>{pendingFU}</span>}
              </button>
            ))}
          </nav>
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{authUser.name}</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>{authUser.role}</div>
            <button style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.sub, padding: "6px 12px", fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={logout}>Sair</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 24 }}>{PT[page]}</div>
          {page === "dashboard" && <Dashboard user={authUser} profiles={profiles} onNav={p => setPage(p)} />}
          {page === "clients"      && <Clients   user={authUser} profiles={profiles} onQuickAc={(c,canal)=>{setQuickClient(c);setQuickTarget("acionamentos");setPage("acionamentos");}} onQuickFU={c=>handleQuick(c,"followups")} />}
          {page === "acionamentos" && <Acionamentos user={authUser} profiles={profiles} preClient={preClient} preCanal={null} />}
          {page === "followups" && <Followups user={authUser} preClient={preClient} />}
          {page === "meetings"  && <Meetings  user={authUser} profiles={profiles} preClient={preClient} onMarkRealizada={showMeetingOutcome} />}
          {page === "goals"     && <Goals     user={authUser} profiles={profiles} />}
          {page === "reports"   && <Reports   user={authUser} profiles={profiles} />}
          {page === "sales"     && <SalesTech user={authUser} />}
          {page === "leads"     && <LeadsSearch user={authUser} profiles={profiles} />}
          {page === "settings"  && <Settings  user={authUser} profiles={profiles} loadProfiles={loadProfiles} />}
        </div>

        {/* GLOBAL MODALS & ALERTS */}
        <AlertPopup alerts={alerts} dismiss={dismiss} />
        {/* Post-save FU quick modal */}
        {postSaveFUOpen && postSaveClient && (
          <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:T.card,border:`1px solid ${T.accent}`,borderRadius:16,padding:28,width:420,maxWidth:"95vw"}}>
              <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>📌 Agendar Follow-up</div>
              <div style={{color:T.sub,fontSize:13,marginBottom:16}}>Para: <strong style={{color:T.text}}>{postSaveClient.name}</strong></div>
              <PostSaveFUForm
                client={postSaveClient}
                userId={authUser?.id}
                onSaved={()=>{
                  setPostSaveFUOpen(false);
                  // Auto-open meeting form after FU
                  setPostSaveMeetingOpen(true);
                }}
                onSkip={()=>{
                  setPostSaveFUOpen(false);
                  setPostSaveMeetingOpen(true);
                }}
              />
            </div>
          </div>
        )}
        {/* Post-save Meeting quick modal */}
        {postSaveMeetingOpen && postSaveClient && (
          <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:T.card,border:`1px solid ${T.purple}`,borderRadius:16,padding:28,width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>📅 Agendar Reunião</div>
              <div style={{color:T.sub,fontSize:13,marginBottom:16}}>Para: <strong style={{color:T.text}}>{postSaveClient.name}</strong></div>
              <PostSaveMeetingForm
                client={postSaveClient}
                userId={authUser?.id}
                onSaved={()=>{setPostSaveMeetingOpen(false);setPostSaveClient(null);}}
                onSkip={()=>{setPostSaveMeetingOpen(false);setPostSaveClient(null);}}
              />
            </div>
          </div>
        )}
        <FollowupReminder
          open={fuReminder.open}
          clientName={fuReminder.clientName}
          clientId={fuReminder.clientId}
          userId={fuReminder.userId}
          onClose={() => setFuReminder(f => ({ ...f, open: false }))}
          onSaved={() => {}}
        />
        <MeetingOutcomeModal
          open={meetingOutcome.open}
          meeting={meetingOutcome.meeting}
          clientName={meetingOutcome.clientName}
          userId={authUser?.id}
          onClose={() => setMeetingOutcome(m => ({ ...m, open: false }))}
          onSaved={() => setMeetingOutcome(m => ({ ...m, open: false }))}
        />
      </div>
    </ListsProvider>
    </ErrorBoundary>
  );
}
