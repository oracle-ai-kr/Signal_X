// ════════════════════════════════════════════════════════════
//  SIGNAL X — Analysis Engine v1.0
//  공용 분석 모듈 (sx_screener / sx_backtester 공유)
//  13 지표모듈 + 7 고급엔진 + 점수산출 + 안전필터 + 스마트필터
// ════════════════════════════════════════════════════════════

// ── 유틸 ──
const SXE = {}; // namespace

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function sma(arr, period) {
  if (arr.length < period) return null;
  let sum = 0;
  for (let i = arr.length - period; i < arr.length; i++) sum += arr[i];
  return sum / period;
}

function ema(arr, period) {
  if (arr.length < period) return null;
  const k = 2 / (period + 1);
  let e = sma(arr.slice(0, period), period);
  for (let i = period; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}

function smaArray(arr, period) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let s = 0; for (let j = i - period + 1; j <= i; j++) s += arr[j];
    result.push(s / period);
  }
  return result;
}

function emaArray(arr, period) {
  const result = [];
  const k = 2 / (period + 1);
  let e = null;
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (i === period - 1) { let s = 0; for (let j = 0; j < period; j++) s += arr[j]; e = s / period; result.push(e); continue; }
    e = arr[i] * k + e * (1 - k);
    result.push(e);
  }
  return result;
}

// ── TF 설정 ──
const SHORT_TFS_SET = new Set(['5m', '15m', '30m', '60m']);
const SCR_TF_THRESHOLD = {
  '5m': { buy: 66, sell: 34 }, '15m': { buy: 65, sell: 35 }, '30m': { buy: 64, sell: 36 },
  '60m': { buy: 63, sell: 37 }, 'day': { buy: 62, sell: 38 }, 'week': { buy: 62, sell: 38 }, 'month': { buy: 62, sell: 38 },
  'D': { buy: 62, sell: 38 }, 'W': { buy: 62, sell: 38 }, 'M': { buy: 62, sell: 38 },
  '240m': { buy: 63, sell: 37 },
};
const SCR_TF_MA = {
  '5m': { short: 12, mid: 48, long: 288, xlong: 576 }, '15m': { short: 8, mid: 32, long: 96, xlong: 192 },
  '30m': { short: 8, mid: 26, long: 48, xlong: 96 }, '60m': { short: 8, mid: 24, long: 60, xlong: 120 },
  'day': { short: 5, mid: 20, long: 60, xlong: 120 }, 'week': { short: 5, mid: 13, long: 26, xlong: 52 },
  'month': { short: 3, mid: 6, long: 12, xlong: 24 }, '240m': { short: 8, mid: 24, long: 60, xlong: 120 },
  'D': { short: 5, mid: 20, long: 60, xlong: 120 }, 'W': { short: 5, mid: 13, long: 26, xlong: 52 },
  'M': { short: 3, mid: 6, long: 12, xlong: 24 },
};
const SCR_SCORING = { tanh: 1.15, ctx: 0.75 };

function _scrTfTh(tf) { return SCR_TF_THRESHOLD[tf] || SCR_TF_THRESHOLD['day']; }
function _scrTfMa(tf) { return SCR_TF_MA[tf] || SCR_TF_MA['day']; }

// ── 커스텀 분석 파라미터 ──
const SCR_ANAL_PARAMS_KEY = 'SX_SCR_ANAL_PARAMS';
const SCR_ANAL_DEFAULTS = { rsiLen: 14, bbLen: 20, bbMult: 2.0, maShort: 0, maMid: 0, maLong: 0, atrLen: 14, buyTh: 0, sellTh: 0 };

function _loadAnalParams() {
  try { const r = JSON.parse(localStorage.getItem(SCR_ANAL_PARAMS_KEY)); if (r) return { ...SCR_ANAL_DEFAULTS, ...r }; } catch (_) {}
  return { ...SCR_ANAL_DEFAULTS };
}
function _saveAnalParams(p) { localStorage.setItem(SCR_ANAL_PARAMS_KEY, JSON.stringify(p)); }

function _getEffectiveTh(tf) {
  const p = _loadAnalParams();
  const base = _scrTfTh(tf);
  return { buyTh: p.buyTh > 0 ? p.buyTh : base.buy, sellTh: p.sellTh > 0 ? p.sellTh : base.sell };
}

// ════════════════════════════════════════════════════════════
//  지표 모듈 (13개)
// ════════════════════════════════════════════════════════════

const RSI = {
  calc(closes, period = 14) {
    let g = 0, l = 0;
    for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) g += d; else l -= d; }
    let ag = g / period, al = l / period;
    const arr = new Array(closes.length).fill(null);
    arr[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
      al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
      arr[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    }
    return arr;
  },
  signal(val) {
    if (val <= 25) return { type: 'buy', strength: 'strong' };
    if (val <= 35) return { type: 'buy', strength: 'normal' };
    if (val >= 75) return { type: 'sell', strength: 'strong' };
    if (val >= 65) return { type: 'sell', strength: 'normal' };
    return null;
  },
  divergence(closes, rsiArr) {
    const n = closes.length;
    if (n < 30) return null;
    const seg = Math.min(20, Math.floor(n * 0.15));
    const recent = closes.slice(-seg), rsiRecent = rsiArr.slice(-seg).filter(v => v != null);
    const prev = closes.slice(-seg * 2, -seg), rsiPrev = rsiArr.slice(-seg * 2, -seg).filter(v => v != null);
    if (!rsiRecent.length || !rsiPrev.length) return null;
    const pHL = Math.min(...recent) < Math.min(...prev), rsiHL = Math.min(...rsiRecent) > Math.min(...rsiPrev);
    if (pHL && rsiHL) return 'bullish';
    const pHH = Math.max(...recent) > Math.max(...prev), rsiHH = Math.max(...rsiRecent) < Math.max(...rsiPrev);
    if (pHH && rsiHH) return 'bearish';
    return null;
  }
};

