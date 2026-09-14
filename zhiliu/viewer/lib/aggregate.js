/**
 * 聚合与集中度 —— 从知流扩展的 `packages/core` 移植。
 *
 * 为什么是移植而不是引用：Web Viewer 是**独立项目**，不能依赖 v1.2.0 那个仓库
 * （它已经 FINAL FREEZE）。这里保留了原实现里几条不显然但很重要的约束，
 * 每一条下面都写了理由 —— 抄过来却把理由丢掉，下次就会有人"顺手优化"掉它。
 *
 * 口径必须和扩展一致，否则同一份数据在两个地方会给出两个分数。
 */

/** 统计窗口：最近 N 篇有效阅读。固定不变 —— 这是分数可比的前提。 */
export const WINDOW_SIZE = 20;
/** 低于此篇数完全不出分：样本太少时给一个数比不给更误导。 */
export const MIN_SAMPLES = 10;
/** 达到此篇数才算正式分数；之间标记为「初步」。 */
export const FULL_SAMPLES = 20;
/** 趋势分段长度：最近 10 篇 vs 再往前 10 篇。 */
export const TREND_SEGMENT = 10;
/** 出现率差多少才算涨/跌。 */
export const TREND_THRESHOLD = 0.40;

/** 能进入统计的记录：有概念、非歧义、分析没失败。 */
export function statEvents(events) {
  // Array.isArray 不是多余的：损坏或迁移遗留的记录可能整个缺 concepts 字段，
  // 直接读 .length 会抛 TypeError。
  return events.filter(
    (e) => Array.isArray(e?.concepts) && e.concepts.length > 0 && !e.ambiguous && e.analysisStatus !== 'failed',
  );
}

const conceptsOf = (e) => (Array.isArray(e?.concepts) ? e.concepts : []);
/** 兼容两种字段名：扩展存的是 canonical，早期文档里写过 label。 */
const nameOf = (c) => c?.canonical ?? c?.label ?? '';

/** 某概念出现在这段文章里的**篇数**。趋势用整数比较，避免浮点误差。 */
function countIn(events, name) {
  return events.filter((e) => conceptsOf(e).some((c) => nameOf(c) === name)).length;
}
function prevalenceIn(events, name) {
  return events.length === 0 ? 0 : countIn(events, name) / events.length;
}

/**
 * 每篇文章对总体统计的贡献恒为 1，再平均分给它的概念。
 *
 * 这条约束是刻意的：否则"被提取出 3 个概念的文章"会比"只有 1 个概念的文章"
 * 对历史产生 3 倍影响，而概念数量只反映模型的犹豫程度，不反映阅读量。
 */
export function buildDistribution(events, windowSize = WINDOW_SIZE) {
  const window = events.slice(-windowSize).filter((e) => conceptsOf(e).length > 0);
  const weights = new Map();
  for (const e of window) {
    const cs = conceptsOf(e);
    const per = 1 / cs.length;
    for (const c of cs) {
      const n = nameOf(c);
      if (n) weights.set(n, (weights.get(n) ?? 0) + per);
    }
  }
  const total = [...weights.values()].reduce((s, v) => s + v, 0);
  const shares = new Map();
  if (total > 0) for (const [k, v] of weights) shares.set(k, v / total);
  return { shares, sampleCount: window.length };
}

/**
 * Simpson 集中度：从窗口内随机抽两次概念暴露，抽到同一个的概率 ×100。
 * 值域 [100/K, 100]，K 为窗口内出现的概念数。
 */
export function concentration(dist) {
  if (dist.sampleCount < MIN_SAMPLES) {
    return { state: 'collecting', sampleCount: dist.sampleCount, needed: MIN_SAMPLES };
  }
  const ps = [...dist.shares.values()].filter((p) => p > 0);
  if (ps.length === 0) {
    return { state: 'collecting', sampleCount: dist.sampleCount, needed: MIN_SAMPLES };
  }
  let c = 0;
  for (const p of ps) c += p * p;
  return {
    state: 'ready',
    score: Math.max(0, Math.min(100, Math.round(100 * c))),
    preliminary: dist.sampleCount < FULL_SAMPLES,
    sampleCount: dist.sampleCount,
    conceptCount: ps.length,
  };
}

/**
 * 用整数篇数判定方向，规避浮点比较。
 *
 * 段长 10 时 0.8-1.0 会得到 -0.19999999999999996，与 -0.2 比较判成 flat，
 * 而 0.4-0.2 得到的 0.2 却判成 up —— 同一个差值两种结果。
 */
export function trendDirection(recentN, priorN, recentCount, priorCount) {
  if (recentN === 0 || priorN === 0) return 'flat';
  const lhs = recentCount * priorN - priorCount * recentN;
  const rhs = TREND_THRESHOLD * recentN * priorN;
  if (lhs >= rhs - 1e-9) return 'up';
  if (lhs <= -rhs + 1e-9) return 'down';
  return 'flat';
}

export function buildAggregates(all, windowSize = WINDOW_SIZE) {
  const window = all.slice(-windowSize);
  const stat = statEvents(window);
  const recent = stat.slice(-TREND_SEGMENT);
  const prior = stat.slice(-TREND_SEGMENT * 2, -TREND_SEGMENT);

  const byConcept = new Map();
  for (const e of stat) {
    const cs = conceptsOf(e);
    const per = 1 / cs.length;
    for (const c of cs) {
      const n = nameOf(c);
      if (!n) continue;
      const cur = byConcept.get(n) ?? { weight: 0, count: 0 };
      cur.weight += per;
      cur.count += 1;
      byConcept.set(n, cur);
    }
  }
  const total = [...byConcept.values()].reduce((s, v) => s + v.weight, 0);

  const concepts = [...byConcept.entries()].map(([label, v]) => ({
    label,
    articleCount: v.count,
    // share 保留完整精度：在这里四舍五入会让各项之和变成 1.001，
    // 面板上就会出现"占比加起来 101%"。取整是展示层的事。
    share: total > 0 ? v.weight / total : 0,
    // 前段没有数据时不谈趋势 ——「从无到有」不是上升，是刚开始记录
    direction: prior.length === 0 ? 'flat'
      : trendDirection(recent.length, prior.length, countIn(recent, label), countIn(prior, label)),
  })).sort((a, b) => b.share - a.share || a.label.localeCompare(b.label));

  return {
    concepts,
    concentration: concentration(buildDistribution(stat, windowSize)),
    sampleCount: stat.length,
    /** 窗口里已记录但没产出概念的条数（分析中 / 歧义 / 失败） */
    pendingCount: window.length - stat.length,
    sourceBreakdown: {
      llm: stat.filter((e) => e.analysisStatus === 'llm').length,
      mock: stat.filter((e) => e.analysisStatus === 'mock').length,
      demo: stat.filter((e) => e.analysisStatus === 'demo').length,
      enriched: stat.filter((e) => e.analysisStatus === 'zhihu_enriched').length,
      other: stat.filter((e) => !['llm', 'mock', 'demo', 'zhihu_enriched'].includes(e.analysisStatus)).length,
    },
  };
}
