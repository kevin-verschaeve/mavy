const sharp = require('sharp');
const fs = require('fs');
const dir = __dirname;

const IND = '#6366f1', VIO = '#8b5cf6', INDK = '#4f46e5', CORAL = '#f97316';

function defs() {
  return `<defs>
    <linearGradient id="g" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${IND}"/><stop offset="1" stop-color="${VIO}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="rad" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#7c74ff"/><stop offset="1" stop-color="${INDK}"/>
    </radialGradient>
  </defs>`;
}
const tileGrad = (r=230) => `<rect width="1024" height="1024" rx="${r}" fill="url(#g)"/><rect width="1024" height="1024" rx="${r}" fill="url(#sheen)"/>`;
const tileLight = (r=230) => `<rect width="1024" height="1024" rx="${r}" fill="#f5f4fb"/><rect x="6" y="6" width="1012" height="1012" rx="${r-6}" fill="none" stroke="#e7e5ef" stroke-width="4"/>`;
const tileDeep = (r=230) => `<rect width="1024" height="1024" rx="${r}" fill="url(#rad)"/><rect width="1024" height="1024" rx="${r}" fill="url(#sheen)"/>`;

// ---- D: Check-in (logging gesture) ----
function conceptD() {
  const d = `M330 520 L470 656 L700 380`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}
  ${tileGrad()}
  <path d="${d}" fill="none" stroke="#fff" stroke-width="96" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// ---- E: Suivi (habit-tracker grid / heatmap) ----
function conceptE() {
  const cols = 4, size = 150, gap = 42, rx = 34;
  const grid = cols*size + (cols-1)*gap;      // 4*150+3*42=726
  const ox = (1024-grid)/2, oy = (1024-grid)/2;
  const vals = [0.5,1.0,0.3,0.75, 1.0,0.5,0.85,0.3, 0.3,0.75,1.0,0.5, 0.85,0.3,'c',1.0];
  let cells = '';
  for (let i=0;i<16;i++){
    const c = i%cols, r = (i-c)/cols;
    const x = ox + c*(size+gap), y = oy + r*(size+gap);
    const v = vals[i];
    const fill = v==='c' ? CORAL : IND;
    const op = v==='c' ? 1 : v;
    cells += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${fill}" fill-opacity="${op}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}
  ${tileLight()}
  ${cells}
</svg>`;
}

// ---- F: Cycle / pulse (a logged moment radiating) ----
function conceptF() {
  const cx=512, cy=512;
  const ring = (r,op,w)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="${w}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}
  ${tileDeep()}
  ${ring(300,0.22,26)}
  ${ring(216,0.5,30)}
  ${ring(132,1.0,34)}
  <circle cx="${cx}" cy="${cy}" r="64" fill="${CORAL}"/>
</svg>`;
}

const items = { D: conceptD(), E: conceptE(), F: conceptF() };
const labels = { D:'Check-in', E:'Suivi (grille)', F:'Cycle / pulse' };
(async () => {
  for (const [k,svg] of Object.entries(items)) {
    fs.writeFileSync(`${dir}/concept-${k}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/concept-${k}.png`);
  }
  const cell=360, pad=40, W=cell*3+pad*4, H=cell+pad*2+60;
  const comps=[]; let i=0;
  for (const k of ['D','E','F']){
    const buf = await sharp(`${dir}/concept-${k}.png`).resize(cell,cell).png().toBuffer();
    comps.push({input:buf, left:pad+i*(cell+pad), top:pad});
    const lab = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="50"><text x="${cell/2}" y="36" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="#1c1917" text-anchor="middle">${labels[k]}</text></svg>`);
    comps.push({input:lab, left:pad+i*(cell+pad), top:pad+cell+8});
    i++;
  }
  await sharp({create:{width:W,height:H,channels:4,background:'#faf9f7'}}).composite(comps).png().toFile(`${dir}/contact-sheet-2.png`);
  console.log('done');
})();
