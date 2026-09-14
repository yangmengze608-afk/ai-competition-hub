/**
 * 导入的 JSON → 规整后的 ReadEvent 数组。
 *
 * **入口处一次性堵住坏数据**，不指望每个消费者都记得判空 ——
 * 这条是从扩展的 `storage.ts` 抄过来的：单条记录缺 concepts 字段
 * （schema 迁移、有人在 DevTools 里手改）会让下游直接抛 TypeError。
 *
 * 这里比扩展多做一件事：**容忍三种外壳**。用户手上的 JSON 可能来自
 *   1. `copy(await chrome.storage.local.get('zhiliu.events.v2'))` → `{ "zhiliu.events.v2": [...] }`
 *   2. `copy((await chrome.storage.local.get(K))[K])`             → `[...]`
 *   3. 本项目 samples/ 里带说明字段的封装                            → `{ events: [...] }`
 * 三种都认，省得用户为了看个图先去改 JSON。
 */

/** 扩展里的 analysisStatus 取值。 */
const KNOWN_STATUS = new Set(['llm', 'mock', 'demo', 'zhihu_enriched', 'ungrounded', 'failed', 'grounded']);

export class ImportError extends Error {}

/** 从任意一种外壳里取出事件数组。取不到就明说是哪种形状不认，不要静默返回空。 */
export function unwrap(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    for (const key of ['zhiliu.events.v2', 'events', 'records', 'data']) {
      if (Array.isArray(json[key])) return json[key];
    }
    const arrays = Object.entries(json).filter(([, v]) => Array.isArray(v));
    if (arrays.length === 1) return arrays[0][1];
    throw new ImportError(
      `认不出这份 JSON 的结构。期望是一个数组，或者一个含 "zhiliu.events.v2" / "events" 字段的对象；` +
      `实际拿到的顶层字段是：${Object.keys(json).slice(0, 8).join(', ') || '(空对象)'}`,
    );
  }
  throw new ImportError(`期望 JSON 是数组或对象，实际是 ${json === null ? 'null' : typeof json}`);
}

const isObj = (x) => typeof x === 'object' && x !== null;

/**
 * 规整一条记录。
 *
 * 概念名同时认 `canonical`（扩展实际存的）和 `label`（早期文档里的写法）。
 * 时间同时认 `timestamp`（扩展实际存的）和 `readAt`。
 * 这不是纵容脏数据 —— 是因为这两组名字在知流自己的文档里都出现过，
 * 用户照着文档导出来的东西必须能直接看。
 */
export function normalizeEvent(raw, i) {
  const concepts = Array.isArray(raw.concepts)
    ? raw.concepts.filter(isObj).map((c) => ({
        label: typeof c.canonical === 'string' ? c.canonical : (typeof c.label === 'string' ? c.label : ''),
        confidence: typeof c.confidence === 'number' ? c.confidence : 0,
      })).filter((c) => c.label)
    : [];

  const ts = typeof raw.timestamp === 'number' ? raw.timestamp
    : typeof raw.readAt === 'number' ? raw.readAt
    : null;

  const contentType = raw.contentType === 'article' || raw.contentType === 'answer' ? raw.contentType : 'unknown';
  const contentId = typeof raw.contentId === 'string' ? raw.contentId : undefined;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `no-id-${i}`,
    contentId,
    contentType,
    title: typeof raw.title === 'string' ? raw.title : '(无标题)',
    timestamp: ts,
    duration: typeof raw.duration === 'number' ? raw.duration : null,
    concepts,
    // 保留 canonical 别名，聚合层两种都读
    analysisStatus: typeof raw.analysisStatus === 'string' ? raw.analysisStatus : 'unknown',
    ambiguous: raw.ambiguous === true,
    /**
     * 事件里**没有 url 字段** —— 扩展只存公开内容 id。
     * 所以链接是这里拼出来的，拼不出来就不给链接，不编一个。
     */
    url: typeof raw.url === 'string' ? raw.url
      : contentId && contentType === 'answer' ? `https://www.zhihu.com/answer/${contentId}`
      : contentId && contentType === 'article' ? `https://zhuanlan.zhihu.com/p/${contentId}`
      : null,
  };
}

/** 导入主入口。返回事件 + 一份如实的导入报告（不把丢弃的记录藏起来）。 */
export function parseEvents(json) {
  const list = unwrap(json);
  const kept = [];
  const dropped = [];
  list.forEach((raw, i) => {
    if (!isObj(raw)) { dropped.push({ i, why: '不是对象' }); return; }
    const e = normalizeEvent(raw, i);
    if (e.timestamp === null) dropped.push({ i, why: '缺 timestamp / readAt，无法排序' });
    kept.push(e);
  });

  // 按时间升序 —— 聚合用 slice(-20) 取"最近"，顺序错了窗口就取错了。
  // 没有时间戳的排在最前，宁可让它落在窗口之外，也不要让它冒充最新的一篇。
  kept.sort((a, b) => (a.timestamp ?? -Infinity) - (b.timestamp ?? -Infinity));

  const unknownStatus = [...new Set(kept.map((e) => e.analysisStatus))].filter((s) => !KNOWN_STATUS.has(s));

  return {
    events: kept,
    report: {
      total: list.length,
      kept: kept.length,
      withoutConcepts: kept.filter((e) => e.concepts.length === 0).length,
      withoutTimestamp: kept.filter((e) => e.timestamp === null).length,
      dropped,
      unknownStatus,
    },
  };
}
