const sharp = require('sharp');
const fs = require('fs');
const dir = __dirname;

const INK = '#1c1917', CREAM = '#faf9f7', CREAM2 = '#f5f3f0';
const EMER = '#10b981', AMBER = '#f59e0b', ROSE = '#e11d48';

function defs() {
  return `<defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity="0.06"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;
}
const tileInk = (r=230) => `<rect width="1024" height="1024" rx="${r}" fill="${INK}"/><rect width="1024" height="1024" rx="${r}" fill="url(#sheen)"/>`;
const tileCream = (r=230, fill=CREAM) => `<rect width="1024" height="1024" rx="${r}" fill="${fill}"/><rect x="5" y="5" width="1014" height="1014" rx="${r-5}" fill="none" stroke="#eae7e2" stroke-width="4"/>`;

// ---- G: Bell (reminder) on ink ----
function conceptG() {
  const bell = `M512 372
    C414 372 378 470 374 560
    C372 588 364 600 352 612
    L672 612
    C660 600 652 588 650 560
    C646 470 610 372 512 372 Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}
  ${tileInk()}
  <path d="${bell}" fill="${CREAM}"/>
  <circle cx="512" cy="360" r="30" fill="${CREAM}"/>
  <circle cx="512" cy="650" r="34" fill="${CREAM}"/>
  <circle cx="672" cy="368" r="86" fill="${INK}"/>
  <circle cx="672" cy="368" r="58" fill="${EMER}"/>
</svg>`;
}

// ---- H: Hourglass (elapsed time) on cream ----
function conceptH() {
  const topTri = `M376 372 L648 372 L512 512 Z`;
  const botTri = `M512 512 L648 656 L376 656 Z`;
  const sandTop = `M452 448 L572 448 L512 520 Z`;      // remaining sand in top
  const sandBot = `M410 656 L614 656 L512 584 Z`;      // pile in bottom
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}
  ${tileCream()}
  <rect x="352" y="326" width="320" height="34" rx="17" fill="${INK}"/>
  <rect x="352" y="668" width="320" height="34" rx="17" fill="${INK}"/>
  <path d="${topTri}" fill="none" stroke="${INK}" stroke-width="30" stroke-linejoin="round"/>
  <path d="${botTri}" fill="none" stroke="${INK}" stroke-width="30" stroke-linejoin="round"/>
  <path d="${sandTop}" fill="${AMBER}"/>
  <path d="${sandBot}" fill="${AMBER}"/>
  <rect x="505" y="518" width="14" height="70" fill="${AMBER}"/>
</svg>`;
}

// ---- I: Sprout (life / "ma vie") on ink ----
function conceptI() {
  const stem = `M512 680 L512 506`;
  const leafR = `M516 528 C566 452 626 424 680 434 C668 502 610 546 516 528 Z`;
  const leafL = `M508 528 C458 452 398 424 344 434 C356 502 414 546 508 528 Z`;
  const ribR = `M528 520 C572 480 616 462 656 456`;
  const ribL = `M496 520 C452 480 408 462 368 456`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}
  ${tileInk()}
  <path d="${stem}" fill="none" stroke="${CREAM}" stroke-width="30" stroke-linecap="round"/>
  <path d="${leafL}" fill="${EMER}"/>
  <path d="${leafR}" fill="${EMER}"/>
  <path d="${ribL}" fill="none" stroke="${INK}" stroke-opacity="0.18" stroke-width="12" stroke-linecap="round"/>
  <path d="${ribR}" fill="none" stroke="${INK}" stroke-opacity="0.18" stroke-width="12" stroke-linecap="round"/>
</svg>`;
}

const items = { G: conceptG(), H: conceptH(), I: conceptI() };
const labels = { G:'Cloche (rappel)', H:'Sablier', I:'Pousse (ma vie)' };
(async () => {
  for (const [k,svg] of Object.entries(items)) {
    fs.writeFileSync(`${dir}/concept-${k}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/concept-${k}.png`);
  }
  const cell=360, pad=40, W=cell*3+pad*4, H=cell+pad*2+60;
  const comps=[]; let i=0;
  for (const k of ['G','H','I']){
    const buf = await sharp(`${dir}/concept-${k}.png`).resize(cell,cell).png().toBuffer();
    comps.push({input:buf, left:pad+i*(cell+pad), top:pad});
    const lab = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="50"><text x="${cell/2}" y="36" font-family="Arial,Helvetica,sans-serif" font-size="27" fill="#1c1917" text-anchor="middle">${labels[k]}</text></svg>`);
    comps.push({input:lab, left:pad+i*(cell+pad), top:pad+cell+8});
    i++;
  }
  await sharp({create:{width:W,height:H,channels:4,background:'#ffffff'}}).composite(comps).png().toFile(`${dir}/contact-sheet-3.png`);
  console.log('done');
})();
