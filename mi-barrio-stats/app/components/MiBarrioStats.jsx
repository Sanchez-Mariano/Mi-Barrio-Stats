"use client";

import { useState, useEffect } from "react";
import { getPartidos } from "../api-client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── DATOS REALES CENSO 2022 / INDEC ──────────────────────────────────────────
// Población y viviendas: extraídos de XLS INDEC c2022_rmba_entidades_c1 y c2
// Superficie: IGN / INDEC datos oficiales
// pob2010: Censo Nacional 2010 INDEC
const PARTIDOS_GBA_NORTE = [
  { partido: "Tigre",               poblacion: 446291, superficie: 368.0, viviendas: 158895, mujeres: 229776, varones: 216515, pob2010: 376381 },
  { partido: "San Fernando",        poblacion: 171099, superficie: 924.0, viviendas: 63949,  mujeres: 89489,  varones: 81610,  pob2010: 163240 },
  { partido: "San Isidro",          poblacion: 295978, superficie: 48.0,  viviendas: 121287, mujeres: 156763, varones: 139215, pob2010: 291505 },
  { partido: "Pilar",               poblacion: 393614, superficie: 355.0, viviendas: 137095, mujeres: 200878, varones: 192736, pob2010: 299077 },
  { partido: "Escobar",             poblacion: 256071, superficie: 277.0, viviendas: 90334,  mujeres: 130340, varones: 125731, pob2010: 213619 },
  { partido: "Vicente López",       poblacion: 280541, superficie: 33.0,  viviendas: 125737, mujeres: 149510, varones: 131031, pob2010: 269420 },
  { partido: "Malvinas Argentinas", poblacion: 349401, superficie: 63.0,  viviendas: 108522, mujeres: 179550, varones: 169851, pob2010: 322375 },
  { partido: "San Miguel",          poblacion: 327650, superficie: 80.0,  viviendas: 113702, mujeres: 169340, varones: 158310, pob2010: 276190 },
  { partido: "José C. Paz",         poblacion: 326527, superficie: 50.0,  viviendas: 99841,  mujeres: 167300, varones: 159227, pob2010: 265981 },
];

const TIGRE_HISTORICO = [
  { año: "1991", poblacion: 257922 },
  { año: "2001", poblacion: 301223 },
  { año: "2010", poblacion: 376381 },
  { año: "2022", poblacion: 446291 },
];

// Fuente: estimado a partir de promedios RMBA 2022 — INDEC
const TIGRE_VIVIENDAS = [
  { tipo: "Casa",         valor: 82.4, color: "#3B82F6" },
  { tipo: "Departamento", valor: 12.8, color: "#06d48f" },
  { tipo: "Casilla",      valor: 2.9,  color: "#e5e90e" },
  { tipo: "Otro",         valor: 1.9,  color: "#fcb07d" },
];

