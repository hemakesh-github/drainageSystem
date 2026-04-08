/**
 * Production: set to your Render Web Service URL (no trailing slash).
 * Local device testing: use http://YOUR_LAN_IP:PORT and enable cleartext in app.json (Android).
 */
export const BASE_URL = 'https://your-service-name.onrender.com';

export function apiUrl(path) {
  const base = BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function imageUrl(relativePath) {
  if (!relativePath) return null;
  const p = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL.replace(/\/$/, '')}${p}`;
}
