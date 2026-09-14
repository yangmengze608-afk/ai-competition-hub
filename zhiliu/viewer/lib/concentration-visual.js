/**
 * 集中度的视觉编码 —— **提案，尚未接进出货路径**。
 *
 * 真人反馈三轮，每一轮都推翻了上一轮：
 *   ① 单层背景 hsla（alpha 0.20→0.44）几乎看不出来；
 *   ② 只把同一个蓝加深还是不够 —— 36 和 80 第一眼仍然分不出；
 *   ③ 端点换成靛青/鹅血石红之后数学对了，但**均匀插值的产品观感不对** ——
 *      看到的是"蓝紫 → 紫 → 品红"，不是"靛青 → 鹅血石红"。
 *
 * 所以这一版的关键改动不在端点，在**插值的形状**：从匀速改成多锚点非匀速。
 *
 * ## 它表达的是什么，不表达什么
 *
 * 颜色只说一件事：**信息分布由"更分散"变成"更集中"**。
 *
 * 这里刻意不用绿→红：绿红是"健康→危险"的文化编码，一上去就变成价值判断，
 * 而集中度不代表好坏（集中可能是你在认真研究一件事，也可能是你被困住了）。
 * 冷→暖只读作"强度在上升"，不读作"情况在变坏"。档位文案也只描述分布形状，
 * 不出现风险/警告/茧房。
 *
 * ## 强度分配（避免看起来像报错）
 *
 *   分数 / 左侧竖轨   最强   —— 小面积、高饱和，承担"一眼可辨"
 *   概念条           次之   —— 高集中度时**主动降饱和**，见 barColor
 *   背景 tint        最弱   —— 大面积，饱和度和 alpha 都压住
 *
 * 大面积高饱和的暖红会被读成 error/warning，所以背景永远只是"有点偏暖"。
 */

import { hexToOklch, oklchToHex, hexToRgb,            } from './oklch.js';

/**
 * 色谱两端用**中国传统色**，不是通用的蓝红。
 *
 *   低集中度  靛青 #1661AB   —— OKLCH L .490 C .137 H 253°
 *   高集中度  鹅血石红 #AB372F —— OKLCH L .506 C .153 H  28°
 *
 * 这两个端点是产品身份的一部分，**不许动**（有测试钉住）。
 */
export const RAMP_LOW = '#1661AB';
export const RAMP_HIGH = '#AB372F';

const LOW = hexToOklch(RAMP_LOW);
const HIGH = hexToOklch(RAMP_HIGH);

/**
 * 色相走哪一边。
 *
 * 253° → 28° 有两条路：
 *   往上（经紫红）135°  —— 靛青 → 蓝 → 蓝紫 → 紫 → 紫红 → 鹅血石红
 *   往下（经绿黄）225°  —— 会穿过绿色和黄色，**禁止**
 *
 * 这里恰好短路径就是对的那条，但仍然**显式写死方向** ——
 * 不能依赖"某个库默认取短路径"这种巧合。
 */
const HUE_SPAN = (HIGH.h - LOW.h + 360) % 360;

/**
 * ## 为什么不能匀速插值
 *
 * 匀速走这 135°，每 1 分就转 1.35°，于是 25 分已经到 287°（明显紫）、
 * 80 分还停在 0.5°（品红）。数学上无可指摘，产品上是错的：
 * **用户在中低分区就已经离开了"靛青"，在高分区又迟迟到不了"鹅血石红"。**
 * 两个传统色都只在端点存在了一瞬间，中间全是紫 —— 那等于没用这两个色。
 *
 * 所以改成**多锚点非匀速**：色相在两端慢、在中段快。
 *
 *   0–35    几乎不动     保住靛青/蓝的身份
 *   35–65   快速穿过     紫只是过渡区，不是落脚点
 *   65–100  进入红系后减速 慢慢收敛到鹅血石红
 *
 * 锚点同时带 L 和 C：中段 C 抬到 .170（紫在这个明度下色域很宽，撑得住），
 * 免得过渡段看起来像褪色；两端保持传统色自己的彩度。
 */
                                                               

/** 五个锚点。`h` 不取模 —— 保持单调递增，插值才不会绕回去。 */
const ANCHORS                    = [
  { t: 0.00, l: LOW.l,  c: LOW.c,  h: LOW.h },                    // 靛青 #1661AB
  { t: 0.25, l: 0.4920, c: 0.1450, h: LOW.h + 11.2 },             // 仍是蓝  #355bb2
  { t: 0.50, l: 0.5000, c: 0.1700, h: LOW.h + 62.2 },             // 紫     #863ca4
  { t: 0.75, l: 0.5030, c: 0.1620, h: LOW.h + 117.2 },            // 已入红系 #ab2e4f
  { t: 1.00, l: HIGH.l, c: HIGH.c, h: LOW.h + HUE_SPAN },         // 鹅血石红 #AB372F
];

/**
 * 单调三次 Hermite（Fritsch–Carlson）。
 *
 * 为什么不是分段直线：锚点处速率会从 0.45°/分 直接跳到 2.0°/分，
 * 渐变带上看得出"先卡住再突然动"的折角。
 *
 * 为什么不是普通样条：普通样条会 overshoot —— 色相冲出锚点区间，
 * 就可能拐进绿色。Fritsch–Carlson 限幅之后**保证单调**，
 * 于是"色相永远待在 253°→388° 之间"是插值本身的性质，不是靠事后检查。
 */
