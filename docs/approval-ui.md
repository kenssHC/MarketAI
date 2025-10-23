# UI de Aprobacion Editorial

Panel SPA (Vite + React) para revisar drafts generados por los workflows, visualizar el reporte de QA SEO y ejecutar las decisiones previas a la publicacion.

---

## Caracteristicas principales

- Lista de drafts listos para revision (`status` *draft* o *review* con `qa_passed = true`).
- Busqueda por titulo, cluster, idea o keyword principal.
- Vista detallada con metadatos SEO, imagen destacada, prompt visual, copys sociales y contenido markdown.
- Seccion QA con resumen, metricas y checklist (`pass`, `warn`, `fail`).
- Acciones editoriales:
  - **Aprobar** -> `status = 'approved'`, registra `approved_at` / `approved_by` y deja traza en `jobs_log` (`job_type = review_approval`).
  - **Solicitar cambios** -> actualiza `status` (por defecto `review`), guarda `rejection_reason` y genera log (`job_type = review_feedback`).

---

## Arquitectura

```
approval-ui/
|-- server/               # Express + pg (API interna)
|   |-- index.js          # Punto de entrada
|   |-- config.js         # Carga de .env (APPROVAL_API_PORT, PG*)
|   |-- db.js             # Pool de conexiones PostgreSQL
|   \-- routes/drafts.js  # Endpoints REST (GET lista/detalle, POST approve/return)
|-- client/               # SPA con Vite + React
|   |-- index.html
|   \-- src/
|       |-- App.jsx       # Layout principal, filtros, QA, acciones
|       |-- api.js        # Wrapper fetch -> /api/*
|       |-- app.css       # Estilos (modo oscuro + glassmorphism)
|       \-- main.jsx      # Bootstrap React
|-- package.json          # Scripts (dev/build/preview/lint)
\-- vite.config.js        # Root client/, proxy /api -> 3001
```

El servidor Express expone `/api/drafts` y sirve la build estatica (`dist/`) al ejecutar `npm run preview`.

---

## Variables de entorno

En `seo-module/.env` (o `.env.example`):

```env
APPROVAL_API_PORT=3001
PGHOST=localhost
PGPORT=5432
PGUSER=marketai_user
PGPASSWORD=marketai_secure_password
PGDATABASE=marketai_seo
```

`config.js` carga automaticamente `../../.env`, por lo que no es necesario duplicar variables dentro de `approval-ui/`.

---

## Ejecucion local

```powershell
cd seo-module\approval-ui
npm install
npm run dev
```

- SPA: http://localhost:5173 (proxy `/api` -> http://localhost:3001)
- API: http://localhost:3001/api
- `npm run build` + `npm run preview:server` sirven la build desde Express.

---

## Endpoints clave

| Metodo | Ruta                      | Descripcion                                                        |
|--------|---------------------------|--------------------------------------------------------------------|
| GET    | `/api/drafts`             | Lista filtrable (`status`, `qaStatus`, `search`, `limit`).         |
| GET    | `/api/drafts/:id`         | Detalle completo del draft.                                       |
| POST   | `/api/drafts/:id/approve` | Marca como aprobado y registra `jobs_log`.                        |
| POST   | `/api/drafts/:id/return`  | Solicita cambios y deja observaciones (`status` por defecto review). |
| GET    | `/api/health`             | Ping simple.                                                       |

---

## Casos de prueba recomendados

1. Draft con `qa_passed = true`, sin imagen -> verificar render y aprobacion.
2. Draft con `summary.warnings > 0` -> confirmar visualizacion de advertencias.
3. Aprobar y solicitar cambios -> validar `drafts.status` y entradas en `jobs_log`.
4. Probar busqueda (`?search=`) y limites custom (`?limit=5`).
5. Verificar el proxy `/api` tanto en modo dev (Vite) como en preview (Express sirviendo `dist/`).

---

## Notas

- El reviewer por defecto es `editor`; se puede exponer autenticacion ligera en iteraciones futuras.
- Para SSL en PostgreSQL usar `PGSSL=true`.
- El front utiliza `window.prompt` para notas/observaciones; se puede reemplazar por un modal dedicado.