const MACD = {
  calc(closes, fast = 12, slow = 26, sig = 9) {
    const emaF = emaArray(closes, fast), emaS = emaArray(closes, slow);
    const line = [], hist = [];
    for (let i = 0; i < closes.length; i++) {
      if (emaF[i] == null || emaS[i] == null) { line.push(0); hist.push(0); continue; }
      line.push(emaF[i] - emaS[i]); hist.push(0);
    }
    const sigArr = emaArray(line, sig);
    for (let i = 0; i < line.length; i++) hist[i] = sigArr[i] != null ? line[i] - sigArr[i] : 0;
    return { line, sig: sigArr, hist };
  },
  signal(hist, prevHist) {
    if (hist > 0 && prevHist <= 0) return { type: 'buy', strength: 'strong' };
    if (hist > 0 && hist > prevHist) return { type: 'buy', strength: 'normal' };
    if (hist < 0 && prevHist >= 0) return { type: 'sell', strength: 'strong' };
    if (hist < 0 && hist < prevHist) return { type: 'sell', strength: 'normal' };
    return null;
  }
};

const Stochastic = {
  calc(rows, kP = 14, dP = 3) {
    const n = rows.length;
    if (n < kP) return { k: 50, d: 50, prevK: 50, prevD: 50 };
    const kArr = [];
    for (let i = kP - 1; i < n; i++) {
      let hi = -Infinity, lo = Infinity;
      for (let j = i - kP + 1; j <= i; j++) { hi = Math.max(hi, rows[j].high); lo = Math.min(lo, rows[j].low); }
      kArr.push(hi === lo ? 50 : (rows[i].close - lo) / (hi - lo) * 100);
    }
    const dArr = smaArray(kArr, dP);
    const k = kArr[kArr.length - 1] ?? 50, d = dArr[dArr.length - 1] ?? 50;
    const prevK = kArr.length >= 2 ? kArr[kArr.length - 2] : k, prevD = dArr.length >= 2 ? dArr[dArr.length - 2] : d;
    return { k, d, prevK, prevD };
  },
  signal(k, d) {
    if (k < 20 && k > d) return { type: 'buy', strength: 'strong' };
    if (k < 30 && k > d) return { type: 'buy', strength: 'normal' };
    if (k > 80 && k < d) return { type: 'sell', strength: 'strong' };
    if (k > 70 && k < d) return { type: 'sell', strength: 'normal' };
    return null;
  }
};

const CCI = {
  calc(rows, period = 20) {
    const n = rows.length;
    if (n < period) return 0;
    const tp = []; for (let i = 0; i < n; i++) tp.push((rows[i].high + rows[i].low + rows[i].close) / 3);
    const m = sma(tp, period);
    if (m == null) return 0;
    let md = 0; for (let i = n - period; i < n; i++) md += Math.abs(tp[i] - m);
    md /= period;
    return md === 0 ? 0 : (tp[n - 1] - m) / (0.015 * md);
  },
  signal(val) {
    if (val <= -200) return { type: 'buy', strength: 'strong' };
    if (val <= -100) return { type: 'buy', strength: 'normal' };
    if (val >= 200) return { type: 'sell', strength: 'strong' };
    if (val >= 100) return { type: 'sell', strength: 'normal' };
    return null;
  }
};

const ADX = {
  calc(rows, period = 14) {
    const n = rows.length;
    if (n < period + 1) return { adx: 0, pdi: 0, mdi: 0 };
    let atr = 0, pDM = 0, mDM = 0;
    for (let i = 1; i <= period; i++) {
      const h = rows[i].high - rows[i - 1].high, l = rows[i - 1].low - rows[i].low;
      pDM += (h > l && h > 0) ? h : 0;
      mDM += (l > h && l > 0) ? l : 0;
      atr += Math.max(rows[i].high - rows[i].low, Math.abs(rows[i].high - rows[i - 1].close), Math.abs(rows[i].low - rows[i - 1].close));
    }
    for (let i = period + 1; i < n; i++) {
      const h = rows[i].high - rows[i - 1].high, l = rows[i - 1].low - rows[i].low;
      const tr = Math.max(rows[i].high - rows[i].low, Math.abs(rows[i].high - rows[i - 1].close), Math.abs(rows[i].low - rows[i - 1].close));
      atr = atr - atr / period + tr;
      pDM = pDM - pDM / period + ((h > l && h > 0) ? h : 0);
      mDM = mDM - mDM / period + ((l > h && l > 0) ? l : 0);
    }
    const pdi = atr > 0 ? (pDM / atr) * 100 : 0, mdi = atr > 0 ? (mDM / atr) * 100 : 0;
    const dx = (pdi + mdi) > 0 ? Math.abs(pdi - mdi) / (pdi + mdi) * 100 : 0;
    return { adx: dx, pdi, mdi };
  },
  signal(adx, pdi, mdi) {
    if (adx > 25 && pdi > mdi) return { type: 'buy', strength: adx > 40 ? 'strong' : 'normal' };
    if (adx > 25 && mdi > pdi) return { type: 'sell', strength: adx > 40 ? 'strong' : 'normal' };
    return null;
  }
};

const OBV = {
  calc(rows) {
    let val = 0;
    const arr = [0];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].close > rows[i - 1].close) val += rows[i].volume;
      else if (rows[i].close < rows[i - 1].close) val -= rows[i].volume;
      arr.push(val);
    }
    const sig = sma(arr, 20) ?? val;
    const trend = val > sig ? 'up' : val < sig ? 'down' : 'flat';
    const divergence = rows.length >= 20 && rows[rows.length - 1].close < rows[rows.length - 10].close && val > arr[arr.length - 10];
    return { val, sig, arr, trend, divergence };
  },
  signal(val, sig) {
    if (val > sig * 1.05) return { type: 'buy', strength: 'normal' };
    if (val < sig * 0.95) return { type: 'sell', strength: 'normal' };
    return null;
  },
  divergence(rows) {
    const n = rows.length;
    if (n < 30) return null;
    const seg = Math.min(15, Math.floor(n * 0.12));
    const recentP = rows.slice(-seg).map(r => r.close), prevP = rows.slice(-seg * 2, -seg).map(r => r.close);
    if (!recentP.length || !prevP.length) return null;
    let ov = 0; const oArr = [0];
    for (let i = 1; i < n; i++) {
      if (rows[i].close > rows[i - 1].close) ov += rows[i].volume;
      else if (rows[i].close < rows[i - 1].close) ov -= rows[i].volume;
      oArr.push(ov);
    }
    const recentO = oArr.slice(-seg), prevO = oArr.slice(-seg * 2, -seg);
    if (!recentO.length || !prevO.length) return null;
    const pLL = Math.min(...recentP) < Math.min(...prevP), oHL = Math.min(...recentO) > Math.min(...prevO);
    if (pLL && oHL) return 'bullish';
    const pHH = Math.max(...recentP) > Math.max(...prevP), oLH = Math.max(...recentO) < Math.max(...prevO);
    if (pHH && oLH) return 'bearish';
    return null;
  }
};

