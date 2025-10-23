const headers = {
  'Content-Type': 'application/json'
};

export async function fetchDrafts(params = {}) {
  const url = new URL('/api/drafts', window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.append(key, value);
  });

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudieron cargar los drafts');
  }
  return response.json();
}

export async function approveDraft(id, body = {}) {
  const response = await fetch(`/api/drafts/${id}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo aprobar el draft');
  }
  return response.json();
}

export async function returnDraft(id, body = {}) {
  const response = await fetch(`/api/drafts/${id}/return`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo devolver el draft');
  }
  return response.json();
}
