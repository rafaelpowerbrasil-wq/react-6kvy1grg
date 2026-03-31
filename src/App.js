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
  const{origins:allOrigins}=useLists();
  const[calls,setCalls]=useState([]);const[clients,setClients]=useState([]);
  const[followups,setFollowups]=useState([]);const[goals,setGoals]=useState([]);const[loading,setLoading]=useState(true);
  const[volFilter,setVolFilter]=useState("week");const[goalFilter,setGoalFilter]=useState("day");
  const[campaigns,setDashCampaigns]=useState([]);
  useEffect(()=>{
    async function load(){
      const[c,cl,f,g,camp]=await Promise.all([
        supabase.from("calls").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("followups").select("*"),
        supabase.from("goals").select("*"),
        supabase.from("campaigns").select("*")
      ]);
      setCalls(c.data||[]);setClients(cl.data||[]);setFollowups(f.data||[]);setGoals(g.data||[]);setDashCampaigns(camp.data||[]);setLoading(false);
    }
    load();
  },[]);
  if(loading)return<Spinner/>;
  const myCalls=user.role==="vendedor"?calls.filter(c=>c.user_id===user.id):calls;
  const myClients=user.role==="vendedor"?clients.filter(c=>c.responsible===user.id):clients;
  const myFU=user.role==="vendedor"?followups.filter(f=>f.user_id===user.id):followups;
  const pendFU=myFU.filter(f=>f.status==="Pendente"&&f.date<=today());
  const effective=myCalls.filter(c=>c.type==="Atendida").length;
  const convRate=myCalls.length>0?Math.round((effective/myCalls.length)*100):0;
  const acionados=myClients.filter(c=>c.status!=="Lead").length;
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
  const period=now.toISOString().slice(0,7);
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
      <div style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.sub}}>🎯 Meta de Equipe</div>
        <div style={{display:"flex",gap:6}}>{FB.map(([k,v])=><Btn key={k} size="sm" variant={goalFilter===k?"primary":"ghost"} onClick={()=>setGoalFilter(k)}>{v}</Btn>)}</div>
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
function Clients({user,profiles,onQuickCall,onQuickWhats,onQuickFU}){
  const{segments,origins}=useLists();
  const[clients,setClients]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);
  const[search,setSearch]=useState("");const[fStatus,setFStatus]=useState("");const[fSeg,setFSeg]=useState("");const[fOrigin,setFOrigin]=useState("");const[fResp,setFResp]=useState("");
  const emptyForm={name:"",cnpj:"",phone:"",whatsapp:"",email:"",city:"",state:"",segment:"",origin:"",responsible:user.role==="vendedor"?user.id:"",status:"Lead"};
  const[form,setForm]=useState(emptyForm);
  const load=useCallback(async()=>{const{data}=await supabase.from("clients").select("*").order("created_at",{ascending:false});setClients(data||[]);setLoading(false);},[]);
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
  return(
    <div>
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
            {["Nome","Telefone","Segmento","Origem","Status","Acionamentos","Responsável",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {visible.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:"center",color:T.muted}}>Nenhum cliente encontrado.</td></tr>}
            {visible.map(c=>(
              <tr key={c.id} style={{borderBottom:`1px solid ${T.border}15`}}>
                <td style={{padding:"10px 12px",color:T.text,fontWeight:600}}>{c.name}</td>
                <td style={{padding:"10px 12px",color:T.sub}}>{c.phone}</td>
                <td style={{padding:"10px 12px"}}><Badge color={T.accent}>{c.segment||"—"}</Badge></td>
                <td style={{padding:"10px 12px"}}><Badge color={T.purple}>{c.origin||"—"}</Badge></td>
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
    </div>
  );
}

// ─── CALLS ───────────────────────────────────────────────────
function Calls({user,profiles,preClient}){
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
    await load();setModal(false);setSchedMeeting(false);
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
function Whatsapp({user,preClient}){
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
function Meetings({user,profiles,preClient}){
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
              <Btn size="sm" variant="success" onClick={()=>updateStatus(m.id,"Realizada")}>✓ Realizada</Btn>
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
    <Card style={{flex:1,minWidth:250}}>
      <div style={{fontSize:11,fontWeight:700,color,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{categoryLabel}</div>
      <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:16}}>{categoryTitle}</div>
      <div style={{display:"flex",gap:10,justifyContent:"space-around",alignItems:"flex-start"}}>
        {[{label:"Hoje",real:todayReal,meta:todayMeta},{label:"Semana",real:weekReal,meta:weekMeta},{label:"Mês",real:monthReal,meta:monthMeta}].map(({label,real,meta})=>(
          <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <DonutRing real={real} meta={meta} color={color} size={label==="Hoje"?108:88}/>
            <div style={{fontSize:12,fontWeight:700,color:T.sub}}>{label}</div>
            <div style={{fontSize:10,color:T.muted}}>Meta/{label==="Hoje"?"Dia":label}</div>
            <div style={{fontSize:14,fontWeight:800,color:T.text}}>{meta}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Goals({user,profiles}){
  const[goals,setGoals]=useState([]);const[calls,setCalls]=useState([]);const[loading,setLoading]=useState(true);
  const[period,setPeriod]=useState(new Date().toISOString().slice(0,7));
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
  const todayCalls=calls.filter(c=>c.user_id===targetUser&&c.date===today()).length;
  const myCalls=calls.filter(c=>c.user_id===targetUser&&c.date?.startsWith(period));
  const[ws,we]=weekRange();
  const weekCalls=calls.filter(c=>c.user_id===targetUser&&c.date>=ws&&c.date<=we).length;
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
  const[yr,mo]=period.split("-");
  const MN=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const periodLabel=`${MN[parseInt(mo)-1]} de ${yr}`;
  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:13,color:T.muted}}>Objetivo × Realizado — Dia · Semana · Mês</div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {user.role!=="vendedor"&&<select style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 14px",fontSize:13,fontFamily:"inherit"}} value={targetUser} onChange={e=>setSelectedUser(e.target.value)}>
            {sellers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>}
          <input type="month" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 14px",fontSize:13,fontFamily:"inherit"}} value={period} onChange={e=>setPeriod(e.target.value)}/>
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
            todayReal={todayCalls} todayMeta={current.prosp_day+current.base_day}
            weekReal={weekCalls} weekMeta={current.prosp_week+current.base_week}
            monthReal={myCalls.length} monthMeta={current.prosp_month+current.base_month}/>
          <GoalCategoryCard categoryLabel="Prospecção" categoryTitle="Prospecção" color={T.orange}
            todayReal={Math.round(todayCalls*.4)} todayMeta={current.prosp_day}
            weekReal={Math.round(weekCalls*.4)} weekMeta={current.prosp_week}
            monthReal={Math.round(myCalls.length*.4)} monthMeta={current.prosp_month}/>
          <GoalCategoryCard categoryLabel="Base de Clientes" categoryTitle="Base de Clientes" color={T.green}
            todayReal={Math.round(todayCalls*.6)} todayMeta={current.base_day}
            weekReal={Math.round(weekCalls*.6)} weekMeta={current.base_week}
            monthReal={Math.round(myCalls.length*.6)} monthMeta={current.base_month}/>
        </div>
        :<Card style={{textAlign:"center",padding:40,marginBottom:20}}>
          <div style={{fontSize:44,marginBottom:14}}>🎯</div>
          <div style={{color:T.sub,fontSize:15,marginBottom:20}}>Nenhuma meta para <strong>{periodLabel}</strong>.</div>
          {user.role==="admin"&&<Btn size="lg" onClick={()=>setEditGoal(true)}>+ Adicionar Meta</Btn>}
        </Card>}
      {campaigns.length>0&&<div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8}}>
        {campaigns.map(camp=><GoalCategoryCard key={camp.id} categoryLabel="🏷 Campanha" categoryTitle={camp.name} color={T.accent}
          todayReal={todayCalls} todayMeta={camp.day}
          weekReal={weekCalls} weekMeta={camp.week}
          monthReal={myCalls.length} monthMeta={camp.month}/>)}
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
  if(user.role!=="admin")return<Card style={{textAlign:"center",padding:48,color:T.muted}}>Acesso restrito a administradores.</Card>;
  async function createUser(){
    if(!form.name||!form.email||!form.password)return alert("Preencha todos os campos.");
    const{error}=await supabase.auth.admin.createUser({email:form.email,password:form.password,user_metadata:{name:form.name,role:form.role},email_confirm:true});
    if(error)return alert("Erro: "+error.message);
    alert("Usuário criado!");setModal(false);await loadProfiles();
  }
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[["users","👤 Usuários"],["segments","🗂 Segmentos"],["origins","🌐 Origens"]].map(([k,v])=><Btn key={k} variant={tab===k?"primary":"ghost"} onClick={()=>setTab(k)}>{v}</Btn>)}
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
const MENU=[
  {id:"dashboard",label:"Dashboard",icon:"📊"},
  {id:"clients",label:"Clientes",icon:"👥"},
  {id:"calls",label:"Ligações",icon:"📞"},
  {id:"whatsapp",label:"WhatsApp",icon:"💬"},
  {id:"followups",label:"Follow-ups",icon:"⏰"},
  {id:"meetings",label:"Reuniões",icon:"📅"},
  {id:"goals",label:"Metas",icon:"🎯"},
  {id:"settings",label:"Configurações",icon:"⚙️"},
];
const PT={dashboard:"📊 Dashboard",clients:"👥 Clientes",calls:"📞 Ligações",whatsapp:"💬 WhatsApp",followups:"⏰ Follow-ups",meetings:"📅 Reuniões",goals:"🎯 Metas",settings:"⚙️ Configurações"};

export default function App(){
  const[authUser,setAuthUser]=useState(null);const[checking,setChecking]=useState(true);
  const[page,setPage]=useState("dashboard");const[profiles,setProfiles]=useState([]);
  const[pendingFU,setPendingFU]=useState(0);
  const[quickClient,setQuickClient]=useState(null);const[quickTarget,setQuickTarget]=useState(null);
  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session){const{data:profile}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();if(profile)setAuthUser({...session.user,...profile});}
      setChecking(false);
    });
  },[]);
  const loadProfiles=useCallback(async()=>{const{data}=await supabase.from("profiles").select("*");setProfiles(data||[]);},[]);
  useEffect(()=>{
    if(authUser){
      loadProfiles();
      supabase.from("followups").select("id,status,date,user_id").then(({data})=>{
        const fu=data||[];const mine=authUser.role==="vendedor"?fu.filter(f=>f.user_id===authUser.id):fu;
        setPendingFU(mine.filter(f=>f.status==="Pendente"&&f.date<=today()).length);
      });
    }
  },[authUser,loadProfiles]);
  function handleQuick(client,target){setQuickClient(client);setQuickTarget(target);setPage(target);}
  if(checking)return<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!authUser)return<Login onLogin={setAuthUser}/>;
  async function logout(){await supabase.auth.signOut();setAuthUser(null);}
  const preClient=quickTarget===page?quickClient:null;
  return(
    <ListsProvider>
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans','Inter',system-ui,sans-serif",color:T.text,display:"flex"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
      <div style={{width:220,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"22px 20px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:16,fontWeight:900,color:T.text,letterSpacing:"-0.3px"}}><span style={{color:T.accent}}>KR</span> CALLFLOW</div>
          <div style={{fontSize:10,color:T.muted,marginTop:3,letterSpacing:1.5,textTransform:"uppercase"}}>Gestão Comercial</div>
        </div>
        <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
          {MENU.map(m=>(
            <button key={m.id} onClick={()=>{setPage(m.id);setQuickClient(null);setQuickTarget(null);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",borderRadius:10,border:"none",background:page===m.id?T.accentGlow:"transparent",color:page===m.id?T.accent:T.sub,fontWeight:page===m.id?700:500,fontSize:13,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit",position:"relative"}}>
              <span>{m.icon}</span>{m.label}
              {m.id==="followups"&&pendingFU>0&&<span style={{marginLeft:"auto",background:T.red,color:"#fff",borderRadius:99,fontSize:10,fontWeight:700,padding:"2px 6px"}}>{pendingFU}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"16px 20px",borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text}}>{authUser.name}</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:10}}>{authUser.role}</div>
          <Btn size="sm" variant="ghost" style={{width:"100%"}} onClick={logout}>Sair</Btn>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"28px 32px"}}>
        <div style={{fontSize:22,fontWeight:800,color:T.text,marginBottom:24}}>{PT[page]}</div>
        {page==="dashboard"&&<Dashboard user={authUser} profiles={profiles} onNav={p=>setPage(p)}/>}
        {page==="clients"&&<Clients user={authUser} profiles={profiles} onQuickCall={c=>handleQuick(c,"calls")} onQuickWhats={c=>handleQuick(c,"whatsapp")} onQuickFU={c=>handleQuick(c,"followups")}/>}
        {page==="calls"&&<Calls user={authUser} profiles={profiles} preClient={preClient}/>}
        {page==="whatsapp"&&<Whatsapp user={authUser} preClient={preClient}/>}
        {page==="followups"&&<Followups user={authUser} preClient={preClient}/>}
        {page==="meetings"&&<Meetings user={authUser} profiles={profiles} preClient={preClient}/>}
        {page==="goals"&&<Goals user={authUser} profiles={profiles}/>}
        {page==="settings"&&<Settings user={authUser} profiles={profiles} loadProfiles={loadProfiles}/>}
      </div>
    </div>
    </ListsProvider>
  );
}
