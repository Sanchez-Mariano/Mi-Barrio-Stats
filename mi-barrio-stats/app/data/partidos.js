// Datos locales: se usan como respaldo mientras carga la API (o si falla).
// Deben coincidir con data/partidos.json de la API.
// Fuente: INDEC · Censo Nacional de Población, Hogares y Viviendas 2022.

export const PARTIDOS_FALLBACK = [
  { partido: "Tigre",               poblacion: 446949, superficie: 393.9, viviendas: 158895, mujeres: 230090, varones: 216835, pob2010: 376381 },
  { partido: "San Fernando",        poblacion: 171616, superficie: 992.8, viviendas: 63949,  mujeres: 89826,  varones: 81764,  pob2010: 163240 },
  { partido: "San Isidro",          poblacion: 297282, superficie: 52.4,  viviendas: 121287, mujeres: 157668, varones: 139602, pob2010: 292878 },
  { partido: "Pilar",               poblacion: 394754, superficie: 384.7, viviendas: 137095, mujeres: 201410, varones: 193344, pob2010: 299077 },
  { partido: "Escobar",             poblacion: 256268, superficie: 301.0, viviendas: 90334,  mujeres: 130472, varones: 125794, pob2010: 213619 },
  { partido: "Vicente López",       poblacion: 282280, superficie: 34.5,  viviendas: 125737, mujeres: 150646, varones: 131596, pob2010: 269420 },
  { partido: "Malvinas Argentinas", poblacion: 350674, superficie: 62.9,  viviendas: 108522, mujeres: 180153, varones: 170521, pob2010: 322375 },
  { partido: "San Miguel",          poblacion: 328835, superficie: 82.8,  viviendas: 113702, mujeres: 169866, varones: 158910, pob2010: 276190 },
  { partido: "José C. Paz",         poblacion: 326992, superficie: 50.2,  viviendas: 99841,  mujeres: 167546, varones: 159419, pob2010: 265981 },
];

// Censos anteriores de Tigre. 2010 y 2022 se toman de los datos del partido.
// TODO: agregar la fuente exacta de estas dos cifras.
export const TIGRE_HISTORICO_PREVIO = [
  { año: "1991", poblacion: 257922 },
  { año: "2001", poblacion: 301223 },
];

export const TIGRE_VIVIENDAS = [
  { tipo: "Casa",         valor: 82.4, color: "#2F6F62" },
  { tipo: "Departamento", valor: 12.8, color: "#C17A2E" },
  { tipo: "Casilla",      valor: 2.9,  color: "#4D6A86" },
  { tipo: "Otro",         valor: 1.9,  color: "#8FA68F" },
];

// Crecimiento nacional 2010–2022: 46.044.703 / 40.117.096 − 1 ≈ +14,8 %
// TODO: verificar contra la publicación oficial de INDEC.
export const CRECIMIENTO_NACIONAL = 14.8;