const VolumeOSC = {
  calc(rows, short = 5, long = 20) {
    const vols = rows.map(r => r.volume);
    const sS = sma(vols, short), sL = sma(vols, long);
    if (!sS || !sL || sL === 0) return 0;
    return ((sS - sL) / sL) * 100;
  },
  signal(val) {
    if (val > 50) return { type: 'buy', strength: 'normal' };
    if (val < -30) return { type: 'sell', strength: 'normal' };
    return null;
  }
};

const BollingerBands = {
  calc(closes, period = 20, mult = 2.0) {
    const n = closes.length;
    if (n < period) return { upper: 0, middle: 0, lower: 0, width: 0, pctB: 0.5, price: closes[n - 1] || 0 };
    const mid = sma(closes, period);
    let sum2 = 0; for (let i = n - period; i < n; i++) sum2 += (closes[i] - mid) ** 2;
    const sd = Math.sqrt(sum2 / period);
    const upper = mid + sd * mult, lower = mid - sd * mult;
    const width = mid > 0 ? (upper - lower) / mid * 100 : 0;
    const pctB = (upper - lower) > 0 ? (closes[n - 1] - lower) / (upper - lower) : 0.5;
    return { upper, middle: mid, lower, width, pctB, price: closes[n - 1], last: closes[n - 1] };
  },
  squeeze(closes, period = 20) {
    const n = closes.length;
    if (n < period + 10) return { squeeze: false };
    const widths = [];
    for (let i = period; i <= n; i++) {
      const sl = closes.slice(i - period, i);
      const m = sma(sl, period);
      let s2 = 0; for (const v of sl) s2 += (v - m) ** 2;
      widths.push(Math.sqrt(s2 / period) / m * 100);
    }
    if (widths.length < 5) return { squeeze: false };
    const recent = widths.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const avg = widths.reduce((a, b) => a + b, 0) / widths.length;
    return { squeeze: recent < avg * 0.7 };
  },
  signal(price, bb) {
    if (price <= bb.lower) return { type: 'buy', strength: 'strong' };
    if (price <= bb.lower + (bb.middle - bb.lower) * 0.2) return { type: 'buy', strength: 'normal' };
    if (price >= bb.upper) return { type: 'sell', strength: 'strong' };
    if (price >= bb.upper - (bb.upper - bb.middle) * 0.2) return { type: 'sell', strength: 'normal' };
    return null;
  }
};

const MA = {
  alignment(closes, tf, ip) {
    const mp = _scrTfMa(tf);
    const short = ip?.maShort > 0 ? ip.maShort : mp.short;
    const mid = ip?.maMid > 0 ? ip.maMid : mp.mid;
    const long = ip?.maLong > 0 ? ip.maLong : mp.long;
    const n = closes.length;
    const mS = n >= short ? sma(closes, short) : null;
    const mM = n >= mid ? sma(closes, mid) : null;
    const mL = n >= long ? sma(closes, long) : null;
    const mXL = n >= (ip?.maXLong || mp.xlong) ? sma(closes, ip?.maXLong || mp.xlong) : null;
    const bullish = mS != null && mM != null && mL != null && mS > mM && mM > mL;
    const bearish = mS != null && mM != null && mL != null && mS < mM && mM < mL;
    const ma60 = n >= 60 ? sma(closes, 60) : null;
    return { bullish, bearish, short: mS, mid: mM, long: mL, xlong: mXL, ma60 };
  },
  signal(maAlign) {
    if (maAlign.bullish) return { type: 'buy', strength: 'strong' };
    if (maAlign.bearish) return { type: 'sell', strength: 'strong' };
    return null;
  }
};

const Trend = {
  calc(closes) {
    const n = closes.length;
    if (n < 20) return { pct: 0, slope: 0 };
    const pct = ((closes[n - 1] - closes[n - 20]) / closes[n - 20]) * 100;
    const slope = (closes[n - 1] - closes[n - 5]) / (5 * closes[n - 1] || 1);
    return { pct, slope };
  },
  structure(rows) {
    const n = rows.length;
    if (n < 20) return { pos: 0.5, nearSupport: false, nearResistance: false };
    const hi = Math.max(...rows.slice(-20).map(r => r.high));
    const lo = Math.min(...rows.slice(-20).map(r => r.low));
    const pos = hi > lo ? (rows[n - 1].close - lo) / (hi - lo) : 0.5;
    const price = rows[n - 1].close;
    return { pos, nearSupport: pos < 0.15, nearResistance: pos > 0.85, hi, lo, price };
  },
  levels(rows) {
    const n = rows.length;
    if (n < 30) return [];
    const levels = [];
    for (let i = 5; i < n - 5; i++) {
      const isHigh = rows[i].high >= Math.max(...rows.slice(i - 5, i + 6).map(r => r.high));
      const isLow = rows[i].low <= Math.min(...rows.slice(i - 5, i + 6).map(r => r.low));
      if (isHigh) levels.push({ type: 'resistance', price: rows[i].high });
      if (isLow) levels.push({ type: 'support', price: rows[i].low });
    }
    return levels.slice(-10);
  },
  fibonacci(rows) {
    const n = rows.length;
    if (n < 20) return null;
    const hi = Math.max(...rows.slice(-50).map(r => r.high));
    const lo = Math.min(...rows.slice(-50).map(r => r.low));
    const d = hi - lo;
    return { levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(r => ({ ratio: r, price: hi - d * r })) };
  }
};

const ATR = {
  calc(rows, period = 14) {
    const n = rows.length;
    if (n < period + 1) return { val: 0, pct: 0 };
    let atr = 0;
    for (let i = 1; i <= period; i++) {
      atr += Math.max(rows[i].high - rows[i].low, Math.abs(rows[i].high - rows[i - 1].close), Math.abs(rows[i].low - rows[i - 1].close));
    }
    atr /= period;
    for (let i = period + 1; i < n; i++) {
      const tr = Math.max(rows[i].high - rows[i].low, Math.abs(rows[i].high - rows[i - 1].close), Math.abs(rows[i].low - rows[i - 1].close));
      atr = (atr * (period - 1) + tr) / period;
    }
    const pct = rows[n - 1].close > 0 ? (atr / rows[n - 1].close) * 100 : 0;
    return { val: atr, pct };
  },
  soften(pct, key, cache) {
    if (!cache) return pct;
    const prev = cache[key];
    cache[key] = pct;
    if (prev == null) return pct;
    return prev * 0.3 + pct * 0.7;
  },
  signal(pct) {
    if (pct >= 5) return { type: 'sell', strength: 'strong' };
    if (pct >= 3) return { type: 'sell', strength: 'normal' };
    return null;
  }
};

