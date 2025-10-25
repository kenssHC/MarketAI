# UI de Aprobacion Editorial

Panel SPA (Vite + React) que cubre la ingesta de keywords, la generacion automatica de articulos y la revision editorial previa a publicacion.

---

## Caracteristicas principales

- Ingesta de keywords: carga manual o via CSV/Excel con cluster y proyecto, estado y contadores.
- Accion "Crear articulo" que lanza los workflows 7-11 de n8n (clustering -> ideas -> redaccion simple -> QA) y devuelve el draft listo para editar.
- Panel de edicion con contenido markdown, metadatos SEO, tags y acciones (guardar, regenerar, aprobar).
- Seccion de QA para revisar reportes, advertencias y aprobar/devolver articulos.
- Feedback inmediato con toasts y filtros por cluster/keyword, manteniendo trazabilidad en `jobs_log`.

---

## Arquitectura

```
approval-ui/
|-- server/               # Express + pg (API interna)
|   |-- index.js          # Punto de entrada
|   |-- config.js         # Carga de .env (APPROVAL_API_PORT, PG*, N8N)
|   |-- db.js             # Pool de conexiones PostgreSQL
|   |-- services/n8n.js   # Cliente helper para webhooks n8n
|   |-- routes/drafts.js  # QA, aprobacion y actualizacion de drafts
|   \-- routes/keywords.js  # Ingesta manual/CSV y pipeline de articulos
|-- client/               # SPA con Vite + React
|   |-- index.html
|   \-- src/
|       |-- App.jsx       # Layout blog (keywords, editor, QA)
|       |-- api.js        # Wrapper fetch -> /api/*
|       |-- app.css       # Estilos globales (sidebar, paneles)
|       \-- main.jsx      # Bootstrap React
|-- package.json          # Scripts (dev/build/preview/lint)
\-- vite.config.js        # Root client/, proxy /api -> 3001
```

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
N8N_WEBHOOK_BASE=http://localhost:5678/webhook
N8N_TIMEOUT_MS=120000
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
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

| Metodo | Ruta                               | Descripcion |
|--------|------------------------------------|-------------|
| GET    | `/api/keywords`                    | Lista keywords (filtros `status`, `project`, `limit`). |
| POST   | `/api/keywords/manual`             | Inserta keywords manuales (`keywords`, `clusterName`, `projectName`). |
| POST   | `/api/keywords/upload`             | Procesa CSV/Excel (campo `file`). |
| POST   | `/api/keywords/:id/generate`       | Orquesta clustering + ideas + redaccion simple + QA y devuelve `{keyword, idea, draft}`. |
| GET    | `/api/drafts`                      | Lista drafts (QA) con filtros. |
| GET    | `/api/drafts/:id`                  | Detalle completo. |
| PUT    | `/api/drafts/:id`                  | Actualiza contenido/meta (editor). |
| POST   | `/api/drafts/:id/approve`          | Marca como aprobado y registra `jobs_log`. |
| POST   | `/api/drafts/:id/return`           | Solicita cambios y registra `jobs_log`. |
| GET    | `/api/health`                      | Ping simple. |

---

## Casos de prueba recomendados

1. Cargar keywords manualmente y via CSV -> validar insercion y listado.
2. Ejecutar "Crear articulo" y confirmar que se genera idea + draft + QA para la keyword seleccionada.
3. Editar el borrador (guardar y regenerar) -> comprobar actualizacion de `drafts`.
4. Aprobar/Solicitar cambios desde el editor y desde la seccion QA -> revisar estado y `jobs_log`.
5. Revisar los endpoints con filtros (`?project=Blog`, `?status=processed`, etc.) y el proxy `/api` tanto en `npm run dev` como en preview.

---

## Notas

- El reviewer por defecto es `editor`; se puede conectar con autenticacion real en versiones futuras.
- Si n8n usa Basic Auth, define `N8N_BASIC_AUTH_USER` y `N8N_BASIC_AUTH_PASSWORD` (se envian en cada webhook).
- Para SSL en PostgreSQL habilita `PGSSL=true`.
- El front usa `fetch` nativo (Node 18+) y `multer` para uploads; ajustar limites segun necesidad.
