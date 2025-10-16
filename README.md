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