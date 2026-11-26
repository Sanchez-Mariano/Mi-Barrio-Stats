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

const TIGRE = "Tigre";

// ── PALETA · "atlas de río" ───────────────────────────────────────────────────
// Papel cálido e tinta verde oscuro en vez del dashboard azul-neón habitual;
// el ocre remite al agua barrosa del delta y al origen del nombre de Tigre
// (los "tigres" —yaguaretés— que se cazaban en la zona).
const PAPER       = "#EFE7D8";
const PAPER_LOW   = "#E4DAC4"; // paneles levemente más oscuros que el fondo
const INK         = "#16231F";
const INK_SOFT    = "#51605A";
const INK_FAINT   = "#8A9690";
const LINE        = "rgba(22,35,31,0.16)";
const LINE_SOFT   = "rgba(22,35,31,0.09)";
const RIVER       = "#2F6F62"; // acento principal — el río
const OCHRE       = "#B5721F"; // acento secundario — el agua barrosa / "tigre"
const BRICK       = "#8C3B2A"; // caídas / contraste
const SAGE        = "#7E9686";
const BAR_COLORS  = ["#2F6F62", "#B5721F", "#4D6A86", "#8C3B2A", "#7E9686", "#C79A3E", "#5C7A6E", "#946A46", "#3F5E72"];

const DISPLAY = "var(--font-display), Georgia, serif";
const SANS    = "var(--font-sans), 'Segoe UI', sans-serif";

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

