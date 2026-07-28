const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const domain = 'https://aisaichang.cn';
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));
const socialCard = fs.readFileSync(path.join(root, 'assets/social-card.svg'), 'utf8');
const favicon = fs.readFileSync(path.join(root, 'assets/favicon.svg'), 'utf8');

const failures = [];
function requireText(text, expected, label) {
  if (!text.includes(expected)) failures.push(`${label} missing: ${expected}`);
}

for (const [file, label] of [
  ['assets/favicon.svg', 'favicon'],
  ['assets/social-card.svg', 'social card'],
  ['site.webmanifest', 'manifest'],
  ['robots.txt', 'robots'],
  ['sitemap.xml', 'sitemap'],
]) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`${label} file does not exist: ${file}`);
}

requireText(index, `<link rel="canonical" href="${domain}/"`, 'index');
requireText(index, `<meta property="og:url" content="${domain}/"`, 'index');
requireText(index, `${domain}/assets/social-card.svg`, 'index');
requireText(index, '<meta name="twitter:card" content="summary_large_image"', 'index');
requireText(index, '<script type="application/ld+json">', 'index');
requireText(index, '<link rel="manifest" href="/site.webmanifest"', 'index');
requireText(index, '<link rel="icon" href="/assets/favicon.svg"', 'index');
requireText(robots, `Sitemap: ${domain}/sitemap.xml`, 'robots');
requireText(sitemap, `<loc>${domain}/</loc>`, 'sitemap');

if (index.includes('yangmengze608-afk.github.io') || robots.includes('yangmengze608-afk.github.io') || sitemap.includes('yangmengze608-afk.github.io')) {
  failures.push('Production SEO files still expose the GitHub Pages host');
}

if (manifest.name !== 'AI 赛场' || manifest.start_url !== '/' || manifest.scope !== '/') {
  failures.push('Manifest name, start_url or scope is invalid');
}
if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.src === '/assets/favicon.svg')) {
  failures.push('Manifest does not reference the self-hosted favicon');
}
if (!/width="1200"/.test(socialCard) || !/height="630"/.test(socialCard)) {
  failures.push('Social card must remain 1200x630');
}
if (!/<svg/.test(favicon) || !/viewBox="0 0 64 64"/.test(favicon)) {
  failures.push('Favicon SVG is malformed');
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Production domain SEO audit passed for aisaichang.cn.');
