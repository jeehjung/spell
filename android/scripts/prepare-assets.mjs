import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const androidRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(androidRoot, '..');
const assetsDir = path.join(androidRoot, 'app/src/main/assets');
fs.mkdirSync(assetsDir, { recursive: true });
let html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const replacements = [
  ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="tailwind.css">'],
  ['<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">', '<link rel="stylesheet" href="fontawesome/css/all.min.css">'],
  ['<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap" rel="stylesheet">', '<!-- Android offline build uses the system sans-serif font. -->']
];
for (const [from, to] of replacements) {
  if (!html.includes(from)) throw new Error('Expected web asset reference not found: ' + from);
  html = html.replace(from, to);
}
if (/https:\/\/cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome|fonts\.googleapis\.com/.test(html)) {
  throw new Error('External CSS/font dependency remains in the Android HTML.');
}
fs.writeFileSync(path.join(assetsDir, 'index.html'), html, 'utf8');
const faRoot = path.join(androidRoot, 'node_modules/@fortawesome/fontawesome-free');
const faCssDir = path.join(assetsDir, 'fontawesome/css');
fs.mkdirSync(faCssDir, { recursive: true });
fs.copyFileSync(path.join(faRoot, 'css/all.min.css'), path.join(faCssDir, 'all.min.css'));
fs.cpSync(path.join(faRoot, 'webfonts'), path.join(assetsDir, 'fontawesome/webfonts'), { recursive: true });
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npx, ['tailwindcss', '-i', 'tailwind.input.css', '-o',
  'app/src/main/assets/tailwind.css', '--content', 'app/src/main/assets/index.html', '--minify'],
  { cwd: androidRoot, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Prepared offline HTML, Tailwind CSS and Font Awesome assets.');