const Candle = {
  analyze(rows) {
    const n = rows.length;
    if (n < 3) return { bullish: false, bearish: false, score: 0, strongest: null, patterns: [], basic: [], reversal: [], continuation: [] };
    const r = rows[n - 1], p = rows[n - 2], pp = rows[n - 3];
    const body = r.close - r.open, absB = Math.abs(body);
    const range = r.high - r.low;
    const pBody = p.close - p.open;
    const patterns = [];
    if (body > 0 && (r.open - r.low) > absB * 2 && (r.high - r.close) < absB * 0.3) patterns.push({ name: '해머', dir: 1, score: 8 });
    if (body < 0 && (r.high - r.open) > absB * 2 && (r.close - r.low) < absB * 0.3) patterns.push({ name: '슈팅스타', dir: -1, score: 8 });
    if (pBody < 0 && body > 0 && r.close > p.open && r.open < p.close) patterns.push({ name: '상승장악', dir: 1, score: 10 });
    if (pBody > 0 && body < 0 && r.close < p.open && r.open > p.close) patterns.push({ name: '하락장악', dir: -1, score: 10 });
    if (pp.close < pp.open && Math.abs(pBody) < range * 0.3 && body > 0 && r.close > (pp.open + pp.close) / 2) patterns.push({ name: '모닝스타', dir: 1, score: 12 });
    if (pp.close > pp.open && Math.abs(pBody) < range * 0.3 && body < 0 && r.close < (pp.open + pp.close) / 2) patterns.push({ name: '이브닝스타', dir: -1, score: 12 });
    if (range > 0 && absB / range < 0.1) patterns.push({ name: '도지', dir: 0, score: 3 });

    let score = 0;
    patterns.forEach(p => score += p.score * p.dir);
    const bullish = score > 0, bearish = score < 0;
    const strongest = patterns.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0] || null;
    const basic = patterns.filter(p => p.dir > 0).map(p => p.name);
    const reversal = patterns.filter(p => Math.abs(p.score) >= 8).map(p => p.name);
    const continuation = [];
    return { bullish, bearish, score, strongest, patterns, basic, reversal, continuation };
  }
};

const VolPattern = {
  analyze(rows) {
    const n = rows.length;
    if (n < 20) return { bullish: false, bearish: false, score: 0, volRatio: 1 };
    const vols = rows.map(r => r.volume);
    const avg20 = sma(vols, 20) || 1;
    const volRatio = vols[n - 1] / avg20;
    const bullish = volRatio > 1.5 && rows[n - 1].close > rows[n - 1].open;
    const bearish = volRatio > 1.5 && rows[n - 1].close < rows[n - 1].open;
    const score = bullish ? Math.min(10, Math.round((volRatio - 1) * 5)) : bearish ? -Math.min(10, Math.round((volRatio - 1) * 5)) : 0;
    return { bullish, bearish, score, volRatio };
  }
};

// ════════════════════════════════════════════════════════════
//  고급 엔진 (7개)
// ════════════════════════════════════════════════════════════

const PullbackScore = {
  calc(ind) {
    if (!ind.maAlign || !ind.trend) return { score: 0 };
    let s = 0;
    if (ind.maAlign.bullish) s += 20;
    if (ind.trend.pct > 0) s += 10;
    if (ind.rsi?.val < 40) s += 15;
    if (ind.rsi?.val < 30) s += 10;
    if (ind.bb?.pctB < 0.2) s += 15;
    if (ind.stoch?.k < 30) s += 10;
    if (ind.candle?.bullish) s += 10;
    if (ind.volPattern?.bullish) s += 10;
    return { score: clamp(s, 0, 100) };
  }
};

const ContextEngine = {
  analyze(ind) {
    let bonus = 0;
    const notes = [];
    if (ind.rsi?.val < 35 && ind.macd?.hist > 0) { bonus += 8; notes.push('RSI과매도+MACD양전'); }
    if (ind.rsi?.val > 65 && ind.macd?.hist < 0) { bonus -= 8; notes.push('RSI과매수+MACD음전'); }
    if (ind.maAlign?.bullish && ind.trend?.pct > 3) { bonus += 6; notes.push('정배열+상승추세'); }
    if (ind.maAlign?.bearish && ind.trend?.pct < -3) { bonus -= 6; notes.push('역배열+하락추세'); }
    if (ind.squeeze?.squeeze && ind.maAlign?.bullish) { bonus += 5; notes.push('스퀴즈+정배열'); }
    if (ind.bb?.pctB < 0.1 && ind.rsi?.val < 30) { bonus += 7; notes.push('BB하단+RSI과매도'); }
    if (ind.bb?.pctB > 0.9 && ind.rsi?.val > 70) { bonus -= 7; notes.push('BB상단+RSI과매수'); }
    if (ind.volPattern?.bullish && ind.candle?.bullish) { bonus += 5; notes.push('거래량확인+강세캔들'); }
    if (ind.volPattern?.bearish && ind.candle?.bearish) { bonus -= 5; notes.push('매도거래량+약세캔들'); }
    if (ind.obv?.div === 'bullish') { bonus += 6; notes.push('OBV상승다이버전스'); }
    if (ind.obv?.div === 'bearish') { bonus -= 6; notes.push('OBV하락다이버전스'); }
    if (ind.adx?.adx > 30 && ind.adx?.pdi > ind.adx?.mdi) { bonus += 4; notes.push('강한상승추세ADX'); }
    if (ind.adx?.adx > 30 && ind.adx?.mdi > ind.adx?.pdi) { bonus -= 4; notes.push('강한하락추세ADX'); }
    if (ind.pullback?.score >= 60) { bonus += 5; notes.push('눌림목 호조건'); }
    if (ind.rsi?.div === 'bullish') { bonus += 6; notes.push('RSI상승다이버전스'); }
    if (ind.rsi?.div === 'bearish') { bonus -= 6; notes.push('RSI하락다이버전스'); }
    if (ind.stoch?.k < 20 && ind.stoch?.k > ind.stoch?.d) { bonus += 4; notes.push('Stoch과매도반전'); }
    if (ind.stoch?.k > 80 && ind.stoch?.k < ind.stoch?.d) { bonus -= 4; notes.push('Stoch과매수반전'); }
    return { bonus: clamp(bonus, -35, 35), notes };
  }
};

