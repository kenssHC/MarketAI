# Prompt #1: Clustering y Análisis de Keywords

**Versión:** 1.0  
**Fecha:** 17 Octubre 2025  
**Corresponde a:** Tarea 5 - Job "cluster de keywords"

---

## 📝 Descripción

Este prompt está diseñado para analizar y agrupar keywords provenientes de Google Keyword Planner o ingreso manual, organizándolas por temáticas semánticas.

---

## 🎯 Objetivo

Actúa como un especialista en SEO, GEO y estrategia de contenidos. 

Recibirás un listado de keywords provenientes de dos fuentes:  
1. Resultados de un estudio en Google Keyword Planner (con volumen y competencia opcional).  
2. Keywords sugeridas manualmente por el usuario.  

---

## 📋 Tu objetivo es:

1. Analizar todas las keywords y eliminar las irrelevantes, duplicadas o con muy poca intención de búsqueda.  
2. Detectar las que tienen mayor potencial para crear contenido que atraiga tráfico orgánico y cumpla objetivos de marketing.  
3. Agruparlas por **temáticas** basadas en similitud semántica.  
4. Dentro de cada grupo, seleccionar:  
   - **Keyword principal**: la más representativa y con mejor potencial.  
   - **Keywords secundarias**: complementos y variaciones para enriquecer el contenido.  
5. Mantener el idioma original de las keywords.  
6. Entregar el resultado en formato JSON.

---

## 📥 Formato de Entrada

```json
{
  "keywords": [
    "café orgánico",
    "café saludable",
    "mejores granos de café",
    "cultura cafetera",
    "recetas con café",
    "café sin pesticidas",
    "cafeterías modernas"
  ]
}
```

---

## 📤 Formato de Salida

```json
{
  "Tema_1": {
    "Keyword_Principal": "palabra clave principal",
    "Keywords_Secundarias": ["keyword1", "keyword2", "keyword3"]
  },
  "Tema_2": {
    "Keyword_Principal": "palabra clave principal",
    "Keywords_Secundarias": ["keyword4", "keyword5"]
  }
}
```

---

## 💡 Ejemplo Completo

### Entrada:
```json
{
  "keywords": [
    "café orgánico",
    "café saludable",
    "mejores granos de café",
    "cultura cafetera",
    "recetas con café",
    "café sin pesticidas",
    "cafeterías modernas"
  ]
}
```

### Salida:
```json
{
  "Tema_1": {
    "Keyword_Principal": "café orgánico",
    "Keywords_Secundarias": ["café saludable", "café sin pesticidas", "mejores granos de café"]
  },
  "Tema_2": {
    "Keyword_Principal": "cultura cafetera",
    "Keywords_Secundarias": ["recetas con café", "cafeterías modernas"]
  }
}
```

---

## ⚙️ Parámetros de Configuración

- **Model:** GPT-4 o GPT-4o
- **Temperature:** 0.7
- **Max Tokens:** 2000
- **Idioma:** Detectar automáticamente del input

---

## 🔗 Uso en n8n

Este prompt se utiliza en el workflow después de la ingesta de keywords:

```
Ingesta Keywords → Guardar en DB → [Este Prompt] → Clusters guardados
```

---

## 📊 Métricas de Éxito

- ✅ Keywords agrupadas por temáticas coherentes
- ✅ Cada cluster tiene 1 keyword principal + 2-5 secundarias
- ✅ No hay keywords duplicadas entre clusters
- ✅ Keywords irrelevantes o spam eliminadas
- ✅ JSON válido y parseables

---

## 📝 Notas

- Mantener el idioma original de las keywords (español, inglés, etc.)
- Priorizar keywords con mayor volumen de búsqueda para principal
- Si hay keywords ambiguas, agrupar por contexto más probable
- Eliminar keywords con menos de 3 caracteres o sin sentido

