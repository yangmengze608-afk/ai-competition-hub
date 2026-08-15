const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.resolve(ROOT, process.env.SEO_BUILD_DIR || '.seo-build');
const DOMAIN = 'https://aisaichang.cn';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'challenges-v1.json'), 'utf8'));
const items = Array.isArray(data.challenges) ? data.challenges : [];
const failures = [];
function fail(m){ failures.push(m); }
function read(p){ if(!fs.existsSync(p)){ fail(`Missing ${path.relative(ROOT,p)}`); return ''; } return fs.readFileSync(p,'utf8'); }
function requireText(text, value, label){ if(!text.includes(value)) fail(`${label} missing ${value}`); }
function locs(xml){ return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]); }
const manifestText = read(path.join(BUILD,'challenge-pages-manifest.json'));
let manifest={}; try{ manifest=JSON.parse(manifestText||'{}'); }catch(e){ fail(`Invalid challenge manifest: ${e.message}`); }
if(manifest.version!==data.version) fail(`Manifest version mismatch: ${manifest.version}`);
if(manifest.count!==items.length) fail(`Manifest count should be ${items.length}`);
if(manifest.localizedPageCount!==items.length*2) fail('Localized challenge page count is wrong');
if(manifest.directoryCount!==2) fail('Challenge directory count should be 2');
const zhDir=read(path.join(BUILD,'challenges','index.html'));
const enDir=read(path.join(BUILD,'en','challenges','index.html'));
requireText(zhDir,'<html lang="zh-CN">','zh directory');
requireText(zhDir,'<h1>创意擂台</h1>','zh directory');
requireText(zhDir,`rel="canonical" href="${DOMAIN}/challenges/"`,'zh directory');
requireText(zhDir,`hreflang="en" href="${DOMAIN}/en/challenges/"`,'zh directory');
requireText(enDir,'<html lang="en">','en directory');
requireText(enDir,'<h1>Idea Challenges</h1>','en directory');
requireText(enDir,`rel="canonical" href="${DOMAIN}/en/challenges/"`,'en directory');
requireText(enDir,`hreflang="zh-CN" href="${DOMAIN}/challenges/"`,'en directory');
for(const item of items){
  const zh=`${DOMAIN}/challenges/${item.id}/`; const en=`${DOMAIN}/en/challenges/${item.id}/`;
  const zhPage=read(path.join(BUILD,'challenges',item.id,'index.html'));
  const enPage=read(path.join(BUILD,'en','challenges',item.id,'index.html'));
  requireText(zhPage,`<link rel="canonical" href="${zh}"` ,`${item.id} zh`);
  requireText(zhPage,`hreflang="en" href="${en}"`,`${item.id} zh`);
  requireText(zhPage,'打开 Challenge 并接题',`${item.id} zh`);
  requireText(zhPage,'发布一个 Idea 不会自动获得其他参与者作品的代码、版权或商业权益',`${item.id} zh`);
  requireText(enPage,`<link rel="canonical" href="${en}"`,`${item.id} en`);
  requireText(enPage,`hreflang="zh-CN" href="${zh}"`,`${item.id} en`);
  requireText(enPage,'Open Challenge & Build This Idea',`${item.id} en`);
  requireText(enPage,'Posting an idea does not automatically grant ownership',`${item.id} en`);
  requireText(zhDir,`/challenges/${item.id}/`,'zh directory');
  requireText(enDir,`/en/challenges/${item.id}/`,'en directory');
}
const sitemap=read(path.join(BUILD,'sitemap.xml'));
const locations=locs(sitemap);
if(manifest.sitemap?.totalCount!==locations.length) fail(`Manifest sitemap total ${manifest.sitemap?.totalCount} != actual ${locations.length}`);
if(manifest.sitemap?.addedCount!==items.length*2+2) fail('Challenge sitemap should add two directories plus two URLs per challenge');
if(new Set(locations).size!==locations.length) fail('Sitemap contains duplicate locations after challenge generation');
for(const item of items){
  const zh=`${DOMAIN}/challenges/${item.id}/`; const en=`${DOMAIN}/en/challenges/${item.id}/`;
  requireText(sitemap,`<loc>${zh}</loc>`,'sitemap');
  requireText(sitemap,`<loc>${en}</loc>`,'sitemap');
  const enBlock=sitemap.match(new RegExp(`<url><loc>${en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}<\\/loc>[\\s\\S]*?<\\/url>`))?.[0]||'';
  requireText(enBlock,`hreflang="zh-CN" href="${zh}"`,`${item.id} English sitemap block`);
  requireText(enBlock,`hreflang="en" href="${en}"`,`${item.id} English sitemap block`);
}
if(failures.length){ failures.forEach(x=>console.error(`- ${x}`)); process.exit(1); }
console.log(`Challenge SEO audit passed: ${items.length} shared challenges, ${items.length*2} localized pages, 2 directories, ${locations.length} total sitemap URLs.`);
