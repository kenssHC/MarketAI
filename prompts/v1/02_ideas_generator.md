# Prompt #2: Generador y Clasificador de Ideas de Contenido

**Versión:** 1.0  
**Fecha:** 17 Octubre 2025  
**Corresponde a:** Tarea 6 - Job "30 ideas y clasificación"

---

## 📝 Descripción

Este prompt genera 30 ideas únicas de contenido para blog basadas en clusters de keywords, y las clasifica según si requieren investigación actualizada o no.

---

## 🎯 Objetivo

Actúa como un estratega de contenidos y generador de ideas para blog. 

Recibirás un conjunto de keywords principales y secundarias seleccionadas previamente.  

---

## 📋 Tu objetivo es:

1. Analizar el conjunto total de keywords y encontrar temas en común o tendencias.  
2. Generar **30 ideas de contenido únicas** para blog, videos o guías, basadas en el conjunto total (no en cada keyword por separado).  
3. Cada idea debe ser breve (máx. 12 palabras) y clara en su enfoque.  
4. Clasificar cada idea en dos categorías:  
   - **Requiere investigación con IA (ej. Perplexity)** → temas que necesitan datos actualizados, estudios recientes o estadísticas.  
   - **No requiere investigación** → temas que pueden desarrollarse con conocimiento general, sin datos recientes.  
5. Entregar el resultado en formato JSON.

---

## 📥 Formato de Entrada

```json
{
  "keywords": [
    "café orgánico",
    "beneficios del café",
    "café de altura",
    "cultivo sostenible",
    "cafeterías modernas"
  ]
}
```

---

## 📤 Formato de Salida

```json
{
  "Ideas": [
    {
      "Idea": "título de la idea",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "título de la idea",
      "Categoria": "No requiere investigación"
    }
  ]
}
```

---

## 💡 Ejemplo Completo

### Entrada:
```json
{
  "keywords": [
    "café orgánico",
    "beneficios del café",
    "café de altura",
    "cultivo sostenible",
    "cafeterías modernas"
  ]
}
```

### Salida (resumen de 4 ideas de 30):
```json
{
  "Ideas": [
    {
      "Idea": "Estadísticas globales de consumo de café sostenible",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "Cómo diferenciar café orgánico del convencional",
      "Categoria": "No requiere investigación"
    },
    {
      "Idea": "Impacto del cambio climático en el café de altura",
      "Categoria": "Requiere investigación"
    },
    {
      "Idea": "Recetas creativas con café orgánico",
      "Categoria": "No requiere investigación"
    }
  ]
}
```

---

## ⚙️ Parámetros de Configuración

- **Model:** GPT-4 o GPT-4o
- **Temperature:** 0.8 (más creatividad)
- **Max Tokens:** 2500
- **Idioma:** Detectar automáticamente del input

---

## 🔗 Uso en n8n

Este prompt se utiliza después del clustering de keywords:

```
Clusters de Keywords → [Este Prompt] → 30 Ideas → Guardar en tabla ideas
```

---

## 📊 Métricas de Éxito

- ✅ Exactamente 30 ideas generadas
- ✅ Ideas únicas (no repetidas)
- ✅ Cada idea tiene máx. 12 palabras
- ✅ Mix balanceado: ~50% con investigación, ~50% sin investigación
- ✅ Ideas relevantes para el conjunto de keywords
- ✅ JSON válido y parseable

---

## 📝 Criterios de Clasificación

### **"Requiere investigación"**
- Estadísticas actuales
- Datos de mercado recientes
- Estudios científicos
- Tendencias del año en curso
- Comparativas con datos numéricos
- Análisis de impacto actual

### **"No requiere investigación"**
- Guías prácticas atemporales
- Recetas y tutoriales
- Conceptos educativos básicos
- Comparaciones cualitativas
- Consejos generales
- Listas de tips

---

## 🎨 Tips para Generar Ideas

- **Variedad:** Mezclar formatos (guías, listas, comparativas, casos de estudio)
- **Audiencia:** Considerar diferentes niveles (principiantes, intermedios, avanzados)
- **Actualidad:** Incluir temas trending cuando aplique
- **Accionabilidad:** Preferir títulos que prometan valor práctico
- **Especificidad:** Evitar títulos demasiado genéricos

---

## 📝 Notas

- Generar SIEMPRE 30 ideas (no más, no menos)
- Las ideas deben cubrir diferentes ángulos del tema
- Mantener balance entre contenido evergreen y trending
- Ideas breves pero descriptivas
- Evitar duplicados o ideas muy similares

