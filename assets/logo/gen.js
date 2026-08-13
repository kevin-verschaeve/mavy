const sharp = require('sharp');
const fs = require('fs');
const dir = __dirname;

const IND = '#6366f1', VIO = '#8b5cf6', CORAL = '#f97316';

// Rounded-square background (iOS squircle-ish) full-bleed gradient
function bg(radius = 230) {
  return `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${IND}"/>
      <stop offset="1" stop-color="${VIO}"/>
    </linearGradient>
    <linearGradient id="gsoft" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" rx="${radius}" fill="url(#g)"/>
  <rect x="0" y="0" width="1024" height="1024" rx="${radius}" fill="url(#gsoft)"/>`;
}

// ---- Concept A: geometric lowercase "m" monogram (sober) ----
function conceptA() {
  const sw = 84, r = 78;
  // stems shifted up ~ centered
  const spring = 452, base = 672;
  const x1 = 356, x2 = 512, x3 = 668;
  const d =
    `M${x1} ${base} L${x1} ${spring} A${r} ${r} 0 0 1 ${x2} ${spring} L${x2} ${base}` +
    ` M${x2} ${spring} A${r} ${r} 0 0 1 ${x3} ${spring} L${x3} ${base}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bg()}
  <path d="${d}" fill="none" stroke="#ffffff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// ---- Concept B: "m" monogram + coral accent dot (tracked moment) ----
function conceptB() {
  const sw = 84, r = 78;
  const spring = 452, base = 660;
  const x1 = 340, x2 = 496, x3 = 652;
  const d =
    `M${x1} ${base} L${x1} ${spring} A${r} ${r} 0 0 1 ${x2} ${spring} L${x2} ${base}` +
    ` M${x2} ${spring} A${r} ${r} 0 0 1 ${x3} ${spring} L${x3} ${base}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bg()}
  <path d="${d}" fill="none" stroke="#ffffff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="712" cy="452" r="46" fill="${CORAL}"/>
</svg>`;
}

// ---- Concept C: "life pulse" — symmetric heartbeat line (life), timeline dots ----
function conceptC() {
  const sw = 66;
  const y = 512, amp = 150;
  // symmetric around x=512: flat -> peak -> valley (center) -> peak -> flat
  const d = `M256 ${y}` +
            ` L360 ${y}` +
            ` L420 ${y-amp}` +
            ` L470 ${y+amp}` +
            ` L512 ${y-amp}` +          // center up-spike
            ` L554 ${y+amp}` +
            ` L604 ${y-amp}` +
            ` L664 ${y}` +
            ` L768 ${y}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bg()}
  <path d="${d}" fill="none" stroke="#ffffff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="256" cy="${y}" r="34" fill="#ffffff"/>
  <circle cx="768" cy="${y}" r="34" fill="${CORAL}"/>
</svg>`;
}

const items = { A: conceptA(), B: conceptB(), C: conceptC() };
(async () => {
  for (const [k, svg] of Object.entries(items)) {
    fs.writeFileSync(`${dir}/concept-${k}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/concept-${k}.png`);
    // small preview at 220 on a neutral card for contact sheet
  }
  // contact sheet 3 across
  const cell = 360, pad = 40, W = cell*3 + pad*4, H = cell + pad*2 + 60;
  const composites = [];
  let i = 0;
  for (const k of ['A','B','C']) {
    const buf = await sharp(`${dir}/concept-${k}.png`).resize(cell, cell).png().toBuffer();
    composites.push({ input: buf, left: pad + i*(cell+pad), top: pad });
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="50"><text x="${cell/2}" y="36" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="#1c1917" text-anchor="middle">Concept ${k}</text></svg>`);
    composites.push({ input: label, left: pad + i*(cell+pad), top: pad + cell + 8 });
    i++;
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: '#faf9f7' } })
    .composite(composites).png().toFile(`${dir}/contact-sheet.png`);
  console.log('done');
})();
