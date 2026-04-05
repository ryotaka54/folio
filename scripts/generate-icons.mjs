import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// Base icon SVG — blue background, white Applyd signal mark, centered with safe zone padding
function iconSvg(size, padding = 0.12) {
  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  // Scale the signal path to fit inside the safe zone
  // Original viewBox is 56x56, signal path spans roughly x:14-44, y:20-36
  const scale = inner / 56;
  const tx = pad;
  const ty = pad;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#2563EB"/>
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    <path d="M14 36 L22 26 L30 32 L38 20 L44 26" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="44" cy="26" r="4" fill="white" fill-opacity="0.95"/>
    <line x1="44" y1="34" x2="44" y2="44" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 3"/>
  </g>
</svg>`;
}

// Maskable needs ~20% safe zone on all sides
function maskableSvg(size) {
  return iconSvg(size, 0.20);
}

// Shortcut: plus icon on blue
function shortcutAddSvg(size) {
  const c = size / 2;
  const arm = size * 0.28;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#2563EB"/>
  <line x1="${c}" y1="${c - arm}" x2="${c}" y2="${c + arm}" stroke="white" stroke-width="${Math.round(size * 0.08)}" stroke-linecap="round"/>
  <line x1="${c - arm}" y1="${c}" x2="${c + arm}" y2="${c}" stroke="white" stroke-width="${Math.round(size * 0.08)}" stroke-linecap="round"/>
</svg>`;
}

// Shortcut: calendar icon on blue
function shortcutCalSvg(size) {
  const m = size * 0.2;
  const w = size - m * 2;
  const h = w * 0.88;
  const x = m, y = m + size * 0.05;
  const r = size * 0.07;
  const lw = Math.round(size * 0.065);
  const headerH = h * 0.3;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#2563EB"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="white" fill-opacity="0.2" stroke="white" stroke-width="${lw * 0.8}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${headerH}" rx="${r}" fill="white" fill-opacity="0.35"/>
  <line x1="${x + w * 0.28}" y1="${y - size * 0.04}" x2="${x + w * 0.28}" y2="${y + size * 0.08}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>
  <line x1="${x + w * 0.72}" y1="${y - size * 0.04}" x2="${x + w * 0.72}" y2="${y + size * 0.08}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>
  <line x1="${x + w * 0.15}" y1="${y + headerH + (h - headerH) * 0.38}" x2="${x + w * 0.85}" y2="${y + headerH + (h - headerH) * 0.38}" stroke="white" stroke-width="${lw * 0.6}" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="${x + w * 0.15}" y1="${y + headerH + (h - headerH) * 0.7}" x2="${x + w * 0.65}" y2="${y + headerH + (h - headerH) * 0.7}" stroke="white" stroke-width="${lw * 0.6}" stroke-linecap="round" stroke-opacity="0.6"/>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskable = new Set([192, 512]);

async function run() {
  // Main icons
  for (const size of sizes) {
    const svg = maskable.has(size) ? maskableSvg(size) : iconSvg(size);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(join(outDir, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }

  // Shortcut icons
  await sharp(Buffer.from(shortcutAddSvg(96))).png().toFile(join(outDir, 'shortcut-add.png'));
  console.log('✓ shortcut-add.png');
  await sharp(Buffer.from(shortcutCalSvg(96))).png().toFile(join(outDir, 'shortcut-calendar.png'));
  console.log('✓ shortcut-calendar.png');

  console.log('All icons generated in public/icons/');
}

run().catch(err => { console.error(err); process.exit(1); });