const SwingStructure = {
  analyze(rows) {
    const n = rows.length;
    if (n < 20) return { higherHighs: false, lowerLows: false, swings: [] };
    const swings = [];
    for (let i = 3; i < n - 3; i++) {
      const isHigh = rows[i].high >= Math.max(rows[i - 1].high, rows[i - 2].high, rows[i + 1].high, rows[i + 2].high);
      const isLow = rows[i].low <= Math.min(rows[i - 1].low, rows[i - 2].low, rows[i + 1].low, rows[i + 2].low);
      if (isHigh) swings.push({ type: 'H', price: rows[i].high, idx: i });
      if (isLow) swings.push({ type: 'L', price: rows[i].low, idx: i });
    }
    const highs = swings.filter(s => s.type === 'H').slice(-3);
    const lows = swings.filter(s => s.type === 'L').slice(-3);
    const higherHighs = highs.length >= 2 && highs[highs.length - 1].price > highs[highs.length - 2].price;
    const lowerLows = lows.length >= 2 && lows[lows.length - 1].price < lows[lows.length - 2].price;
    return { higherHighs, lowerLows, swings: swings.slice(-6) };
  }
};

const MAConvergence = {
  analyze(closes) {
    if (closes.length < 60) return { converging: false, spread: 0 };
    const m5 = sma(closes, 5), m20 = sma(closes, 20), m60 = sma(closes, 60);
    if (!m5 || !m20 || !m60) return { converging: false, spread: 0 };
    const avg = (m5 + m20 + m60) / 3;
    const spread = Math.max(m5, m20, m60) - Math.min(m5, m20, m60);
    const spreadPct = avg > 0 ? (spread / avg) * 100 : 0;
    return { converging: spreadPct < 1.5, spread: spreadPct };
  }
};

const StochDivergence = {
  calc(rows) {
    const n = rows.length;
    if (n < 30) return null;
    const stochArr = [];
    for (let i = 13; i < n; i++) {
      let hi = -Infinity, lo = Infinity;
      for (let j = i - 13; j <= i; j++) { hi = Math.max(hi, rows[j].high); lo = Math.min(lo, rows[j].low); }
      stochArr.push(hi === lo ? 50 : (rows[i].close - lo) / (hi - lo) * 100);
    }
    const seg = 10;
    if (stochArr.length < seg * 2) return null;
    const rP = rows.slice(-seg).map(r => r.close), pP = rows.slice(-seg * 2, -seg).map(r => r.close);
    const rS = stochArr.slice(-seg), pS = stochArr.slice(-seg * 2, -seg);
    if (Math.min(...rP) < Math.min(...pP) && Math.min(...rS) > Math.min(...pS)) return 'bullish';
    if (Math.max(...rP) > Math.max(...pP) && Math.max(...rS) < Math.max(...pS)) return 'bearish';
    return null;
  }
};

const PsychLevel = {
  analyze(price) {
    if (!price || price <= 0) return { near: false, level: 0 };
    const mag = Math.pow(10, Math.floor(Math.log10(price)));
    const round = Math.round(price / mag) * mag;
    const dist = Math.abs(price - round) / price * 100;
    return { near: dist < 2, level: round };
  }
};

const MarketRegime = {
  detect(ind) {
    if (!ind.adx || !ind.bb || !ind.trend) return { label: '불명', icon: '❓', direction: 'FLAT', score: 50 };
    const adx = ind.adx.adx ?? 0;
    const bbW = ind.bb.width ?? 0;
    const slope = ind.trend.slope ?? 0;
    let score = 50;
    if (adx > 25) score += 15; if (adx > 40) score += 10;
    if (slope > 0.01) score += 10; if (slope > 0.03) score += 5;
    if (slope < -0.01) score -= 10; if (slope < -0.03) score -= 5;
    if (bbW > 3) score += 5; if (bbW < 1.5) score -= 5;
    score = clamp(score, 0, 100);
    const direction = score > 60 && slope > 0 ? 'UP' : score < 40 || slope < -0.01 ? 'DOWN' : 'FLAT';
    let label, icon;
    if (adx > 30 && bbW > 3) { label = '추세+변동'; icon = '🔥'; }
    else if (adx > 25) { label = '추세장'; icon = '📈'; }
    else if (bbW < 1.5) { label = '횡보장'; icon = '〰️'; }
    else { label = '전환기'; icon = '🔄'; }
    return { label, icon, direction, score, adx, bbWidth: bbW };
  }
};

// ════════════════════════════════════════════════════════════
//  통합 지표 계산 (calcAllScreener)
// ════════════════════════════════════════════════════════════
const _volCache = {};

