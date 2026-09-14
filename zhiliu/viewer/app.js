/**
 * 知流 Web Viewer —— 查看端，只读。
 *
 * 三条边界，写在最前面免得后来被"顺手"突破：
 *   1. 所有数据处理都在浏览器里。没有 fetch 到任何后端，没有 localStorage 落盘。
 *   2. 只显示导入的东西，不采集、不补全、不猜。
 *   3. 口径必须和扩展一致 —— 同一份数据在两处不能给出两个分数。
 */
import { buildAggregates, MIN_SAMPLES, WINDOW_SIZE } from './lib/aggregate.js';
import { parseEvents, ImportError } from './lib/parse.js';
import { concentrationVisual, rampAt } from './lib/concentration-visual.js';

const $ = (id) => document.getElementById(id);
const ARROW = { up: '↑', down: '↓', flat: '—' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 当前载入的数据。**只在内存里** —— 刷新页面就没了，这是刻意的。 */
let state = { events: [], report: null, sourceName: null, isDemo: false };

// ────────────────────────── 渲染 ──────────────────────────

function renderPanel() {
  const panel = $('panel');
  const { events } = state;

  if (events.length === 0) {
    panel.style.cssText = '';
    panel.innerHTML =
      `<div class="head"><span class="brand">知流 · 最近信息</span></div>` +
      `<div class="caption">还没有载入数据</div>`;
    return;
  }

  const agg = buildAggregates(events);
  const conc = agg.concentration;
  const score = conc.state === 'ready' && Number.isFinite(conc.score) ? conc.score : null;
  const cv = score !== null ? concentrationVisual(score) : null;

  // 四个通道一次性写成 CSS 变量，模板里只引用变量 —— 和扩展同一套做法
  panel.style.setProperty('--tint', cv ? cv.tint : 'rgba(0,0,0,0)');
  panel.style.setProperty('--conc-score', cv ? cv.scoreColor : '#eaf0f7');
  panel.style.setProperty('--conc-rail', cv ? cv.railColor : 'transparent');
  panel.style.setProperty('--conc-rail-w', cv ? `${cv.railWidth}px` : '0px');
  panel.style.setProperty('--conc-bar', cv ? cv.barColor : '#5b8ac9');

  /**
   * 来源徽标**失败时必须倒向「演示数据」**。
   * 这一条是扩展里踩过的真 bug：字段缺失时相加得到 NaN，所有分支都不成立，
   * 于是徽标整个消失 —— 演示数据看起来就像真实分析。宁可误标演示，不可误标真实。
   */
  const b = agg.sourceBreakdown;
  const nums = [b.llm, b.mock, b.demo, b.enriched, b.other];
  const allFinite = nums.every((n) => Number.isFinite(n));
  const synthetic = !allFinite || state.isDemo || b.mock > 0 || b.demo > 0;
  const badge = synthetic
    ? `<span class="badge demo">演示数据</span>`
    : b.llm > 0 ? `<span class="badge">AI 分析</span>` : '';

  const bars = agg.concepts.slice(0, 4).map((c) => {
    const pct = Math.round(c.share * 100);
    return `<div class="bar-row">
      <span class="label" title="${esc(c.label)}">${esc(c.label)}</span>
      <span class="bar"><i style="width:${Math.max(2, pct)}%"></i></span>
      <span class="pct">${pct}%</span>
      <span class="arrow">${ARROW[c.direction]}</span>
    </div>`;
  }).join('');

  let body;
  if (score === null) {
    // 分数拿不到时退回积累态，绝不渲染 null
    body = `<div class="notice">数据积累中 · 已记录 ${conc.sampleCount ?? agg.sampleCount}/${MIN_SAMPLES} 篇<br>
      不足 ${MIN_SAMPLES} 篇不出集中度 —— 样本太少时给一个数比不给更误导</div>`;
  } else {
    const stops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      .map((p) => `${rampAt(p)} ${p}%`).join(', ');
    body = `<div class="score">
        <span>信息集中度${conc.preliminary ? '<span class="prelim">初步</span>' : ''}</span><b>${score}</b>
      </div>
      <span class="conc-scale" aria-hidden="true">
        <i class="track" style="background:linear-gradient(90deg, ${stops})"></i>
        <i class="mark" style="left:${score.toFixed(1)}%;background:${cv.scoreColor}"></i>
      </span>
      <div class="conc-label">${esc(cv.label)}<span class="eff"> · 约 ${cv.effectiveConcepts} 个有效概念</span></div>
      <div class="score-note">${conc.preliminary
        ? `样本未满 ${WINDOW_SIZE} 篇，这是初步值，不要和满窗口的分数直接比较`
        : '不代表好坏，只描述最近读的内容是否集中在少数几个概念上'}</div>`;
  }

  const pending = agg.pendingCount > 0
    ? `<div class="notice">${agg.pendingCount} 篇已记录但未产出概念（分析中 / 歧义），不计入统计</div>` : '';

  panel.innerHTML =
    `<div class="head"><span class="brand">知流 · 最近信息</span>${badge}</div>` +
    `<div class="caption">最近 ${agg.sampleCount} 篇里，各核心概念出现的占比</div>` +
    bars + body + pending;
}

/** 阅读时长。不足一分钟按秒 —— 全部四舍五入成"1 分钟"等于没有信息。 */
function fmtDuration(ms) {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return '';
  if (ms < 60_000) return `${Math.round(ms / 1000)} 秒`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s === 0 ? `${m} 分钟` : `${m} 分 ${s} 秒`;
}

function renderList() {
  const list = $('list');
  const { events } = state;
  if (events.length === 0) {
    $('list-head').textContent = '最近阅读';
    list.innerHTML = `<div class="empty">还没有数据。点上面的「载入演示数据」，或导入一份 JSON。</div>`;
    return;
  }

  // 倒序显示：最近读的在最上面。统计用的是升序，这里只是展示。
  const rows = [...events].reverse();
  $('list-head').textContent = `最近阅读 · 共 ${rows.length} 条`;

  list.innerHTML = rows.map((e) => {
    const when = e.timestamp === null ? '<span title="这条记录没有时间戳">时间未知</span>'
      : new Date(e.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    // 概念色按它在色谱上的位置取，只是让列表和面板看起来是同一套东西；
    // 这里**不**表达集中度，所以用固定的靛青端附近，不随分数变
    const chips = e.concepts.length
      ? e.concepts.map((c, i) => `<span class="chip" style="background:${rampAt(12 + i * 26)}">${esc(c.label)}</span>`).join('')
      : `<span class="chip none">${e.ambiguous ? '判为无明确核心概念' : '未产出概念'}</span>`;
    const title = e.url
      ? `<a class="t" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)}</a>`
      : `<span class="t plain">${esc(e.title)}</span>`;
    const mins = fmtDuration(e.duration);
    return `<div class="item">
      <span class="when">${when}</span>
      <span class="main">${title}<span class="chips">${chips}</span></span>
      <span class="meta">${mins}</span>
    </div>`;
  }).join('');
}

function renderStatus(extra) {
  const s = $('status');
  if (!state.report) { s.className = 'status'; s.innerHTML = extra ?? ''; return; }
  const r = state.report;
  const notes = [];
  if (r.withoutConcepts > 0) notes.push(`${r.withoutConcepts} 条没有概念（分析中 / 歧义 / 失败），不计入统计`);
  if (r.withoutTimestamp > 0) notes.push(`${r.withoutTimestamp} 条没有时间戳，已排在最前，可能落在 20 篇窗口之外`);
  if (r.dropped.length > 0) notes.push(`${r.dropped.length} 条无法解析已丢弃：${r.dropped.slice(0, 3).map((d) => `#${d.i} ${d.why}`).join('；')}`);
  if (r.unknownStatus.length > 0) notes.push(`出现了没见过的 analysisStatus：${r.unknownStatus.join(', ')}`);
  s.className = 'status';
  s.innerHTML = `当前数据源：<b>${esc(state.sourceName)}</b> · 读入 ${r.total} 条，可用 ${r.kept} 条` +
    (notes.length ? `<ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '');
}

function render(extra) { renderPanel(); renderList(); renderStatus(extra); }

function fail(msg) {
  state = { events: [], report: null, sourceName: null, isDemo: false };
  renderPanel(); renderList();
  const s = $('status');
  s.className = 'status err';
  s.innerHTML = `导入失败：${esc(msg)}`;
}

// ────────────────────────── 数据入口 ──────────────────────────

function load(json, sourceName, isDemo) {
  try {
    const { events, report } = parseEvents(json);
    if (events.length === 0) return fail('这份 JSON 里没有任何可用记录。');
    state = { events, report, sourceName, isDemo };
    render();
  } catch (err) {
    fail(err instanceof ImportError ? err.message : `JSON 解析出错 —— ${err.message}`);
  }
}

async function loadDemo() {
  try {
    const resp = await fetch('./samples/demo-events.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    load(await resp.json(), '演示数据（合成，非真人记录）', true);
  } catch (err) {
    // file:// 直接打开时 fetch 会被 CORS 挡掉 —— 说清楚该怎么办，不要只说"失败"
    fail(`读不到演示数据（${err.message}）。`
      + `如果你是用 file:// 直接打开这个页面，浏览器会拦掉本地读取 —— 请改用 npm start 起一个本地服务器。`);
  }
}

function readFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let json;
    try { json = JSON.parse(reader.result); }
    catch (e) { return fail(`${file.name} 不是合法的 JSON —— ${e.message}`); }
    load(json, file.name, false);
  };
  reader.onerror = () => fail(`读不了 ${file.name}`);
  reader.readAsText(file);
}

$('btn-demo').addEventListener('click', loadDemo);
$('file').addEventListener('change', (e) => readFile(e.target.files[0]));
$('btn-sample').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = './samples/minimal-events.json';
  a.download = 'zhiliu-events-example.json';
  a.click();
});

const drop = $('drop');
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => {
  e.preventDefault(); drop.classList.add('over');
}));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  readFile(e.dataTransfer.files[0]);
});

/**
 * `#demo` 直接载入演示数据。
 *
 * 为的是让分享出去的预览链接一打开就有东西看 —— 落在一个空面板上，
 * 对方还得先猜该点哪个按钮。**只认这一个 hash**，不从 URL 读任何数据。
 */
// hash 也可能在页面加载**之后**才被加上（换个 URL 打开同一个标签页），
// 所以这里既在启动时看一次，也监听 hashchange。
addEventListener('hashchange', () => { if (location.hash === '#demo') loadDemo(); });
if (location.hash === '#demo') loadDemo(); else render();
