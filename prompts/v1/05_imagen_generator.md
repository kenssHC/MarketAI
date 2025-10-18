# Prompt #5: Generador de Prompts Visuales para Imágenes IA

**Versión:** 1.0  
**Fecha:** 17 Octubre 2025  
**Corresponde a:** Tarea 10 - Job "generación de imágenes"

---

## 📝 Descripción

Este prompt analiza un artículo completo y genera un prompt optimizado en inglés para crear imágenes con IA (Midjourney, DALL-E, Leonardo AI).

---

## 🎯 Objetivo

You are a visual prompt creator for an AI image generator. 

You will receive the full text of a blog article.

---

## 📋 Your task is:

1. Analyze the article and detect the most important visual elements:  
   - Characters (appearance, clothing, position)  
   - Setting (geography, time period, location details)  
   - Objects of interest  
   - Predominant colors  
   - Atmosphere or emotions  
   - Artistic style if implied  

2. Create ONE short, descriptive prompt in English (max 4 sentences) optimized for image generation AI such as Midjourney, DALL·E, or Stable Diffusion.  

3. The prompt must:  
   - Avoid generic terms like "image of" or "photo of"  
   - Use specific, sensory adjectives  
   - Include the artistic style (realistic, watercolor, cyberpunk, minimalistic, etc.) if relevant  
   - Focus on a single scene  
   - Exclude text or typography  

4. Return ONLY the final prompt with no explanations.  

---

## 📥 Formato de Entrada

```json
{
  "article_text": "Durante el otoño, la primera nevada cubrió la aldea...",
  "main_keywords": ["otoño", "nevada", "aldea de montaña"]
}
```

---

## 📤 Formato de Salida

```
Snow gently covering a small mountain village, golden autumn leaves on the ground, smoke rising from chimneys, cozy warm lights glowing through windows, realistic style.
```

---

## 💡 Ejemplo Completo

### Entrada:
```json
{
  "article_text": "El café orgánico se cultiva en las montañas de América Latina, donde los agricultores utilizan métodos tradicionales sin pesticidas. Las plantas crecen bajo la sombra de árboles nativos, creando un ecosistema sostenible. Los granos son cosechados a mano por familias que han perfeccionado el arte del café durante generaciones.",
  "main_keywords": ["café orgánico", "montañas", "cultivo sostenible"]
}
```

### Salida:
```
Lush green coffee plants growing in terraced mountain slopes, farmers carefully handpicking red coffee cherries at sunrise, tropical forest canopy providing natural shade, misty mountains in background, warm golden hour lighting, photorealistic style with earthy tones.
```

---

## ⚙️ Parámetros de Configuración

**Para GPT (generación del prompt):**
- **Model:** GPT-4 o GPT-4o
- **Temperature:** 0.7
- **Max Tokens:** 200
- **Language:** English (output)

**Para generador de imágenes:**
- **DALL-E 3:** 1024x1024, quality: standard
- **Leonardo AI:** PhotoReal v2, aspect 16:9
- **Midjourney:** --ar 16:9 --style raw

---

## 🔗 Flujo Completo

Este es un proceso de 2 pasos (IA → IA):

```
Artículo completo → [Este Prompt en GPT] → Visual Prompt → Leonardo/DALL-E → Imagen
```

---

## 📊 Elementos de un Buen Prompt Visual

### **Debe incluir:**
✅ **Sujeto principal** (qué se ve)  
✅ **Entorno/Setting** (dónde ocurre)  
✅ **Iluminación** (hora del día, tipo de luz)  
✅ **Estilo artístico** (realista, ilustración, etc.)  
✅ **Atmósfera/Mood** (emoción que transmite)  
✅ **Colores predominantes** (si son relevantes)

### **Debe evitar:**
❌ Términos genéricos ("image of", "picture showing")  
❌ Múltiples escenas no relacionadas  
❌ Texto o tipografía en la imagen  
❌ Elementos abstractos difíciles de visualizar  
❌ Prompts demasiado largos (>4 oraciones)

---

## 🎨 Ejemplos de Buenos Prompts

### **Artículo sobre Marketing Digital:**
```
Modern entrepreneur working on laptop at minimalist home office, warm afternoon sunlight streaming through large window, indoor plants and coffee mug on desk, soft bokeh background, professional photography style, cool blue and white tones.
```

### **Artículo sobre Café Orgánico:**
```
Close-up of hands cupping freshly roasted organic coffee beans, rustic wooden table surface, steam rising from nearby ceramic mug, soft natural lighting, shallow depth of field, warm brown and cream colors, artisan food photography style.
```

