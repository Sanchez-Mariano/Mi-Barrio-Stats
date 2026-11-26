// URL de la API: configurable con NEXT_PUBLIC_API_URL (ver .env.example).
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://mi-barrio-stats-api.onrender.com"
).replace(/\/$/, "");

async function fetchJson(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${path}`, { signal });
  if (!res.ok) {
    throw new Error(`La API respondió ${res.status} en ${path}`);
  }
  return res.json();
}

export function getPartidos(options) {
  return fetchJson("/partidos", options);
}

export function getPartido(nombre, options) {
  return fetchJson(`/partidos/${encodeURIComponent(nombre)}`, options);
}