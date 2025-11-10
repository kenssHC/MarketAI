# 🚂 Guía de Deploy en Railway - MarketAI SEO Module

## 📋 Variables de Entorno Requeridas

### 🔹 Para el Servicio: **Approval UI**

```bash
# Configuración básica
NODE_ENV=production
PORT=3000

# PostgreSQL (conectar con el servicio PostgreSQL de Railway)
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGDATABASE=${{Postgres.PGDATABASE}}

# n8n (usar la URL del servicio n8n de Railway)
N8N_WEBHOOK_BASE=https://[TU-N8N-DOMAIN].up.railway.app/webhook

# WordPress
WP_BASE_URL=https://larabs.pe
WP_APP_USER=tu-usuario-wordpress
WP_APP_PASSWORD=tu-application-password-wordpress
WORDPRESS_MEDIA_ENDPOINT=https://larabs.pe/wp-json/wp/v2/media
```

### 🔹 Para el Servicio: **n8n**

```bash
# Configuración básica
N8N_PORT=5678
N8N_HOST=${{RAILWAY_PUBLIC_DOMAIN}}
N8N_PROTOCOL=https
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/

# Seguridad
N8N_ENCRYPTION_KEY=genera-una-clave-aleatoria-de-32-caracteres-minimo

# Timezone
GENERIC_TIMEZONE=America/Lima
TZ=America/Lima

# PostgreSQL (conectar con el servicio PostgreSQL de Railway)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=${{Postgres.PGHOST}}
DB_POSTGRESDB_PORT=${{Postgres.PGPORT}}
DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}
DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}

# OpenAI
OPENAI_API_KEY=sk-tu-api-key-de-openai

# WordPress (mismo que approval-ui)
WORDPRESS_MEDIA_ENDPOINT=https://larabs.pe/wp-json/wp/v2/media
WORDPRESS_AUTH_HEADER=Basic [tu-auth-header-base64]

# Configuración de ejecución
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_ON_PROGRESS=true
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
N8N_METRICS=true
N8N_HIRING_BANNER_ENABLED=false
```

## 🎯 Configuración de Servicios en Railway

### 1️⃣ **Servicio PostgreSQL**
- Tipo: Database → PostgreSQL
- Railway lo crea automáticamente con todas las variables

### 2️⃣ **Servicio n8n**
- Root Directory: `seo-module/n8n`
- Dockerfile: Railway detectará automáticamente el Dockerfile
- Custom Start Command: *dejar vacío*
- Networking: Generar dominio público

### 3️⃣ **Servicio Approval UI**
- Root Directory: `seo-module/approval-ui`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Networking: Generar dominio público

## 🔐 Generar N8N_ENCRYPTION_KEY

```bash
# En PowerShell (Windows)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# En Linux/Mac
openssl rand -base64 32
```

## 📝 Pasos Post-Deploy

1. **Ejecutar migraciones de base de datos:**
   - Conectarse a PostgreSQL de Railway
   - Ejecutar archivos en `seo-module/n8n/migrations/` en orden

2. **Importar workflows en n8n:**
   - Acceder a la URL de n8n
   - Importar cada workflow desde `seo-module/n8n/workflows/`
   - Configurar credenciales (OpenAI, WordPress, etc.)

3. **Verificar conectividad:**
   - Approval UI debe poder conectarse a PostgreSQL
   - Approval UI debe poder llamar webhooks de n8n
   - n8n debe poder escribir en PostgreSQL

## 🐛 Troubleshooting

- **502 Bad Gateway:** Revisar logs del servicio en Railway
- **Database connection error:** Verificar variables `PGHOST`, `PGUSER`, etc.
- **n8n no se conecta:** Verificar `DB_TYPE=postgresdb` y todas las variables `DB_POSTGRESDB_*`
- **Build falla:** Verificar que `package.json` tenga el script `start`

## 💰 Costos Estimados

- PostgreSQL: ~$5/mes
- n8n: ~$5-8/mes  
- Approval UI: ~$3-5/mes
- **Total: ~$13-18/mes**

