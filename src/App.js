import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ============================================================
//  ⚙️  CONFIGURAÇÃO SUPABASE — Substitua com suas credenciais
//  Encontre em: supabase.com → seu projeto → Settings → API
// ============================================================
const SUPABASE_URL  = "https://xdnlowogfhwcrvwueups.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkbmxvd29nZmh3Y3J2d3VldXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTcxMzYsImV4cCI6MjA5MDE3MzEzNn0.EVybcOK9Y25sEyGpaZPSkRR7_UfNB21kPVwSNmWgvbY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0D0F14", surface: "#13161E", card: "#181C26", border: "#252A38",
  accent: "#3B82F6", accentGlow: "#3B82F620", green: "#10B981", red: "#EF4444",
  yellow: "#F59E0B", purple: "#8B5CF6", text: "#F1F5F9", muted: "#64748B", sub: "#94A3B8",
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SEGMENTS = ["Varejo","Indústria","Serviços","Tecnologia","Saúde","Educação","Agronegócio","Outro"];
const ORIGINS  = ["Lead","Indicação","Prospecção ativa","Site","Evento","Parceiro"];
const STATUS_OPTIONS = ["Lead","Em contato","Sem contato","Whats","Caixa Postal","Telefone não existe"];
const STATUS_COLORS  = { "Lead": T.accent, "Em contato": T.green, "Sem contato": T.muted, "Whats": T.purple, "Caixa Postal": T.yellow, "Telefone não existe": T.red };
const CALL_TYPES     = ["Atendida","Não atendida","Caixa Postal"];
const CALL_RESULTS   = ["Interesse","Sem interesse","Retornar"];
const FOLLOWUP_TYPES = ["Ligação","WhatsApp","Reunião"];
const WHATS_TYPES    = ["Enviado","Recebido"];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────
function Badge({ color = T.accent, children }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

function Card({ children, style }) {
  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, ...style }}>{children}</div>;
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, style }) {
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "9px 18px", fontSize: 13 }, lg: { padding: "12px 28px", fontSize: 15 } };
  const variants = { primary: { background: T.accent, color: "#fff" }, ghost: { background: "transparent", color: T.sub, border: `1px solid ${T.border}` }, danger: { background: T.red, color: "#fff" } };
  return <button style={{ border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, transition: "all .15s", opacity: disabled ? 0.5 : 1, ...sizes[size], ...variants[variant], ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", options, style, required, placeholder }) {
  const s = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%", fontFamily: "inherit", outline: "none", boxSizing: "border-box", ...style };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>{label}{required && <span style={{ color: T.red }}> *</span>}</div>}
      {options
        ? <select style={s} value={value} onChange={e => onChange(e.target.value)}><option value="">Selecione...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
        : <input style={s} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function Modal({ open, title, onClose, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = T.accent, icon }) {
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: T.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
        </div>
        {icon && <span style={{ fontSize: 24, opacity: 0.7 }}>{icon}</span>}
      </div>
    </Card>
  );
}

function ProgressBar({ value, max, color = T.accent }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div style={{ background: T.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? T.green : pct >= 70 ? color : T.yellow, borderRadius: 99, transition: "width .4s" }} />
    </div>
  );
}

function Spinner() {
  return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // login | register | reset

  async function handleLogin() {
    setLoading(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr("E-mail ou senha incorretos."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onLogin({ ...data.user, ...profile });
    setLoading(false);
  }

  async function handleReset() {
    setLoading(true); setErr("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) setErr(error.message);
    else { setErr(""); alert("E-mail de recuperação enviado!"); setMode("login"); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 44, width: 380, maxWidth: "95vw", boxShadow: "0 20px 60px #00000060" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>📞</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>
            <span style={{ color: T.accent }}>KR</span> CALLFLOW
          </div>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 5, letterSpacing: 2, textTransform: "uppercase" }}>Gestão Comercial Inteligente</div>
        </div>

        {mode === "reset" ? (
          <>
            <div style={{ color: T.sub, fontSize: 13, marginBottom: 16 }}>Digite seu e-mail para receber o link de recuperação.</div>
            <Input label="E-mail" value={email} onChange={setEmail} type="email" />
            {err && <div style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{err}</div>}
            <Btn style={{ width: "100%" }} onClick={handleReset} disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</Btn>
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer" }}>← Voltar ao login</button>
            </div>
          </>
        ) : (
          <>
            <Input label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" />
            <Input label="Senha" value={pass} onChange={setPass} type="password" placeholder="••••••••" />
            {err && <div style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{err}</div>}
            <Btn style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Btn>
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => setMode("reset")} style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer" }}>Esqueci minha senha</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, profiles }) {
  const [calls, setCalls] = useState([]);
  const [clients, setClients] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, cl, f, g] = await Promise.all([
        supabase.from("calls").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("followups").select("*"),
        supabase.from("goals").select("*"),
      ]);
      setCalls(c.data || []); setClients(cl.data || []);
      setFollowups(f.data || []); setGoals(g.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  const myCalls    = user.role === "vendedor" ? calls.filter(c => c.user_id === user.id) : calls;
  const myClients  = user.role === "vendedor" ? clients.filter(c => c.responsible === user.id) : clients;
  const myFU       = user.role === "vendedor" ? followups.filter(f => f.user_id === user.id) : followups;
  const pendingFU  = myFU.filter(f => f.status === "Pendente").length;
  const effective  = myCalls.filter(c => c.type === "Atendida").length;
  const convRate   = myCalls.length > 0 ? Math.round((myCalls.filter(c => c.result === "Interesse").length / myCalls.length) * 100) : 0;

  const statusData = STATUS_OPTIONS.map(s => ({ name: s, value: myClients.filter(c => c.status === s).length, color: STATUS_COLORS[s] })).filter(d => d.value > 0);
  const resultData = CALL_RESULTS.map(r => ({ name: r, value: myCalls.filter(c => c.result === r).length })).filter(d => d.value > 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { name: d.toLocaleDateString("pt-BR", { weekday: "short" }), value: myCalls.filter(c => c.date === key).length };
  });

  const sellers = profiles.filter(p => p.role === "vendedor");
  const ranking = sellers.map(s => {
    const sc = calls.filter(c => c.user_id === s.id).length;
    const g  = goals.find(g => g.user_id === s.id);
    return { ...s, calls: sc, pct: g ? Math.min(100, Math.round((sc / g.monthly) * 100)) : 0 };
  }).sort((a, b) => b.calls - a.calls);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Total de Ligações"    value={myCalls.length}  icon="📞" />
        <StatCard label="Contatos Efetivos"    value={effective}       color={T.green}  icon="✅" />
        <StatCard label="Taxa de Conversão"    value={`${convRate}%`}  color={T.purple} icon="🎯" />
        <StatCard label="Follow-ups Pendentes" value={pendingFU}       color={pendingFU > 0 ? T.yellow : T.green} icon="⏰" />
        <StatCard label="Clientes Ativos"      value={myClients.length} color={T.accent} icon="👥" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>📈 Volumetria — Últimos 7 dias</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 }} />
              <Bar dataKey="value" fill={T.accent} radius={[4,4,0,0]} label={{ position: "top", fill: T.sub, fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>🗂 Clientes por Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: T.sub }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>📊 Resultado das Ligações</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={resultData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {resultData.map((e, i) => <Cell key={i} fill={[T.green, T.red, T.yellow][i % 3]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: T.sub }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 14 }}>🏆 Ranking de Vendedores</div>
          {ranking.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>Nenhum vendedor cadastrado.</div>}
          {ranking.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: T.text, fontSize: 13 }}>{i + 1}. {s.name}</span>
                <span style={{ color: T.muted, fontSize: 12 }}>{s.calls} lig · {s.pct}%</span>
              </div>
              <ProgressBar value={s.calls} max={goals.find(g => g.user_id === s.id)?.monthly || 100} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
function Clients({ user, profiles }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeg, setFilterSeg] = useState("");
  const emptyForm = { name: "", cnpj: "", phone: "", whatsapp: "", email: "", city: "", state: "", segment: "", origin: "", responsible: user.role === "vendedor" ? user.id : "", status: "Lead" };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = clients.filter(c => {
    const q = search.toLowerCase();
    const mine = user.role === "vendedor" ? c.responsible === user.id : true;
    return mine && (!q || c.name.toLowerCase().includes(q) || (c.cnpj || "").includes(q)) && (!filterStatus || c.status === filterStatus) && (!filterSeg || c.segment === filterSeg);
  });

  async function save() {
    if (!form.name || !form.phone) return alert("Nome e telefone são obrigatórios.");
    if (edit) {
      await supabase.from("clients").update({ ...form, updated_at: new Date().toISOString() }).eq("id", edit.id);
    } else {
      const { error } = await supabase.from("clients").insert({ ...form, responsible: form.responsible || user.id });
      if (error?.code === "23505") return alert("CNPJ já cadastrado!");
    }
    await load(); setModal(false);
  }

  async function del(id) {
    if (!confirm("Remover cliente?")) return;
    await supabase.from("clients").delete().eq("id", id);
    await load();
  }

  function exportCSV() {
    const rows = [["Nome","CNPJ","Telefone","WhatsApp","Email","Cidade","Estado","Segmento","Origem","Status","Responsável","Criado em"]];
    visible.forEach(c => rows.push([c.name,c.cnpj,c.phone,c.whatsapp,c.email,c.city,c.state,c.segment,c.origin,c.status,profiles.find(p => p.id === c.responsible)?.name||"",c.created_at?.slice(0,10)]));
    const blob = new Blob([rows.map(r => r.join(";")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "krcallflow_clientes.csv"; a.click();
  }

  function importCSV(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const lines = ev.target.result.split("\n").slice(1);
      let ok = 0, err = 0;
      for (const line of lines) {
        const [name, phone, email, , city] = line.split(";");
        if (!name?.trim() || !phone?.trim()) { err++; continue; }
        const dup = clients.find(c => c.phone === phone.trim());
        if (dup) { err++; continue; }
        await supabase.from("clients").insert({ name: name.trim(), phone: phone.trim(), email: email?.trim(), city: city?.trim(), responsible: user.id, status: "Lead" });
        ok++;
      }
      alert(`Importação: ${ok} importados, ${err} ignorados/duplicados.`);
      await load();
    };
    reader.readAsText(file);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 14px", fontSize: 13, flex: 1, minWidth: 180, fontFamily: "inherit" }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }} value={filterSeg} onChange={e => setFilterSeg(e.target.value)}>
          <option value="">Todos segmentos</option>{SEGMENTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <Btn size="sm" onClick={() => { setEdit(null); setForm(emptyForm); setModal(true); }}>+ Novo Cliente</Btn>
        <Btn size="sm" variant="ghost" onClick={exportCSV}>⬇ Exportar</Btn>
        <label style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.sub, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          ⬆ Importar CSV<input type="file" accept=".csv" style={{ display: "none" }} onChange={importCSV} />
        </label>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: T.surface }}>
            {["Nome / Empresa","CNPJ","Telefone","Segmento","Status","Responsável",""].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.muted }}>Nenhum cliente encontrado.</td></tr>}
            {visible.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}15` }}>
                <td style={{ padding: "12px 16px", color: T.text, fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "12px 16px", color: T.sub }}>{c.cnpj || "—"}</td>
                <td style={{ padding: "12px 16px", color: T.sub }}>{c.phone}</td>
                <td style={{ padding: "12px 16px" }}><Badge color={T.accent}>{c.segment || "—"}</Badge></td>
                <td style={{ padding: "12px 16px" }}><Badge color={STATUS_COLORS[c.status] || T.muted}>{c.status}</Badge></td>
                <td style={{ padding: "12px 16px", color: T.sub }}>{profiles.find(p => p.id === c.responsible)?.name || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="ghost" onClick={() => { setEdit(c); setForm({ name: c.name, cnpj: c.cnpj||"", phone: c.phone||"", whatsapp: c.whatsapp||"", email: c.email||"", city: c.city||"", state: c.state||"", segment: c.segment||"", origin: c.origin||"", responsible: c.responsible||"", status: c.status }); setModal(true); }}>✏️</Btn>
                    {user.role === "admin" && <Btn size="sm" variant="ghost" onClick={() => del(c.id)}>🗑</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={modal} title={edit ? "Editar Cliente" : "Novo Cliente"} onClose={() => setModal(false)} width={580}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Nome / Razão Social" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <Input label="CNPJ / CPF" value={form.cnpj} onChange={v => setForm(f => ({ ...f, cnpj: v }))} />
          <Input label="Telefone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} required />
          <Input label="WhatsApp" value={form.whatsapp} onChange={v => setForm(f => ({ ...f, whatsapp: v }))} />
          <Input label="E-mail" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
          <Input label="Cidade" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
          <Input label="Estado" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} />
          <Input label="Segmento" value={form.segment} onChange={v => setForm(f => ({ ...f, segment: v }))} options={SEGMENTS} />
          <Input label="Origem" value={form.origin} onChange={v => setForm(f => ({ ...f, origin: v }))} options={ORIGINS} />
          <Input label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
          {user.role !== "vendedor" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Responsável</div>
              <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%" }} value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}>
                <option value="">Selecione...</option>
                {profiles.filter(p => p.role === "vendedor").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── CALLS ───────────────────────────────────────────────────────────────────
function Calls({ user, profiles }) {
  const [calls, setCalls] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ client_id: "", date: today(), time: "", type: "Atendida", duration: "", obs: "", result: "Retornar" });

  const load = useCallback(async () => {
    const [c, cl] = await Promise.all([supabase.from("calls").select("*").order("created_at", { ascending: false }), supabase.from("clients").select("id,name,responsible")]);
    setCalls(c.data || []); setClients(cl.data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const myClients = user.role === "vendedor" ? clients.filter(c => c.responsible === user.id) : clients;
  const myCalls   = user.role === "vendedor" ? calls.filter(c => c.user_id === user.id) : calls;

  async function save() {
    if (!form.client_id) return alert("Selecione um cliente.");
    await supabase.from("calls").insert({ ...form, user_id: user.id, client_id: form.client_id });
    await load(); setModal(false);
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <Btn onClick={() => { setForm({ client_id: "", date: today(), time: "", type: "Atendida", duration: "", obs: "", result: "Retornar" }); setModal(true); }}>+ Registrar Ligação</Btn>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: T.surface }}>
            {["Cliente","Data","Hora","Tipo","Duração","Resultado","Obs"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {myCalls.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.muted }}>Nenhuma ligação registrada.</td></tr>}
            {myCalls.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}15` }}>
                <td style={{ padding: "11px 16px", color: T.text, fontWeight: 600 }}>{clients.find(cl => cl.id === c.client_id)?.name || "—"}</td>
                <td style={{ padding: "11px 16px", color: T.sub }}>{c.date}</td>
                <td style={{ padding: "11px 16px", color: T.sub }}>{c.time}</td>
                <td style={{ padding: "11px 16px" }}><Badge color={c.type === "Atendida" ? T.green : c.type === "Não atendida" ? T.red : T.yellow}>{c.type}</Badge></td>
                <td style={{ padding: "11px 16px", color: T.sub }}>{c.duration}</td>
                <td style={{ padding: "11px 16px" }}><Badge color={c.result === "Interesse" ? T.green : c.result === "Sem interesse" ? T.red : T.yellow}>{c.result}</Badge></td>
                <td style={{ padding: "11px 16px", color: T.sub, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.obs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} title="Registrar Ligação" onClose={() => setModal(false)}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Cliente *</div>
          <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%" }} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Selecione...</option>{myClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Data" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
          <Input label="Hora" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} type="time" />
          <Input label="Tipo" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={CALL_TYPES} />
          <Input label="Duração" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="5min" />
          <Input label="Resultado" value={form.result} onChange={v => setForm(f => ({ ...f, result: v }))} options={CALL_RESULTS} />
        </div>
        <Input label="Observações" value={form.obs} onChange={v => setForm(f => ({ ...f, obs: v }))} placeholder="Detalhes da ligação..." />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── WHATSAPP ────────────────────────────────────────────────────────────────
function Whatsapp({ user }) {
  const [whats, setWhats] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ client_id: "", date: today(), type: "Enviado", content: "", status: "Enviado" });

  const load = useCallback(async () => {
    const [w, c] = await Promise.all([supabase.from("whatsapp_logs").select("*").order("created_at", { ascending: false }), supabase.from("clients").select("id,name,responsible")]);
    setWhats(w.data || []); setClients(c.data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const myClients = user.role === "vendedor" ? clients.filter(c => c.responsible === user.id) : clients;
  const myWhats   = user.role === "vendedor" ? whats.filter(w => w.user_id === user.id) : whats;

  async function save() {
    if (!form.client_id) return alert("Selecione um cliente.");
    await supabase.from("whatsapp_logs").insert({ ...form, user_id: user.id });
    await load(); setModal(false);
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <Btn onClick={() => { setForm({ client_id: "", date: today(), type: "Enviado", content: "", status: "Enviado" }); setModal(true); }}>+ Registrar WhatsApp</Btn>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: T.surface }}>
            {["Cliente","Data","Tipo","Resumo","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {myWhats.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: T.muted }}>Nenhuma conversa registrada.</td></tr>}
            {myWhats.map(w => (
              <tr key={w.id} style={{ borderBottom: `1px solid ${T.border}15` }}>
                <td style={{ padding: "11px 16px", color: T.text, fontWeight: 600 }}>{clients.find(c => c.id === w.client_id)?.name || "—"}</td>
                <td style={{ padding: "11px 16px", color: T.sub }}>{w.date}</td>
                <td style={{ padding: "11px 16px" }}><Badge color={w.type === "Enviado" ? T.accent : T.green}>{w.type}</Badge></td>
                <td style={{ padding: "11px 16px", color: T.sub, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.content}</td>
                <td style={{ padding: "11px 16px" }}><Badge color={T.muted}>{w.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} title="Registrar WhatsApp" onClose={() => setModal(false)}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Cliente *</div>
          <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%" }} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Selecione...</option>{myClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Data" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
          <Input label="Tipo" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={WHATS_TYPES} />
        </div>
        <Input label="Conteúdo / Resumo" value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} />
        <Input label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={["Enviado","Visualizado","Respondido"]} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── FOLLOW-UPS ──────────────────────────────────────────────────────────────
function Followups({ user }) {
  const [fus, setFus] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ client_id: "", date: today(), type: "Ligação", description: "", status: "Pendente" });

  const load = useCallback(async () => {
    const [f, c] = await Promise.all([supabase.from("followups").select("*").order("date"), supabase.from("clients").select("id,name,responsible")]);
    setFus(f.data || []); setClients(c.data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const myClients = user.role === "vendedor" ? clients.filter(c => c.responsible === user.id) : clients;
  const myFUs = user.role === "vendedor" ? fus.filter(f => f.user_id === user.id) : fus;

  async function save() {
    if (!form.client_id) return alert("Selecione um cliente.");
    await supabase.from("followups").insert({ ...form, user_id: user.id });
    await load(); setModal(false);
  }
  async function toggle(f) {
    await supabase.from("followups").update({ status: f.status === "Pendente" ? "Concluído" : "Pendente" }).eq("id", f.id);
    await load();
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <Btn onClick={() => { setForm({ client_id: "", date: today(), type: "Ligação", description: "", status: "Pendente" }); setModal(true); }}>+ Agendar Follow-up</Btn>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: T.surface }}>
            {["Cliente","Data","Tipo","Descrição","Status",""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {myFUs.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: T.muted }}>Nenhum follow-up agendado.</td></tr>}
            {myFUs.map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}15`, opacity: f.status === "Concluído" ? 0.6 : 1 }}>
                <td style={{ padding: "11px 16px", color: T.text, fontWeight: 600 }}>{clients.find(c => c.id === f.client_id)?.name || "—"}</td>
                <td style={{ padding: "11px 16px", color: f.date < today() && f.status === "Pendente" ? T.red : T.sub }}>{f.date}</td>
                <td style={{ padding: "11px 16px" }}><Badge color={f.type === "Ligação" ? T.accent : f.type === "WhatsApp" ? T.green : T.purple}>{f.type}</Badge></td>
                <td style={{ padding: "11px 16px", color: T.sub, maxWidth: 200 }}>{f.description}</td>
                <td style={{ padding: "11px 16px" }}><Badge color={f.status === "Pendente" ? T.yellow : T.green}>{f.status}</Badge></td>
                <td style={{ padding: "11px 16px" }}><Btn size="sm" variant="ghost" onClick={() => toggle(f)}>{f.status === "Pendente" ? "✓ Concluir" : "↺ Reabrir"}</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} title="Agendar Follow-up" onClose={() => setModal(false)}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Cliente *</div>
          <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, width: "100%" }} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Selecione...</option>{myClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Data" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
          <Input label="Tipo" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={FOLLOWUP_TYPES} />
        </div>
        <Input label="Descrição" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── GOALS ───────────────────────────────────────────────────────────────────
function Goals({ user, profiles }) {
  const [goals, setGoals] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [selectedUser, setSelectedUser] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [form, setForm] = useState({ daily: 8, weekly: 40, monthly: 160, prosp_day: 3, prosp_week: 15, prosp_month: 60, base_day: 5, base_week: 25, base_month: 100 });

  const sellers = profiles.filter(p => p.role === "vendedor");
  const targetUser = user.role === "vendedor" ? user.id : (selectedUser || sellers[0]?.id);

  const load = useCallback(async () => {
    const [g, c] = await Promise.all([supabase.from("goals").select("*"), supabase.from("calls").select("date,user_id")]);
    setGoals(g.data || []); setCalls(c.data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const current = goals.find(g => g.user_id === targetUser && g.period === period);
  const myCalls = calls.filter(c => c.user_id === targetUser && c.date?.startsWith(period));
  const todayCalls = calls.filter(c => c.user_id === targetUser && c.date === today()).length;

  async function save() {
    if (current) await supabase.from("goals").update({ ...form }).eq("id", current.id);
    else await supabase.from("goals").insert({ ...form, user_id: targetUser, period });
    await load(); setEditGoal(false);
  }

  function pct(real, meta) { return meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0; }

  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        {user.role !== "vendedor" && (
          <div>
            <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Vendedor</div>
            <select style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13 }} value={targetUser} onChange={e => setSelectedUser(e.target.value)}>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <div style={{ color: T.sub, fontSize: 12, marginBottom: 5, fontWeight: 600 }}>Período</div>
          <input type="month" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, fontFamily: "inherit" }} value={period} onChange={e => setPeriod(e.target.value)} />
        </div>
        {user.role === "admin" && <Btn onClick={() => { setForm(current ? { daily: current.daily, weekly: current.weekly, monthly: current.monthly, prosp_day: current.prosp_day, prosp_week: current.prosp_week, prosp_month: current.prosp_month, base_day: current.base_day, base_week: current.base_week, base_month: current.base_month } : form); setEditGoal(true); }}>{current ? "✏️ Editar Meta" : "➕ Definir Meta"}</Btn>}
      </div>

      {current ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "📅 Diária — Geral",        real: todayCalls,                    meta: current.daily },
            { label: "📅 Diária — Prospecção",   real: Math.round(todayCalls * 0.4),  meta: current.prosp_day },
            { label: "📅 Diária — Base",         real: Math.round(todayCalls * 0.6),  meta: current.base_day },
            { label: "📆 Semanal — Geral",       real: Math.round(myCalls.length * 0.25), meta: current.weekly },
            { label: "📆 Semanal — Prospecção",  real: Math.round(myCalls.length * 0.1),  meta: current.prosp_week },
            { label: "📆 Semanal — Base",        real: Math.round(myCalls.length * 0.15), meta: current.base_week },
            { label: "📋 Mensal — Geral",        real: myCalls.length,                meta: current.monthly },
            { label: "📋 Mensal — Prospecção",   real: Math.round(myCalls.length * 0.4),  meta: current.prosp_month },
            { label: "📋 Mensal — Base",         real: Math.round(myCalls.length * 0.6),  meta: current.base_month },
          ].map(({ label, real, meta }) => {
            const p = pct(real, meta);
            return (
              <Card key={label}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 10, fontWeight: 600 }}>{label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "baseline" }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: p >= 100 ? T.green : p >= 70 ? T.accent : T.yellow }}>{real}</span>
                  <span style={{ color: T.muted, fontSize: 12 }}>/ {meta}</span>
                </div>
                <ProgressBar value={real} max={meta} />
                <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>{p}% da meta</div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ color: T.sub, marginBottom: 16 }}>Nenhuma meta definida para este período.</div>
          {user.role === "admin" && <Btn onClick={() => setEditGoal(true)}>Definir Meta</Btn>}
        </Card>
      )}

      <Modal open={editGoal} title="Configurar Metas" onClose={() => setEditGoal(false)} width={600}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1", color: T.accent, fontSize: 12, fontWeight: 700, marginBottom: 8, marginTop: 4 }}>📊 META GERAL</div>
          <Input label="Diária" value={form.daily} onChange={v => setForm(f => ({ ...f, daily: Number(v) }))} type="number" />
          <Input label="Semanal" value={form.weekly} onChange={v => setForm(f => ({ ...f, weekly: Number(v) }))} type="number" />
          <Input label="Mensal" value={form.monthly} onChange={v => setForm(f => ({ ...f, monthly: Number(v) }))} type="number" />
          <div style={{ gridColumn: "1/-1", color: T.green, fontSize: 12, fontWeight: 700, marginBottom: 8, marginTop: 8 }}>🔍 META DE PROSPECÇÃO</div>
          <Input label="Diária" value={form.prosp_day} onChange={v => setForm(f => ({ ...f, prosp_day: Number(v) }))} type="number" />
          <Input label="Semanal" value={form.prosp_week} onChange={v => setForm(f => ({ ...f, prosp_week: Number(v) }))} type="number" />
          <Input label="Mensal" value={form.prosp_month} onChange={v => setForm(f => ({ ...f, prosp_month: Number(v) }))} type="number" />
          <div style={{ gridColumn: "1/-1", color: T.purple, fontSize: 12, fontWeight: 700, marginBottom: 8, marginTop: 8 }}>🏢 META DE BASE</div>
          <Input label="Diária" value={form.base_day} onChange={v => setForm(f => ({ ...f, base_day: Number(v) }))} type="number" />
          <Input label="Semanal" value={form.base_week} onChange={v => setForm(f => ({ ...f, base_week: Number(v) }))} type="number" />
          <Input label="Mensal" value={form.base_month} onChange={v => setForm(f => ({ ...f, base_month: Number(v) }))} type="number" />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setEditGoal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function Settings({ user, profiles, loadProfiles }) {
  const [tab, setTab] = useState("users");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "vendedor" });

  if (user.role !== "admin") return <Card style={{ textAlign: "center", padding: 48, color: T.muted }}>Acesso restrito a administradores.</Card>;

  async function createUser() {
    if (!form.name || !form.email || !form.password) return alert("Preencha todos os campos.");
    const { data, error } = await supabase.auth.admin.createUser({ email: form.email, password: form.password, user_metadata: { name: form.name, role: form.role }, email_confirm: true });
    if (error) return alert("Erro: " + error.message);
    alert("Usuário criado com sucesso!");
    setModal(false); await loadProfiles();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["users","👤 Usuários"],["segments","🗂 Segmentos"],["origins","🌐 Origens"]].map(([k,v]) => (
          <Btn key={k} variant={tab === k ? "primary" : "ghost"} onClick={() => setTab(k)}>{v}</Btn>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Btn size="sm" onClick={() => { setForm({ name: "", email: "", password: "", role: "vendedor" }); setModal(true); }}>+ Novo Usuário</Btn>
          </div>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: T.surface }}>
                {["Nome","E-mail","Perfil"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}15` }}>
                    <td style={{ padding: "12px 16px", color: T.text, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "12px 16px", color: T.sub }}>{p.id.slice(0,8)}...</td>
                    <td style={{ padding: "12px 16px" }}><Badge color={p.role === "admin" ? T.red : p.role === "gestor" ? T.purple : T.accent}>{p.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      {tab === "segments" && <Card><div style={{ marginBottom: 16, color: T.sub, fontSize: 13 }}>Segmentos cadastrados:</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{SEGMENTS.map(s => <Badge key={s} color={T.accent}>{s}</Badge>)}</div></Card>}
      {tab === "origins"  && <Card><div style={{ marginBottom: 16, color: T.sub, fontSize: 13 }}>Origens de leads:</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{ORIGINS.map(o => <Badge key={o} color={T.purple}>{o}</Badge>)}</div></Card>}

      <Modal open={modal} title="Criar Novo Usuário" onClose={() => setModal(false)}>
        <Input label="Nome completo" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
        <Input label="E-mail" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" required />
        <Input label="Senha inicial" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" required />
        <Input label="Perfil" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={["admin","gestor","vendedor"]} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={createUser}>Criar Usuário</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const MENU = [
  { id: "dashboard", label: "Dashboard",      icon: "📊" },
  { id: "clients",   label: "Clientes",        icon: "👥" },
  { id: "calls",     label: "Ligações",        icon: "📞" },
  { id: "whatsapp",  label: "WhatsApp",        icon: "💬" },
  { id: "followups", label: "Follow-ups",      icon: "⏰" },
  { id: "goals",     label: "Metas",           icon: "🎯" },
  { id: "settings",  label: "Configurações",   icon: "⚙️" },
];

const PAGE_TITLES = { dashboard: "📊 Dashboard", clients: "👥 Clientes", calls: "📞 Ligações", whatsapp: "💬 WhatsApp", followups: "⏰ Follow-ups", goals: "🎯 Metas", settings: "⚙️ Configurações" };

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [profiles, setProfiles] = useState([]);
  const [pendingFU, setPendingFU] = useState(0);

  // Verificar sessão existente
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) setAuthUser({ ...session.user, ...profile });
      }
      setChecking(false);
    });
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") setAuthUser(null);
    });
  }, []);

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  }, []);

  useEffect(() => {
    if (authUser) {
      loadProfiles();
      // Checar follow-ups pendentes
      supabase.from("followups").select("id,status,date,user_id").then(({ data }) => {
        const fu = data || [];
        const mine = authUser.role === "vendedor" ? fu.filter(f => f.user_id === authUser.id) : fu;
        setPendingFU(mine.filter(f => f.status === "Pendente" && f.date <= today()).length);
      });
    }
  }, [authUser, loadProfiles]);

  if (checking) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!authUser) return <Login onLogin={setAuthUser} />;

  async function logout() {
    await supabase.auth.signOut();
    setAuthUser(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", color: T.text, display: "flex" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "22px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: "-0.3px" }}>
            <span style={{ color: T.accent }}>KR</span> CALLFLOW
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 3, letterSpacing: 1.5, textTransform: "uppercase" }}>Gestão Comercial</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {MENU.map(m => (
            <button key={m.id} onClick={() => setPage(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", background: page === m.id ? T.accentGlow : "transparent", color: page === m.id ? T.accent : T.sub, fontWeight: page === m.id ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "inherit", position: "relative" }}>
              <span>{m.icon}</span>{m.label}
              {m.id === "followups" && pendingFU > 0 && <span style={{ marginLeft: "auto", background: T.red, color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "2px 6px" }}>{pendingFU}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{authUser.name}</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>{authUser.role}</div>
          <Btn size="sm" variant="ghost" style={{ width: "100%" }} onClick={logout}>Sair</Btn>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 24 }}>{PAGE_TITLES[page]}</div>
        {page === "dashboard" && <Dashboard user={authUser} profiles={profiles} />}
        {page === "clients"   && <Clients   user={authUser} profiles={profiles} />}
        {page === "calls"     && <Calls     user={authUser} profiles={profiles} />}
        {page === "whatsapp"  && <Whatsapp  user={authUser} />}
        {page === "followups" && <Followups user={authUser} />}
        {page === "goals"     && <Goals     user={authUser} profiles={profiles} />}
        {page === "settings"  && <Settings  user={authUser} profiles={profiles} loadProfiles={loadProfiles} />}
      </div>
    </div>
  );
}
