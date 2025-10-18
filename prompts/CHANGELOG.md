# Changelog - Prompts del Módulo SEO

Todos los cambios notables en los prompts del módulo SEO se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [v1.0.0] - 2025-10-17

### ✨ Añadido

#### Estructura Inicial
- Creada carpeta `v1/` para primera versión estable de prompts
- Implementado sistema de versionado semántico
- Añadido README.md con documentación completa
- Añadido este CHANGELOG.md

#### Prompts Nuevos

**Prompt #1: Clustering de Keywords**
- Archivo: `01_keywords_clustering.md`
- Función: Analiza y agrupa keywords por temáticas semánticas
- Entrada: Array de keywords (manual o Google Keyword Planner)
- Salida: JSON con clusters (keyword principal + secundarias)
- Casos de uso: Tarea 5 - Organización de keywords para generación de ideas
- Parámetros: GPT-4, temp 0.7, max tokens 2000

**Prompt #2: Generador de Ideas**
- Archivo: `02_ideas_generator.md`
- Función: Genera 30 ideas únicas de contenido
- Entrada: Clusters de keywords
- Salida: JSON con 30 ideas clasificadas (con/sin investigación)
- Casos de uso: Tarea 6 - Planificación de contenido
- Parámetros: GPT-4, temp 0.8, max tokens 2500

**Prompt #3: Redacción Simple**
- Archivo: `03_redaccion_simple.md`
- Función: Redacta artículos sin necesidad de investigación actualizada
- Entrada: Idea de contenido
- Salida: Artículo Markdown completo (600+ palabras) con metadatos SEO
- Casos de uso: Tarea 7 - Contenido evergreen
- Parámetros: GPT-4, temp 0.7, max tokens 3500

**Prompt #4: Redacción Investigada**
- Archivo: `04_redaccion_investigada.md`
- Función: Redacta artículos basados en datos de investigación
- Entrada: JSON con datos de Perplexity/Serper + fuentes
- Salida: Artículo Markdown con citas y fuentes (800+ palabras)
- Casos de uso: Tarea 9 - Contenido con autoridad y datos actualizados
- Parámetros: GPT-4, temp 0.6, max tokens 4000

**Prompt #5: Generador de Imágenes**
- Archivo: `05_imagen_generator.md`
- Función: Analiza artículos y crea prompts para generadores de imágenes IA
- Entrada: Texto completo del artículo
- Salida: Prompt optimizado en inglés para DALL-E/Leonardo/Midjourney
- Casos de uso: Tarea 10 - Imágenes destacadas para artículos
- Parámetros: GPT-4, temp 0.7, max tokens 200

### 📊 Métricas

- **Total de prompts:** 5
- **Tareas cubiertas:** 5-7, 9, 10
- **Costo estimado por artículo completo:** $0.15 - $0.20
- **Tiempo total de procesamiento:** ~30-45 segundos

### 📝 Documentación

- README.md con guía completa de uso
- Ejemplos de input/output para cada prompt
- Instrucciones de integración con n8n
- Guía de versionado y mantenimiento

### 🔗 Integraciones

- Workflows de n8n configurados
- Conexión con PostgreSQL para almacenamiento
- Pipeline completo: Keywords → Clustering → Ideas → Redacción → Imagen

---

## [Unreleased]

### 🔮 Próximas Mejoras

#### Para v1.1.0
- [ ] Optimización de tokens en Prompt #2 (reducir de 2500 a 2000)
- [ ] Añadir ejemplos multilenguaje (inglés, portugués)
- [ ] Mejoras en prompt de imágenes para estilos específicos

#### Para v2.0.0
- [ ] Prompt #6: Generador de copys para redes sociales
- [ ] Prompt #7: Optimización de títulos A/B testing
- [ ] Prompt #8: Análisis de competencia SEO
- [ ] Integración con GPT-5 (cuando esté disponible)
- [ ] Soporte para modelos locales (Llama, Mistral)

---

## Notas de Versionado

### **Versión Mayor (X.0.0)**
Cambios cuando:
- Se modifica significativamente la estructura del prompt
- Cambia el formato de entrada/salida (breaking changes)
- Se requiere un modelo diferente de IA
- Reorganización completa del pipeline

### **Versión Menor (1.X.0)**
Cambios cuando:
- Se añaden nuevos prompts
- Se mejora significativamente el rendimiento
- Se añaden nuevas funcionalidades sin romper compatibilidad
- Optimizaciones de tokens o costos

### **Versión Parche (1.0.X)**
Cambios cuando:
- Correcciones de errores o typos
- Mejoras menores en el wording
- Actualizaciones de ejemplos
- Ajustes de documentación

---

## Enlaces

- [Documentación de Prompts](README.md)
- [Workflows n8n](../n8n/workflows/)
- [Lista de Tareas Completa](../../Herramientas/Lista%20de%20tareas%20del%20modulo%20SEO.txt)

---

**Convenciones de este archivo:**
- ✨ Añadido = Nuevas características
- 🔧 Cambiado = Cambios en funcionalidad existente
- 🐛 Corregido = Bug fixes
- 🗑️ Eliminado = Características removidas
- 📚 Documentación = Cambios en docs
- ⚡ Rendimiento = Mejoras de performance
- 🔒 Seguridad = Vulnerabilidades corregidas

---

**Formato de fechas:** YYYY-MM-DD  
**Mantenido por:** Equipo de desarrollo MarketAI  
**Última actualización:** 2025-10-17

