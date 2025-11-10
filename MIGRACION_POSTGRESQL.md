# 🔄 Migración Completada: SQLite → PostgreSQL

## ✅ CAMBIOS REALIZADOS

### 1. **docker-compose.yml actualizado**
- ✅ n8n ahora usa PostgreSQL en lugar de SQLite
- ✅ Variables configurables desde `.env`
- ✅ Configuración de WordPress mejorada

**Antes:**
```yaml
DB_TYPE=sqlite
DB_SQLITE_PATH=/home/node/.n8n/database.sqlite
```

**Ahora:**
```yaml
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=${PGDATABASE:-marketai_seo}
DB_POSTGRESDB_USER=${PGUSER:-marketai_user}
DB_POSTGRESDB_PASSWORD=${PGPASSWORD:-marketai_secure_password}
```

### 2. **Archivos creados**
- ✅ `ENV_CONFIGURATION.md` - Guía de configuración de variables
- ✅ `migrate-to-postgresql.ps1` - Script de migración automática
- ✅ `MIGRACION_POSTGRESQL.md` - Este documento

### 3. **Backups creados**
- ✅ `n8n/storage/database.sqlite.backup_[timestamp]` - Backup de SQLite
- ✅ `n8n/workflows_backup_[timestamp]/` - Backup de workflows

---

## 📋 CONFIGURACIÓN REQUERIDA

### **Paso 1: Crear archivo `.env`**

Crea el archivo `seo-module/.env` con este contenido (llena los valores vacíos):

```bash
# ===== POSTGRESQL =====
PGHOST=localhost
PGPORT=5432
PGUSER=marketai_user
PGPASSWORD=marketai_secure_password
PGDATABASE=marketai_seo

# ===== n8n =====
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_WEBHOOK_BASE=http://localhost:5678/webhook
N8N_ENCRYPTION_KEY=UueCwgDK1lhz4kINqm2dMZtWjpibr803
N8N_TIMEOUT_MS=120000
N8N_BASIC_AUTH_ACTIVE=false

# Timezone
GENERIC_TIMEZONE=America/Lima
TZ=America/Lima

# ===== API Keys =====
OPENAI_API_KEY=sk-tu-api-key-aqui           # ← LLENAR
OPENAI_MODEL=gpt-4o
GEMINI_API_KEY=                              # ← OPCIONAL

# ===== WordPress =====
WP_BASE_URL=https://larabs.pe
WP_APP_USER=tu-usuario-wordpress             # ← LLENAR
WP_APP_PASSWORD=tu-application-password      # ← LLENAR

# ===== Approval UI =====
PORT=3000
APPROVAL_API_PORT=3001
```

**Variables que DEBES llenar:**
1. `OPENAI_API_KEY` - Tu API key de OpenAI
2. `WP_APP_USER` - Usuario de WordPress
3. `WP_APP_PASSWORD` - Application Password de WordPress

Ver guía completa en: `ENV_CONFIGURATION.md`

---

## 🚀 MIGRACIÓN (2 Opciones)

### **Opción A: Script Automático (Recomendado)**

```powershell
cd seo-module
.\migrate-to-postgresql.ps1
```

El script:
1. ✅ Verifica configuración
2. ✅ Detiene n8n actual (SQLite)
3. ✅ Reinicia n8n con PostgreSQL
4. ✅ Verifica que todo funcione

### **Opción B: Manual**

```powershell
cd seo-module/n8n

# 1. Detener servicios
docker-compose down

# 2. Reiniciar con nueva configuración
docker-compose up -d

# 3. Ver logs
docker logs -f n8n-n8n-1
```

---

## 📥 POST-MIGRACIÓN: Importar Workflows

Después de la migración, deberás:

1. **Acceder a n8n:** http://localhost:5678
2. **Crear cuenta de usuario** (primera vez con PostgreSQL)
3. **Importar workflows:**
   - Click en "Workflows" → "Import from File"
   - Selecciona cada archivo .json de `n8n/workflows/`
   - Hay 15 workflows para importar

4. **Configurar credenciales:**
   - OpenAI API Key
   - WordPress (URL + Application Password)
   - Cualquier otra credencial necesaria

---

## 🔍 VERIFICACIÓN

### **1. Verificar que n8n usa PostgreSQL:**

```powershell
docker logs n8n-n8n-1 | Select-String "postgresdb"
```

Deberías ver: `Database type: postgresdb`

### **2. Verificar conexión a PostgreSQL:**

```powershell
docker exec n8n-postgres-1 psql -U marketai_user -d marketai_seo -c "\dt"
```

Deberías ver las tablas de n8n.

### **3. Verificar approval-ui:**

```powershell
cd seo-module/approval-ui
npm run dev
```

Accede a: http://localhost:3001

---

## 🎯 BENEFICIOS DE LA MIGRACIÓN

### **Desarrollo Local:**
- ✅ Base de datos unificada (PostgreSQL)
- ✅ Mejor rendimiento que SQLite
- ✅ Consistente con producción (Railway)

### **Railway (Producción):**
- ✅ Compatible 100% con Railway
- ✅ PostgreSQL es el estándar
- ✅ Fácil migración de datos si es necesario

---

## ⚠️ IMPORTANTE

### **N8N_ENCRYPTION_KEY**
```
UueCwgDK1lhz4kINqm2dMZtWjpibr803
```

**NO cambies esta clave** después de empezar a usar n8n con PostgreSQL. Si la cambias, perderás acceso a todas las credenciales encriptadas.

### **Backups disponibles:**
- SQLite anterior: `n8n/storage/database.sqlite.backup_*`
- Workflows: `n8n/workflows_backup_*`

Si algo sale mal, puedes revertir:
1. Cambiar `DB_TYPE=sqlite` en docker-compose.yml
2. Restaurar el backup de SQLite
3. Reiniciar servicios

---

## 📊 ESTRUCTURA FINAL

```
Desarrollo Local:
├── n8n → PostgreSQL (puerto 5432)
├── approval-ui → PostgreSQL (mismo, puerto 5432)
└── Ambos comparten la misma base de datos

Railway (Producción):
├── n8n → PostgreSQL (Railway-managed)
├── approval-ui → PostgreSQL (Railway-managed)
└── Misma arquitectura que local ✅
```

---

## 🆘 TROUBLESHOOTING

### **n8n no inicia:**
```powershell
docker logs n8n-n8n-1
```

### **Error de conexión a PostgreSQL:**
- Verifica que el servicio postgres esté corriendo: `docker ps`
- Verifica credenciales en `.env`

### **Workflows no aparecen:**
- Son datos nuevos en PostgreSQL
- Debes importarlos manualmente desde la UI de n8n

### **approval-ui no conecta:**
- Verifica variables `PG*` en `.env`
- Verifica que PostgreSQL esté corriendo

---

## ✅ SIGUIENTE PASO

**Ejecuta la migración cuando estés listo:**

```powershell
cd seo-module
.\migrate-to-postgresql.ps1
```

O sigue los pasos manuales si prefieres más control.

---

**Fecha:** 10 de Noviembre, 2025  
**Estado:** Configuración lista, migración pendiente  
**Reversible:** Sí (con backups disponibles)

