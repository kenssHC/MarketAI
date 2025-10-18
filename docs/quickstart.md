# 🚀 Guía Rápida - Inicio en 5 Minutos

Configura el módulo SEO en menos de 5 minutos.

---

## ✅ Prerrequisitos

- Docker Desktop instalado
- PowerShell (Windows) o Bash (Linux/Mac)
- 4GB RAM disponible

---

## 📋 Paso 1: Iniciar Servicios (1 min)

```powershell
cd seo-module/n8n
docker compose up -d
```

**Verifica que estén corriendo:**
```powershell
docker compose ps
```

Deberías ver:
- ✅ `n8n` - Up
- ✅ `postgres` - Up (healthy)

---

## 📋 Paso 2: Acceder a n8n (1 min)

1. Abre tu navegador: **http://localhost:5678**
2. Primera vez: Crea tu cuenta de administrador
3. Ingresa tus credenciales

---

## 📋 Paso 3: Importar Workflows (2 min)

**Importa los 6 workflows:**

1. En n8n, haz clic en **"Workflows"** (menú lateral)
2. Click en **"+"** → **"Import from file"**
3. Selecciona e importa uno por uno:
   - `seo_01_keywords_workflow.json`
   - `seo_02_ideas_workflow.json`
   - `seo_03_redaccion_workflow.json`
   - `seo_04_formateo_workflow.json`
   - `seo_05_ingesta_keywords.json`
   - `seo_06_ingesta_manual.json`

---

## 📋 Paso 4: Configurar Credenciales PostgreSQL (1 min)

**Solo necesitas hacerlo UNA vez:**

1. Ve a **Settings** (⚙️) → **Credentials**
2. Click en **"Add Credential"**
3. Busca y selecciona **"Postgres"**
4. Completa:

```
Name:       PostgreSQL MarketAI
Host:       postgres
Port:       5432
Database:   marketai_seo
User:       marketai_user
Password:   marketai_secure_password
SSL:        Disabled
```

5. Click **"Save"**

---

## 📋 Paso 5: Asignar Credenciales (1 min)

**Para Workflows 5 y 6:**

1. Abre **Workflow 5** (Ingesta CSV)
2. Click en el nodo **"Guardar en PostgreSQL"**
3. En "Credential to connect with", selecciona **"PostgreSQL MarketAI"**
4. Click **"Save"** en el nodo
5. **Guarda el workflow**

6. Repite para **Workflow 6** (Ingesta Manual)

---

## 📋 Paso 6: Activar Workflows (1 min)

**Activa TODOS los workflows:**

Para cada uno de los 6 workflows:
1. Abre el workflow
2. Cambia el switch **"Inactive"** a **"Active"** (verde)
3. Verifica que no haya errores (⚠️)

---

## 📋 Paso 7: Verificar (1 min)

```powershell
cd ../scripts
.\test_workflows.ps1
```

**Deberías ver:**
```
[OK] TODOS LOS WORKFLOWS ACTIVOS

Endpoints disponibles:
  1. POST /webhook/seo/keywords
  2. POST /webhook/seo/ideas
  3. POST /webhook/seo/redaccion
  4. POST /webhook/seo/formatear
  5. POST /webhook/seo/ingesta/csv
  6. POST /webhook/seo/ingesta/manual
```

---

## ✅ ¡Listo!

Tu sistema está configurado y funcionando. 

### 🎯 Próximos Pasos:

1. **Importa tus primeras keywords:**
   ```powershell
   .\test_ingesta.ps1
   ```

2. **Lee la documentación completa:**
   - [Workflows](workflows/overview.md)
   - [Troubleshooting](troubleshooting.md)

---

## 🆘 ¿Algo salió mal?

Si encuentras errores:

1. **Verifica servicios:**
   ```powershell
   cd ../n8n
   docker compose ps
   docker compose logs n8n
   ```

2. **Consulta:** [Troubleshooting](troubleshooting.md)

3. **Reinicia servicios:**
   ```powershell
   docker compose restart
   ```

---

**Última actualización:** 17 Octubre 2025

