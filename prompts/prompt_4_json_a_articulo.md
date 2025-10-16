# Prompt para Conversión de JSON a Artículo

Este prompt convierte la estructura JSON en un artículo formateado en HTML/Markdown.

## Input Format
```json
{
  "titulo": "string",
  "meta_descripcion": "string",
  "secciones": [
    {
      "subtitulo": "string",
      "contenido": "string",
      "keywords_utilizadas": ["string"]
    }
  ]
}
```

## Output Format
```markdown
# [Título]

[Meta descripción]

## [Subtítulo 1]
[Contenido 1]

## [Subtítulo 2]
[Contenido 2]

...
```