function monotoneSpline(xs                   , ys                   )                        {
  const n = xs.length;
  const d           = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m           = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; }
  }
  return (x        )         => {
    let i = n - 2;
    for (let k = 0; k < n - 1; k++) if (x <= xs[k + 1]) { i = k; break; }
    const h = xs[i + 1] - xs[i];
    const s = (x - xs[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i]
         + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

const TS = ANCHORS.map((a) => a.t);
const splineL = monotoneSpline(TS, ANCHORS.map((a) => a.l));
const splineC = monotoneSpline(TS, ANCHORS.map((a) => a.c));
const splineH = monotoneSpline(TS, ANCHORS.map((a) => a.h));

const lerp = (a        , b        , t        )         => a + (b - a) * t;
const clamp01 = (x        )         => Math.max(0, Math.min(1, x));

/** 锚点的 hex。给 preview 和文档用 —— 报出去的五个色号就是这五个。 */
export const ANCHOR_HEXES                    =
  ANCHORS.map((a) => oklchToHex({ l: a.l, c: a.c, h: ((a.h % 360) + 360) % 360 }));

/** 分数在色谱上的那一点（OKLCH）。 */
export function rampOklch(score        )        {
  const t = clamp01(score / 100);
  return { l: splineL(t), c: splineC(t), h: ((splineH(t) % 360) + 360) % 360 };
}

/** 分数 → hex。端点精确回到 #1661AB / #AB372F。 */
export function rampAt(score        )         {
  const s = Math.max(0, Math.min(100, score));
  // 端点直接返回原色，避免浮点往返带来 1/255 的偏移
  if (s <= 0) return RAMP_LOW.toLowerCase();
  if (s >= 100) return RAMP_HIGH.toLowerCase();
  return oklchToHex(rampOklch(s));
}

/** 在色谱那一点的基础上调整明度/彩度，派生出各通道的颜色。 */
function shift(score        , dL        , dC        )         {
  const base = rampOklch(score);
  return oklchToHex({ l: clamp01(base.l + dL), c: Math.max(0, base.c + dC), h: base.h });
}

/** 背景 tint：同色相但压暗压淡，再套一个很低的 alpha。 */
function tintOf(score        , alpha        )         {
  const hex = shift(score, -0.26, -0.075);
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(3)})`;
}

                                      
                                
                       
                             
                
                                           
                            
                          
                     
                    
                    
                    
                               
                   
                                      
               
                                     
                    
 

/**
 * 文字分档的边界，**按有效概念数 `1/Simpson` 切**，不是按分数拍脑袋。
 *
 *   ≥ 4.0 个   分散
 *   ≥ 2.5 个   主要分布在几个
 *   ≥ 1.5 个   明显集中在少数
 *   < 1.5 个   高度集中在一个
 *
 * 这样每条文案都能被一句话解释清楚（"最近读的内容大致相当于 N 个概念"），
 * 而不是"因为分数过了 50"。上一版只有一条边界在 50，于是 55 和 80
 * 共用同一句文案 —— 颜色差了半条色谱，文字却一模一样。
 */
export const EFFECTIVE_EDGES = [4.0, 2.5, 1.5]         ;
/** 等价的分数边界（`100/effective`）。preview 与测试用。 */
export const LEVEL_EDGES = EFFECTIVE_EDGES.map((e) => 100 / e)                                ;

const LABELS = [
  '分散在多个概念上',
  '主要分布在几个概念上',
  '明显集中在少数概念上',
  '高度集中在一个主要概念上',
];

export function concentrationVisual(score        )                      {
  const s = Math.max(0, Math.min(100, score));
  const t = s / 100;
  const eff = s <= 0 ? Infinity : Math.max(1, 100 / s);
  const level = (eff >= EFFECTIVE_EDGES[0] ? 0
    : eff >= EFFECTIVE_EDGES[1] ? 1
    : eff >= EFFECTIVE_EDGES[2] ? 2 : 3)                 ;

  return {
    level,
    label: LABELS[level],
    effectiveConcepts: Number.isFinite(eff) ? Math.round(eff * 10) / 10 : NaN,
    // 分数：提亮 —— 深色面板上要够读得清，同时它是最抢眼的那个通道
    scoreColor: shift(s, 0.22, 0.01),
    railColor: shift(s, 0.06, 0.012),
    railWidth: Math.round(lerp(2, 5, t)),
    /**
     * 概念条：随集中度**降饱和**，并略微压暗。
     *
     * 高集中度本来就有分数、竖轨、轨道标记三个通道在说话；概念条是面板里
     * 面积第二大的色块，它要是跟着一起冲到满彩度，整块面板会读成 neon/warning ——
     * 而集中度**不是**警告。`t²` 而不是 `t`：低分区几乎不动，只在高分区收。
     */
    barColor: shift(s, -0.02 - 0.020 * t, -0.008 - 0.030 * t * t),
    // 背景是唯一的大面积色块：alpha 封顶 0.18，且已经压暗压淡过
    tint: tintOf(s, 0.10 + 0.08 * t),
    markerPct: s,
  };
}

/**
 * 连续量尺：一条 0→100 的渐变轨道 + 当前位置的标记。
 *
 * 比四段计量条好在两点：它本身是连续的（和颜色一致），
 * 而且它把**映射关系**画了出来 —— 用户看一眼就知道"偏左=分散、偏右=集中"，
 * 不需要记住数字含义。
 *
 * 取样点用 10 个而不是 6 个：色相在 35–65 走得快，6 个点之间 CSS 做的是
 * RGB 线性插值，采样太稀会把我们刚算出来的那条曲线又拉回直线。
 */
export function scaleHtml(v                     )         {
  const stops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    .map((p) => `${rampAt(p)} ${p}%`).join(', ');
  return `<span class="conc-scale" aria-hidden="true">` +
    `<i class="track" style="background:linear-gradient(90deg, ${stops})"></i>` +
    `<i class="mark" style="left:${v.markerPct.toFixed(1)}%;background:${v.scoreColor}"></i>` +
    `</span>`;
}
