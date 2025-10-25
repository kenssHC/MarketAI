import config from '../config.js';

async function callN8nWebhook(path, body = {}, options = {}) {
  const url = `${config.n8n.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (config.n8n.basicAuth.user && config.n8n.basicAuth.password) {
    const token = Buffer.from(`${config.n8n.basicAuth.user}:${config.n8n.basicAuth.password}`).toString('base64');
    headers.Authorization = `Basic ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.n8n.timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`N8N webhook error ${response.status}: ${text}`);
    }

    const data = await response.json().catch(() => ({}));
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export default callN8nWebhook;
