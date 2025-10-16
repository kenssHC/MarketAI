# Prompt para Generación de Keywords

Este prompt está diseñado para generar y analizar palabras clave relevantes para contenido SEO.

## Input Format
```
Tema principal: [tema]
Nicho de mercado: [nicho]
Intención de búsqueda: [informacional/transaccional/navegacional]
```

## Output Format
```json
{
  "keywords": [
    {
      "keyword": "string",
      "searchVolume": "estimated",
      "difficulty": "1-100",
      "intent": "string"
    }
  ]
}
```