function calcAllScreener(rows, tf) {
  const ip = _loadAnalParams();
  const closes = rows.map(r => r.close);
  const n = closes.length;
  const price = closes[n - 1];

  const rsiArr = RSI.calc(closes, ip.rsiLen);
  const rsiVal = rsiArr[n - 1] ?? 50;
  const macdObj = MACD.calc(closes);
  const stochVal = Stochastic.calc(rows);
  const cciVal = CCI.calc(rows);
  const adxVal = ADX.calc(rows, 14);
  const obvObj = OBV.calc(rows);
  const volOsc = VolumeOSC.calc(rows);
  const bbVal = BollingerBands.calc(closes, ip.bbLen, ip.bbMult);
  const squeeze = BollingerBands.squeeze(closes, ip.bbLen);
  const maAlign = MA.alignment(closes, tf, ip);
  const { pct: trendPct, slope } = Trend.calc(closes);
  const struct = Trend.structure(rows);
  const srLvls = Trend.levels(rows);
  const fib = Trend.fibonacci(rows);
  const atrObj = ATR.calc(rows, ip.atrLen);
  const rsiDiv = RSI.divergence(closes, rsiArr);
  const obvDiv = OBV.divergence(rows);
  const candle = Candle.analyze(rows);
  const volPattern = VolPattern.analyze(rows);
  const macdHist = macdObj.hist[n - 1] || 0;
  const macdHistPct = price ? (macdHist / price) * 100 : 0;

  const base = {
    price,
    rsi: { val: rsiVal, arr: rsiArr, div: rsiDiv },
    macd: { line: macdObj.line[n - 1], sig: macdObj.sig[n - 1], hist: macdHist, histPct: macdHistPct, arr: macdObj },
    stoch: stochVal,
    cci: cciVal,
    adx: adxVal,
    obv: { ...obvObj, div: obvDiv },
    volOsc,
    bb: { ...bbVal, price },
    squeeze,
    maAlign,
    trend: { pct: trendPct, slope, struct, levels: srLvls, fib },
    atr: atrObj,
    candle,
    volPattern,
    rows, closes,
  };

  base.pullback = PullbackScore.calc(base);
  base.context = ContextEngine.analyze(base);
  base.swingStruct = SwingStructure.analyze(rows);
  base.maConv = MAConvergence.analyze(closes);
  base.stochDiv = StochDivergence.calc(rows);
  base.psychLevel = PsychLevel.analyze(price);
  base.regime = MarketRegime.detect(base);

  // 레거시 호환 (checkTechConditions 용)
  base.ma5 = maAlign.short;
  base.ma20 = maAlign.mid;
  base.ma60 = maAlign.long;
  base.ma120 = maAlign.xlong;
  base.rsiLegacy = rsiVal;
  base.macdLegacy = {
    macd: macdObj.line[n - 1] || 0,
    signal: macdObj.sig[n - 1] || 0,
    histogram: macdHist,
    prevHist: macdObj.hist[n - 2] || 0,
    recentGolden: n >= 3 && macdObj.hist[n - 1] > 0 && (macdObj.hist[n - 2] <= 0 || macdObj.hist[n - 3] <= 0),
    recentDead: n >= 3 && macdObj.hist[n - 1] < 0 && (macdObj.hist[n - 2] >= 0 || macdObj.hist[n - 3] >= 0),
  };
  base.stochLegacy = stochVal;
  base.bbLegacy = {
    upper: bbVal.upper, middle: bbVal.middle, lower: bbVal.lower,
    pctB: bbVal.pctB, last: price, isSqueeze: squeeze.squeeze,
    width: bbVal.width
  };
  base.adxLegacy = { adx: adxVal.adx, plusDI: adxVal.pdi, minusDI: adxVal.mdi };
  base.obvLegacy = obvObj;
  base.patternsLegacy = candle;

  return base;
}

// ════════════════════════════════════════════════════════════
//  종합 점수 산출 (scrComputeScore)
// ════════════════════════════════════════════════════════════
function scrComputeScore(ind, volSoft, ctxBonus) {
  let s = 50;
  s += clamp(ind.trend.pct * 4.0, -28, 28);
  s += clamp(ind.trend.slope * 18.0, -18, 18);
  s += clamp((50 - ind.rsi.val) * 0.65, -32, 32);
  s += clamp(Math.tanh(ind.macd.histPct * 0.35) * 18, -18, 18);
  s += clamp(Math.tanh((1.6 - volSoft) * 0.9) * 18, -18, 18);
  let st = clamp((0.5 - ind.trend.struct.pos) * 26.0, -14, 14);
  if (ind.trend.struct.nearSupport) st += 10;
  if (ind.trend.struct.nearResistance) st -= 10;
  s += clamp(st, -22, 22);
  if (ind.rsi.div === 'bearish') s -= 8;
  if (ind.rsi.div === 'bullish') s += 8;
  let b = 0;
  if (ind.rsi.div === 'bullish') b += 6; if (ind.rsi.div === 'bearish') b -= 6;
  if (ind.obv.div === 'bullish') b += 7; if (ind.obv.div === 'bearish') b -= 7;
  const add = (sig, w) => { if (!sig) return; if (sig.type === 'buy') b += w; if (sig.type === 'sell') b -= w; };
  add(Stochastic.signal(ind.stoch.k, ind.stoch.d), 3);
  add(CCI.signal(ind.cci), 3);
  add(OBV.signal(ind.obv.val, ind.obv.sig), 5);
  add(VolumeOSC.signal(ind.volOsc), 2);
  add(MA.signal(ind.maAlign), 5);
  add(BollingerBands.signal(ind.bb.price, ind.bb), 3);
  add(ADX.signal(ind.adx.adx, ind.adx.pdi, ind.adx.mdi), 2);
  if (ind.candle.bullish) b += clamp(ind.candle.score, 0, 12);
  if (ind.candle.bearish) b -= clamp(Math.abs(ind.candle.score), 0, 12);
  if (ind.volPattern.bullish) b += clamp(ind.volPattern.score, 0, 10);
  if (ind.volPattern.bearish) b -= clamp(Math.abs(ind.volPattern.score), 0, 10);
  b = clamp(b, -30, 30);
  let aux = 0;
  {
    const hArr = ind.macd.arr.hist, len = hArr.length;
    if (len >= 3) {
      const h1 = hArr[len - 1], h2 = hArr[len - 2], h3 = hArr[len - 3];
      if (h1 > 0 && h1 < h2 && h2 < h3) {
        const dr = h3 > 0 ? (1 - h1 / h3) * 100 : 0;
        if (dr >= 50) aux -= 8; else if (dr >= 30) aux -= 6; else aux -= 4;
      } else if (h1 > 0 && h1 < h2) aux -= 3;
    }
  }
  aux = clamp(aux, -16, 16);
  const combined = clamp(s + b * 0.5 + clamp(ctxBonus, -35, 35) * 0.8 + aux, 0, 100);
  const rawScore = Math.round(clamp(50 + 50 * Math.tanh(((combined - 50) / 50) * SCR_SCORING.tanh), 0, 100));
  const mom = clamp(ind.trend.pct * 4.0, -28, 28) + clamp(ind.trend.slope * 18.0, -18, 18);
  const osc = clamp((ind.rsi.val - 50) * 0.7, -32, 32) + clamp(Math.tanh(ind.macd.histPct * 0.35) * 18, -18, 18);
  return { rawScore, mom, osc };
}

// ── 안전필터 ──
function _scrMomOscPass(mom, osc, tf) {
  return SHORT_TFS_SET.has(tf) ? (mom + osc) > 0 : (mom > 0 && osc > 0);
}
function _scrVolFilter(volSoft, tf) {
  if (tf === 'week' || tf === 'month' || tf === 'W' || tf === 'M') return { hard: 14.0, softTh: 10.0, bonus: 10 };
  if (SHORT_TFS_SET.has(tf)) return { hard: 10.0, softTh: 7.0, bonus: 5 };
  return { hard: 7.0, softTh: 5.0, bonus: 5 };
}

