"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { getPartidos } from "../api-client";
import {
  PARTIDOS_FALLBACK,
  TIGRE_HISTORICO_PREVIO,
  TIGRE_VIVIENDAS,
  CRECIMIENTO_NACIONAL,
} from "../data/partidos";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const TIGRE     = "Tigre";
const ACCENT    = "#38BDF8";
const ACCENT2   = "#818CF8";
const GRID_LINE = "#1E3A5F";
const BAR_COLORS = ["#38BDF8","#818CF8","#34D399","#FB923C","#F472B6","#A78BFA","#FCD34D","#6EE7B7","#F9A8D4"];

// Fuentes cargadas con next/font en layout.tsx
const SANS = "var(--font-inter), 'Segoe UI', sans-serif";
const MONO = "var(--font-space-mono), monospace";

const fmt    = n => n.toLocaleString("es-AR");
const pct    = (a, b) => ((a - b) / b) * 100;
const fmtPct = v => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const esTigre = p => p.partido === TIGRE;

// Valida lo que devuelve la API antes de usarlo
const CAMPOS_NUMERICOS = ["poblacion", "superficie", "viviendas", "mujeres", "varones", "pob2010"];
const esPartidoValido = p =>
  p && typeof p.partido === "string" && CAMPOS_NUMERICOS.every(c => Number.isFinite(p[c]));

// ── HOOK ──────────────────────────────────────────────────────────────────────
// useSyncExternalStore evita el desajuste de hidratación (servidor 1024px vs. celular real)
const subscribeResize = callback => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
const useWindowWidth = () =>
  useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1024);

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = ACCENT }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${GRID_LINE}`,
    borderTop: `3px solid ${color}`,
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  }}>
    <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
    <span style={{ fontSize: "clamp(16px, 4vw, 26px)", fontWeight: 800, color: "#F1F5F9", fontFamily: MONO }}>{value}</span>
    {sub && <span style={{ fontSize: 10, color: "#94A3B8" }}>{sub}</span>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
    <h2 style={{ margin: 0, fontSize: "clamp(10px, 2.8vw, 14px)", fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: "0.08em" }}>{children}</h2>
    <div style={{ flex: 1, height: 1, background: GRID_LINE, marginLeft: 8 }} />
  </div>
);

// Contenedor de gráfico con texto alternativo para lectores de pantalla
const ChartBox = ({ height, label, style, children }) => (
  <div role="img" aria-label={label} style={{ height, ...style }}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0F1E33", border: "none", borderRadius: 8, padding: "10px 14px", maxWidth: 180 }}>
      <p style={{ margin: 0, color: "#94A3B8", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || ACCENT, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const Aviso = ({ children }) => (
  <p role="status" style={{ margin: "0 0 20px", fontSize: 11, color: "#94A3B8", background: "#0F1E33", border: `1px solid ${GRID_LINE}`, borderRadius: 8, padding: "8px 12px" }}>
    {children}
  </p>
);

// ── TAB: POBLACIÓN ────────────────────────────────────────────────────────────
const ViewPoblacion = ({ isMobile, partidos }) => {
  const tigre = partidos.find(esTigre) ?? partidos[0];
  const crecimiento = pct(tigre.poblacion, tigre.pob2010);
  const densidad = Math.round(tigre.poblacion / tigre.superficie);

  // 2010 y 2022 salen de los datos del partido, así el gráfico nunca se contradice con las tarjetas
  const historico = [
    ...TIGRE_HISTORICO_PREVIO,
    { año: "2010", poblacion: tigre.pob2010 },
    { año: "2022", poblacion: tigre.poblacion },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* 2×2 en mobile, 4 columnas en desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard label="Población total"        value={fmt(tigre.poblacion)}       sub="Censo 2022 · datos definitivos" color={ACCENT}   />
        <StatCard label="Crecimiento 2010–2022"  value={fmtPct(crecimiento)}        sub={`Media nacional: ${fmtPct(CRECIMIENTO_NACIONAL)}`} color="#34D399" />
        <StatCard label="Densidad"               value={`${fmt(densidad)} hab/km²`} sub={`Superficie: ${tigre.superficie} km²`} color={ACCENT2} />
        <StatCard label="Viviendas particulares" value={fmt(tigre.viviendas)}       sub="Fuente: INDEC Censo 2022"       color="#FB923C"  />
      </div>

      <div>
        <SectionTitle>Evolución poblacional · Tigre</SectionTitle>
        <ChartBox height={isMobile ? 210 : 260} label={`Evolución de la población de Tigre entre 1991 y 2022, de ${fmt(historico[0].poblacion)} a ${fmt(tigre.poblacion)} habitantes`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
              <XAxis dataKey="año" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={38} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Line type="monotone" dataKey="poblacion" name="Población" stroke={ACCENT} strokeWidth={3} dot={{ r: 5, fill: ACCENT, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div>
        <SectionTitle>Distribución por género · Tigre</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Mujeres", val: tigre.mujeres, p: ((tigre.mujeres/tigre.poblacion)*100).toFixed(1), color: "#F472B6" },
            { label: "Varones", val: tigre.varones, p: ((tigre.varones/tigre.poblacion)*100).toFixed(1), color: "#38BDF8" },
          ].map(g => (
            <div key={g.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GRID_LINE}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 800, color: g.color, fontFamily: MONO }}>{g.p}%</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{g.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{fmt(g.val)} personas</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>* Sexo registrado al nacer. Fuente: INDEC c2022_rmba_entidades_c2.</p>
      </div>
    </div>
  );
};

// ── TAB: COMPARATIVA ──────────────────────────────────────────────────────────
const ViewComparativa = ({ isMobile, partidos }) => {
  const chartData = partidos.map(p => ({
    ...p,
    densidad:    Math.round(p.poblacion / p.superficie),
    crecimiento: Number(pct(p.poblacion, p.pob2010).toFixed(1)),
  }));

  // El color destaca a Tigre por nombre (no por posición en la lista)
  const charts = [
    { title: "Población por partido · GBA Norte",  key: "poblacion",   yFmt: v => `${(v/1000).toFixed(0)}k`, name: "Población",          color: (t, i) => t ? ACCENT    : `${BAR_COLORS[i % BAR_COLORS.length]}88` },
    { title: "Densidad poblacional (hab/km²)",     key: "densidad",    yFmt: v => v,                          name: "Densidad (hab/km²)", color: (t, i) => t ? "#34D399" : `${BAR_COLORS[i % BAR_COLORS.length]}77` },
    { title: "Crecimiento 2010 → 2022 (%)",        key: "crecimiento", yFmt: v => `${v}%`,                    name: "Crecimiento %",      color: (t, i) => t ? ACCENT2   : `${BAR_COLORS[i % BAR_COLORS.length]}77` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {charts.map(({ title, key, yFmt, name, color }) => (
        <div key={key}>
          <SectionTitle>{title}</SectionTitle>
          <ChartBox height={isMobile ? 230 : 280} label={`Gráfico de barras: ${title}, para ${partidos.length} partidos del GBA Norte. Los valores están en la tabla de la pestaña Viviendas.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
                <XAxis
                  dataKey="partido"
                  stroke="#475569"
                  tick={{ fill: "#94A3B8", fontSize: isMobile ? 9 : 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={isMobile ? 72 : 60}
                />
                <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={yFmt} width={isMobile ? 34 : 44} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey={key} name={name} radius={[6, 6, 0, 0]}>
                  {chartData.map((p, i) => <Cell key={p.partido} fill={color(esTigre(p), i)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      ))}
    </div>
  );
};

