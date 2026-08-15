const sharp = require('sharp');
const fs = require('fs');
const OUT = '/home/user/mavy/assets';

const INK = '#1c1917', CREAM = '#faf9f7', EMER = '#10b981';

const sw = 84, r = 78, spring = 452, base = 660, hw = sw/2;
const x1 = 340, x2 = 496, x3 = 652;
const mPath =
  `M${x1} ${base} L${x1} ${spring} A${r} ${r} 0 0 1 ${x2} ${spring} L${x2} ${base}` +
  ` M${x2} ${spring} A${r} ${r} 0 0 1 ${x3} ${spring} L${x3} ${base}`;
const emeraldSeg = `M${x3-hw} 556 L${x3-hw} ${base} A${hw} ${hw} 0 0 0 ${x3+hw} ${base} L${x3+hw} 556 Z`;
const vy = 656;
const checkPath = `M626 ${vy-18} L646 ${vy} L686 ${vy-44}`;

// mark, wrapped in a transform. Native bbox center ~ (496, 517).
function mark(transform) {
  return `<g transform="${transform}">
    <path d="${mPath}" fill="none" stroke="${CREAM}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${emeraldSeg}" fill="${EMER}"/>
    <path d="${checkPath}" fill="none" stroke="${CREAM}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}
const sheen = `<defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#fff" stop-opacity="0.05"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;

// center the native mark at (512,512)
const centered = `translate(16,-5)`;
// scaled-up mark for adaptive/splash: scale 1.5 about native center (496,517)
const scaledCentered = `translate(512,512) scale(1.5) translate(-496,-517)`;

// 1) App icon (iOS/general): full-bleed ink square + centered mark
const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${sheen}
  <rect width="1024" height="1024" fill="${INK}"/>
  <rect width="1024" height="1024" fill="url(#sheen)"/>
  ${mark(centered)}
</svg>`;

// 2) Android adaptive foreground: transparent + enlarged centered mark (within safe zone)
const adaptiveSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${mark(scaledCentered)}
</svg>`;

// 3) Splash: transparent + centered mark (contained on ink bg)
const splashSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${mark(scaledCentered)}
</svg>`;

(async () => {
  await sharp(Buffer.from(iconSVG)).png().toFile(`${OUT}/icon.png`);
  await sharp(Buffer.from(adaptiveSVG)).png().toFile(`${OUT}/adaptive-icon.png`);
  await sharp(Buffer.from(splashSVG)).png().toFile(`${OUT}/splash-icon.png`);
  await sharp(Buffer.from(iconSVG)).resize(64,64).png().toFile(`${OUT}/favicon.png`);
  // save master svg for reference
  fs.writeFileSync(`${OUT}/logo/mavy-icon.svg`, iconSVG);

  // preview: android circle mask check + final icon
  const iconBuf = await sharp(`${OUT}/icon.png`).resize(400,400).png().toBuffer();
  const circle = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="200" fill="#fff"/></svg>`);
  const bg = await sharp({create:{width:400,height:400,channels:4,background:INK}}).png().toBuffer();
  const fg = await sharp(Buffer.from(adaptiveSVG)).resize(400,400).png().toBuffer();
  const androidRound = await sharp(bg).composite([{input:fg}]).composite([{input:circle, blend:'dest-in'}]).png().toBuffer();
  await sharp({create:{width:880,height:460,channels:4,background:'#ffffff'}}).composite([
    {input:iconBuf,left:40,top:30},
    {input:androidRound,left:440,top:30},
    {input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="40"><text x="200" y="28" font-family="Arial" font-size="24" fill="#1c1917" text-anchor="middle">icon.png (iOS)</text></svg>`),left:40,top:440},
    {input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="40"><text x="200" y="28" font-family="Arial" font-size="24" fill="#1c1917" text-anchor="middle">Android adaptive (rond)</text></svg>`),left:440,top:440},
  ]).png().toFile('/tmp/claude-0/-home-user-mavy/3338a42e-ea7e-5a0a-aebf-7a630001531b/scratchpad/final-preview.png');
  console.log('done');
})();
