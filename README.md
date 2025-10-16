# SEO Module

Este módulo integra n8n para automatizaciones SEO utilizando prompts específicos.

## Estructura del Proyecto

```
seo-module/
  README.md
  .gitignore
  .env.example
  prompts/
    prompt_1_keywords.md
    prompt_2_ideas_clasifica.md
    prompt_3_redaccion.md
    prompt_4_json_a_articulo.md
  n8n/
    docker-compose.yml
    storage/         (se crea automáticamente al ejecutar)
    workflows/       (para exportar/importar)
```

## Configuración

1. Copia `.env.example` a `.env` y configura las variables de entorno
2. Inicia n8n usando docker-compose
3. Importa los workflows necesarios

# Módulo SEO & n8n (Starter)

## Archivos
- `.env.example`: variables de entorno **sin** secretos.
- `docker-compose.yml`: levanta n8n en `http://localhost:5678` (ajusta puerto si es necesario).
- `prompts/*.md`: pega aquí tus prompts reales.
- `workflows/seo_01_keywords_workflow.json`: flujo n8n exportable (Webhook → OpenAI → JSON).

## Uso
1. Copia `.env.example` a `.env` y completa tus valores reales (no subas `.env` a git).
2. `docker compose up -d` dentro de esta carpeta.
3. Importa el flujo `workflows/seo_01_keywords_workflow.json` en n8n.
4. Activa el flujo y envía un POST al Production URL del Webhook:
```bash
curl -X POST "http://localhost:5678/webhook/seo/keywords"   -H "Content-Type: application/json"   -d '{ "keywords": ["café orgánico","beneficios del café","cafeterías modernas"] }'
```
Recibirás el JSON agrupado.