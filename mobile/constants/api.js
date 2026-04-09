import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

const API_PORT = '8000';

/**
 * Base URL order:
 * 1. EXPO_PUBLIC_API_URL from mobile/.env (local Wi‑Fi IP or Render HTTPS). Restart Metro after edits.
 * 2. Dev fallback: Metro bundle host + API_PORT (Expo Go on device).
 * 3. http://127.0.0.1:API_PORT (simulator / web).
 *
 * Regenerate .env with current LAN IP: npm run set-local-api
 */
function devMachineHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL && typeof scriptURL === 'string') {
    const m = scriptURL.match(/^https?:\/\/([^/:]+)/i);
    if (m?.[1]) return m[1];
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const hostname = hostUri.split(':')[0];
    if (hostname) return hostname;
  }

  return null;
}

/**
 * 1. EXPO_PUBLIC_API_URL — production or Android emulator (e.g. http://10.0.2.2:8000)
 * 2. In dev, same host as the JS bundle (LAN IP from Expo / Metro)
 * 3. localhost — iOS Simulator / web
 */
function resolveBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env && String(env).trim()) {
    return String(env).trim().replace(/\/$/, '');
  }

  const host = devMachineHost();
  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  return `http://127.0.0.1:${API_PORT}`;
}

export const BASE_URL = resolveBaseUrl();

if (__DEV__) {
  console.log('[api] BASE_URL =', BASE_URL);
}

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

/**
 * Same as fetch(), but logs every call to Metro/console: method, path, status, duration.
 * Use for all backend requests so client and server logs can be correlated.
 */
/**
 * Build a clear error message for Alerts (includes URL and status; hints on 404).
 */
export function formatFailedResponse(res, data, url) {
  let detail = '';
  if (data && typeof data.detail === 'string') {
    detail = data.detail;
  } else if (data && Array.isArray(data.detail)) {
    detail = data.detail.map((e) => e.msg || JSON.stringify(e)).join('\n');
  } else if (data?.message) {
    detail = String(data.message);
  } else {
    detail = res.statusText || `HTTP ${res.status}`;
  }
  const lines = [detail, `URL: ${url}`];
  if (res.status === 404) {
    lines.push(
      'Tip: Start backend: uvicorn main:app --host 0.0.0.0 --port 8000',
      'Check EXPO_PUBLIC_API_URL in mobile/.env matches this PC WiFi IP (npm run set-local-api).'
    );
  }
  return lines.join('\n');
}

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let pathForLog = url;
  try {
    const u = new URL(url);
    pathForLog = `${u.pathname}${u.search}` || '/';
  } catch {
    /* relative or invalid */
  }
  const start = Date.now();
  const tag = `[api-client] ${method} ${pathForLog}`;
  console.log(`${tag} →`);

  try {
    const res = await fetch(url, options);
    const ms = Date.now() - start;
    console.log(`${tag} ← ${res.status} ${ms}ms`);
    return res;
  } catch (err) {
    const ms = Date.now() - start;
    console.warn(`${tag} × failed ${ms}ms`, err?.message || String(err));
    throw err;
  }
}
