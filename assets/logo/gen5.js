const sharp = require('sharp');
const fs = require('fs');
const dir = __dirname;

const INK = '#1c1917', CREAM = '#faf9f7', AMBER = '#f59e0b';

const sheen = `<defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#fff" stop-opacity="0.06"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;

const sw = 84, r = 78, spring = 452, base = 660;
const x1 = 340, x2 = 496, x3 = 652;
const mPath =
  `M${x1} ${base} L${x1} ${spring} A${r} ${r} 0 0 1 ${x2} ${spring} L${x2} ${base}` +
  ` M${x2} ${spring} A${r} ${r} 0 0 1 ${x3} ${spring} L${x3} ${base}`;

function tile(bg, dark) {
  if (dark) return `<rect width="1024" height="1024" rx="230" fill="${bg}"/><rect width="1024" height="1024" rx="230" fill="url(#sheen)"/>`;
  return `<rect width="1024" height="1024" rx="230" fill="${bg}"/><rect x="5" y="5" width="1014" height="1014" rx="225" fill="none" stroke="#eae7e2" stroke-width="4"/>`;
}

// bare amber check centered ~ (708,452)
const bareCheck = `<path d="M672 456 L700 486 L752 410" fill="none" stroke="${AMBER}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`;
// amber disc badge with dark check
function badge(bg) {
  return `<circle cx="708" cy="452" r="60" fill="${AMBER}"/>
  <path d="M680 452 L700 474 L740 424" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function make(bg, mColor, accent, dark) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${sheen}
  ${tile(bg, dark)}
  <path d="${mPath}" fill="none" stroke="${mColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  ${accent}
</svg>`;
}

const variants = {
  'C-ink-bare':   make(INK,  CREAM, bareCheck, true),
  'C-ink-badge':  make(INK,  CREAM, badge(INK), true),
  'C-cream-bare': make(CREAM, INK,  bareCheck, false),
  'C-cream-badge':make(CREAM, INK,  badge(CREAM), false),
};
const labels = {
  'C-ink-bare':'Sombre · check nu',
  'C-ink-badge':'Sombre · check pastille',
  'C-cream-bare':'Crème · check nu',
  'C-cream-badge':'Crème · check pastille',
};

(async () => {
  for (const [k,svg] of Object.entries(variants)) {
    fs.writeFileSync(`${dir}/${k}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/${k}.png`);
  }
  const keys=Object.keys(variants), cell=360, pad=40, cols=2;
  const W=cell*cols+pad*(cols+1), rows=Math.ceil(keys.length/cols), H=rows*(cell+56)+pad;
  const comps=[];
  for (let idx=0; idx<keys.length; idx++){
    const k=keys[idx], c=idx%cols, rr=(idx-c)/cols;
    const buf=await sharp(`${dir}/${k}.png`).resize(cell,cell).png().toBuffer();
    comps.push({input:buf,left:pad+c*(cell+pad),top:pad+rr*(cell+56)});
    const lab=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="46"><text x="${cell/2}" y="32" font-family="Arial,Helvetica,sans-serif" font-size="25" fill="#1c1917" text-anchor="middle">${labels[k]}</text></svg>`);
    comps.push({input:lab,left:pad+c*(cell+pad),top:pad+rr*(cell+56)+cell+4});
  }
  await sharp({create:{width:W,height:H,channels:4,background:'#ffffff'}}).composite(comps).png().toFile(`${dir}/contact-sheet-5.png`);
  console.log('done');
})();
