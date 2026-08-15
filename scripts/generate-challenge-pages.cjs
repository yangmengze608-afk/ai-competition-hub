const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://aisaichang.cn';
const DATA_PATH = path.join(ROOT, 'data', 'challenges-v1.json');

function parseArgs(argv) {
  let out = '.seo-build';
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === '--out' && argv[i + 1]) { out = argv[++i]; }
  return path.resolve(ROOT, out);
}
function esc(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function safeJson(value) { return JSON.stringify(value).replaceAll('<', '\\u003c'); }
function ensure(dir) { fs.mkdirSync(dir, { recursive: true }); }
function write(file, content) { ensure(path.dirname(file)); fs.writeFileSync(file, content); }
function local(item, field, lang) { const value = item[field] || {}; return value[lang] || value.zh || value.en || ''; }
function list(item, lang) { return item.submission?.[lang] || item.submission?.zh || item.submission?.en || []; }
function buildCount(item) { return Array.isArray(item.builds) ? item.builds.length : 0; }
function title(item, lang) { return lang === 'en' ? `${local(item,'title','en')} | Idea Challenge | AI Competition Hub` : `${local(item,'title','zh')}｜创意擂台｜AI 赛场`; }
function meta(item, lang) { return lang === 'en' ? `Open worldwide idea challenge: ${local(item,'tagline','en')} See the brief, submission requirements and builds, or submit your own interpretation.` : `全球开放的创意擂台：${local(item,'tagline','zh')} 查看题目、提交要求和不同人的 Build，也可以交出你自己的答案。`; }
function appUrl(item, lang) { return `${DOMAIN}/${lang === 'en' ? '?lang=en' : ''}#/challenges/${encodeURIComponent(item.id)}`; }
function canonical(item, lang) { return `${DOMAIN}/${lang === 'en' ? 'en/' : ''}challenges/${encodeURIComponent(item.id)}/`; }
function directoryCanonical(lang) { return `${DOMAIN}/${lang === 'en' ? 'en/' : ''}challenges/`; }

function head(item, lang, isDirectory = false) {
  const zh = isDirectory ? `${DOMAIN}/challenges/` : canonical(item, 'zh');
  const en = isDirectory ? `${DOMAIN}/en/challenges/` : canonical(item, 'en');
  const canonicalUrl = lang === 'en' ? en : zh;
  const pageTitle = isDirectory ? (lang === 'en' ? 'Idea Challenges | AI Competition Hub' : '创意擂台｜AI 赛场') : title(item, lang);
  const description = isDirectory ? (lang === 'en' ? 'Open idea challenges where one prompt can produce many independent AI-built answers.' : '开放式创意擂台：一个人出题，来自不同地方的人用任意 AI 工具给出不同 Build。') : meta(item, lang);
  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonicalUrl}"><link rel="alternate" hreflang="zh-CN" href="${zh}"><link rel="alternate" hreflang="en" href="${en}"><link rel="alternate" hreflang="x-default" href="${zh}"><meta property="og:type" content="website"><meta property="og:site_name" content="AI Competition Hub"><meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonicalUrl}"><meta property="og:image" content="${DOMAIN}/assets/social-card.svg"><title>${esc(pageTitle)}</title><link rel="stylesheet" href="/challenge-seo-v1.css">`;
}

function challengePage(item, lang) {
  const isEn = lang === 'en';
  const titleText = local(item, 'title', lang);
  const tagline = local(item, 'tagline', lang);
  const brief = local(item, 'brief', lang);
  const requirements = list(item, lang);
  const count = buildCount(item);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: titleText, description: brief,
    url: canonical(item, lang), inLanguage: isEn ? 'en' : 'zh-CN', dateModified: '2026-08-16',
    creator: { '@type': 'Organization', name: item.creator || 'AI Competition Hub' },
    isAccessibleForFree: true
  };
  const breadcrumb = { '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:isEn?'AI Competition Hub':'AI 赛场',item:DOMAIN+'/'},
    {'@type':'ListItem',position:2,name:isEn?'Challenges':'创意擂台',item:directoryCanonical(lang)},
    {'@type':'ListItem',position:3,name:titleText,item:canonical(item,lang)}
  ]};
  return `<!doctype html><html lang="${isEn ? 'en' : 'zh-CN'}"><head>${head(item,lang)}<script type="application/ld+json">${safeJson(jsonLd)}</script><script type="application/ld+json">${safeJson(breadcrumb)}</script></head><body><div class="challenge-landing-wrap"><nav class="challenge-landing-nav"><a href="${DOMAIN}/">${isEn?'AI Competition Hub':'AI 赛场'}</a><span><a href="${directoryCanonical(lang)}">${isEn?'Challenges':'创意擂台'}</a> · <a href="${isEn ? canonical(item,'zh') : canonical(item,'en')}">${isEn?'中文':'English'}</a></span></nav><main><section class="challenge-landing-hero"><div class="challenge-landing-kicker">IDEA → MANY BUILDS</div><h1>${esc(titleText)}</h1><p>${esc(tagline)}</p><div class="challenge-landing-meta"><span class="challenge-landing-pill">${isEn?'Open Worldwide':'全球开放'}</span><span class="challenge-landing-pill muted">${count} ${isEn?'Builds':'个 Builds'}</span><span class="challenge-landing-pill muted">${isEn?'Originally posted in Chinese':'原始发布语言：中文'}</span></div><div class="challenge-landing-actions"><a class="challenge-landing-primary" href="${appUrl(item,lang)}">${isEn?'Open Challenge & Build This Idea':'打开 Challenge 并接题'}</a><a class="challenge-landing-secondary" href="${DOMAIN}/${isEn?'?lang=en':''}#/challenges/new">${isEn?'Create a Challenge':'我要出题'}</a></div></section><section class="challenge-landing-grid"><div><article class="challenge-landing-block"><h2>${isEn?'What this challenge is asking for':'这道题想看什么'}</h2><p>${esc(brief)}</p></article><article class="challenge-landing-block"><h2>${isEn?'What to submit':'提交一个 Build 需要'}</h2><ul>${requirements.map((line)=>`<li>${esc(line)}</li>`).join('')}</ul></article><article class="challenge-landing-block"><h2>${isEn?'Why this is different from a hackathon':'它和传统比赛有什么不同'}</h2><p>${isEn?'The idea is the shared starting point. Builders may use any tool and host their work anywhere; AI Competition Hub groups independent answers under one prompt instead of requiring a shared coding environment.':'Idea 是所有人的共同起点。参与者可以使用任意工具、把作品部署在任意地方；AI 赛场只负责把同一道题的独立答案聚合回来，而不是规定统一开发环境。'}</p></article></div><aside class="challenge-landing-side"><small>${isEn?'Creator':'发起者'}</small><strong>${esc(item.creator)}</strong><small>${isEn?'Participation':'参与范围'}</small><strong>${isEn?'Open Worldwide':'全球开放'}</strong><small>${isEn?'Builds published':'已发布 Build'}</small><strong>${count}</strong><div class="challenge-landing-note">${isEn?'Posting an idea does not automatically grant ownership of another participant’s code, copyright, or commercial rights. Do not publish confidential ideas or materials.':'发布一个 Idea 不会自动获得其他参与者作品的代码、版权或商业权益。不要发布需要保密的创意或材料。'}</div></aside></section></main><footer class="challenge-landing-footer">${isEn?'AI Competition Hub separates official competitions from community-created Idea Challenges. Challenge pages are community prompts, not organizer-verified competitions.':'AI 赛场会把正式赛事与社区创意擂台明确分开。Challenge 页面是社区发起的开放题，不属于经过主办方来源核验的正式赛事。'}</footer></div></body></html>`;
}

function directoryPage(items, lang) {
  const isEn = lang === 'en';
  return `<!doctype html><html lang="${isEn?'en':'zh-CN'}"><head>${head(null,lang,true)}</head><body><div class="challenge-landing-wrap"><nav class="challenge-landing-nav"><a href="${DOMAIN}/">${isEn?'AI Competition Hub':'AI 赛场'}</a><span><a href="${isEn?`${DOMAIN}/challenges/`:`${DOMAIN}/en/challenges/`}">${isEn?'中文':'English'}</a></span></nav><main><section class="challenge-directory-hero"><div class="challenge-landing-kicker">IDEA → MANY BUILDS</div><h1>${isEn?'Idea Challenges':'创意擂台'}</h1><p>${isEn?'Post an idea worth building, or answer someone else’s prompt with your own working interpretation. One idea can produce many independent builds.':'有人出一道值得实现的题，其他人用任意 AI / 开发工具给出自己的答案。同一个 Idea，可以长出很多完全不同的 Build。'}</p><div class="challenge-landing-actions"><a class="challenge-landing-primary" href="${DOMAIN}/${isEn?'?lang=en':''}#/challenges/new">${isEn?'Create a Challenge':'我要出题'}</a></div></section><section class="challenge-directory-grid">${items.map((item)=>`<article class="challenge-directory-card"><span class="challenge-landing-pill">${isEn?'Open Worldwide':'全球开放'}</span><h2>${esc(local(item,'title',lang))}</h2><p>${esc(local(item,'tagline',lang))}</p><a href="${canonical(item,lang)}">${isEn?'View Challenge →':'查看 Challenge →'}</a><div class="challenge-directory-tags">${(item.tags||[]).map((tag)=>`<span>${esc(tag)}</span>`).join('')}</div></article>`).join('')}</section></main><footer class="challenge-landing-footer">${items.length} ${isEn?'founding challenges · reviewed before publication':'道首批开放题 · Beta 审核后发布'}</footer></div></body></html>`;
}

function appendSitemap(outDir, items) {
  const sitemapPath = path.join(outDir, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) throw new Error('Challenge generator expects an existing sitemap.xml from the competition SEO generator.');
  let xml = fs.readFileSync(sitemapPath, 'utf8');
  const baseCount = [...xml.matchAll(/<loc>/g)].length;
  const entries = [];
  const pair = (zh,en) => `<url><loc>${zh}</loc><xhtml:link rel="alternate" hreflang="zh-CN" href="${zh}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${zh}"/></url>`;
  entries.push(pair(`${DOMAIN}/challenges/`,`${DOMAIN}/en/challenges/`));
  entries.push(pair(`${DOMAIN}/en/challenges/`,`${DOMAIN}/en/challenges/`));
  for (const item of items) { const zh=canonical(item,'zh'), en=canonical(item,'en'); entries.push(pair(zh,en), pair(en,en)); }
  xml = xml.replace('</urlset>', `${entries.join('\n')}\n</urlset>`);
  fs.writeFileSync(sitemapPath, xml);
  return { baseCount, addedCount: entries.length, totalCount: baseCount + entries.length };
}

const outDir = parseArgs(process.argv.slice(2));
const canonicalData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const items = Array.isArray(canonicalData.challenges) ? canonicalData.challenges : [];
if (!items.length) throw new Error('No challenges found.');
const ids = new Set();
for (const item of items) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(item.id || '')) throw new Error(`Invalid challenge id: ${item.id}`);
  if (ids.has(item.id)) throw new Error(`Duplicate challenge id: ${item.id}`);
  ids.add(item.id);
  if (!local(item,'title','zh') || !local(item,'title','en')) throw new Error(`Challenge ${item.id} must have zh and en titles.`);
}
write(path.join(outDir,'challenges','index.html'), directoryPage(items,'zh'));
write(path.join(outDir,'en','challenges','index.html'), directoryPage(items,'en'));
for (const item of items) {
  write(path.join(outDir,'challenges',item.id,'index.html'), challengePage(item,'zh'));
  write(path.join(outDir,'en','challenges',item.id,'index.html'), challengePage(item,'en'));
}
const sitemap = appendSitemap(outDir, items);
write(path.join(outDir,'challenge-pages-manifest.json'), JSON.stringify({ version: canonicalData.version, count: items.length, ids:[...ids], localizedPageCount: items.length*2, directoryCount:2, sitemap }, null, 2));
console.log(`Generated ${items.length} bilingual challenge pages (${items.length*2} localized pages) and expanded sitemap from ${sitemap.baseCount} to ${sitemap.totalCount} URLs.`);
