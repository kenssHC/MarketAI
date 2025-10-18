# 📜 Scripts de Prueba y Verificación

Este directorio contiene **9 scripts organizados** para probar y verificar el módulo SEO de MarketAI.

---

## 🎯 Scripts de Verificación General (3)

### 1. `verificar_sistema.ps1`
**Propósito:** Verifica que toda la infraestructura esté funcionando

**Qué verifica:**
- ✅ Docker Desktop instalado y corriendo
- ✅ Contenedores n8n y PostgreSQL activos
- ✅ n8n UI accesible en `http://localhost:5678`
- ✅ PostgreSQL acepta conexiones
- ✅ Tabla `keywords` existe

**Uso:**
```powershell
cd seo-module\scripts
.\verificar_sistema.ps1
```

---

### 2. `verificar_sprint.ps1`
**Propósito:** Verificación completa para Daily Sprint

**Qué verifica:**
- 📁 Estructura del proyecto completa
- 🔧 Workflows exportados (6 en total)
- 🐳 Docker Compose configurado
- 🗄️ PostgreSQL con esquema completo
- 📚 Documentación disponible

**Uso:**
```powershell
.\verificar_sprint.ps1
```

---

### 3. `test_workflows.ps1`
**Propósito:** Prueba todos los 6 workflows a la vez

**Qué hace:**
- 🔄 Ejecuta un test rápido en cada workflow
- ⏱️ Timeout de 10 segundos por workflow
- 📊 Muestra resumen final con estado de cada uno
- 🧹 Limpia datos de test automáticamente

**Uso:**
```powershell
.\test_workflows.ps1
```

**Resultado esperado:**
```
[1/6] Workflow 1 - Keywords Analysis...
  [OK] Activo - Status: 200

[2/6] Workflow 2 - Ideas Generator...
  [OK] Activo - Status: 200

...

[OK] TODOS LOS WORKFLOWS ACTIVOS ✅
```

---

## 🔬 Scripts de Prueba Individual (6)

Cada workflow tiene su propio script de prueba detallado.

### 4. `test_workflow1.ps1` - Keywords Analysis
**Workflow:** SEO - 01 Generación de Keywords  
**Endpoint:** `/webhook-test/seo/keywords`  
**Requiere:** OpenAI API Key

**Prueba:**
```powershell
.\test_workflow1.ps1
```

**Datos de prueba:**
- Tema: "marketing digital"
- Nicho: "tecnologia"
- Intención: "informacional"

---

### 5. `test_workflow2.ps1` - Ideas Generator
**Workflow:** SEO - 02 Clasificación de Ideas  
**Endpoint:** `/webhook-test/seo/ideas`  
**Requiere:** OpenAI API Key

**Prueba:**
```powershell
.\test_workflow2.ps1
```

**Datos de prueba:**
- Keywords: ["seo", "marketing digital", "contenido"]
- Tema: "marketing digital"
- Objetivo: "generar trafico organico"

---

### 6. `test_workflow3.ps1` - Redacción de Contenido
**Workflow:** SEO - 03 Redacción de Contenido  
**Endpoint:** `/webhook-test/seo/redaccion`  
**Requiere:** OpenAI API Key

**Prueba:**
```powershell
.\test_workflow3.ps1
```

**Datos de prueba:**
- Keyword principal: "marketing digital"
- Keywords secundarias: ["seo", "contenido", "estrategias"]
- Tono: "profesional"
- Extensión: 500 palabras

---

### 7. `test_workflow4.ps1` - Formateo a HTML
**Workflow:** SEO - 04 Formateo a HTML  
**Endpoint:** `/webhook-test/seo/formatear`  
**Requiere:** Nada (no usa OpenAI)

**Prueba:**
```powershell
.\test_workflow4.ps1
```

**Datos de prueba:**
- Título: "Guía de Marketing Digital"
- 2 secciones con contenido

---

### 8. `test_workflow5.ps1` - Ingesta CSV
**Workflow:** SEO - 05 Ingesta Keywords CSV  
**Endpoint:** `/webhook-test/seo/ingesta/csv`  
**Requiere:** PostgreSQL

