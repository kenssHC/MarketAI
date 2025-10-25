const jsonHeaders = {
  'Content-Type': 'application/json'
};

function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.append(key, value);
  });
  return url;
}

async function handleResponse(response, defaultMessage) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || defaultMessage);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function fetchKeywords(params = {}) {
  const response = await fetch(buildUrl('/api/keywords', params));
  return handleResponse(response, 'No se pudieron cargar las keywords');
}

export async function createKeywordManual(body) {
  const response = await fetch('/api/keywords/manual', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudieron guardar las keywords');
}

export async function uploadKeywordsCsv(formData) {
  const response = await fetch('/api/keywords/upload', {
    method: 'POST',
    body: formData
  });
  return handleResponse(response, 'No se pudo procesar el archivo');
}

export async function generateArticleFromKeyword(keywordId, body = {}) {
  const response = await fetch(`/api/keywords/${keywordId}/generate`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudo generar el articulo');
}

export async function updateKeyword(keywordId, body = {}) {
  const response = await fetch(`/api/keywords/${keywordId}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudo actualizar la keyword');
}

export async function deleteKeyword(keywordId) {
  const response = await fetch(`/api/keywords/${keywordId}`, {
    method: 'DELETE'
  });
  return handleResponse(response, 'No se pudo eliminar la keyword');
}

export async function deleteAllKeywords() {
  const response = await fetch('/api/keywords', {
    method: 'DELETE'
  });
  return handleResponse(response, 'No se pudieron eliminar las keywords');
}

export async function fetchDrafts(params = {}) {
  const response = await fetch(buildUrl('/api/drafts', params));
  return handleResponse(response, 'No se pudieron cargar los drafts');
}

export async function fetchDraftById(id) {
  const response = await fetch(`/api/drafts/${id}`);
  return handleResponse(response, 'No se pudo cargar el draft');
}

export async function updateDraft(id, body = {}) {
  const response = await fetch(`/api/drafts/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudo actualizar el draft');
}

export async function approveDraft(id, body = {}) {
  const response = await fetch(`/api/drafts/${id}/approve`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudo aprobar el draft');
}

export async function returnDraft(id, body = {}) {
  const response = await fetch(`/api/drafts/${id}/return`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudo devolver el draft');
}

export async function generateDraftImage(id, body = {}) {
  const response = await fetch(`/api/drafts/${id}/image`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'No se pudo generar la imagen');
}
