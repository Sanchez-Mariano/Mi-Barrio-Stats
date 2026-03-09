# Mi Barrio Stats — Frontend

Dashboard interactivo que visualiza datos sociodemográficos del Partido de Tigre y el GBA Norte, basado en datos reales del Censo Nacional de Población, Hogares y Viviendas 2022 — INDEC.

🔗 **Demo en vivo:** [mi-barrio-stats.vercel.app](https://mi-barrio-stats.vercel.app)

---

## Tecnologías

- [Next.js](https://nextjs.org/) — framework React con App Router
- [Recharts](https://recharts.org/) — gráficos interactivos
- CSS-in-JS con estilos inline

## Funcionalidades

- **Pestaña Población** — KPIs de Tigre (habitantes, crecimiento, densidad, viviendas), evolución histórica 1991–2022, distribución por género
- **Pestaña Comparativa** — Tigre vs partidos del GBA Norte en población, densidad y crecimiento
- **Pestaña Viviendas** — tipo de vivienda, comparativa regional y tabla de datos crudos
- Datos consumidos desde una API REST propia

## Instalación local

```bash
git clone https://github.com/Sanchez-Mariano/Mi-Barrio-Stats.git
cd Mi-Barrio-Stats/mi-barrio-stats
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

> El frontend consume la API en producción por defecto. Para usar la API local, cambiá `API_URL` en `app/api-client.js`.

## Estructura del proyecto

```
app/
├── components/
│   └── MiBarrioStats.jsx   # Componente principal del dashboard
├── api-client.js            # Funciones para consumir la API REST
├── page.tsx                 # Página principal
└── layout.tsx
```

## Fuente de datos

INDEC — Censo Nacional de Población, Hogares y Viviendas 2022. Resultados definitivos por partido para la provincia de Buenos Aires.

---

Desarrollado por **Mariano Benjamín Sánchez**
