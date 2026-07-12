export async function apiFetch(url: string, options: RequestInit = {}) {
  const userStr = localStorage.getItem('lexia_user');
  let rol = 'user';
  let despacho = 'default';
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      rol = user.rol || 'user';
      despacho = user.despacho_id || 'default';
    } catch (e) {
      console.error(e);
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set('X-Lexia-Rol', rol);
  headers.set('X-Lexia-Despacho', despacho);

  const newOptions = {
    ...options,
    headers
  };
  
  const isClient = typeof window !== 'undefined';
  const apiHost = isClient ? window.location.hostname : '127.0.0.1';
  const finalUrl = url.startsWith('/api') ? `http://${apiHost}:3001${url}` : url;

  return fetch(finalUrl, newOptions);
}
