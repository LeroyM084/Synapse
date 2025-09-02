import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(dist, 'firefox');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

ensureDir(out);

// copy all files from dist to dist/firefox, but skip the firefox folder itself to avoid recursion
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const item of fs.readdirSync(src)) {
    if (item === 'firefox') continue; // skip target to avoid recursion
    const s = path.join(src, item);
    const d = path.join(dest, item);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(dist, out);

// copy top-level background.js (and any other root files needed) into dist/firefox
const rootBg = path.join(root, 'background.js');
if (fs.existsSync(rootBg)) {
  fs.copyFileSync(rootBg, path.join(out, 'background.js'));
}

// load root manifest and produce a Firefox-compatible (MV2) manifest
const manifestPath = path.join(root, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('manifest.json not found at', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Build a MV2 manifest for Firefox by converting simple fields
const ffManifest = {
  manifest_version: 2,
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  icons: manifest.icons || {},
};

// action -> browser_action
if (manifest.action) {
  ffManifest.browser_action = {
    default_title: manifest.action.default_title,
    default_icon: manifest.action.default_icon || undefined,
    default_popup: manifest.action.default_popup ? manifest.action.default_popup.replace(/^dist\//, '') : undefined
  };
}

// permissions
ffManifest.permissions = manifest.permissions || [];

// host_permissions -> permissions for MV2 (append)
if (manifest.host_permissions) {
  ffManifest.permissions = Array.from(new Set([...(ffManifest.permissions||[]), ...manifest.host_permissions]));
}

// background: convert service_worker -> scripts if possible
if (manifest.background && manifest.background.service_worker) {
  ffManifest.background = {
    scripts: ['background.js'],
    persistent: false
  };
} else if (manifest.background && manifest.background.scripts) {
  ffManifest.background = manifest.background;
}

// content_scripts
if (manifest.content_scripts) ffManifest.content_scripts = manifest.content_scripts.map(cs => ({
  matches: cs.matches,
  js: cs.js ? cs.js.map(p => p.replace(/^dist\//, '')) : undefined,
  css: cs.css ? cs.css.map(p => p.replace(/^dist\//, '')) : undefined,
  run_at: cs.run_at
}));

// browser_specific_settings (keep gecko id if present)
if (manifest.browser_specific_settings) ffManifest.browser_specific_settings = manifest.browser_specific_settings;

const outManifestPath = path.join(out, 'manifest.json');
fs.writeFileSync(outManifestPath, JSON.stringify(ffManifest, null, 2));
console.log('Prepared Firefox manifest at', outManifestPath);
