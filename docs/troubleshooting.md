# 🔧 Troubleshooting - Solución de Problemas

Guía completa para resolver problemas comunes del módulo SEO.

---

## 📋 Índice

- [Problemas con Docker](#problemas-con-docker)
- [Problemas con n8n](#problemas-con-n8n)
- [Problemas con PostgreSQL](#problemas-con-postgresql)
- [Problemas con Workflows](#problemas-con-workflows)
- [Errores Comunes](#errores-comunes)

---

## 🐳 Problemas con Docker

### Servicios no inician

**Síntoma:** `docker compose up -d` falla o servicios no arrancan.

**Solución 1:** Verifica que Docker Desktop esté corriendo
```powershell
docker ps
```

**Solución 2:** Revisa los logs
```powershell
cd seo-module/n8n
docker compose logs
```

**Solución 3:** Reinicia Docker Desktop
- Windows: Click derecho en el icono de Docker → Restart
- Luego: `docker compose up -d`

---

### Puerto 5432 ya en uso

**Síntoma:** `Error: port 5432 is already allocated`

**Causa:** Ya tienes PostgreSQL corriendo localmente.

**Solución:** Cambia el puerto en `docker-compose.yml`
```yaml
postgres:
  ports:
    - "5433:5432"  # Puerto externo cambiado
```

---

### Puerto 5678 ya en uso

**Síntoma:** `Error: port 5678 is already allocated`

**Causa:** Ya tienes n8n u otro servicio en ese puerto.

**Solución:** Cambia el puerto en `docker-compose.yml`
```yaml
n8n:
  ports:
    - "5679:5678"  # Puerto externo cambiado
```

---

## 🔄 Problemas con n8n

### No puedo acceder a http://localhost:5678

**Verificación 1:** ¿Está corriendo n8n?
```powershell
docker compose ps
```

Deberías ver:
```
n8n-n8n-1    n8nio/n8n:latest    Up
```

**Verificación 2:** Revisa los logs
```powershell
docker compose logs n8n
```

**Solución:** Reinicia el servicio
```powershell
docker compose restart n8n
```

---

### Workflows importados no aparecen

**Causa:** Los workflows se importan pero no se guardan automáticamente.

**Solución:**
1. Después de importar, haz clic en **"Save"** en cada workflow
2. Verifica que aparezcan en la lista de Workflows

---

### Credenciales no se guardan

**Causa:** Error de permisos o storage de n8n corrupto.

**Solución:**
```powershell
docker compose down
docker volume rm n8n_storage
docker compose up -d
```

⚠️ **Advertencia:** Esto elimina todas las credenciales y workflows guardados.

---

## 🗄️ Problemas con PostgreSQL

### No puedo conectarme a PostgreSQL

**Verificación:** ¿Está healthy?
```powershell
docker compose ps
```

Deberías ver `(healthy)` junto a postgres.

**Solución:** Espera 10-15 segundos para que PostgreSQL inicialice completamente.

---

### Tabla 'keywords' no existe

**Síntoma:** `ERROR: relation "keywords" does not exist`

**Causa:** Las migraciones no se ejecutaron.

**Solución:** Ejecuta las migraciones manualmente
```powershell
cd seo-module/n8n
docker compose exec postgres psql -U marketai_user -d marketai_seo -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

---

### Error de autenticación

**Síntoma:** `FATAL: password authentication failed`

**Causa:** Contraseña incorrecta en credenciales de n8n.

**Solución:**
1. Verifica el password en `docker-compose.yml`
2. Actualiza las credenciales en n8n:
   - Settings → Credentials → PostgreSQL MarketAI
   - Usa el password correcto: `marketai_secure_password` (o el configurado)

---

## 🔄 Problemas con Workflows

### Workflow devuelve 404

**Síntoma:** `Error 404 - Not Found` al llamar al webhook

**Causa:** El workflow NO está activo.

**Solución:**
1. Abre el workflow en n8n
2. Cambia el switch de **"Inactive"** a **"Active"** (verde)
3. Verifica que no haya errores (⚠️) en los nodos

---

### Workflow devuelve {"message":"Workflow was started"}

**Síntoma:** El webhook responde 200 pero solo devuelve mensaje genérico.

**Causa:** Estás usando la URL de TEST en lugar de PRODUCTION.

**URLs:**
- ❌ Test: `http://localhost:5678/webhook-test/...`
- ✅ Production: `http://localhost:5678/webhook/...`

**Solución:**
1. Usa la URL de PRODUCTION sin `-test`
2. El workflow DEBE estar **ACTIVO** (switch verde)
3. Verifica que el nodo Webhook tenga **Response Mode: "Last Node"**

---

### Workflow devuelve 500

**Síntoma:** `Error 500 - Internal Server Error`

**Causas comunes:**

**1. Credenciales no configuradas**
```
Solution: Settings → Credentials → Agrega PostgreSQL MarketAI
```

**2. Credenciales no asignadas al nodo**
```
Solution: Abre el nodo PostgreSQL → Selecciona la credencial → Save
```

**3. Error en el código JavaScript**
```
Solution: Abre el workflow → Revisa logs de ejecución
```

---

### Keywords no se guardan en PostgreSQL

**Verificación:** ¿El workflow se ejecuta?
```powershell
# Ejecuta el test
cd seo-module/scripts
.\test_ingesta.ps1
```

**Verificación 2:** ¿Las credenciales están correctas?
1. Abre el workflow
2. Click en nodo "Guardar en PostgreSQL"
3. Verifica que la credencial esté asignada

**Verificación 3:** Consulta PostgreSQL directamente
```powershell
docker compose exec postgres psql -U marketai_user -d marketai_seo -c "SELECT COUNT(*) FROM keywords;"
```

---

## ⚠️ Errores Comunes

### Error: "OpenAI API key not set"

**Síntoma:** Workflows 1-4 fallan con error de API key.

**Causa:** No has configurado la variable de entorno `OPENAI_API_KEY`.

**Solución:**
```powershell
# En el terminal
$env:OPENAI_API_KEY="sk-tu-api-key-aqui"
docker compose restart n8n
```

O en `docker-compose.yml`:
```yaml
n8n:
  environment:
    - OPENAI_API_KEY=sk-tu-api-key-aqui
```

---

### Error: "Cannot parse CSV"

**Síntoma:** Workflow 5 falla al procesar CSV.

**Causa:** Formato de CSV incorrecto.

**Solución:** Verifica que tu CSV tenga el formato correcto:
```csv
Keyword,Avg. monthly searches,Competition
keyword 1,1000,Low
keyword 2,500,Medium
```

**Requisitos:**
- Primera línea DEBE ser headers
- Mínimo 2 columnas: Keyword, Avg. monthly searches
- Sin líneas vacías al final

---

### Error: Duplicate key value

**Síntoma:** `ERROR: duplicate key value violates unique constraint`

**Causa:** Estás intentando insertar una keyword que ya existe.

**Esto es normal:** El workflow usa `ON CONFLICT DO UPDATE` que actualiza el registro existente. No es un error, simplemente actualiza los datos.

---

### Workflows lentos o timeout

**Causa:** OpenAI API está lenta o con alta carga.

**Solución:**
1. Aumenta el timeout en el workflow
2. Verifica tu cuota de OpenAI API
3. Considera usar un modelo más rápido (gpt-3.5-turbo en lugar de gpt-4)

---

## 🔍 Herramientas de Diagnóstico

### Script de Verificación Completa

```powershell
cd seo-module/scripts
.\test_workflows.ps1
```

Este script verifica:
- ✅ Docker está corriendo
- ✅ n8n responde
- ✅ PostgreSQL está healthy
- ✅ Los 6 workflows están activos
- ✅ Workflows responden correctamente

---

### Verificar Logs

**Logs de n8n:**
```powershell
docker compose logs n8n --tail=50 -f
```

**Logs de PostgreSQL:**
```powershell
docker compose logs postgres --tail=50 -f
```

**Logs de todos los servicios:**
```powershell
docker compose logs --tail=50 -f
```

---

### Reiniciar Todo (Fresh Start)

Si nada funciona, reinicia completamente:

```powershell
# 1. Detén todos los servicios
docker compose down

# 2. (Opcional) Elimina volúmenes (⚠️ PERDERAS DATOS)
docker volume rm n8n_postgres_data

# 3. Reinicia
docker compose up -d

# 4. Espera 30 segundos

# 5. Verifica
.\test_workflows.ps1
```

---

## 📞 Obtener Ayuda

Si el problema persiste:

1. **Revisa los logs** completos
2. **Ejecuta el script de diagnóstico:** `test_workflows.ps1`
3. **Comparte** el output del script y los logs relevantes

---

## 📚 Documentación Relacionada

- [Quickstart](quickstart.md) - Configuración inicial
- [Workflows](workflows/overview.md) - Documentación de workflows
- [Ingesta CSV](workflows/ingesta-csv.md) - Workflow 5
- [Ingesta Manual](workflows/ingesta-manual.md) - Workflow 6

---

**Última actualización:** 17 Octubre 2025

