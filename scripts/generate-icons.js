const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ICON_DIR = path.join(__dirname, "..", "public", "icons");

// Thread app icon: purple background with a minimal white thread/needle mark
// Design: a stylized "✦" thread symbol centered on purple

function createIconSVG(size, maskable = false) {
  const padding = maskable ? size * 0.2 : size * 0.1;
  const center = size / 2;
  const r = (size - padding * 2) / 2;

  // Thread-inspired icon: an abstract stitch/weave mark
  // Four short lines radiating from center, forming a ✦ shape
  const s = r * 0.45; // stroke length from center
  const sw = size * 0.06; // stroke width

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.22}" fill="#0A0A0A"/>
  ${maskable ? "" : `<rect x="${size * 0.02}" y="${size * 0.02}" width="${size * 0.96}" height="${size * 0.96}" rx="${size * 0.20}" fill="none" stroke="#1A1A1A" stroke-width="${size * 0.01}"/>`}

  <!-- Accent circle glow -->
  <circle cx="${center}" cy="${center}" r="${r * 0.42}" fill="#8B7CF620"/>

  <!-- Thread weave mark -->
  <g stroke="#8B7CF6" stroke-width="${sw}" stroke-linecap="round">
    <!-- Vertical -->
    <line x1="${center}" y1="${center - s}" x2="${center}" y2="${center + s}"/>
    <!-- Horizontal -->
    <line x1="${center - s}" y1="${center}" x2="${center + s}" y2="${center}"/>
    <!-- Diagonal 1 -->
    <line x1="${center - s * 0.7}" y1="${center - s * 0.7}" x2="${center + s * 0.7}" y2="${center + s * 0.7}"/>
    <!-- Diagonal 2 -->
    <line x1="${center + s * 0.7}" y1="${center - s * 0.7}" x2="${center - s * 0.7}" y2="${center + s * 0.7}"/>
  </g>

  <!-- Center dot -->
  <circle cx="${center}" cy="${center}" r="${sw * 0.8}" fill="#F2F2F2"/>
</svg>`;
}

async function generate() {
  fs.mkdirSync(ICON_DIR, { recursive: true });

  const configs = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "icon-512-maskable.png", size: 512, maskable: true },
  ];

  for (const { name, size, maskable } of configs) {
    const svg = createIconSVG(size, maskable);
    const outPath = path.join(ICON_DIR, name);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Generate apple touch icon (180x180)
  const appleSvg = createIconSVG(180, false);
  await sharp(Buffer.from(appleSvg)).png().toFile(path.join(ICON_DIR, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png (180x180)");

  // Generate favicon (32x32)
  const faviconSvg = createIconSVG(32, false);
  await sharp(Buffer.from(faviconSvg)).png().toFile(path.join(ICON_DIR, "favicon-32.png"));
  console.log("Generated favicon-32.png (32x32)");

  // ICO not needed — browsers use PNG link tags
  console.log("\nDone! Icons generated in public/icons/");
}

generate().catch(console.error);
