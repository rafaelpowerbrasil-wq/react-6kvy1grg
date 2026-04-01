import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ============================================================
//  ⚙️  CONFIGURAÇÃO SUPABASE
// ============================================================
const SUPABASE_URL = "https://xdnlowogfhwcrvwueups.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkbmxvd29nZmh3Y3J2d3VldXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTcxMzYsImV4cCI6MjA5MDE3MzEzNn0.EVybcOK9Y25sEyGpaZPSkRR7_UfNB21kPVwSNmWgvbY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── THEME ───────────────────────────────────────────────────
const T = {
  bg:"#0D0F14",surface:"#13161E",card:"#181C26",border:"#252A38",
  accent:"#3B82F6",accentGlow:"#3B82F620",green:"#10B981",red:"#EF4444",
  yellow:"#F59E0B",orange:"#F59E0B",purple:"#8B5CF6",
  text:"#F1F5F9",muted:"#64748B",sub:"#94A3B8",
};

// ─── GLOBAL LISTS CONTEXT ────────────────────────────────────
const ListsContext = React.createContext({ segments:[], origins:[], reload:()=>{} });
function useLists(){ return React.useContext(ListsContext); }
function ListsProvider({ children }){
  const[segments,setSegments]=useState([]);
  const[origins,setOrigins]=useState([]);
  const reload=useCallback(async()=>{
    const[s,o]=await Promise.all([supabase.from("segments").select("*").order("name"),supabase.from("origins").select("*").order("name")]);
    setSegments((s.data||[]).map(x=>x.name));
    setOrigins((o.data||[]).map(x=>x.name));
  },[]);
  useEffect(()=>{reload();},[reload]);
  return <ListsContext.Provider value={{segments,origins,reload}}>{children}</ListsContext.Provider>;
}
function getSegments(){return["Varejo","Indústria","Serviços","Tecnologia","Saúde","Educação","Agronegócio","Outro"];}
function getOrigins(){return["Lead","Indicação","Prospecção ativa","Site","Evento","Parceiro"];}

const STATUS_OPTIONS=["Lead","Em contato","Sem contato","Whats","Caixa Postal","Telefone não existe"];
const STATUS_COLORS={"Lead":T.accent,"Em contato":T.green,"Sem contato":T.muted,"Whats":T.purple,"Caixa Postal":T.yellow,"Telefone não existe":T.red};
const CALL_TYPES=["Atendida","Não atendida","Caixa Postal"];
const CALL_RESULTS=["Interesse","Sem interesse","Retornar"];
const FOLLOWUP_TYPES=["Ligação","WhatsApp","Reunião"];
const WHATS_TYPES=["Enviado","Recebido"];
const MEETING_STATUS=["Agendada","Realizada","Cancelada","Reagendada"];

const today=()=>new Date().toISOString().slice(0,10);
const nowTime=()=>new Date().toTimeString().slice(0,5);
function weekRange(){const n=new Date();const s=new Date(n);s.setDate(n.getDate()-n.getDay());const e=new Date(n);e.setDate(n.getDate()+(6-n.getDay()));return[s.toISOString().slice(0,10),e.toISOString().slice(0,10)];}

