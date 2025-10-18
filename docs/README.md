# 📚 Documentación - Módulo SEO MarketAI

Bienvenido a la documentación completa del sistema de generación automática de contenido SEO.

---

## 📖 Índice de Documentación

### 🚀 Inicio Rápido
- **[Guía Rápida (5 minutos)](quickstart.md)** - Configuración inicial paso a paso

### 🔄 Workflows
- **[Resumen de Workflows](workflows/overview.md)** - Descripción de los 6 workflows
- **[Ingesta CSV (Workflow 5)](workflows/ingesta-csv.md)** - Importar keywords desde Google Keyword Planner
- **[Ingesta Manual (Workflow 6)](workflows/ingesta-manual.md)** - Ingreso manual de keywords

### 🗄️ Base de Datos
- **[Esquema de Base de Datos](database/schema.md)** - Tablas, relaciones y migraciones

### 🔧 Solución de Problemas
- **[Troubleshooting](troubleshooting.md)** - Errores comunes y soluciones

---

## 🎯 Flujo de Trabajo Completo

```
1. Ingesta de Keywords (WF 5-6)
   ↓
2. Clustering con IA (WF 1)
   ↓
3. Generación de Ideas (WF 2)
   ↓
4. Redacción de Contenido (WF 3)
   ↓
5. Formateo HTML (WF 4)
   ↓
6. Publicación WordPress
```

---

## 📂 Estructura del Proyecto

```
seo-module/
├── docs/              ← Documentación (estás aquí)
├── scripts/           ← Scripts de prueba
├── n8n/               ← Workflows y configuración
├── prompts/           ← Prompts versionados para IA
└── README.md          ← Punto de entrada principal
```

---

## 🔗 Enlaces Externos

- **n8n UI:** http://localhost:5678
- **PostgreSQL:** localhost:5432
- **Base de datos:** `marketai_seo`

---

## 📞 Soporte

Si tienes problemas:
1. Consulta [Troubleshooting](troubleshooting.md)
2. Ejecuta el script de verificación: `scripts/test_workflows.ps1`
3. Revisa los logs: `docker compose logs n8n`

---

**Última actualización:** 17 Octubre 2025

