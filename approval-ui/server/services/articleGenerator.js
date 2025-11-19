import config from '../config.js';

function extractTextFromResponse(data) {
  if (!data) return '';
  if (Array.isArray(data.output_text) && data.output_text.length) {
    return data.output_text.join('\n');
  }
  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((entry) => entry?.content || [])
      .map((part) => (part?.text || '').trim())
      .filter(Boolean)
      .join('\n');
  }
  if (typeof data.response === 'string') {
    return data.response;
  }
  return '';
}

function stripCodeFences(text) {
  if (!text) return '';
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```[\w-]*\s*\n([\s\S]*?)\n```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed.replace(/^```+\s*/, '').replace(/```+\s*$/, '').trim();
}

function clampText(value, limit) {
  if (!value) return '';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trim()}…`;
}

function parseFrontMatter(markdown) {
  const fm = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) {
    return { meta: {}, content: markdown };
  }
  const frontMatterRaw = fm[1].trim();
  const content = fm[2] ?? '';
  const meta = {};

  const lines = frontMatterRaw.split('\n');
  let currentKey = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const kvMatch = line.match(/^([A-Za-z0-9 _-]+)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1].toLowerCase().trim();
      meta[currentKey] = kvMatch[2] || '';
      continue;
    }

    const listMatch = line.match(/^-+\s+(.*)$/);
    if (listMatch && currentKey) {
      const previous = meta[currentKey] || '';
      meta[currentKey] = previous ? `${previous}\n${listMatch[1]}` : listMatch[1];
      continue;
    }

    if (currentKey) {
      meta[currentKey] = meta[currentKey] ? `${meta[currentKey]}\n${line}` : line;
    }
  }

  return { meta, content };
}

function mapMetadata(meta, fallbackTitle) {
  const lookup = (key) => meta[key] || meta[key?.replace(/\s+/g, '')] || '';

  let metaTitle = lookup('meta title') || lookup('title') || '';
  let metaDescription = lookup('meta description') || lookup('description') || '';
  let tagsRaw = lookup('tags');

  const tags = tagsRaw
    ? tagsRaw
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(/,|\n/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  let title = lookup('title') || fallbackTitle || 'Artículo';

  return { metaTitle, metaDescription, tags, title };
}

function calculateWordCount(content) {
  if (!content) return 0;
  const text = content
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`#>]/g, '')
    .replace(/^[->]\s+/gm, '')
    .trim();

  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export async function generateArticleFromPrompt({ prompt }) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Debes enviar un prompt para regenerar el articulo.');
  }
  if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en el backend.');
  }

  const response = await fetch(`${config.openai.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`
    },
    body: JSON.stringify({
      model: config.openai.model,
      input: prompt,
      max_output_tokens: config.openai.maxOutputTokens
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const rawText = stripCodeFences(extractTextFromResponse(data));
  if (!rawText) {
    throw new Error('El proveedor no devolvio contenido.');
  }

  const { meta, content } = parseFrontMatter(rawText);
  const mapped = mapMetadata(meta, 'Artículo');
  const metaTitle = clampText(mapped.metaTitle || mapped.title, 60);
  let metaDescription = mapped.metaDescription;

  if (!metaDescription) {
    const fallback = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^#+\s+.*$/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~`#>]/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim()
      .split('\n')
      .find((line) => line.trim());
    metaDescription = clampText(fallback || 'Articulo generado automaticamente.', 155);
  }

  const contentMarkdown = content.trim() || rawText.trim();
  const wordCount = calculateWordCount(contentMarkdown);

  return {
    rawMarkdown: rawText,
    contentMarkdown,
    title: mapped.title || metaTitle,
    metaTitle,
    metaDescription,
    tags: mapped.tags,
    wordCount,
    llmTokensUsed: data?.usage?.total_tokens || data?.usage?.totalTokens || null
  };
}

