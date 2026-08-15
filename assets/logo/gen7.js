const sharp = require('sharp');
const fs = require('fs');
const dir = __dirname;

const INK = '#1c1917', CREAM = '#faf9f7', EMER = '#10b981';

const sheen = `<defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#fff" stop-opacity="0.06"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
const tileInk = `<rect width="1024" height="1024" rx="230" fill="${INK}"/><rect width="1024" height="1024" rx="230" fill="url(#sheen)"/>`;

const sw = 84, r = 78, spring = 452, base = 660, hw = sw/2;
const x1 = 340, x2 = 496, x3 = 652;
const mPath =
  `M${x1} ${base} L${x1} ${spring} A${r} ${r} 0 0 1 ${x2} ${spring} L${x2} ${base}` +
  ` M${x2} ${spring} A${r} ${r} 0 0 1 ${x3} ${spring} L${x3} ${base}`;

// emerald bottom segment of the right stem: flat top (seamless) + round bottom foot
function emeraldSeg(yTop) {
  return `<path d="M${x3-hw} ${yTop} L${x3-hw} ${base} A${hw} ${hw} 0 0 0 ${x3+hw} ${base} L${x3+hw} ${yTop} Z" fill="${EMER}"/>`;
}
// emerald rounded pill button (round top too)
function emeraldPill(yTop) {
  return `<path d="M${x3} ${yTop} L${x3} ${base}" fill="none" stroke="${EMER}" stroke-width="${sw}" stroke-linecap="round"/>`;
}
// cream check low in the bar
const checkLow = `<path d="M626 606 L646 624 L686 580" fill="none" stroke="${CREAM}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`;

function make(emerald) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${sheen}
  ${tileInk}
  <path d="${mPath}" fill="none" stroke="${CREAM}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  ${emerald}
  ${checkLow}
</svg>`;
}

const variants = {
  'N-seg':   make(emeraldSeg(556)),
  'N-tight': make(emeraldSeg(586)),
  'N-pill':  make(emeraldPill(560)),
};
const labels = {
  'N-seg':'Segment vert (fin du trait)',
  'N-tight':'Vert court (autour coche)',
  'N-pill':'Pastille bouton',
};

(async () => {
  for (const [k,svg] of Object.entries(variants)) {
    fs.writeFileSync(`${dir}/${k}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/${k}.png`);
  }
  const keys=Object.keys(variants), cell=360, pad=40;
  const W=cell*keys.length+pad*(keys.length+1), H=cell+pad*2+50;
  const comps=[];
  for (let i=0;i<keys.length;i++){
    const k=keys[i];
    const buf=await sharp(`${dir}/${k}.png`).resize(cell,cell).png().toBuffer();
    comps.push({input:buf,left:pad+i*(cell+pad),top:pad});
    const lab=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="46"><text x="${cell/2}" y="32" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#1c1917" text-anchor="middle">${labels[k]}</text></svg>`);
    comps.push({input:lab,left:pad+i*(cell+pad),top:pad+cell+6});
  }
  await sharp({create:{width:W,height:H,channels:4,background:'#ffffff'}}).composite(comps).png().toFile(`${dir}/contact-sheet-7.png`);
  console.log('done');
})();