// ── TAB: VIVIENDAS ────────────────────────────────────────────────────────────
const ViewViviendas = ({ isMobile, partidos }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

    {/* Pie + Bar: 1 columna en mobile, 2 en desktop */}
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
      <div>
        <SectionTitle>Tipo de vivienda · Tigre (%)</SectionTitle>
        <ChartBox
          height={260}
          style={{ display: "flex", alignItems: "center" }}
          label={`Tipo de vivienda en Tigre: ${TIGRE_VIVIENDAS.map(v => `${v.tipo} ${v.valor}%`).join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={TIGRE_VIVIENDAS} cx="50%" cy="50%" outerRadius={isMobile ? 80 : 100} dataKey="valor" nameKey="tipo" paddingAngle={3}>
                {TIGRE_VIVIENDAS.map(entry => <Cell key={entry.tipo} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: "#0F1E33", border: "none", borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div>
        <SectionTitle>Viviendas particulares · GBA Norte</SectionTitle>
        <ChartBox height={260} label="Gráfico de barras de viviendas particulares por partido del GBA Norte. Los valores están en la tabla de abajo.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partidos} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} />
              <XAxis
                dataKey="partido"
                stroke="#475569"
                tick={{ fill: "#94A3B8", fontSize: isMobile ? 9 : 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={isMobile ? 72 : 70}
              />
              <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={isMobile ? 34 : 40} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="viviendas" name="Viviendas" fill={`${ACCENT}99`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>

    {/* Tabla con scroll horizontal */}
    <div>
      <SectionTitle>Datos crudos · partidos GBA Norte · Censo 2022</SectionTitle>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: isMobile ? 11 : 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${GRID_LINE}` }}>
              {["Partido","Población","Sup. km²","Densidad","Viviendas","Crec. 2010–22"].map(h => (
                <th key={h} scope="col" style={{ padding: "10px 10px", textAlign: "left", color: "#64748B", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partidos.map(p => {
              const destacado = esTigre(p);
              const crec = pct(p.poblacion, p.pob2010);
              return (
                <tr key={p.partido} style={{ borderBottom: `1px solid ${GRID_LINE}`, background: destacado ? "rgba(56,189,248,0.06)" : "transparent" }}>
                  <td style={{ padding: "10px 10px", color: destacado ? ACCENT : "#CBD5E1", fontWeight: destacado ? 700 : 400, whiteSpace: "nowrap" }}>
                    {p.partido}
                    {destacado && <span style={{ marginLeft: 5, fontSize: 9, background: `${ACCENT}22`, color: ACCENT, padding: "2px 5px", borderRadius: 4 }}>TU PARTIDO</span>}
                  </td>
                  <td style={{ padding: "10px 10px", color: "#94A3B8", fontFamily: MONO }}>{fmt(p.poblacion)}</td>
                  <td style={{ padding: "10px 10px", color: "#94A3B8", fontFamily: MONO }}>{p.superficie}</td>
                  <td style={{ padding: "10px 10px", color: "#94A3B8", fontFamily: MONO }}>{fmt(Math.round(p.poblacion / p.superficie))}</td>
                  <td style={{ padding: "10px 10px", color: "#94A3B8", fontFamily: MONO }}>{fmt(p.viviendas)}</td>
                  <td style={{ padding: "10px 10px", color: crec >= 0 ? "#34D399" : "#F87171", fontFamily: MONO }}>{fmtPct(crec)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>
        Fuente: INDEC · Censo Nacional de Población, Hogares y Viviendas 2022 · Archivos c2022_rmba_entidades_c1 y c2.
      </p>
    </div>
  </div>
);

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "poblacion",   label: "Población"   },
  { id: "comparativa", label: "Comparativa" },
  { id: "viviendas",   label: "Viviendas"   },
];

export default function MiBarrioStats() {
  const [activeTab, setActiveTab] = useState("poblacion");
  const [partidos, setPartidos]   = useState(PARTIDOS_FALLBACK);
  // "cargando" | "api" | "local"
  const [origen, setOrigen]       = useState("cargando");
  const width    = useWindowWidth();
  const isMobile = width < 640;
  const px       = isMobile ? 16 : 32;

  useEffect(() => {
    const controller = new AbortController();

    getPartidos({ signal: controller.signal })
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data.every(esPartidoValido)) {
          setPartidos(data);
          setOrigen("api");
        } else {
          setOrigen("local"); // respuesta con formato inesperado → datos locales
        }
      })
      .catch(err => {
        if (err.name !== "AbortError") setOrigen("local");
      });

    return () => controller.abort();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#070F1A", color: "#F1F5F9", fontFamily: SANS }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #070F1A; }
        ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: "rgba(7,15,26,0.95)",
        borderBottom: "1px solid #1E3A5F",
        padding: `0 ${px}px`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",          // badge baja a nueva línea si no entra
          gap: 8,
          minHeight: isMobile ? "auto" : 64,
          padding: isMobile ? "10px 0" : "0",
        }}>
          <div>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Mi Barrio Stats</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>Datos INDEC · Partido de Tigre · GBA Norte</div>
          </div>
          <div style={{ fontSize: 10, color: "#334155", background: "#0F1E33", padding: "4px 10px", borderRadius: 20, border: "1px solid #1E3A5F" }}>
            Censo 2022 · datos oficiales
          </div>
        </div>
      </header>

      {/* HERO */}
      <div style={{
        background: `linear-gradient(135deg, #0F1E33 0%, #071626 50%, #0A1929 100%)`,
        borderBottom: "1px solid #1E3A5F",
        padding: isMobile ? "20px 16px 16px" : "32px 32px 28px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>△ GBA Norte · Buenos Aires · Argentina</div>
          <h1 style={{ margin: 0, fontSize: "clamp(22px, 6vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Partido de <span style={{ color: ACCENT }}>Tigre</span>
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748B", fontSize: isMobile ? 12 : 14, maxWidth: 540 }}>
            Visualización de indicadores sociodemográficos basada en datos del Censo Nacional de Población, Hogares y Viviendas 2022 — INDEC.
          </p>
        </div>
      </div>

      {/* TAB BAR — scrolleable en mobile */}
      <div style={{ background: "#070F1A", borderBottom: "1px solid #1E3A5F", padding: `0 ${px}px`, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div role="tablist" aria-label="Secciones del dashboard" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: isMobile ? 0 : 4, minWidth: "max-content" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls="panel-dashboard"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : "2px solid transparent",
                color: activeTab === tab.id ? ACCENT : "#475569",
                padding: isMobile ? "11px 16px" : "14px 18px",
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "32px 32px 64px" }}>
        {origen === "cargando" && <Aviso>Conectando con la API… mientras tanto se muestran los datos locales.</Aviso>}
        {origen === "local"    && <Aviso>No se pudo cargar la API; se muestran los datos locales del Censo 2022.</Aviso>}

        <div role="tabpanel" id="panel-dashboard" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "poblacion"   && <ViewPoblacion   isMobile={isMobile} partidos={partidos} />}
          {activeTab === "comparativa" && <ViewComparativa isMobile={isMobile} partidos={partidos} />}
          {activeTab === "viviendas"   && <ViewViviendas   isMobile={isMobile} partidos={partidos} />}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1E3A5F", padding: `20px ${px}px`, textAlign: "center" }}>
        <p style={{ margin: 0, color: "#334155", fontSize: 11 }}>
          Datos: INDEC · Censo Nacional de Población, Hogares y Viviendas 2022 · Archivos c2022_rmba_entidades
          &nbsp;·&nbsp; Proyecto <strong style={{ color: "#475569" }}>Mi Barrio Stats</strong> · Mariano B. Sánchez
        </p>
      </footer>
    </div>
  );
}