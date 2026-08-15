const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.resolve(ROOT, process.env.SEO_BUILD_DIR || '.seo-build');
const DOMAIN = 'https://aisaichang.cn';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'challenges-v1.json'), 'utf8'));
const sitemapPath = path.join(BUILD, 'sitemap.xml');
let xml = fs.readFileSync(sitemapPath, 'utf8');
const pairs = [[`${DOMAIN}/challenges/`, `${DOMAIN}/en/challenges/`], ...(data.challenges || []).map((item) => [`${DOMAIN}/challenges/${item.id}/`, `${DOMAIN}/en/challenges/${item.id}/`])];
for (const [zh, en] of pairs) {
  const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<url><loc>${escaped}<\\/loc>[\\s\\S]*?<\\/url>`);
  const correct = `<url><loc>${en}</loc><xhtml:link rel="alternate" hreflang="zh-CN" href="${zh}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${zh}"/></url>`;
  if (!pattern.test(xml)) throw new Error(`Missing English challenge sitemap entry: ${en}`);
  xml = xml.replace(pattern, correct);
}
fs.writeFileSync(sitemapPath, xml);
console.log(`Normalized reciprocal hreflang for ${pairs.length} challenge URL pairs.`);