// ════════════════════════════════════════════════════════════
//  quickScore — 종합 판정 (BUY/SELL/HOLD + 안전필터)
// ════════════════════════════════════════════════════════════
function scrQuickScore(rows, tf) {
  const ind = calcAllScreener(rows, tf);
  const volSoft = ATR.soften(ind.atr.pct, `scr_${rows[0]?.date || 'x'}`, _volCache);
  const ctx = ind.context || ContextEngine.analyze(ind);
  const { rawScore, mom, osc } = scrComputeScore(ind, volSoft, ctx.bonus);
  const th = _getEffectiveTh(tf);
  let action = rawScore >= th.buyTh ? 'BUY' : rawScore <= th.sellTh ? 'SELL' : 'HOLD';
  if (action === 'BUY' && !_scrMomOscPass(mom, osc, tf)) action = 'HOLD';
  const reasons = [];

  // 안전필터 (순수 기술)
  if (action === 'BUY' && rawScore < th.buyTh + 2) { reasons.push('🔒임계값'); action = 'HOLD'; }
  { const vf = _scrVolFilter(volSoft, tf);
    if (volSoft >= vf.hard) { reasons.push('🔒변동성극단'); action = 'HOLD'; }
    else if (volSoft >= vf.softTh && action === 'BUY' && rawScore < th.buyTh + vf.bonus) { reasons.push('🔒변동성과다'); action = 'HOLD'; }
  }
  if (action === 'BUY' && ind.rsi.div === 'bearish') { reasons.push('🔒RSI다이버전스'); action = 'HOLD'; }
  if (action === 'BUY' && ind.stoch.k > 90 && ind.rsi.val < 60) { reasons.push('🔒Stoch/RSI괴리'); action = 'HOLD'; }
  if (action === 'BUY' && ind.macd.hist < 0) {
    const h = ind.macd.arr.hist; if (h.length >= 5 && h.slice(-5).every(v => v < 0)) { reasons.push('🔒MACD음전'); action = 'HOLD'; }
  }
  if (action === 'BUY' && ind.maAlign.ma60 != null && ind.price < ind.maAlign.ma60) {
    const d60 = ((ind.maAlign.ma60 - ind.price) / ind.price) * 100;
    if (d60 < 2 && rawScore < th.buyTh + 4) { reasons.push('🔒MA60저항'); action = 'HOLD'; }
  }
  if (action === 'BUY' && ind.candle.strongest) {
    const cn = ind.candle.strongest.name || '';
    if (cn.includes('이브닝') || cn.includes('슈팅')) { reasons.push('🔒' + cn); action = 'HOLD'; }
  }
  if (action === 'SELL' && ind.candle.strongest) {
    const cn = ind.candle.strongest.name || '';
    if (cn.includes('모닝') || cn.includes('해머')) { reasons.push('🔒' + cn); action = 'HOLD'; }
  }

  return {
    score: rawScore, action, reasons, ind,
    rsiDiv: ind.rsi.div, obvDiv: ind.obv.div,
    pullback: ind.pullback, candle: ind.candle,
    squeeze: ind.squeeze?.squeeze || false,
    maAlignBull: ind.maAlign.bullish,
    maAlignBear: ind.maAlign.bearish,
    above60: ind.maAlign.ma60 != null && ind.price > ind.maAlign.ma60,
    volRatio: ind.volPattern.volRatio,
    volBull: ind.volPattern.bullish,
    pbScore: ind.pullback ? ind.pullback.score : 0,
    regime: ind.regime,
    macdCrossUp: ind.macd.arr.hist.length >= 2 && ind.macd.hist > 0 && ind.macd.arr.hist[ind.macd.arr.hist.length - 2] <= 0,
    macdCrossDown: ind.macd.arr.hist.length >= 2 && ind.macd.hist < 0 && ind.macd.arr.hist[ind.macd.arr.hist.length - 2] >= 0,
    rsiVal: ind.rsi.val,
    stochK: ind.stoch.k,
  };
}

// ════════════════════════════════════════════════════════════
//  스마트필터 — 배지 판정
// ════════════════════════════════════════════════════════════
function scrSmartFilterCheck(scanResult) {
  const tags = [];
  if (scanResult.maAlignBull) tags.push({ id: 'maUp', label: '정배열', color: '#00d4a0', dir: 1 });
  const volR = scanResult.volRatio || 1;
  if (volR >= 2.0) tags.push({ id: 'volUp', label: `Vol${volR.toFixed(1)}x`, color: '#ff8c00', dir: 1 });
  if (scanResult.above60) tags.push({ id: 'above60', label: 'MA60↑', color: '#00d4a0', dir: 1 });
  if (scanResult.squeeze) tags.push({ id: 'sqz', label: '스퀴즈', color: '#4488ff', dir: 1 });
  if (scanResult.pbScore >= 50) tags.push({ id: 'pb', label: `눌림${scanResult.pbScore}`, color: '#ffc040', dir: 1 });
  const rsi = scanResult.rsiVal ?? 50;
  if (rsi <= 30) tags.push({ id: 'rsiLo', label: `RSI${Math.round(rsi)}`, color: '#aa88ff', dir: 1 });
  if (scanResult.macdCrossUp) tags.push({ id: 'macdUp', label: 'MACD↑', color: '#00d4a0', dir: 1 });
  if (scanResult.maAlignBear) tags.push({ id: 'maDn', label: '역배열', color: '#aa88ff', dir: -1 });
  if (volR <= 0.3) tags.push({ id: 'volDn', label: 'Vol↓', color: '#4488ff', dir: -1 });
  if (rsi >= 70) tags.push({ id: 'rsiHi', label: `RSI${Math.round(rsi)}`, color: '#ff4060', dir: -1 });
  if (scanResult.macdCrossDown) tags.push({ id: 'macdDn', label: 'MACD↓', color: '#ff4060', dir: -1 });
  if (scanResult.rsiDiv === 'bullish') tags.push({ id: 'rsiDivUp', label: 'RSI↑다이버', color: '#00d4a0', dir: 1 });
  if (scanResult.rsiDiv === 'bearish') tags.push({ id: 'rsiDivDn', label: 'RSI↓다이버', color: '#ff4060', dir: -1 });
  if (scanResult.obvDiv === 'bullish') tags.push({ id: 'obvDivUp', label: 'OBV↑다이버', color: '#00d4a0', dir: 1 });
  if (scanResult.obvDiv === 'bearish') tags.push({ id: 'obvDivDn', label: 'OBV↓다이버', color: '#ff4060', dir: -1 });
  return tags;
}

