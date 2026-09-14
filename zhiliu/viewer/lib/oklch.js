/**
 * OKLab / OKLCH 色彩换算。零依赖 —— 这个项目不为一次插值引入色彩库。
 *
 * 为什么不是 RGB 线性插值：sRGB 不是感知均匀的。
 * 蓝到红直接在 RGB 里插，中段会塌成灰紫，而且两端到中点的"视觉步长"差很多，
 * 看上去就是"前半段变化慢、后半段突然变"。OKLab 是为感知均匀设计的，
 * 等距的数值差对应大致等距的视觉差。
 *
 * 矩阵取自 Björn Ottosson 的 OKLab 定义。
 */

                                                          

const clamp01 = (x        )         => (x < 0 ? 0 : x > 1 ? 1 : x);

/** sRGB 传输函数（gamma）与其逆。 */
const toLinear = (v        )         =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const toSrgb = (v        )         =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;

export function hexToRgb(hex        )                           {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

export function rgbToHex(r        , g        , b        )         {
  const f = (v        )         =>
    Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

export function rgbToOklch(r        , g        , b        )        {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

/** OKLCH → 线性 sRGB。可能越界（超出 sRGB 色域），由调用方处理。 */
function oklchToLinearRgb({ l: L, c, h }       )                           {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad), B = c * Math.sin(rad);
  const l_ = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return [
    +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
  ];
}

const inGamut = (rgb          )          =>
  rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/**
 * OKLCH → hex，带**色域映射**。
 *
 * 中段的紫在高彩度下会跑出 sRGB。直接 clamp 会让色相偏掉（紫被裁成蓝或洋红），
 * 所以改成**保持 L 和 H、二分降低 C** 直到进色域 —— 宁可这一段不那么鲜艳，
 * 也不要让色相在中途拐弯。
 */
export function oklchToHex(col       )         {
  let rgb = oklchToLinearRgb(col);
  if (!inGamut(rgb)) {
    let lo = 0, hi = col.c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearRgb({ ...col, c: mid }))) lo = mid; else hi = mid;
    }
    rgb = oklchToLinearRgb({ ...col, c: lo });
  }
  return rgbToHex(toSrgb(clamp01(rgb[0])), toSrgb(clamp01(rgb[1])), toSrgb(clamp01(rgb[2])));
}

export const hexToOklch = (hex        )        => rgbToOklch(...hexToRgb(hex));
