const API_URL = "https://mi-barrio-stats-api.onrender.com";

export async function getPartidos() {
  const res = await fetch(`${API_URL}/partidos`);
  const data = await res.json();
  return data;
}

export async function getPartido(nombre) {
  const res = await fetch(`${API_URL}/partidos/${nombre}`);
  const data = await res.json();
  return data;
}