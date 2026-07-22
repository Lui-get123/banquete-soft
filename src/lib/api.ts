export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const eventoId = localStorage.getItem('evento_id');

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (eventoId) {
    headers.set('x-evento-id', eventoId);
  }

  // Ensure JSON content type if body is present and no content type is set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