// Franja de indicadores tipo planilla: celdas separadas por filetes, sin
// tarjetas ni sombras — el "mismo radio en todo" es uno de los tics más
// comunes del diseño genérico.
const StatStrip = ({ items }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    border: `1px solid ${LINE}`,
  }}>
    {items.map((it, i) => (
      <div key={it.label} style={{
        padding: "16px 18px",
        borderLeft: i % 2 === 1 ? `1px solid ${LINE}` : "none",
        borderTop: i >= 2 ? `1px solid ${LINE}` : "none",
      }}>
        <div style={{ fontSize: 12, color: INK_FAINT, marginBottom: 6 }}>{it.label}</div>
        <div style={{
          fontSize: "clamp(20px, 5vw, 28px)",
          fontWeight: 600,
          color: it.color || INK,
          fontVariantNumeric: "tabular-nums",
          fontFamily: SANS,
        }}>{it.value}</div>
        {it.sub && <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 4 }}>{it.sub}</div>}
      </div>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ marginBottom: 18 }}>
    <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(17px, 3.4vw, 21px)", color: INK }}>
      {children}
    </h2>
    <div style={{ width: 36, height: 3, background: OCHRE, marginTop: 8 }} />
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
    <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 2, padding: "10px 14px", maxWidth: 190 }}>
      <p style={{ margin: 0, color: INK_FAINT, fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || RIVER, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const Aviso = ({ children }) => (
  <p role="status" style={{ margin: "0 0 20px", fontSize: 12, color: INK_SOFT, background: PAPER_LOW, border: `1px solid ${LINE}`, borderRadius: 2, padding: "9px 14px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      <StatStrip items={[
        { label: "Población total",       value: fmt(tigre.poblacion),       sub: "Censo 2022, datos definitivos", color: RIVER },
        { label: "Crecimiento 2010–2022", value: fmtPct(crecimiento),        sub: `Media nacional: ${fmtPct(CRECIMIENTO_NACIONAL)}` },
        { label: "Densidad",              value: `${fmt(densidad)} hab/km²`, sub: `Superficie: ${tigre.superficie} km²` },
        { label: "Viviendas particulares", value: fmt(tigre.viviendas),      sub: "Fuente: INDEC, Censo 2022", color: OCHRE },
      ]} />

      <div>
        <SectionTitle>Evolución poblacional de Tigre</SectionTitle>
        <ChartBox height={isMobile ? 210 : 260} label={`Evolución de la población de Tigre entre 1991 y 2022, de ${fmt(historico[0].poblacion)} a ${fmt(tigre.poblacion)} habitantes`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE_SOFT} vertical={false} />
              <XAxis dataKey="año" stroke={LINE} tick={{ fill: INK_SOFT, fontSize: 11 }} />
              <YAxis stroke={LINE} tick={{ fill: INK_SOFT, fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={38} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Line type="monotone" dataKey="poblacion" name="Población" stroke={RIVER} strokeWidth={3} dot={{ r: 5, fill: RIVER, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div>
        <SectionTitle>Distribución por género en Tigre</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${LINE}` }}>
          {[
            { label: "Mujeres", val: tigre.mujeres, p: ((tigre.mujeres/tigre.poblacion)*100).toFixed(1), color: BRICK },
            { label: "Varones", val: tigre.varones, p: ((tigre.varones/tigre.poblacion)*100).toFixed(1), color: RIVER },
          ].map((g, i) => (
            <div key={g.label} style={{ padding: "18px 16px", textAlign: "center", borderLeft: i === 1 ? `1px solid ${LINE}` : "none" }}>
              <div style={{ fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 600, color: g.color, fontFamily: SANS, fontVariantNumeric: "tabular-nums" }}>{g.p}%</div>
              <div style={{ fontSize: 13, color: INK_SOFT, marginTop: 4 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 2 }}>{fmt(g.val)} personas</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: INK_FAINT, marginTop: 8 }}>Sexo registrado al nacer. Fuente: INDEC, c2022_rmba_entidades_c2.</p>
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
    { title: "Población por partido en el GBA Norte", key: "poblacion",   yFmt: v => `${(v/1000).toFixed(0)}k`, name: "Población",          color: (t, i) => t ? RIVER : `${BAR_COLORS[i % BAR_COLORS.length]}99` },
    { title: "Densidad poblacional (hab/km²)",         key: "densidad",    yFmt: v => v,                          name: "Densidad (hab/km²)", color: (t, i) => t ? OCHRE : `${BAR_COLORS[i % BAR_COLORS.length]}88` },
    { title: "Crecimiento 2010 a 2022 (%)",            key: "crecimiento", yFmt: v => `${v}%`,                    name: "Crecimiento %",      color: (t, i) => t ? BRICK : `${BAR_COLORS[i % BAR_COLORS.length]}88` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {charts.map(({ title, key, yFmt, name, color }) => (
        <div key={key}>
          <SectionTitle>{title}</SectionTitle>
          <ChartBox height={isMobile ? 230 : 280} label={`Gráfico de barras: ${title}, para ${partidos.length} partidos del GBA Norte. Los valores están en la tabla de la pestaña Viviendas.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE_SOFT} vertical={false} />
                <XAxis
                  dataKey="partido"
                  stroke={LINE}
                  tick={{ fill: INK_SOFT, fontSize: isMobile ? 9 : 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={isMobile ? 72 : 60}
                />
                <YAxis stroke={LINE} tick={{ fill: INK_SOFT, fontSize: 10 }} tickFormatter={yFmt} width={isMobile ? 34 : 44} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey={key} name={name} radius={[2, 2, 0, 0]}>
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
  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

    {/* Pie + Bar: 1 columna en mobile, 2 en desktop */}
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 28 }}>
      <div>
        <SectionTitle>Tipo de vivienda en Tigre</SectionTitle>
        <ChartBox
          height={260}
          style={{ display: "flex", alignItems: "center" }}
          label={`Tipo de vivienda en Tigre: ${TIGRE_VIVIENDAS.map(v => `${v.tipo} ${v.valor}%`).join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={TIGRE_VIVIENDAS} cx="50%" cy="50%" outerRadius={isMobile ? 80 : 100} dataKey="valor" nameKey="tipo" paddingAngle={2}>
                {TIGRE_VIVIENDAS.map(entry => <Cell key={entry.tipo} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 2 }} />
              <Legend wrapperStyle={{ color: INK_SOFT, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div>
        <SectionTitle>Viviendas particulares en el GBA Norte</SectionTitle>
        <ChartBox height={260} label="Gráfico de barras de viviendas particulares por partido del GBA Norte. Los valores están en la tabla de abajo.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partidos} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE_SOFT} vertical={false} />
              <XAxis
                dataKey="partido"
                stroke={LINE}
                tick={{ fill: INK_SOFT, fontSize: isMobile ? 9 : 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={isMobile ? 72 : 70}
              />
              <YAxis stroke={LINE} tick={{ fill: INK_SOFT, fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={isMobile ? 34 : 40} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="viviendas" name="Viviendas" fill={`${RIVER}99`} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>

    {/* Tabla con scroll horizontal */}
    <div>
      <SectionTitle>Datos por partido, GBA Norte, Censo 2022</SectionTitle>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: isMobile ? 11 : 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${INK}` }}>
              {["Partido","Población","Sup. km²","Densidad","Viviendas","Crec. 2010–22"].map(h => (
                <th key={h} scope="col" style={{ padding: "10px 10px", textAlign: "left", color: INK_SOFT, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partidos.map(p => {
              const destacado = esTigre(p);
              const crec = pct(p.poblacion, p.pob2010);
              return (
                <tr key={p.partido} style={{ borderBottom: `1px solid ${LINE}`, background: destacado ? "rgba(181,114,31,0.08)" : "transparent" }}>
                  <td style={{ padding: "10px 10px", color: destacado ? OCHRE : INK, fontWeight: destacado ? 700 : 400, whiteSpace: "nowrap", fontFamily: destacado ? DISPLAY : SANS }}>
                    {p.partido}
                    {destacado && <span style={{ marginLeft: 6, fontSize: 10, color: OCHRE, fontFamily: SANS, fontStyle: "italic" }}>tu partido</span>}
                  </td>
                  <td style={{ padding: "10px 10px", color: INK_SOFT, fontVariantNumeric: "tabular-nums" }}>{fmt(p.poblacion)}</td>
                  <td style={{ padding: "10px 10px", color: INK_SOFT, fontVariantNumeric: "tabular-nums" }}>{p.superficie}</td>
                  <td style={{ padding: "10px 10px", color: INK_SOFT, fontVariantNumeric: "tabular-nums" }}>{fmt(Math.round(p.poblacion / p.superficie))}</td>
                  <td style={{ padding: "10px 10px", color: INK_SOFT, fontVariantNumeric: "tabular-nums" }}>{fmt(p.viviendas)}</td>
                  <td style={{ padding: "10px 10px", color: crec >= 0 ? RIVER : BRICK, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmtPct(crec)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: INK_FAINT, marginTop: 8 }}>
        Fuente: INDEC, Censo Nacional de Población, Hogares y Viviendas 2022, archivos c2022_rmba_entidades_c1 y c2.
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
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: SANS }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${PAPER}; }
        ::-webkit-scrollbar-thumb { background: ${SAGE}; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: `${PAPER}F2`,
        borderBottom: `1px solid ${LINE}`,
        padding: `0 ${px}px`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(8px)",
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
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600, fontFamily: DISPLAY, letterSpacing: "-0.01em" }}>Mi Barrio Stats</div>
            <div style={{ fontSize: 11, color: INK_FAINT, marginTop: 1 }}>Datos INDEC, Partido de Tigre, GBA Norte</div>
          </div>
          <div style={{ fontSize: 11, color: INK_SOFT, padding: "4px 10px", border: `1px solid ${LINE}` }}>
            Censo 2022
          </div>
        </div>
      </header>

      {/* HERO */}
      <div style={{
        borderBottom: `1px solid ${LINE}`,
        padding: isMobile ? "28px 16px 22px" : "48px 32px 36px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Motivo de fondo: curvas suaves evocando los brazos del delta, en vez de una grilla de puntos */}
        <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }} preserveAspectRatio="none" viewBox="0 0 800 300">
          <path d="M0,230 C150,180 250,260 420,210 C560,170 650,230 800,190" fill="none" stroke={SAGE} strokeWidth="1" opacity="0.35" />
          <path d="M0,260 C180,220 300,280 460,240 C600,205 680,260 800,225" fill="none" stroke={SAGE} strokeWidth="1" opacity="0.25" />
        </svg>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 12, color: OCHRE, fontWeight: 600, marginBottom: 10 }}>Partido del GBA Norte</div>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontStyle: "italic", fontSize: "clamp(32px, 8vw, 52px)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.05, color: INK }}>
            Tigre
          </h1>
          <p style={{ margin: "14px 0 0", color: INK_SOFT, fontSize: isMobile ? 13 : 15, maxWidth: 520, lineHeight: 1.5 }}>
            Indicadores sociodemográficos del partido y su entorno en el GBA Norte, Buenos Aires, a partir del Censo Nacional de Población, Hogares y Viviendas 2022 (INDEC).
          </p>
        </div>
      </div>

      {/* TAB BAR — scrolleable en mobile */}
      <div style={{ background: PAPER, borderBottom: `1px solid ${LINE}`, padding: `0 ${px}px`, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
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
                borderBottom: activeTab === tab.id ? `2px solid ${OCHRE}` : "2px solid transparent",
                color: activeTab === tab.id ? INK : INK_FAINT,
                padding: isMobile ? "11px 16px" : "14px 18px",
                fontSize: isMobile ? 13 : 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
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
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 16px 48px" : "36px 32px 64px" }}>
        {origen === "cargando" && <Aviso>Conectando con la API. Mientras tanto se muestran los datos locales.</Aviso>}
        {origen === "local"    && <Aviso>No se pudo cargar la API; se muestran los datos locales del Censo 2022.</Aviso>}

        <div role="tabpanel" id="panel-dashboard" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "poblacion"   && <ViewPoblacion   isMobile={isMobile} partidos={partidos} />}
          {activeTab === "comparativa" && <ViewComparativa isMobile={isMobile} partidos={partidos} />}
          {activeTab === "viviendas"   && <ViewViviendas   isMobile={isMobile} partidos={partidos} />}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${LINE}`, padding: `20px ${px}px`, textAlign: "center" }}>
        <p style={{ margin: 0, color: INK_FAINT, fontSize: 11 }}>
          Datos: INDEC, Censo Nacional de Población, Hogares y Viviendas 2022, archivos c2022_rmba_entidades.
          Proyecto <strong style={{ color: INK_SOFT, fontWeight: 600 }}>Mi Barrio Stats</strong>, Mariano B. Sánchez.
        </p>
      </footer>
    </div>
  );
}