**Prueba:**
```powershell
.\test_workflow5.ps1
```

**Qué hace:**
- Importa keywords desde CSV de Google Keyword Planner
- 3 tests diferentes (simple, completo, con líneas vacías)
- Total: 11 keywords de prueba
- Verifica en PostgreSQL automáticamente

**Datos de prueba:**
```csv
Keyword,Avg. monthly searches,Competition
cafe organico,5400,Medium
cafe de hongo,1200,Low
beneficios del cafe,9900,High
```

---

### 9. `test_workflow6.ps1` - Ingesta Manual
**Workflow:** SEO - 06 Ingesta Keywords Manual  
**Endpoint:** `/webhook-test/seo/ingesta/manual`  
**Requiere:** PostgreSQL

**Prueba:**
```powershell
.\test_workflow6.ps1
```

**Qué hace:**
- Importa keywords manualmente (sin CSV)
- 5 keywords de prueba
- Verifica en PostgreSQL

**Datos de prueba:**
- Cluster: "Marketing para Emprendedores"
- Keywords: ["marketing digital para emprendedores", ...]

---

## 📊 Flujo de Trabajo Recomendado

### 1️⃣ Primera vez (Verificación completa)
```powershell
# 1. Verificar que todo esté instalado
.\verificar_sistema.ps1

# 2. Verificar estructura del proyecto
.\verificar_sprint.ps1

# 3. Probar todos los workflows
.\test_workflows.ps1
```

### 2️⃣ Desarrollo diario
```powershell
# Probar workflow específico que estás editando
.\test_workflow5.ps1

# O probar todos rápidamente
.\test_workflows.ps1
```

### 3️⃣ Antes de commit
```powershell
# Verificación completa
.\verificar_sistema.ps1
.\test_workflows.ps1
```

---

## ⚠️ Notas Importantes

### Workflows con OpenAI (1, 2, 3)
- Requieren `OPENAI_API_KEY` configurada en el archivo `.env`
- Un error de **timeout** o **API key** significa que el workflow **SÍ está activo**
- Solo un error **404** significa que el workflow está **inactivo**

### Workflows sin OpenAI (4, 5, 6)
- No requieren configuración adicional
- Deberían funcionar inmediatamente después de activarlos

### Endpoints de Producción vs Test
- **Test:** `/webhook-test/...` (para pruebas)
- **Producción:** `/webhook/...` (para uso real)

---

## 🔍 Troubleshooting

### Problema: "The requested webhook is not registered"
**Solución:** El workflow no está activo
1. Abre http://localhost:5678
2. Busca el workflow
3. Activa el toggle (debe estar en verde)

### Problema: "Timeout"
**Solución:** Normal en workflows con OpenAI
- Aumenta el timeout en el script si es necesario
- Verifica que la API key esté configurada

### Problema: "Docker not running"
**Solución:**
```powershell
cd ..\n8n
docker compose up -d
```

### Problema: "PostgreSQL connection refused"
**Solución:**
```powershell
cd ..\n8n
docker compose restart postgres
```

---

## 📁 Estructura Final

```
scripts/
├── README.md (este archivo)
│
├── Verificación (3)
│   ├── verificar_sistema.ps1
│   ├── verificar_sprint.ps1
│   └── test_workflows.ps1
│
└── Tests Individuales (6)
    ├── test_workflow1.ps1 (Keywords)
    ├── test_workflow2.ps1 (Ideas)
    ├── test_workflow3.ps1 (Redacción)
    ├── test_workflow4.ps1 (Formateo)
    ├── test_workflow5.ps1 (Ingesta CSV)
    └── test_workflow6.ps1 (Ingesta Manual)
```

**Total: 9 scripts organizados**

---

## 🚀 Quick Start

Para probar todo rápidamente:
```powershell
cd D:\Trabajo\Larabs - Novaly AI\MarketAi\seo-module\scripts
.\test_workflows.ps1
```

¡Listo! 🎉