### **Artículo sobre Cambio Climático:**
```
Split view showing healthy coffee plantation on left and drought-affected crops on right, aerial perspective of mountainous terrain, dramatic cloud formation above, contrasting vibrant greens with dried browns, documentary photography style.
```

---

## 📝 Consejos para Prompts Efectivos

### **Estructura recomendada:**
1. **Sujeto principal** (qué/quién)
2. **Acción o estado** (qué está pasando)
3. **Entorno** (dónde)
4. **Detalles visuales** (iluminación, colores)
5. **Estilo** (fotográfico, ilustración, etc.)

### **Adjetivos útiles:**
- **Iluminación:** golden hour, dramatic, soft, backlit, cinematic
- **Atmosfera:** cozy, vibrant, serene, dynamic, moody
- **Calidad:** detailed, high-resolution, crisp, professional
- **Estilo:** photorealistic, illustrated, minimalistic, vintage

---

## 🔄 Integración con APIs

### **DALL-E 3 (OpenAI):**
```python
import openai

# Paso 1: Generar prompt visual
visual_prompt = generate_visual_prompt(article_text)

# Paso 2: Generar imagen
response = openai.Image.create(
    prompt=visual_prompt,
    n=1,
    size="1024x1024",
    quality="hd"
)

image_url = response['data'][0]['url']
```

### **Leonardo AI:**
```python
import requests

# Usando el prompt generado
headers = {"Authorization": f"Bearer {LEONARDO_API_KEY}"}
data = {
    "prompt": visual_prompt,
    "modelId": "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",  # PhotoReal v2
    "width": 1024,
    "height": 768
}

response = requests.post(
    "https://cloud.leonardo.ai/api/rest/v1/generations",
    headers=headers,
    json=data
)
```

---

## ⚠️ Limitaciones y Consideraciones

### **Evitar en prompts:**
- Rostros de personas específicas (usar descripciones genéricas)
- Marcas comerciales o logos
- Contenido sensible o inapropiado
- Demasiados detalles contradictorios

### **Mejores prácticas:**
- Probar el prompt generado y ajustar si es necesario
- Guardar el prompt junto con la imagen para referencia
- Incluir `alt_text` descriptivo para SEO
- Almacenar en S3/GCS con nombres descriptivos

---

## 📸 Metadatos de la Imagen

Junto con la imagen, guardar:

```json
{
  "image_url": "https://s3.../image.png",
  "visual_prompt": "el prompt usado",
  "alt_text": "descripción SEO-friendly",
  "generator": "dall-e-3",
  "article_id": "uuid-del-artículo",
  "created_at": "2025-10-17T15:30:00Z"
}
```

---

## 🎯 Ejemplo de Flujo Completo

### **Input (Artículo):**
```
"El impacto del cambio climático en el café de altura es cada vez más evidente. 
Las temperaturas en aumento están obligando a los agricultores a trasladar sus 
cultivos a altitudes más elevadas..."
```

### **Paso 1 - Prompt generado:**
```
Terraced coffee plantation on steep mountainside, farmers tending to plants at 
higher elevation, misty morning atmosphere with sun breaking through clouds, 
lush greenery contrasting with rocky terrain, documentary style photography, 
earthy greens and browns.
```

### **Paso 2 - Imagen generada:**
`[Imagen de plantación de café en montaña]`

### **Paso 3 - Guardar en DB:**
```sql
UPDATE drafts 
SET featured_image_url = 'https://s3.../coffee-mountains.png',
    featured_image_alt = 'Plantación de café en montañas de altura',
    featured_image_prompt = 'Terraced coffee plantation...'
WHERE id = 'article-uuid';
```

---

## 📚 Referencias de Estilos

- **Photorealistic:** professional photography, DSLR, high detail
- **Illustrated:** digital illustration, vector art, flat design
- **Artistic:** watercolor, oil painting, sketch, artistic rendering
- **Cinematic:** movie still, dramatic lighting, wide angle
- **Minimalist:** clean, simple, white background, minimal
- **Vintage:** retro, nostalgic, film grain, muted colors

---

## ✅ Checklist de Calidad

Antes de enviar el prompt al generador de imágenes:

- [ ] Prompt en inglés
- [ ] Máximo 4 oraciones
- [ ] Incluye sujeto principal
- [ ] Especifica entorno
- [ ] Define estilo visual
- [ ] Menciona iluminación
- [ ] Sin texto o tipografía
- [ ] Enfocado en una escena
- [ ] Adjetivos específicos y sensoriales