// ─── UI PRIMITIVES ───────────────────────────────────────────
function Badge({color=T.accent,children}){return<span style={{background:color+"22",color,border:`1px solid ${color}40`,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{children}</span>;}
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
function StatCard({label,value,color=T.accent,icon}){
  return(
    <Card style={{flex:1,minWidth:140}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{color:T.muted,fontSize:10,fontWeight:600,marginBottom:6}}>{label}</div><div style={{fontSize:26,fontWeight:800,color}}>{value}</div></div>
        {icon&&<span style={{fontSize:20,opacity:.7}}>{icon}</span>}
      </div>
    </Card>
  );
}
function ProgressBar({value,max,color=T.accent}){
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
      const[c,cl,f,g,camp,dcl,ca,wh,fu,mt]=await Promise.all([
        supabase.from("calls").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("followups").select("*"),
        supabase.from("goals").select("*"),
        supabase.from("campaigns").select("*"),
        supabase.from("clients").select("id,responsible"),
        supabase.from("calls").select("client_id"),
        supabase.from("whatsapp_logs").select("client_id"),
        supabase.from("followups").select("client_id"),
        supabase.from("meetings").select("client_id"),
      ]);
      setCalls(c.data||[]);
      setClients(cl.data||[]);
      setFollowups(f.data||[]);
      setGoals(g.data||[]);
      setDashCampaigns(camp.data||[]);
      setDashClients(dcl.data||[]);
      const ids=new Set([...(ca.data||[]),...(wh.data||[]),...(fu.data||[]),...(mt.data||[])].map(a=>a.client_id));
      setDashActs(ids);
      setLoading(false);
    }
    load();
  },[]);
  // ── COMPUTED VALUES (after hooks) ──
  const allCalls=user.role==="vendedor"?calls.filter(c=>c.user_id===user.id):calls;
  const myCalls=dateMode==="specific"
    ?allCalls.filter(c=>c.date===specificDate)
    :allCalls.filter(c=>c.date?.startsWith(dashMonth));
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myFU=user.role==="vendedor"?followups.filter(f=>f.user_id===user.id):followups;
  const pendFU=myFU.filter(f=>f.status==="Pendente"&&f.date<=today());
  const effective=myCalls.filter(c=>c.type==="Atendida").length;
  const convRate=myCalls.length>0?Math.round((effective/myCalls.length)*100):0;
  const visibleClients=user.role==="vendedor"?dashClients.filter(c=>c.responsible===user.id):dashClients;
  const acionadosCount=visibleClients.filter(c=>dashActs.has(c.id)).length;
  const semAcionamento=visibleClients.length-acionadosCount;
  const acionados=myClients.filter(c=>c.status!=="Lead").length;
  if(loading)return<Spinner/>;
  const now=new Date();
  let volData=[];
  if(volFilter==="day"){
    volData=Array.from({length:24},(_,i)=>({name:`${i}h`,Ligações:myCalls.filter(c=>c.date===today()&&parseInt(c.time||"0")>=i&&parseInt(c.time||"0")<i+1).length})).slice(0,now.getHours()+1);
  }else if(volFilter==="week"){
    volData=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+i);const k=d.toISOString().slice(0,10);return{name:d.toLocaleDateString("pt-BR",{weekday:"short"}),Ligações:myCalls.filter(c=>c.date===k).length};});
  }else{
    const dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    volData=Array.from({length:dim},(_,i)=>{const k=`${now.toISOString().slice(0,7)}-${String(i+1).padStart(2,"0")}`;return{name:String(i+1),Ligações:myCalls.filter(c=>c.date===k).length};});
  }
  const originsData=allOrigins.map(o=>({name:o,value:myCalls.filter(c=>clients.find(cl=>cl.id===c.client_id)?.origin===o).length})).filter(d=>d.value>0);
  const period=dashMonth;
  const sellers=profiles.filter(p=>p.role==="vendedor");
  const[ws,we]=weekRange();
  // Para vendedor: mostra só as metas dele. Para admin/gestor: soma a equipe toda
  const relevantGoals = user.role==="vendedor"
    ? goals.filter(g=>g.user_id===user.id&&g.period===period)
    : sellers.map(s=>goals.find(g=>g.user_id===s.id&&g.period===period)).filter(Boolean);
  const totalMeta={
    prosp:relevantGoals.reduce((a,g)=>a+(goalFilter==="day"?g.prosp_day:goalFilter==="week"?g.prosp_week:g.prosp_month),0),
    base:relevantGoals.reduce((a,g)=>a+(goalFilter==="day"?g.base_day:goalFilter==="week"?g.base_week:g.base_month),0),
    get general(){ return this.prosp + this.base; }
  };
  const filterCalls=goalFilter==="day"?myCalls.filter(c=>c.date===today()):goalFilter==="week"?myCalls.filter(c=>c.date>=ws&&c.date<=we):myCalls;
  const realGeneral=filterCalls.length,realProsp=Math.round(realGeneral*.4),realBase=Math.round(realGeneral*.6);
  const FB=[["day","Dia"],["week","Semana"],["month","Mês"]];
  return(
    <div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
        <StatCard label="Total de Ligações" value={myCalls.length} icon="📞"/>
        <StatCard label="Contatos Efetivos" value={effective} color={T.green} icon="✅"/>
        <StatCard label="Taxa de Contatos Efetivos" value={`${convRate}%`} color={T.purple} icon="🎯"/>
        <StatCard label="Follow-ups Pendentes" value={pendFU.length} color={pendFU.length>0?T.yellow:T.green} icon="⏰"/>
        <StatCard label="Clientes Acionados" value={acionados} color={T.accent} icon="👥"/>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
        <Card style={{flex:1,minWidth:140,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:800,color:T.accent}}>{visibleClients.length}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Total de Clientes</div>
        </Card>
        <Card style={{flex:1,minWidth:140,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:800,color:T.green}}>{acionadosCount}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Clientes Acionados</div>
        </Card>
        <Card style={{flex:1,minWidth:140,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:800,color:semAcionamento>0?T.red:T.muted}}>{semAcionamento}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Sem Acionamento</div>
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
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,marginBottom:24}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:T.sub}}>📈 Volumetria de Ligações</div>
            <div style={{display:"flex",gap:6}}>{FB.map(([k,v])=><Btn key={k} size="sm" variant={volFilter===k?"primary":"ghost"} onClick={()=>setVolFilter(k)}>{v}</Btn>)}</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volData} margin={{top:20,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fill:T.muted,fontSize:10}}/>
              <YAxis tick={{fill:T.muted,fontSize:10}}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12}}/>
              <Bar dataKey="Ligações" fill={T.accent} radius={[4,4,0,0]} label={{position:"top",fill:T.sub,fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:12}}>🌐 Origem dos Contatos</div>
          {originsData.length===0?<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:32}}>Sem dados</div>
          :<ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={originsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {originsData.map((_,i)=><Cell key={i} fill={[T.accent,T.green,T.purple,T.yellow,T.red,T.sub][i%6]}/>)}
            </Pie><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12}}/><Legend iconType="circle" wrapperStyle={{fontSize:10,color:T.sub}}/></PieChart>
          </ResponsiveContainer>}
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
function ClientHistory({client,profiles,onClose}){
  const[calls,setCalls]=useState([]);const[whats,setWhats]=useState([]);const[fus,setFus]=useState([]);const[meetings,setMeetings]=useState([]);const[loading,setLoading]=useState(true);
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
    ...(calls||[]).map(c=>({date:c.date,type:"Ligação",icon:"📞",desc:`${c.type} · ${c.result}`,color:T.accent})),
    ...(whats||[]).map(w=>({date:w.date,type:"WhatsApp",icon:"💬",desc:`${w.type} · ${w.status}`,color:T.green})),
    ...(fus||[]).map(f=>({date:f.date,type:"Follow-up",icon:"⏰",desc:`${f.type} · ${f.status}`,color:T.yellow})),
    ...(meetings||[]).map(m=>({date:m.date,type:"Reunião",icon:"📅",desc:`${m.title} · ${m.status}`,color:T.purple})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const lastActivity=allActivities[0];
  const daysNoContact=lastActivity?daysSince(lastActivity.date):daysSince(client.created_at);
  return(
    <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:28,width:680,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>{client.name}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {client.phone&&<span style={{color:T.sub,fontSize:12}}>📞 {client.phone}</span>}
              {client.email&&<span style={{color:T.sub,fontSize:12}}>✉️ {client.email}</span>}
              {resp&&<span style={{color:T.sub,fontSize:12}}>👤 {resp.name}</span>}
              <Badge color={STATUS_COLORS[client.status]||T.muted}>{client.status}</Badge>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:24,cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <Card style={{flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:22,fontWeight:800,color:T.accent}}>{calls.length+whats.length+fus.length+meetings.length}</div>
            <div style={{fontSize:11,color:T.muted}}>Total atividades</div>
          </Card>
          <Card style={{flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:22,fontWeight:800,color:daysNoContact>30?T.red:daysNoContact>7?T.yellow:T.green}}>{daysNoContact??0}d</div>
            <div style={{fontSize:11,color:T.muted}}>Sem contato</div>
          </Card>
          <Card style={{flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:22,fontWeight:800,color:T.purple}}>{meetings.filter(m=>m.proposal_status==="Proposta fechada").length}</div>
            <div style={{fontSize:11,color:T.muted}}>Propostas fechadas</div>
          </Card>
          <Card style={{flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:22,fontWeight:800,color:T.muted}}>{daysSince(client.created_at)}d</div>
            <div style={{fontSize:11,color:T.muted}}>Dias cadastrado</div>
          </Card>
        </div>
        {loading?<Spinner/>:(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:12}}>📋 Histórico Completo</div>
            {allActivities.length===0?<div style={{color:T.muted,textAlign:"center",padding:32}}>Nenhuma atividade registrada.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {allActivities.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:12,alignItems:"center",background:T.surface,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                  <span style={{fontSize:18}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <Badge color={a.color}>{a.type}</Badge>
                      <span style={{color:T.muted,fontSize:11}}>{a.date}</span>
                    </div>
                    <div style={{color:T.sub,fontSize:12,marginTop:2}}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Clients({user,profiles,onQuickCall,onQuickWhats,onQuickFU}){
  const{segments,origins}=useLists();
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);
  const[historyClient,setHistoryClient]=useState(null);
  const[allCalls,setAllCalls]=useState([]);const[allWhats,setAllWhats]=useState([]);const[allFUs,setAllFUs]=useState([]);const[allMeetings,setAllMeetings]=useState([]);
  const[search,setSearch]=useState("");const[fStatus,setFStatus]=useState("");const[fSeg,setFSeg]=useState("");const[fOrigin,setFOrigin]=useState("");const[fResp,setFResp]=useState("");
  const emptyForm={name:"",cnpj:"",phone:"",whatsapp:"",email:"",city:"",state:"",segment:"",origin:"",responsible:user.role==="vendedor"?user.id:"",status:"Lead"};
  const[form,setForm]=useState(emptyForm);
  const load=useCallback(async()=>{
    const[{data:cl},{data:ca},{data:wh},{data:fu},{data:mt}]=await Promise.all([
      supabase.from("clients").select("*").order("created_at",{ascending:false}),
      supabase.from("calls").select("client_id,date").order("date",{ascending:false}),
      supabase.from("whatsapp_logs").select("client_id,date").order("date",{ascending:false}),
      supabase.from("followups").select("client_id,date").order("date",{ascending:false}),
      supabase.from("meetings").select("client_id,date").order("date",{ascending:false}),
    ]);
    setClients(cl||[]);setAllCalls(ca||[]);setAllWhats(wh||[]);setAllFUs(fu||[]);setAllMeetings(mt||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  const visible=clients.filter(c=>{
    const q=search.toLowerCase();
    const mine=user.role==="vendedor"?c.responsible===user.id:true;
    const respMatch=fResp?c.responsible===fResp:true;
    return mine&&respMatch&&(!q||c.name.toLowerCase().includes(q)||(c.cnpj||"").includes(q)||(c.phone||"").includes(q))&&(!fStatus||c.status===fStatus)&&(!fSeg||c.segment===fSeg)&&(!fOrigin||c.origin===fOrigin);
  });
  async function save(){
    if(!form.name||!form.phone)return alert("Nome e telefone são obrigatórios.");
    if(edit)await supabase.from("clients").update({...form,updated_at:new Date().toISOString()}).eq("id",edit.id);
    else{const{error}=await supabase.from("clients").insert({...form,responsible:form.responsible||user.id});if(error?.code==="23505")return alert("CNPJ já cadastrado!");}
    await load();setModal(false);
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
      ...(allWhats.filter(a=>a.client_id===cid).map(a=>a.date)),
      ...(allFUs.filter(a=>a.client_id===cid).map(a=>a.date)),
      ...(allMeetings.filter(a=>a.client_id===cid).map(a=>a.date)),
    ].filter(Boolean).sort().reverse();
    return dates[0]||null;
  };
  const getDaysSince=(dateStr)=>{if(!dateStr)return 999;const d=new Date(dateStr);const now=new Date();return Math.floor((now-d)/(1000*60*60*24));};
  const acionadosCount=visibleAll.filter(c=>{
    return allCalls.some(a=>a.client_id===c.id)||allWhats.some(a=>a.client_id===c.id)||allFUs.some(a=>a.client_id===c.id)||allMeetings.some(a=>a.client_id===c.id);
  }).length;
  const semAcionamento=visibleAll.length-acionadosCount;
  return(
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <Card style={{flex:1,minWidth:140,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:800,color:T.accent}}>{visibleAll.length}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Total de Clientes</div>
        </Card>
        <Card style={{flex:1,minWidth:140,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:800,color:T.green}}>{acionadosCount}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Clientes Acionados</div>
        </Card>
        <Card style={{flex:1,minWidth:140,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:800,color:semAcionamento>0?T.red:T.muted}}>{semAcionamento}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>Sem Acionamento</div>
        </Card>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:12,flex:1,minWidth:150,fontFamily:"inherit"}} placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="">Status</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fSeg} onChange={e=>setFSeg(e.target.value)}>
          <option value="">Segmento</option>{segments.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fOrigin} onChange={e=>setFOrigin(e.target.value)}>
          <option value="">Origem</option>{origins.map(o=><option key={o}>{o}</option>)}
        </select>
        {user.role!=="vendedor"&&<select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"7px 10px",fontSize:12}} value={fResp} onChange={e=>setFResp(e.target.value)}>
          <option value="">Responsável</option>{sellers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>}
        <Btn size="sm" onClick={()=>{setEdit(null);setForm(emptyForm);setModal(true);}}>+ Novo Cliente</Btn>
        <Btn size="sm" variant="ghost" onClick={exportCSV}>⬇ Exportar</Btn>
        <label style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.sub,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>⬆ Importar<input type="file" accept=".csv" style={{display:"none"}} onChange={importCSV}/></label>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:T.surface}}>
            {["Nome","Telefone","Dias Cadastro","Último Contato","Segmento","Status","Acionamentos","Responsável",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {visible.length===0&&<tr><td colSpan={9} style={{padding:32,textAlign:"center",color:T.muted}}>Nenhum cliente encontrado.</td></tr>}
            {visible.map(c=>(
              <tr key={c.id} style={{borderBottom:`1px solid ${T.border}15`}}>
                <td style={{padding:"10px 12px"}}>
                  <button onClick={()=>setHistoryClient(c)} style={{background:"none",border:"none",color:T.accent,fontWeight:700,fontSize:13,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit",textAlign:"left"}}>{c.name}</button>
                </td>
                <td style={{padding:"10px 12px",color:T.sub}}>{c.phone}</td>
                <td style={{padding:"10px 12px",textAlign:"center"}}>
                  <span style={{color:T.muted,fontSize:12}}>{getDaysSince(c.created_at)}d</span>
                </td>
                <td style={{padding:"10px 12px",textAlign:"center"}}>{(()=>{const last=getLastActivity(c.id);const days=getDaysSince(last);return<span style={{color:days>30?T.red:days>7?T.yellow:T.green,fontWeight:700,fontSize:12}}>{last?days+"d":"—"}</span>;})()}</td>
                <td style={{padding:"10px 12px"}}><Badge color={T.accent}>{c.segment||"—"}</Badge></td>
                <td style={{padding:"10px 12px"}}><Badge color={STATUS_COLORS[c.status]||T.muted}>{c.status}</Badge></td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <Btn size="sm" variant="ghost" title="Registrar Ligação" onClick={()=>onQuickCall(c)} style={{padding:"4px 8px",fontSize:13}}>📞</Btn>
                    <Btn size="sm" variant="ghost" title="Registrar WhatsApp" onClick={()=>onQuickWhats(c)} style={{padding:"4px 8px",fontSize:13}}>💬</Btn>
                    <Btn size="sm" variant="ghost" title="Agendar Follow-up" onClick={()=>onQuickFU(c)} style={{padding:"4px 8px",fontSize:13}}>⏰</Btn>
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
      </Card>
      <Modal open={modal} title={edit?"Editar Cliente":"Novo Cliente"} onClose={()=>setModal(false)} width={580}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Nome / Razão Social" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <Input label="CNPJ / CPF" value={form.cnpj} onChange={v=>setForm(f=>({...f,cnpj:v}))}/>
          <Input label="Telefone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} required/>
          <Input label="WhatsApp" value={form.whatsapp} onChange={v=>setForm(f=>({...f,whatsapp:v}))}/>
          <Input label="E-mail" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
          <Input label="Cidade" value={form.city} onChange={v=>setForm(f=>({...f,city:v}))}/>
          <Input label="Estado" value={form.state} onChange={v=>setForm(f=>({...f,state:v}))}/>
          <Input label="Segmento" value={form.segment} onChange={v=>setForm(f=>({...f,segment:v}))} options={segments}/>
          <Input label="Origem" value={form.origin} onChange={v=>setForm(f=>({...f,origin:v}))} options={origins}/>
          <Input label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={STATUS_OPTIONS}/>
          {user.role!=="vendedor"&&<div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Responsável</div>
            <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.responsible} onChange={e=>setForm(f=>({...f,responsible:e.target.value}))}>
              <option value="">Selecione...</option>{profiles.filter(p=>p.role==="vendedor").map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
      {historyClient&&<ClientHistory client={historyClient} profiles={profiles} onClose={()=>setHistoryClient(null)}/>}
    </div>
  );
}

// ─── CALLS ───────────────────────────────────────────────────
function Calls({user,profiles,preClient,onSaved}){
  const[calls,setCalls]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[schedMeeting,setSchedMeeting]=useState(false);
  const emptyForm={client_id:"",date:today(),time:nowTime(),type:"Atendida",duration_min:"0",duration_sec:"0",obs:"",result:"Retornar"};
  const[form,setForm]=useState(emptyForm);
  const[fType,setFType]=useState("");const[fResult,setFResult]=useState("");const[fDate,setFDate]=useState("");
  const load=useCallback(async()=>{
    const[c,cl]=await Promise.all([supabase.from("calls").select("*").order("created_at",{ascending:false}),supabase.from("clients").select("id,name,responsible,whatsapp")]);
    setCalls(c.data||[]);setClients(cl.data||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(preClient){setForm(f=>({...f,client_id:preClient.id}));setModal(true);}}, [preClient]);
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myCalls=(user.role==="vendedor"?calls.filter(c=>c.user_id===user.id):calls).filter(c=>(!fType||c.type===fType)&&(!fResult||c.result===fResult)&&(!fDate||c.date===fDate));
  async function save(){
    if(!form.client_id)return alert("Selecione um cliente.");
    const duration=`${form.duration_min}min ${form.duration_sec}s`;
    await supabase.from("calls").insert({...form,duration,user_id:user.id,client_id:form.client_id});
    if(schedMeeting)alert("Ligação salva! Agende a reunião na aba Reuniões.");
    const savedClient = myClients.find(c=>c.id===form.client_id);
    await load();setModal(false);setSchedMeeting(false);
    if(onSaved && savedClient) onSaved(savedClient);
  }
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn onClick={()=>{setForm(emptyForm);setModal(true);}}>+ Registrar Ligação</Btn></div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            <ThFilter label="Cliente" value="" onChange={()=>{}}/>
            <ThFilter label="Data" value={fDate} onChange={setFDate}/>
            <ThFilter label="Hora" value="" onChange={()=>{}}/>
            <ThFilter label="Tipo" value={fType} onChange={setFType} options={CALL_TYPES}/>
            <ThFilter label="Duração" value="" onChange={()=>{}}/>
            <ThFilter label="Resultado" value={fResult} onChange={setFResult} options={CALL_RESULTS}/>
            <ThFilter label="Obs" value="" onChange={()=>{}}/>
          </tr></thead>
          <tbody>
            {myCalls.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:T.muted}}>Nenhuma ligação registrada.</td></tr>}
            {myCalls.map(c=>(
              <tr key={c.id} style={{borderBottom:`1px solid ${T.border}15`}}>
                <td style={{padding:"10px 12px",color:T.text,fontWeight:600}}>{clients.find(cl=>cl.id===c.client_id)?.name||"—"}</td>
                <td style={{padding:"10px 12px",color:T.sub}}>{c.date}</td>
                <td style={{padding:"10px 12px",color:T.sub}}>{c.time}</td>
                <td style={{padding:"10px 12px"}}><Badge color={c.type==="Atendida"?T.green:c.type==="Não atendida"?T.red:T.yellow}>{c.type}</Badge></td>
                <td style={{padding:"10px 12px",color:T.sub}}>{c.duration}</td>
                <td style={{padding:"10px 12px"}}><Badge color={c.result==="Interesse"?T.green:c.result==="Sem interesse"?T.red:T.yellow}>{c.result}</Badge></td>
                <td style={{padding:"10px 12px",color:T.sub,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.obs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} title="Registrar Ligação" onClose={()=>setModal(false)} width={560}>
        <div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Cliente *</div>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))}>
            <option value="">Selecione...</option>{myClients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Data" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
          <Input label="Hora (automática)" value={form.time} onChange={v=>setForm(f=>({...f,time:v}))} type="time"/>
          <Input label="Tipo" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={CALL_TYPES}/>
          <Input label="Resultado" value={form.result} onChange={v=>setForm(f=>({...f,result:v}))} options={CALL_RESULTS}/>
          <Input label="Duração — Minutos" value={form.duration_min} onChange={v=>setForm(f=>({...f,duration_min:v}))} type="number" min="0"/>
          <Input label="Duração — Segundos" value={form.duration_sec} onChange={v=>setForm(f=>({...f,duration_sec:v}))} type="number" min="0" max="59"/>
        </div>
        <Input label="Observações" value={form.obs} onChange={v=>setForm(f=>({...f,obs:v}))} placeholder="Detalhes da ligação..."/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 14px",background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
          <input type="checkbox" id="sm" checked={schedMeeting} onChange={e=>setSchedMeeting(e.target.checked)}/>
          <label htmlFor="sm" style={{color:T.sub,fontSize:13,cursor:"pointer"}}>📅 Após salvar, lembrar de agendar reunião</label>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── WHATSAPP ────────────────────────────────────────────────
function Whatsapp({user,preClient,onSaved}){
  const[whats,setWhats]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const emptyForm={client_id:"",date:today(),time:nowTime(),type:"Enviado",content:"",status:"Enviado"};
  const[form,setForm]=useState(emptyForm);
  const[fType,setFType]=useState("");const[fStatus,setFStatus]=useState("");const[fDate,setFDate]=useState("");
  const load=useCallback(async()=>{
    const[w,c]=await Promise.all([supabase.from("whatsapp_logs").select("*").order("created_at",{ascending:false}),supabase.from("clients").select("id,name,responsible,whatsapp")]);
    setWhats(w.data||[]);setClients(c.data||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(preClient){setForm(f=>({...f,client_id:preClient.id}));setModal(true);}}, [preClient]);
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myWhats=(user.role==="vendedor"?whats.filter(w=>w.user_id===user.id):whats).filter(w=>(!fType||w.type===fType)&&(!fStatus||w.status===fStatus)&&(!fDate||w.date===fDate));
  async function save(){if(!form.client_id)return alert("Selecione um cliente.");await supabase.from("whatsapp_logs").insert({...form,user_id:user.id});await load();setModal(false);}
  function openWhatsApp(clientId){const c=clients.find(c=>c.id===clientId);if(!c?.whatsapp)return alert("Cliente sem WhatsApp cadastrado.");const num=c.whatsapp.replace(/\D/g,"");window.open(`https://wa.me/55${num}`,"_blank");}
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn onClick={()=>{setForm(emptyForm);setModal(true);}}>+ Registrar WhatsApp</Btn></div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            <ThFilter label="Cliente" value="" onChange={()=>{}}/>
            <ThFilter label="Data" value={fDate} onChange={setFDate}/>
            <ThFilter label="Hora" value="" onChange={()=>{}}/>
            <ThFilter label="Tipo" value={fType} onChange={setFType} options={WHATS_TYPES}/>
            <ThFilter label="Resumo" value="" onChange={()=>{}}/>
            <ThFilter label="Status" value={fStatus} onChange={setFStatus} options={["Enviado","Visualizado","Respondido"]}/>
            <ThFilter label="Ação" value="" onChange={()=>{}}/>
          </tr></thead>
          <tbody>
            {myWhats.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:T.muted}}>Nenhuma conversa registrada.</td></tr>}
            {myWhats.map(w=>(
              <tr key={w.id} style={{borderBottom:`1px solid ${T.border}15`}}>
                <td style={{padding:"10px 12px",color:T.text,fontWeight:600}}>{clients.find(c=>c.id===w.client_id)?.name||"—"}</td>
                <td style={{padding:"10px 12px",color:T.sub}}>{w.date}</td>
                <td style={{padding:"10px 12px",color:T.sub}}>{w.time||"—"}</td>
                <td style={{padding:"10px 12px"}}><Badge color={w.type==="Enviado"?T.accent:T.green}>{w.type}</Badge></td>
                <td style={{padding:"10px 12px",color:T.sub,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.content}</td>
                <td style={{padding:"10px 12px"}}><Badge color={T.muted}>{w.status}</Badge></td>
                <td style={{padding:"10px 12px"}}><Btn size="sm" variant="success" onClick={()=>openWhatsApp(w.client_id)} style={{fontSize:11}}>💬 Abrir</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} title="Registrar WhatsApp" onClose={()=>setModal(false)}>
        <div style={{marginBottom:14}}><div style={{color:T.sub,fontSize:12,marginBottom:5,fontWeight:600}}>Cliente *</div>
          <select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,width:"100%"}} value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))}>
            <option value="">Selecione...</option>{myClients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <Input label="Data" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/>
          <Input label="Hora (automática)" value={form.time} onChange={v=>setForm(f=>({...f,time:v}))} type="time"/>
          <Input label="Tipo" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={WHATS_TYPES}/>
          <Input label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={["Enviado","Visualizado","Respondido"]}/>
        </div>
        <Input label="Conteúdo / Resumo" value={form.content} onChange={v=>setForm(f=>({...f,content:v}))} placeholder="Descreva o conteúdo..."/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── FOLLOW-UPS ──────────────────────────────────────────────
function Followups({user,preClient}){
  const[fus,setFus]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const emptyForm={client_id:"",date:today(),type:"Ligação",description:"",status:"Pendente"};
  const[form,setForm]=useState(emptyForm);
  const[fType,setFType]=useState("");const[fSt,setFSt]=useState("");const[fDate,setFDate]=useState("");
  const load=useCallback(async()=>{
    const[f,c]=await Promise.all([supabase.from("followups").select("*").order("date"),supabase.from("clients").select("id,name,responsible")]);
    setFus(f.data||[]);setClients(c.data||[]);setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(preClient){setForm(f=>({...f,client_id:preClient.id}));setModal(true);}}, [preClient]);
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myFUs=(user.role==="vendedor"?fus.filter(f=>f.user_id===user.id):fus).filter(f=>(!fType||f.type===fType)&&(!fSt||f.status===fSt)&&(!fDate||f.date===fDate));
  async function save(){if(!form.client_id)return alert("Selecione um cliente.");await supabase.from("followups").insert({...form,user_id:user.id});await load();setModal(false);}
  async function conclude(f){await supabase.from("followups").update({status:f.status==="Pendente"?"Concluído":"Pendente"}).eq("id",f.id);await load();}
  function newFU(f){setForm({client_id:f.client_id,date:today(),type:f.type,description:"",status:"Pendente"});setModal(true);}
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><Btn onClick={()=>{setForm(emptyForm);setModal(true);}}>+ Agendar Follow-up</Btn></div>
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
                <td style={{padding:"10px 12px",color:T.text,fontWeight:600}}>{clients.find(c=>c.id===f.client_id)?.name||"—"}</td>
                <td style={{padding:"10px 12px",color:f.date<today()&&f.status==="Pendente"?T.red:T.sub}}>{f.date}</td>
                <td style={{padding:"10px 12px"}}><Badge color={f.type==="Ligação"?T.accent:f.type==="WhatsApp"?T.green:T.purple}>{f.type}</Badge></td>
                <td style={{padding:"10px 12px",color:T.sub,maxWidth:180}}>{f.description}</td>
                <td style={{padding:"10px 12px"}}><Badge color={f.status==="Pendente"?T.yellow:T.green}>{f.status}</Badge></td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <Btn size="sm" variant={f.status==="Pendente"?"success":"ghost"} onClick={()=>conclude(f)}>{f.status==="Pendente"?"✓ Concluir":"↺ Reabrir"}</Btn>
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
        <Input label="Descrição" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── MEETINGS ────────────────────────────────────────────────
function Meetings({user,profiles,preClient,onMarkRealizada}){
  const[meetings,setMeetings]=useState([]);const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const emptyForm={client_id:"",title:"",date:today(),time:"09:00",duration_min:"30",location:"",description:"",status:"Agendada",participants:""};
  const[form,setForm]=useState(emptyForm);
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
                <Badge color={SC[m.status]||T.muted}>{m.status}</Badge>
                <span style={{fontSize:15,fontWeight:700,color:T.text}}>{m.title}</span>
              </div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                <span style={{color:T.sub,fontSize:12}}>👥 {clients.find(c=>c.id===m.client_id)?.name||"—"}</span>
                <span style={{color:T.sub,fontSize:12}}>📅 {m.date} às {m.time}</span>
                <span style={{color:T.sub,fontSize:12}}>⏱ {m.duration_min} min</span>
                {m.location&&<span style={{color:T.sub,fontSize:12}}>📍 {m.location}</span>}
                {m.participants&&<span style={{color:T.sub,fontSize:12}}>👤 {m.participants}</span>}
              </div>
              {m.description&&<div style={{color:T.muted,fontSize:12,marginTop:6}}>{m.description}</div>}
            </div>
            {m.status==="Agendada"&&<div style={{display:"flex",gap:6,flexShrink:0}}>
              <Btn size="sm" variant="success" onClick={()=>{
                    const cn=clients.find(c=>c.id===m.client_id)?.name||"—";
                    if(onMarkRealizada) onMarkRealizada(m,cn);
                    else updateStatus(m.id,"Realizada");
                  }}>✓ Realizada</Btn>
              <Btn size="sm" variant="ghost" onClick={()=>updateStatus(m.id,"Reagendada")}>↺ Reagendar</Btn>
              <Btn size="sm" variant="danger" onClick={()=>updateStatus(m.id,"Cancelada")}>✕</Btn>
            </div>}
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
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
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
      supabase.from("calls").select("date,user_id"),
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
    await Promise.all([
      supabase.from("calls").delete().neq("id","00000000-0000-0000-0000-000000000000"),
      supabase.from("whatsapp_logs").delete().neq("id","00000000-0000-0000-0000-000000000000"),
      supabase.from("followups").delete().neq("id","00000000-0000-0000-0000-000000000000"),
      supabase.from("meetings").delete().neq("id","00000000-0000-0000-0000-000000000000"),
      supabase.from("goals").delete().neq("id","00000000-0000-0000-0000-000000000000"),
      supabase.from("campaigns").delete().neq("id","00000000-0000-0000-0000-000000000000"),
      supabase.from("clients").delete().neq("id","00000000-0000-0000-0000-000000000000"),
    ]);
    alert("Sistema resetado com sucesso!");
    setResetModal(false);setResetConfirm("");
    window.location.reload();
  }
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {[["users","👤 Usuários"],["segments","🗂 Segmentos"],["origins","🌐 Origens"],["danger","⚠️ Sistema"]].map(([k,v])=><Btn key={k} variant={tab===k?"primary":"ghost"} onClick={()=>setTab(k)}>{v}</Btn>)}
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

// Helper: chama IA via proxy seguro (sem expor API key no browser)
async function callAI(prompt, maxTokens = 1000) {
  try {
    // Tenta via Supabase Edge Function primeiro
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: { prompt, maxTokens, model: CLAUDE_MODEL }
    });
    if (!error && data?.text) return data.text;
  } catch(e) {}
  
  // Fallback: tenta diretamente (funciona no StackBlitz dev mode)
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL, max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.error?.message || "API error " + r.status);
    }
    const d = await r.json();
    return d.content?.map(i => i.text || "").join("\n") || "";
  } catch(e) {
    throw new Error("IA indisponível: " + e.message);
  }
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
  const sellers = profiles.filter(p => p.role === "vendedor");

  async function generateReport() {
    setLoading(true); setReport(""); setSentMsg("");
    try {
      // Fetch data
      const [{ data: meetings }, { data: calls }, { data: clients }] = await Promise.all([
        supabase.from("meetings").select("*"),
        supabase.from("calls").select("*"),
        supabase.from("clients").select("*"),
      ]);

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


// ─── GUIA: PESQUISA DE LEADS ─────────────────────────────────
function LeadsSearch({ user, profiles }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [saving, setSaving] = useState(null);
  const [savedMsg, setSavedMsg] = useState("");

  function search() {
    if (!query.trim()) return alert("Digite o que procura. Ex: Clínicas em São Paulo");
    const q = encodeURIComponent(`${query} ${city}`);
    setMapUrl(`https://www.google.com/maps/embed/v1/search?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${q}`);
    searchWithAI();
  }

  async function searchWithAI() {
    setLoadingResults(true); setResults([]);
    try {
      const prompt = `Você é um assistente de prospecção comercial. Liste 8 leads potenciais fictícios mas realistas para a busca: "${query} ${city}".
Responda APENAS em JSON válido, sem markdown:
[{"name":"Nome da Empresa","phone":"(11) 9XXXX-XXXX","segment":"Segmento","city":"Cidade","address":"Endereço aproximado","potential":"Alto/Médio/Baixo"}]`;
      const text = await callAI(prompt, 800);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
    } catch(e) {
      setResults([]);
    }
    setLoadingResults(false);
  }

  async function saveAsClient(lead) {
    setSaving(lead.name);
    const {error} = await supabase.from("clients").insert({
      name: lead.name,
      phone: lead.phone || "",
      city: lead.city || city,
      segment: lead.segment || "",
      responsible: user.id,
      status: "Lead",
      origin: "Pesquisa de Leads"
    });
    if (error && error.code !== "23505") {
      alert("Erro ao salvar: " + error.message);
    } else {
      setSavedMsg(lead.name + " salvo como Lead!");
      setTimeout(() => setSavedMsg(""), 3000);
    }
    setSaving(null);
  }

  const potentialColor = {"Alto": T.green, "Médio": T.yellow, "Baixo": T.muted};

  return (
    <div>
      {/* Search bar */}
      <Card style={{marginBottom: 20}}>
        <div style={{fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 12}}>🔍 Pesquisar Leads no Mapa</div>
        <div style={{display: "flex", gap: 10, flexWrap: "wrap"}}>
          <input
            style={{flex: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 200}}
            placeholder="O que buscar? Ex: Clínicas, Restaurantes, Indústrias..."
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <input
            style={{flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 140}}
            placeholder="Cidade / Bairro"
            value={city} onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <button onClick={search} style={{background: T.accent, border: "none", borderRadius: 8, color: "#fff", padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap"}}>
            🔍 Pesquisar
          </button>
        </div>
        {savedMsg && <div style={{color: T.green, fontSize: 13, marginTop: 10, fontWeight: 600}}>✅ {savedMsg}</div>}
      </Card>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
        {/* Google Maps iframe */}
        <div>
          <div style={{fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10}}>🗺 Google Maps</div>
          {mapUrl ? (
            <div style={{borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`}}>
              <iframe
                src={mapUrl}
                width="100%"
                height="420"
                style={{border: "none", display: "block"}}
                allowFullScreen
                loading="lazy"
                title="Google Maps"
              />
            </div>
          ) : (
            <Card style={{height: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
              <div style={{fontSize: 48, marginBottom: 16}}>🗺</div>
              <div style={{color: T.sub, fontSize: 14}}>Digite sua busca e clique em Pesquisar</div>
              <div style={{color: T.muted, fontSize: 12, marginTop: 8}}>O mapa aparecerá aqui</div>
            </Card>
          )}
          <div style={{marginTop: 10}}>
            <a href={`https://www.google.com/maps/search/${encodeURIComponent(query+" "+city)}`} target="_blank" rel="noreferrer"
              style={{color: T.accent, fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4}}>
              ↗ Abrir no Google Maps completo
            </a>
          </div>
        </div>

        {/* AI Results */}
        <div>
          <div style={{fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10}}>🤖 Leads Sugeridos pela IA</div>
          {loadingResults ? (
            <Card style={{textAlign: "center", padding: 40}}>
              <div style={{fontSize: 32, marginBottom: 10}}>🤖</div>
              <div style={{color: T.sub}}>Buscando leads com IA...</div>
            </Card>
          ) : results.length > 0 ? (
            <div style={{display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto"}}>
              {results.map((lead, i) => (
                <Card key={i} style={{padding: 14}}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10}}>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 4}}>{lead.name}</div>
                      <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4}}>
                        {lead.segment && <span style={{background: T.accent+"22", color: T.accent, borderRadius: 5, padding: "1px 8px", fontSize: 11}}>{lead.segment}</span>}
                        {lead.potential && <span style={{background: (potentialColor[lead.potential]||T.muted)+"22", color: potentialColor[lead.potential]||T.muted, borderRadius: 5, padding: "1px 8px", fontSize: 11, fontWeight: 700}}>Potencial: {lead.potential}</span>}
                      </div>
                      {lead.phone && <div style={{color: T.sub, fontSize: 12}}>📞 {lead.phone}</div>}
                      {lead.city && <div style={{color: T.muted, fontSize: 11}}>📍 {lead.address || lead.city}</div>}
                    </div>
                    <button
                      onClick={() => saveAsClient(lead)}
                      disabled={saving === lead.name}
                      style={{background: T.green+"22", border: `1px solid ${T.green}40`, color: T.green, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap"}}
                    >
                      {saving === lead.name ? "Salvando..." : "💾 Salvar Lead"}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card style={{textAlign: "center", padding: 40, height: 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
              <div style={{fontSize: 40, marginBottom: 12}}>🎯</div>
              <div style={{color: T.sub, fontSize: 13}}>Faça uma busca para ver leads sugeridos</div>
              <div style={{color: T.muted, fontSize: 12, marginTop: 8}}>A IA vai sugerir empresas para prospectar</div>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <Card style={{marginTop: 20, background: T.accent+"0A", border: `1px solid ${T.accent}20`}}>
        <div style={{fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 8}}>💡 Dicas de Pesquisa</div>
        <div style={{display: "flex", gap: 20, flexWrap: "wrap"}}>
          {["Clínicas odontológicas em São Paulo","Indústrias metalúrgicas Campinas","Restaurantes delivery interior SP","Escritórios de contabilidade SP"].map(tip => (
            <button key={tip} onClick={() => { const parts = tip.split(" em "); setQuery(parts[0]); setCity(parts[1]||""); }}
              style={{background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.sub, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit"}}>
              {tip}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MENU E APP ATUALIZADOS ───────────────────────────────────
const MENU = [
  { id: "dashboard", label: "Dashboard",       icon: "📊" },
  { id: "clients",   label: "Clientes",         icon: "👥" },
  { id: "calls",     label: "Ligações",         icon: "📞" },
  { id: "whatsapp",  label: "WhatsApp",         icon: "💬" },
  { id: "followups", label: "Follow-ups",       icon: "⏰" },
  { id: "meetings",  label: "Reuniões",         icon: "📅" },
  { id: "goals",     label: "Metas",            icon: "🎯" },
  { id: "reports",   label: "Relatórios IA",    icon: "🤖" },
  { id: "sales",     label: "Técnicas de Venda",icon: "🧠" },
  { id: "leads",     label: "Pesquisa Leads",   icon: "🗺" },
  { id: "settings",  label: "Configurações",    icon: "⚙️" },
];

const PT = {
  dashboard: "📊 Dashboard", clients: "👥 Clientes", calls: "📞 Ligações",
  whatsapp: "💬 WhatsApp", followups: "⏰ Follow-ups", meetings: "📅 Reuniões",
  goals: "🎯 Metas", reports: "🤖 Relatórios IA", sales: "🧠 Técnicas de Venda",
  settings: "⚙️ Configurações"
};

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

  function showFuReminder(client) {
    if (!client) return;
    setFuReminder({ open: true, clientName: client.name, clientId: client.id, userId: authUser?.id });
  }

  function showMeetingOutcome(meeting, clientName) {
    setMeetingOutcome({ open: true, meeting, clientName });
  }

  if (checking) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!authUser) return <Login onLogin={setAuthUser} />;

  async function logout() { await supabase.auth.signOut(); setAuthUser(null); }
  const preClient = quickTarget === page ? quickClient : null;

  return (
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
          {page === "clients"   && <Clients   user={authUser} profiles={profiles} onQuickCall={c => handleQuick(c, "calls")} onQuickWhats={c => handleQuick(c, "whatsapp")} onQuickFU={c => handleQuick(c, "followups")} />}
          {page === "calls"     && <Calls     user={authUser} profiles={profiles} preClient={preClient} onSaved={showFuReminder} />}
          {page === "whatsapp"  && <Whatsapp  user={authUser} preClient={preClient} onSaved={showFuReminder} />}
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
  );
}