// ─── COLORES ──────────────────────────────────────────────────────────────────
const ACCENT = "#38BDF8";
const ACCENT2 = "#818CF8";
const GRID_LINE = "#1E3A5F";
const BAR_COLORS = ["#38BDF8", "#818CF8", "#34D399", "#FB923C", "#F472B6", "#A78BFA", "#FCD34D", "#6EE7B7", "#F9A8D4"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = n => n.toLocaleString("es-AR");
const pct = (a, b) => (((a - b) / b) * 100).toFixed(1);

// ─── COMPONENTES UI ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = ACCENT }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${GRID_LINE}`,
    borderTop: `3px solid ${color}`,
    borderRadius: 12,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  }}>
    <span style={{ fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
    <span style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", fontFamily: "'Space Mono', monospace" }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: "#94A3B8" }}>{sub}</span>}
  </div>
);

const SectionTitle = ({ children, icon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: "0.08em" }}>{children}</h2>
    <div style={{ flex: 1, height: 1, background: GRID_LINE, marginLeft: 8 }} />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0F1E33", border: "none", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ margin: 0, color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || ACCENT, fontSize: 14, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── TAB VIEWS ────────────────────────────────────────────────────────────────
const ViewPoblacion = () => {
  const tigre = PARTIDOS_GBA_NORTE[0];
  const crecimiento = pct(tigre.poblacion, tigre.pob2010);
  const densidad = Math.round(tigre.poblacion / tigre.superficie);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Población total" value={fmt(tigre.poblacion)} sub="Censo 2022 · datos definitivos" color={ACCENT} />
        <StatCard label="Crecimiento 2010–2022" value={`+${crecimiento}%`} sub="Media nacional: +15.2%" color="#34D399" />
        <StatCard label="Densidad" value={`${fmt(densidad)} hab/km²`} sub={`Superficie: ${tigre.superficie} km²`} color={ACCENT2} />
        <StatCard label="Viviendas particulares" value={fmt(tigre.viviendas)} sub="Fuente: INDEC Censo 2022" color="#FB923C" />
      </div>

      <div>
        <SectionTitle icon="📈">Evolución poblacional · Tigre</SectionTitle>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TIGRE_HISTORICO}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
              <XAxis dataKey="año" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Line type="monotone" dataKey="poblacion" name="Población" stroke={ACCENT} strokeWidth={3} dot={{ r: 6, fill: ACCENT, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle icon="👥">Distribución por género · Tigre</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Mujeres", val: tigre.mujeres, p: ((tigre.mujeres/tigre.poblacion)*100).toFixed(1), color: "#F472B6" },
            { label: "Varones", val: tigre.varones, p: ((tigre.varones/tigre.poblacion)*100).toFixed(1), color: "#38BDF8" },
          ].map(g => (
            <div key={g.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GRID_LINE}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: g.color, fontFamily: "'Space Mono', monospace" }}>{g.p}%</div>
              <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 4 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{fmt(g.val)} personas</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>* Sexo registrado al nacer. Fuente: INDEC c2022_rmba_entidades_c2.</p>
      </div>
    </div>
  );
};