function scrSmartFilterScore(tags) {
  return tags.reduce((s, t) => s + t.dir, 0);
}

// ── 스마트필터 정의 (UI용) ──
const SMART_FILTER_DEFS = [
  { id: 'maUp', label: '정배열', dir: 1 },
  { id: 'above60', label: 'MA60↑', dir: 1 },
  { id: 'sqz', label: '스퀴즈', dir: 1 },
  { id: 'pb', label: '눌림목', dir: 1 },
  { id: 'rsiLo', label: 'RSI과매도', dir: 1 },
  { id: 'macdUp', label: 'MACD↑', dir: 1 },
  { id: 'volUp', label: 'Vol폭발', dir: 1 },
  { id: 'maDn', label: '역배열', dir: -1 },
  { id: 'rsiHi', label: 'RSI과매수', dir: -1 },
  { id: 'macdDn', label: 'MACD↓', dir: -1 },
  { id: 'volDn', label: 'Vol↓', dir: -1 },
];

function passSmartFilters(tags, activeSmartFilters) {
  if (!activeSmartFilters || !activeSmartFilters.size) return true;
  const tagIds = new Set(tags.map(t => t.id));
  for (const fId of activeSmartFilters) {
    if (!tagIds.has(fId)) return false;
  }
  return true;
}

// ════════════════════════════════════════════════════════════
//  레거시 지표 (checkTechConditions 호환)
// ════════════════════════════════════════════════════════════
function calcWilliamsR(highs, lows, closes, period) {
  const n = closes.length;
  if (n < period) return -50;
  let hh = -Infinity, ll = Infinity;
  for (let i = n - period; i < n; i++) { hh = Math.max(hh, highs[i]); ll = Math.min(ll, lows[i]); }
  return hh === ll ? -50 : -((hh - closes[n - 1]) / (hh - ll)) * 100;
}

function calcMFI(highs, lows, closes, volumes, period) {
  const n = closes.length;
  if (n < period + 1) return 50;
  let posFlow = 0, negFlow = 0;
  for (let i = n - period; i < n; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    const prevTp = (highs[i - 1] + lows[i - 1] + closes[i - 1]) / 3;
    const mf = tp * volumes[i];
    if (tp > prevTp) posFlow += mf; else negFlow += mf;
  }
  return negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow);
}

function calcVR(closes, volumes, period) {
  const n = closes.length;
  if (n < period + 1) return 100;
  let up = 0, down = 0;
  for (let i = n - period; i < n; i++) {
    if (closes[i] > closes[i - 1]) up += volumes[i];
    else if (closes[i] < closes[i - 1]) down += volumes[i];
  }
  return down === 0 ? 300 : (up / down) * 100;
}

function calcParabolicSAR(highs, lows, closes) {
  const n = closes.length;
  if (n < 3) return { trend: 'flat', sar: 0 };
  let isUp = closes[1] > closes[0], sar = isUp ? lows[0] : highs[0], ep = isUp ? highs[1] : lows[1], af = 0.02;
  for (let i = 2; i < n; i++) {
    sar = sar + af * (ep - sar);
    if (isUp) {
      if (lows[i] < sar) { isUp = false; sar = ep; ep = lows[i]; af = 0.02; }
      else { if (highs[i] > ep) { ep = highs[i]; af = Math.min(af + 0.02, 0.2); } }
    } else {
      if (highs[i] > sar) { isUp = true; sar = ep; ep = highs[i]; af = 0.02; }
      else { if (lows[i] < ep) { ep = lows[i]; af = Math.min(af + 0.02, 0.2); } }
    }
  }
  return { trend: isUp ? 'up' : 'down', sar };
}

// ════════════════════════════════════════════════════════════
//  calcIndicators — 레거시 래퍼 (스크리너 호환)
// ════════════════════════════════════════════════════════════
function calcIndicators(candles, tf) {
  const rows = candles.map(c => ({
    date: c.date, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
  }));
  const ind = calcAllScreener(rows, tf);

  return {
    last: ind.price,
    closes: ind.closes,
    highs: rows.map(r => r.high),
    lows: rows.map(r => r.low),
    volumes: rows.map(r => r.volume),
    candles: rows,
    ma5: ind.ma5, ma20: ind.ma20, ma60: ind.ma60, ma120: ind.ma120,
    rsi: ind.rsi.val,
    macd: ind.macdLegacy,
    stoch: ind.stochLegacy,
    bb: ind.bbLegacy,
    adx: ind.adxLegacy,
    cci: ind.cci,
    willR: rows.length > 14 ? calcWilliamsR(rows.map(r => r.high), rows.map(r => r.low), ind.closes, 14) : -50,
    roc: ind.closes.length > 12 ? (ind.price / ind.closes[ind.closes.length - 13] - 1) * 100 : 0,
    momentum: ind.closes.length > 12 ? ind.price - ind.closes[ind.closes.length - 13] : 0,
    atr: { atr: ind.atr.val, ratio: ind.price > 0 ? (ind.atr.val / ind.price) * 100 : 0 },
    obv: ind.obvLegacy,
    mfi: calcMFI(rows.map(r => r.high), rows.map(r => r.low), ind.closes, rows.map(r => r.volume), 14),
    vr: calcVR(ind.closes, rows.map(r => r.volume), 20),
    psar: calcParabolicSAR(rows.map(r => r.high), rows.map(r => r.low), ind.closes),
    patterns: ind.patternsLegacy,
    _advanced: ind,
  };
}

// ── 엔진 버전 ──
SXE.version = '1.0';
SXE.calcAllScreener = calcAllScreener;
SXE.scrComputeScore = scrComputeScore;
SXE.scrQuickScore = scrQuickScore;
SXE.calcIndicators = calcIndicators;
SXE.scrSmartFilterCheck = scrSmartFilterCheck;
SXE.scrSmartFilterScore = scrSmartFilterScore;
SXE.passSmartFilters = passSmartFilters;
SXE.SMART_FILTER_DEFS = SMART_FILTER_DEFS;
