const sharp = require('sharp');
const fs = require('fs');
const dir = __dirname;

const INK = '#1c1917', CREAM = '#faf9f7';
const EMER = '#10b981', AMBER = '#f59e0b';

const sheen = `<defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#fff" stop-opacity="0.06"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;

// m geometry
const sw = 84, r = 78, spring = 452, base = 660;
const x1 = 340, x2 = 496, x3 = 652;
const mPath =
  `M${x1} ${base} L${x1} ${spring} A${r} ${r} 0 0 1 ${x2} ${spring} L${x2} ${base}` +
  ` M${x2} ${spring} A${r} ${r} 0 0 1 ${x3} ${spring} L${x3} ${base}`;

function tile(bg, dark) {
  if (dark) return `<rect width="1024" height="1024" rx="230" fill="${bg}"/><rect width="1024" height="1024" rx="230" fill="url(#sheen)"/>`;
  return `<rect width="1024" height="1024" rx="230" fill="${bg}"/><rect x="5" y="5" width="1014" height="1014" rx="225" fill="none" stroke="#eae7e2" stroke-width="4"/>`;
}

function make(bg, mColor, dotColor, dark) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${sheen}
  ${tile(bg, dark)}
  <path d="${mPath}" fill="none" stroke="${mColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="712" cy="452" r="46" fill="${dotColor}"/>
</svg>`;
}

const variants = {
  'B-ink-emer':   make(INK,  CREAM, EMER,  true),
  'B-ink-amber':  make(INK,  CREAM, AMBER, true),
  'B-cream-emer': make(CREAM, INK,  EMER,  false),
  'B-cream-amber':make(CREAM, INK,  AMBER, false),
};
const labels = {
  'B-ink-emer':'Sombre · émeraude',
  'B-ink-amber':'Sombre · ambre',
  'B-cream-emer':'Crème · émeraude',
  'B-cream-amber':'Crème · ambre',
};

(async () => {
  for (const [k,svg] of Object.entries(variants)) {
    fs.writeFileSync(`${dir}/${k}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/${k}.png`);
  }
  const keys = Object.keys(variants);
  const cell=360, pad=40, cols=2;
  const W=cell*cols+pad*(cols+1);
  const rows=Math.ceil(keys.length/cols);
  const H=rows*(cell+60)+pad;
  const comps=[];
  keys.forEach((k,idx)=>{
    const c=idx%cols, rr=(idx-c)/cols;
    const left=pad+c*(cell+pad), top=pad+rr*(cell+60);
    comps.push({input: fs.readFileSync(`${dir}/${k}.png`), left, top, });
  });
  // resize each first
  const comps2=[];
  for (const c of comps){
    const buf = await sharp(c.input).resize(cell,cell).png().toBuffer();
    comps2.push({input:buf,left:c.left,top:c.top});
  }
  keys.forEach((k,idx)=>{
    const c=idx%cols, rr=(idx-c)/cols;
    const left=pad+c*(cell+pad), top=pad+rr*(cell+60)+cell+6;
    const lab=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="46"><text x="${cell/2}" y="32" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#1c1917" text-anchor="middle">${labels[k]}</text></svg>`);
    comps2.push({input:lab,left,top});
  });
  await sharp({create:{width:W,height:H,channels:4,background:'#ffffff'}}).composite(comps2).png().toFile(`${dir}/contact-sheet-4.png`);
  console.log('done');
})();
