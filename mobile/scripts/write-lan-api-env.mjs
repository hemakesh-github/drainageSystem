/**
 * Writes mobile/.env with EXPO_PUBLIC_API_URL=http://<LAN-IP>:8000
 * Run from mobile/: npm run set-local-api
 * Prefer non-link-local IPv4; prefer adapters named like Wi-Fi / wlan / wireless.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.join(__dirname, '..');
const PORT = process.env.API_PORT || '8000';

function pickLanIp() {
  const ifs = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(ifs)) {
    for (const addr of ifs[name] || []) {
      const family = addr.family;
      if (family !== 'IPv4' && family !== 4) continue;
      if (addr.internal) continue;
      if (addr.address.startsWith('169.254.')) continue;
      candidates.push({ address: addr.address, name });
    }
  }
  const wifi = candidates.find((c) => /wi-?fi|wlan|wireless|802\.11|ethernet/i.test(c.name));
  return (wifi || candidates[0])?.address;
}

const ip = pickLanIp();
if (!ip) {
  console.error('Could not find a LAN IPv4 address. Set EXPO_PUBLIC_API_URL manually in .env');
  process.exit(1);
}

const url = `http://${ip}:${PORT}`;
const envPath = path.join(MOBILE_ROOT, '.env');
const contents = `# Local backend on this PC (same WiFi as your phone). Regenerate: npm run set-local-api
# For Render/production, set EXPO_PUBLIC_API_URL to your https URL (no trailing slash).
EXPO_PUBLIC_API_URL=${url}
`;

fs.writeFileSync(envPath, contents, 'utf8');
console.log('Wrote', envPath);
console.log(`EXPO_PUBLIC_API_URL=${url}`);