const ViewComparativa = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
    <div>
      <SectionTitle icon="🏘️">Población por partido · GBA Norte</SectionTitle>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PARTIDOS_GBA_NORTE} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
            <XAxis dataKey="partido" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="poblacion" name="Población" radius={[6, 6, 0, 0]}>
              {PARTIDOS_GBA_NORTE.map((_, i) => <Cell key={i} fill={i === 0 ? ACCENT : `${BAR_COLORS[i]}88`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div>
      <SectionTitle icon="📐">Densidad poblacional (hab/km²)</SectionTitle>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PARTIDOS_GBA_NORTE.map(p => ({ ...p, densidad: Math.round(p.poblacion / p.superficie) }))} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
            <XAxis dataKey="partido" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="densidad" name="Densidad (hab/km²)" radius={[6, 6, 0, 0]}>
              {PARTIDOS_GBA_NORTE.map((_, i) => <Cell key={i} fill={i === 0 ? "#34D399" : `${BAR_COLORS[i]}77`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div>
      <SectionTitle icon="🔄">Crecimiento 2010 → 2022 (%)</SectionTitle>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PARTIDOS_GBA_NORTE.map(p => ({ ...p, crecimiento: parseFloat(pct(p.poblacion, p.pob2010)) }))} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
            <XAxis dataKey="partido" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="crecimiento" name="Crecimiento %" radius={[6, 6, 0, 0]}>
              {PARTIDOS_GBA_NORTE.map((_, i) => <Cell key={i} fill={i === 0 ? ACCENT2 : `${BAR_COLORS[i]}77`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const ViewViviendas = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <SectionTitle icon="🏠">Tipo de vivienda · Tigre (%)</SectionTitle>
        <div style={{ height: 280, display: "flex", alignItems: "center" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={TIGRE_VIVIENDAS} cx="50%" cy="50%" outerRadius={100} dataKey="valor" nameKey="tipo" paddingAngle={3}>
                {TIGRE_VIVIENDAS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "#0F1E33", border: "none", borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle icon="📊">Viviendas particulares · GBA Norte</SectionTitle>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PARTIDOS_GBA_NORTE} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
              <XAxis 
                dataKey="partido" 
                stroke="#475569" 
                tick={{ fill: "#94A3B8", fontSize: 10 }} 
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="viviendas" name="Viviendas" fill={`${ACCENT}99`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div>
      <SectionTitle icon="🗂️">Datos crudos · partidos GBA Norte · Censo 2022</SectionTitle>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${GRID_LINE}` }}>
              {["Partido", "Población", "Sup. km²", "Densidad", "Viviendas", "Crec. 2010–22"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748B", fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTIDOS_GBA_NORTE.map((p, i) => (
              <tr key={p.partido} style={{ borderBottom: `1px solid ${GRID_LINE}`, background: i === 0 ? "rgba(56,189,248,0.06)" : "transparent" }}>
                <td style={{ padding: "10px 14px", color: i === 0 ? ACCENT : "#CBD5E1", fontWeight: i === 0 ? 700 : 400 }}>
                  {p.partido}
                  {i === 0 && <span style={{ marginLeft: 6, fontSize: 10, background: `${ACCENT}22`, color: ACCENT, padding: "2px 6px", borderRadius: 4 }}>TU PARTIDO</span>}
                </td>
                <td style={{ padding: "10px 14px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>{fmt(p.poblacion)}</td>
                <td style={{ padding: "10px 14px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>{p.superficie}</td>
                <td style={{ padding: "10px 14px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>{fmt(Math.round(p.poblacion / p.superficie))}</td>
                <td style={{ padding: "10px 14px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>{fmt(p.viviendas)}</td>
                <td style={{ padding: "10px 14px", color: "#34D399", fontFamily: "'Space Mono', monospace" }}>+{pct(p.poblacion, p.pob2010)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
        Fuente: INDEC · Censo Nacional de Población, Hogares y Viviendas 2022 · Archivos c2022_rmba_entidades_c1 y c2.
      </p>
    </div>
  </div>
);

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
const TABS = [
  { id: "poblacion",   label: "Población",   icon: "👤" },
  { id: "comparativa", label: "Comparativa", icon: "🗺️" },
  { id: "viviendas",   label: "Viviendas",   icon: "🏠" },
];

export default function MiBarrioStats() {
  const [activeTab, setActiveTab] = useState("poblacion");
  const [partidos, setPartidos] = useState(PARTIDOS_GBA_NORTE);

  useEffect(() => {
    getPartidos().then(data => {
      if (data && data.length > 0) setPartidos(data);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#070F1A", color: "#F1F5F9", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #070F1A; }
        ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 3px; }
      `}</style>

      <header style={{ background: "rgba(7,15,26,0.95)", borderBottom: "1px solid #1E3A5F", padding: "0 32px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📍</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Mi Barrio Stats</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: -2 }}>Datos INDEC · Partido de Tigre · GBA Norte</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#334155", background: "#0F1E33", padding: "4px 10px", borderRadius: 20, border: "1px solid #1E3A5F" }}>
            Censo 2022 · datos oficiales
          </div>
        </div>
      </header>

      <div style={{ background: `linear-gradient(135deg, #0F1E33 0%, #071626 50%, #0A1929 100%)`, borderBottom: "1px solid #1E3A5F", padding: "32px 32px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>△ GBA Norte · Buenos Aires · Argentina</div>
          <h1 style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Partido de <span style={{ color: ACCENT }}>Tigre</span>
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748B", fontSize: 14, maxWidth: 540 }}>
            Visualización de indicadores sociodemográficos basada en datos del Censo Nacional de Población, Hogares y Viviendas 2022 — INDEC.
          </p>
        </div>
      </div>

      <div style={{ background: "#070F1A", borderBottom: "1px solid #1E3A5F", padding: "0 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "none", border: "none", borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : "2px solid transparent", color: activeTab === tab.id ? ACCENT : "#475569", padding: "14px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", fontFamily: "inherit" }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>
        {activeTab === "poblacion"   && <ViewPoblacion />}
        {activeTab === "comparativa" && <ViewComparativa />}
        {activeTab === "viviendas"   && <ViewViviendas />}
      </main>

      <footer style={{ borderTop: "1px solid #1E3A5F", padding: "20px 32px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "#334155", fontSize: 12 }}>
          Datos: INDEC · Censo Nacional de Población, Hogares y Viviendas 2022 · Archivos c2022_rmba_entidades
          &nbsp;·&nbsp; Proyecto <strong style={{ color: "#475569" }}>Mi Barrio Stats</strong> · Mariano B. Sánchez
        </p>
      </footer>
    </div>
  );
}