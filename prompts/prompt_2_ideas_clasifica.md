# Prompt para Clasificación de Ideas

Este prompt ayuda a clasificar y organizar ideas para contenido SEO.

## Input Format
```
Keywords: [lista de keywords]
Tema principal: [tema]
Objetivo: [objetivo]
```

## Output Format
```json
{
  "categorias": [
    {
      "nombre": "string",
      "keywords": ["string"],
      "relevancia": "1-10",
      "ideas_contenido": ["string"]
    }
  ]
}
```