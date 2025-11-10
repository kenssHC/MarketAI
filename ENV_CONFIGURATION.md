# 🔧 Configuración de Variables de Entorno

## 📝 Archivo `.env` Requerido

Crea un archivo `.env` en la carpeta `seo-module/` con el siguiente contenido:

```bash
# ============================================
# VARIABLES DE ENTORNO - MarketAI SEO Module
# Desarrollo Local
# ============================================

# ===== POSTGRESQL (Compartido por n8n y approval-ui) =====
PGHOST=localhost
PGPORT=5432
PGUSER=marketai_user
PGPASSWORD=marketai_secure_password
PGDATABASE=marketai_seo

# ===== n8n Configuration =====
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_WEBHOOK_BASE=http://localhost:5678/webhook
N8N_ENCRYPTION_KEY=UueCwgDK1lhz4kINqm2dMZtWjpibr803
N8N_TIMEOUT_MS=120000

# n8n Basic Auth (opcional, para proteger acceso local)
N8N_BASIC_AUTH_ACTIVE=false
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=

# Timezone
GENERIC_TIMEZONE=America/Lima
TZ=America/Lima

# ===== API Keys =====
# IMPORTANTE: Reemplaza con tus API keys reales
OPENAI_API_KEY=sk-tu-api-key-aqui
OPENAI_MODEL=gpt-4o

# Opcional: Si usas Gemini
GEMINI_API_KEY=

# ===== WordPress Integration =====
# IMPORTANTE: Completa con tus credenciales reales de WordPress
WP_BASE_URL=https://larabs.pe
WP_APP_USER=tu-usuario-wordpress
WP_APP_PASSWORD=tu-application-password

# ===== Approval UI Server =====
PORT=3000
APPROVAL_API_PORT=3001
```

## ⚠️ VARIABLES QUE DEBES COMPLETAR:

### 1. OpenAI API Key (OBLIGATORIO)
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```
Obtén tu API key en: https://platform.openai.com/api-keys

### 2. WordPress Credentials (OBLIGATORIO)
```bash
WP_BASE_URL=https://larabs.pe
WP_APP_USER=tu-usuario
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

Para crear un Application Password en WordPress:
1. Ve a: Usuarios → Perfil
2. Scroll hasta "Contraseñas de aplicaciones"
3. Crea una nueva con nombre "n8n"
4. Copia el password generado (incluye los espacios)

### 3. PostgreSQL Password (Ya configurado)
```bash
PGPASSWORD=marketai_secure_password
```
Este es el password del PostgreSQL que ya tienes corriendo en Docker.

## 🔐 N8N_ENCRYPTION_KEY

Ya está generada y configurada:
```bash
N8N_ENCRYPTION_KEY=UueCwgDK1lhz4kINqm2dMZtWjpibr803
```

⚠️ **IMPORTANTE:** NO cambies esta clave una vez que empieces a usar n8n con PostgreSQL, o perderás acceso a tus credenciales encriptadas.

## 📋 Checklist de Configuración

- [ ] Archivo `.env` creado en `seo-module/`
- [ ] `OPENAI_API_KEY` completado con tu API key real
- [ ] `WP_APP_USER` completado
- [ ] `WP_APP_PASSWORD` completado
- [ ] PostgreSQL corriendo (ya lo tienes)
- [ ] Variables de PostgreSQL correctas (ya configuradas)

## ✅ Verificar Configuración

Después de crear tu `.env`, verifica que todo esté bien con:

```powershell
cd seo-module
docker-compose config
```

Esto mostrará la configuración final con las variables del .env aplicadas.

