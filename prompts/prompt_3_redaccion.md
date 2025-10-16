# Prompt para Redacción de Contenido

Este prompt genera contenido optimizado para SEO basado en palabras clave y estructura definida.

## Input Format
```
Keyword principal: [keyword]
Keywords secundarias: [lista de keywords]
Tono de voz: [formal/informal/técnico]
Extensión: [número de palabras]
```

## Output Format
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