// ════════════════════════════════════════════════════════════
//  SIGNAL X — Interpret Engine v1.0
//  지표별 구간 해석 텍스트풀 + 복합상황 해석 + 종합평 생성
//  sx_screener 종목분석 탭 해석카드용
// ════════════════════════════════════════════════════════════

const SXI = {}; // namespace

// ════════════════════════════════════════════════════════════
//  1단계: 지표별 구간 해석
//  각 함수는 { label, tone, text } 반환
//  tone: 'bullish' | 'bearish' | 'neutral' | 'warning' | 'danger'
// ════════════════════════════════════════════════════════════

SXI.rsi = function(val) {
  if (val == null) return null;
  const v = +val;
  if (v <= 20) return { label: '극단적 과매도', tone: 'bullish', text: '매도 세력이 거의 소진된 상태입니다. 기술적 반등 가능성이 높지만, 하락 추세가 강할 경우 더 내릴 수 있으니 거래량 확인이 필요합니다.' };
  if (v <= 30) return { label: '과매도', tone: 'bullish', text: '매도 압력이 과도한 구간입니다. 다른 지표(MACD 골든크로스, 거래량 증가)와 함께 반등 신호가 나오면 매수 타이밍이 될 수 있습니다.' };
  if (v <= 40) return { label: '약세 구간', tone: 'bearish', text: '매도세가 우위인 구간입니다. 아직 과매도는 아니지만 하락 모멘텀이 남아있을 수 있습니다. 추세 전환 신호를 기다리세요.' };
  if (v <= 50) return { label: '중립 약세', tone: 'neutral', text: '중립에서 약세 쪽입니다. 뚜렷한 방향성이 없으며, 매수/매도 모두 근거가 약합니다. 다른 지표와 함께 판단하세요.' };
  if (v <= 60) return { label: '중립 강세', tone: 'neutral', text: '중립에서 강세 쪽입니다. 약한 매수 우위지만 아직 추세 확인이 안 된 상태입니다. MA 배열이나 거래량으로 확인하세요.' };
  if (v <= 70) return { label: '강세 구간', tone: 'bullish', text: '매수세가 우위인 구간입니다. 상승 추세가 이어지고 있으며, 추세 추종 전략에 유리합니다.' };
  if (v <= 80) return { label: '과매수', tone: 'warning', text: '매수 압력이 과도해지고 있습니다. 단기 조정 가능성이 높아지는 구간이며, 신규 진입보다는 보유 종목의 익절 시점을 고려하세요.' };
  return { label: '극단적 과매수', tone: 'danger', text: '과열 상태입니다. 급락 위험이 높으며, 신규 매수는 매우 위험합니다. 이미 보유 중이라면 분할 매도를 검토하세요.' };
};

SXI.macd = function(hist, prevHist, recentGolden, recentDead) {
  if (hist == null) return null;
  const h = +hist;
  if (recentGolden) return { label: 'MACD 골든크로스', tone: 'bullish', text: 'MACD선이 시그널선을 상향 돌파했습니다. 하락 추세에서 상승 전환의 초기 신호로, 거래량 증가와 함께 나타나면 강력한 매수 근거입니다.' };
  if (recentDead) return { label: 'MACD 데드크로스', tone: 'bearish', text: 'MACD선이 시그널선을 하향 돌파했습니다. 상승 모멘텀이 꺾이고 하락 전환 가능성이 높습니다. 보유 중이라면 손절/익절 기준을 점검하세요.' };
  if (h > 0 && h > (prevHist || 0)) return { label: '양수 확대', tone: 'bullish', text: '상승 모멘텀이 강화되고 있습니다. 히스토그램이 커지고 있어 매수세가 가속되는 구간입니다.' };
  if (h > 0 && h <= (prevHist || 0)) return { label: '양수 축소', tone: 'warning', text: '아직 양수이지만 모멘텀이 둔화되고 있습니다. 상승 속도가 줄어들고 있으며, 데드크로스 가능성에 주의하세요.' };
  if (h < 0 && h < (prevHist || 0)) return { label: '음수 확대', tone: 'bearish', text: '하락 모멘텀이 강화되고 있습니다. 매도세가 가속되는 구간으로, 신규 매수를 자제하세요.' };
  if (h < 0 && h >= (prevHist || 0)) return { label: '음수 축소', tone: 'neutral', text: '하락 모멘텀이 줄어들고 있습니다. 아직 음수이지만 바닥을 다지는 중일 수 있습니다. 골든크로스 여부를 주시하세요.' };
  return { label: '중립', tone: 'neutral', text: 'MACD가 제로선 부근입니다. 방향성이 약한 구간으로, 다른 지표로 판단을 보강하세요.' };
};

SXI.stoch = function(k, d) {
  if (k == null) return null;
  const kv = +k, dv = +(d || k);
  if (kv <= 20 && kv > dv) return { label: '과매도 반전', tone: 'bullish', text: '%K가 과매도 구간에서 %D를 상향 돌파했습니다. 강력한 매수 신호이며, RSI 과매도와 함께 나타나면 신뢰도가 높습니다.' };
  if (kv <= 20) return { label: '과매도', tone: 'bullish', text: '스토캐스틱이 과매도 구간에 있습니다. 반등 가능성이 높지만, %K가 %D를 상향 돌파할 때까지 기다리는 것이 안전합니다.' };
  if (kv <= 50) return { label: '하단 중립', tone: 'neutral', text: '스토캐스틱이 중간 아래에 있습니다. 뚜렷한 신호는 없으며, 추세 확인 후 판단하세요.' };
  if (kv <= 80) return { label: '상단 중립', tone: 'neutral', text: '스토캐스틱이 중간 위에 있습니다. 매수세가 우위이지만, 과매수 진입 전 단계입니다.' };
  if (kv > 80 && kv < dv) return { label: '과매수 반전', tone: 'bearish', text: '%K가 과매수 구간에서 %D를 하향 돌파했습니다. 매도 신호이며, RSI 과매수와 함께 나타나면 조정 가능성이 높습니다.' };
  return { label: '과매수', tone: 'warning', text: '스토캐스틱이 과매수 구간에 있습니다. 단기 고점일 수 있으며, %K가 %D를 하향 돌파하면 매도 신호입니다.' };
};

SXI.adx = function(adx, pdi, mdi) {
  if (adx == null) return null;
  const v = +adx;
  let dir = '';
  if (pdi != null && mdi != null) dir = +pdi > +mdi ? '상승' : '하락';
  if (v < 20) return { label: '추세 없음', tone: 'neutral', text: '추세 강도가 약합니다. 횡보 구간일 가능성이 높으며, 추세 추종 전략보다 박스권 매매가 적합합니다.' };
  if (v < 30) return { label: '약한 추세', tone: 'neutral', text: `약한 ${dir} 추세가 형성되고 있습니다. 아직 확정적이지 않으니 추세 강화 여부를 지켜보세요.` };
  if (v < 50) return { label: '강한 추세', tone: dir === '상승' ? 'bullish' : 'bearish', text: `강한 ${dir} 추세가 진행 중입니다. ADX 30 이상은 추세 추종 전략에 유리한 환경이며, ${dir === '상승' ? '매수 보유' : '매도/관망'}이 적절합니다.` };
  return { label: '극강 추세', tone: dir === '상승' ? 'bullish' : 'danger', text: `매우 강한 ${dir} 추세입니다. ADX 50 이상은 추세 과열 상태일 수 있으며, ${dir === '상승' ? '익절 시점 점검' : '손절 필수'} 구간입니다.` };
};

SXI.cci = function(val) {
  if (val == null) return null;
  const v = +val;
  if (v <= -200) return { label: '극단적 과매도', tone: 'bullish', text: '극심한 매도 과잉 상태입니다. 기술적 반등 가능성이 높지만, 추세 전환 확인 후 진입이 안전합니다.' };
  if (v <= -100) return { label: '과매도', tone: 'bullish', text: 'CCI가 과매도 구간입니다. 반등 시 초기 매수 구간이 될 수 있습니다.' };
  if (v <= 100) return { label: '중립', tone: 'neutral', text: 'CCI가 정상 범위 내에 있습니다. 뚜렷한 과열/침체 신호가 없는 상태입니다.' };
  if (v <= 200) return { label: '과매수', tone: 'warning', text: 'CCI가 과매수 구간입니다. 단기 조정 가능성이 있으며, 추가 매수는 신중하게 접근하세요.' };
  return { label: '극단적 과매수', tone: 'danger', text: '극심한 매수 과잉 상태입니다. 급락 위험이 높은 구간입니다.' };
};

SXI.mfi = function(val) {
  if (val == null) return null;
  const v = +val;
  if (v <= 20) return { label: '과매도 (자금유출)', tone: 'bullish', text: '자금이 대량 유출된 상태입니다. 매도 압력이 극에 달해 반등 가능성이 높습니다.' };
  if (v <= 40) return { label: '약세', tone: 'neutral', text: '자금 유출이 진행 중입니다. 아직 과매도는 아니지만 매수세가 약합니다.' };
  if (v <= 60) return { label: '중립', tone: 'neutral', text: '자금 흐름이 균형 상태입니다. 뚜렷한 방향성이 없습니다.' };
  if (v <= 80) return { label: '강세', tone: 'bullish', text: '자금이 유입되고 있습니다. 매수세가 우위이며 상승 추세를 뒷받침합니다.' };
  return { label: '과매수 (자금과잉)', tone: 'warning', text: '자금이 과도하게 유입된 상태입니다. 단기 고점 근처일 수 있으며, 익절 타이밍을 고려하세요.' };
};

SXI.bb = function(pctB, width, isSqueeze) {
  if (pctB == null) return null;
  const b = +pctB;
  let res;
  if (b <= 0) res = { label: '하단 이탈', tone: 'bullish', text: '가격이 볼린저밴드 하단을 이탈했습니다. 극단적 과매도 상태이며, 반등 가능성이 높지만 하락 추세에서는 추가 하락도 가능합니다.' };
  else if (b <= 0.2) res = { label: '하단 근접', tone: 'bullish', text: '가격이 볼린저밴드 하단 근처입니다. 매수 관심 구간이지만, 밴드 이탈 여부를 확인하세요.' };
  else if (b <= 0.5) res = { label: '하단~중심', tone: 'neutral', text: '가격이 밴드 중심 아래에 있습니다. 약한 매도 우위이지만 뚜렷한 신호는 없습니다.' };
  else if (b <= 0.8) res = { label: '중심~상단', tone: 'neutral', text: '가격이 밴드 중심 위에 있습니다. 약한 매수 우위이며 상승 추세 유지 중입니다.' };
  else if (b <= 1.0) res = { label: '상단 근접', tone: 'warning', text: '가격이 볼린저밴드 상단 근처입니다. 단기 과열 가능성이 있으며, 추가 상승 여력은 제한적일 수 있습니다.' };
  else res = { label: '상단 돌파', tone: 'danger', text: '가격이 볼린저밴드 상단을 돌파했습니다. 강한 매수세이지만 과열 상태이며, 되돌림에 주의하세요.' };
  if (isSqueeze) res.text += ' BB폭이 수축(스퀴즈) 상태로, 큰 변동이 임박할 수 있습니다.';
  return res;
};

SXI.bbWidth = function(width, isSqueeze) {
  if (width == null) return null;
  if (isSqueeze) return { label: '스퀴즈 (수축)', tone: 'neutral', text: '볼린저밴드 폭이 좁아진 상태입니다. 에너지가 축적되어 있으며, 방향 결정 시 큰 움직임이 나올 수 있습니다. 돌파 방향을 주시하세요.' };
  if (+width > 5) return { label: '확장 (고변동)', tone: 'warning', text: '볼린저밴드가 크게 확장되어 있습니다. 변동성이 높은 구간이며, 추세 끝자락에서 나타나는 경우가 많습니다.' };
  return { label: '보통', tone: 'neutral', text: '볼린저밴드 폭이 정상 범위입니다.' };
};

SXI.obv = function(trend, divergence) {
  if (!trend) return null;
  if (divergence) return { label: 'OBV 다이버전스', tone: 'bullish', text: '가격은 하락하지만 OBV(누적거래량)는 상승 중입니다. 세력이 저가에서 매집하고 있을 가능성이 높으며, 상승 전환 초기 신호입니다.' };
  if (trend === 'up') return { label: 'OBV 상승', tone: 'bullish', text: '누적 거래량이 증가 추세입니다. 매수세가 지속적으로 유입되고 있으며, 가격 상승을 뒷받침합니다.' };
  if (trend === 'down') return { label: 'OBV 하락', tone: 'bearish', text: '누적 거래량이 감소 추세입니다. 매도세가 우위이며, 가격 하락 또는 상승 신뢰도 저하를 의미합니다.' };
  return { label: 'OBV 보합', tone: 'neutral', text: 'OBV가 횡보 중입니다. 뚜렷한 수급 방향이 없습니다.' };
};

SXI.ma = function(arrangement, ma5, ma20, ma60, ma120) {
  if (!arrangement) return null;
  if (arrangement === 'bullish') return { label: '정배열', tone: 'bullish', text: '단기 이평선이 장기 이평선 위에 정렬되어 있습니다. 상승 추세가 확인된 상태이며, 눌림목 매수 전략에 적합합니다.' };
  if (arrangement === 'bearish') return { label: '역배열', tone: 'bearish', text: '단기 이평선이 장기 이평선 아래에 정렬되어 있습니다. 하락 추세가 확인된 상태이며, 반등 시 매도 또는 관망이 적절합니다.' };
  return { label: '혼조', tone: 'neutral', text: '이평선이 뒤엉켜 있습니다. 추세 전환기일 수 있으며, 방향이 정리될 때까지 관망이 좋습니다.' };
};

SXI.atr = function(ratio) {
  if (ratio == null) return null;
  const v = +ratio;
  if (v < 1.5) return { label: '저변동', tone: 'neutral', text: '변동성이 매우 낮습니다. 큰 움직임 전 에너지 축적 구간일 수 있습니다.' };
  if (v < 3) return { label: '보통', tone: 'neutral', text: '변동성이 정상 범위입니다. 일반적인 매매 환경입니다.' };
  if (v < 5) return { label: '고변동', tone: 'warning', text: '변동성이 높습니다. 손절/익절 폭을 넓게 설정하고, 포지션 크기를 줄이는 것이 안전합니다.' };
  return { label: '극변동', tone: 'danger', text: '변동성이 극단적으로 높습니다. 큰 수익과 큰 손실이 동시에 가능한 위험 구간입니다. 소액 진입 또는 관망을 권장합니다.' };
};

SXI.sar = function(trend) {
  if (!trend) return null;
  if (trend === 'up') return { label: '상승추세', tone: 'bullish', text: 'Parabolic SAR이 가격 아래에 있어 상승 추세를 확인합니다. SAR이 가격을 따라 올라오며 추세가 유지됩니다.' };
  return { label: '하락추세', tone: 'bearish', text: 'Parabolic SAR이 가격 위에 있어 하락 추세를 확인합니다. 매수 보류가 적절하며 추세 전환을 기다리세요.' };
};

SXI.candle = function(patterns) {
  if (!patterns || !patterns.length) return null;
  const strongest = patterns.sort((a, b) => Math.abs(b.score || 0) - Math.abs(a.score || 0))[0];
  if (!strongest) return null;
  const dir = strongest.dir > 0 ? 'bullish' : strongest.dir < 0 ? 'bearish' : 'neutral';
  const CANDLE_TEXT = {
    '장대양봉': '강한 매수세로 종가가 고가 근처에서 마감했습니다. 상승 추세 시작이나 지속 신호입니다.',
    '장대음봉': '강한 매도세로 종가가 저가 근처에서 마감했습니다. 하락 추세 시작이나 지속 신호입니다.',
    '해머': '하락 중 나타나면 반등 신호입니다. 긴 아래꼬리가 저가에서 매수세가 유입되었음을 보여줍니다.',
    '슈팅스타': '상승 중 나타나면 반락 신호입니다. 긴 윗꼬리가 고가에서 매도세가 유입되었음을 보여줍니다.',
    '도지': '매수/매도 세력이 팽팽한 상태입니다. 추세 전환 가능성이 있으며, 다음 봉의 방향이 중요합니다.',
    '스피닝탑': '매수/매도 세력이 비슷한 힘을 보이고 있습니다. 방향성이 약한 상태입니다.',
    '모닝스타': '3봉 강세 반전 패턴입니다. 하락 후 나타나면 강력한 매수 신호로, 신뢰도가 높습니다.',
    '이브닝스타': '3봉 약세 반전 패턴입니다. 상승 후 나타나면 강력한 매도 신호로, 신뢰도가 높습니다.',
    '상승장악': '전일 음봉을 완전히 감싸는 양봉입니다. 강한 매수 반전 신호입니다.',
    '하락장악': '전일 양봉을 완전히 감싸는 음봉입니다. 강한 매도 반전 신호입니다.',
    '하라미상승': '큰 음봉 안에 작은 양봉이 나타났습니다. 하락 모멘텀이 약화되고 있으며 반등 가능성이 있습니다.',
    '하라미하락': '큰 양봉 안에 작은 음봉이 나타났습니다. 상승 모멘텀이 약화되고 있으며 조정 가능성이 있습니다.',
    '피어싱라인': '전일 음봉의 50% 이상을 회복하는 양봉입니다. 하락 추세에서 반등 초기 신호입니다.',
    '다크클라우드': '전일 양봉의 50% 이상을 하락하는 음봉입니다. 상승 추세에서 반락 초기 신호입니다.',
    '적삼병': '3일 연속 양봉으로 강한 상승 지속 패턴입니다. 매수세가 확실한 우위입니다.',
    '흑삼병': '3일 연속 음봉으로 강한 하락 지속 패턴입니다. 매도세가 확실한 우위입니다.',
    '갭상승': '전일 고가보다 높게 시작했습니다. 강한 매수 심리를 반영하며, 갭을 메우지 않으면 상승 추세 확인입니다.',
    '갭하락': '전일 저가보다 낮게 시작했습니다. 강한 매도 심리를 반영하며, 갭을 메우지 않으면 하락 추세 확인입니다.',
    '집게바닥': '두 봉의 저가가 거의 같은 수준입니다. 지지선이 형성되었으며 반등 가능성이 높습니다.',
    '집게천정': '두 봉의 고가가 거의 같은 수준입니다. 저항선이 형성되었으며 하락 가능성이 높습니다.',
    '인사이드데이': '금일 고저가가 전일 범위 안에 있습니다. 변동성 수축 상태로, 돌파 방향 주시가 필요합니다.',
    '아웃사이드데이': '금일 고저가가 전일 범위를 넘었습니다. 변동성 확대로, 방향이 결정되면 큰 움직임이 나올 수 있습니다.',
  };
  return { label: strongest.name, tone: dir, text: CANDLE_TEXT[strongest.name] || `${strongest.name} 패턴이 감지되었습니다.` };
};

// ── 고급 분석 해석 ──

SXI.pullback = function(score) {
  if (score == null) return null;
  const s = +score;
  if (s >= 70) return { label: '눌림목 매수 적기', tone: 'bullish', text: '상승 추세 내에서 조정이 충분히 이루어진 상태입니다. 이평선 지지 + 과매도 조건이 갖춰져 분할 매수에 적합합니다.' };
  if (s >= 50) return { label: '눌림목 관심', tone: 'neutral', text: '조정이 진행 중이지만, 아직 최적 진입 구간은 아닙니다. 추가 하락 시 매수 기회가 될 수 있습니다.' };
  if (s >= 30) return { label: '눌림목 약함', tone: 'neutral', text: '눌림목 조건이 일부만 충족됩니다. 추세가 강하지 않거나 조정이 충분하지 않은 상태입니다.' };
  return { label: '해당없음', tone: 'neutral', text: '눌림목 매수 조건에 해당하지 않습니다.' };
};

SXI.swingStruct = function(higherHighs, lowerLows) {
  if (higherHighs && !lowerLows) return { label: '상승 구조 (HH+HL)', tone: 'bullish', text: '고점과 저점이 모두 높아지고 있습니다. 건강한 상승 추세 구조이며, 눌림목에서 매수하기 좋은 환경입니다.' };
  if (higherHighs && lowerLows) return { label: '확산형', tone: 'warning', text: '고점은 높아지지만 저점도 낮아지는 확산형 구조입니다. 변동성이 확대되고 있으며 방향성이 불명확합니다.' };
  if (!higherHighs && lowerLows) return { label: '하락 구조 (LH+LL)', tone: 'bearish', text: '고점과 저점이 모두 낮아지고 있습니다. 하락 추세 구조이며, 반등 시 매도 또는 관망이 적절합니다.' };
  return { label: '횡보 구조', tone: 'neutral', text: '뚜렷한 고저점 패턴이 형성되지 않았습니다. 횡보 구간이며 방향이 결정될 때까지 대기하세요.' };
};

SXI.maConvergence = function(converging, spread) {
  if (converging == null) return null;
  if (converging) return { label: '수렴 중', tone: 'neutral', text: `이평선들이 모이고 있습니다 (분산 ${(+spread).toFixed(1)}%). 큰 추세 변화가 임박할 수 있으며, 돌파 방향에 주목하세요.` };
  if (+spread > 5) return { label: '크게 벌어짐', tone: 'warning', text: `이평선 간격이 넓습니다 (분산 ${(+spread).toFixed(1)}%). 추세가 과열 상태일 수 있으며, 평균 회귀 가능성에 유의하세요.` };
  return { label: '보통', tone: 'neutral', text: `이평선 분산 ${(+spread).toFixed(1)}%로 정상 범위입니다.` };
};

SXI.vwap = function(position, pct) {
  if (!position) return null;
  if (position === 'above_far') return { label: 'VWAP 크게 위', tone: 'warning', text: `가격이 VWAP보다 ${(+pct).toFixed(1)}% 위에 있습니다. 평균 매입단가를 크게 웃돌아 차익실현 매물이 나올 수 있습니다.` };
  if (position === 'above') return { label: 'VWAP 위', tone: 'bullish', text: '가격이 VWAP 위에 있어 매수세가 우위입니다. 기관/세력의 평균단가를 상회하고 있어 상승 추세를 뒷받침합니다.' };
  if (position === 'near') return { label: 'VWAP 근처', tone: 'neutral', text: '가격이 VWAP 근처에서 움직이고 있습니다. 매수/매도 균형 상태이며, 이탈 방향이 향후 추세를 결정합니다.' };
  if (position === 'below') return { label: 'VWAP 아래', tone: 'bearish', text: '가격이 VWAP 아래에 있어 매도세가 우위입니다. 평균 매입단가를 하회하여 추가 매도 압력이 있을 수 있습니다.' };
  return { label: 'VWAP 크게 아래', tone: 'danger', text: `가격이 VWAP보다 ${Math.abs(+pct).toFixed(1)}% 아래에 있습니다. 심각한 매도 압력 구간이며, 손절 기준을 반드시 지키세요.` };
};

SXI.ichimoku = function(priceVsCloud, cloud, signal) {
  if (!priceVsCloud) return null;
  if (priceVsCloud === 'above' && cloud === 'bullish') return { label: '구름 위 (양운)', tone: 'bullish', text: '가격이 양운(상승 구름) 위에 있습니다. 가장 강한 상승 신호이며, 구름이 지지선 역할을 합니다.' };
  if (priceVsCloud === 'above') return { label: '구름 위', tone: 'bullish', text: '가격이 구름 위에 있어 상승 추세입니다. 구름 색상(음운)에 주의하며 추세 약화 가능성도 점검하세요.' };
  if (priceVsCloud === 'inside') return { label: '구름 안', tone: 'neutral', text: '가격이 구름 안에 있어 추세가 불명확합니다. 구름 이탈 방향이 향후 추세를 결정하며, 관망이 적절합니다.' };
  if (priceVsCloud === 'below' && cloud === 'bearish') return { label: '구름 아래 (음운)', tone: 'danger', text: '가격이 음운(하락 구름) 아래에 있습니다. 가장 약한 상태이며, 구름이 강한 저항선으로 작용합니다.' };
  return { label: '구름 아래', tone: 'bearish', text: '가격이 구름 아래에 있어 하락 추세입니다. 구름을 돌파하기 전까지 매수는 위험합니다.' };
};

SXI.regime = function(label, direction, adx) {
  if (!label) return null;
  const TEXT = {
    '추세+변동': '추세가 있으면서 변동성도 높은 구간입니다. 큰 수익 기회이지만 리스크 관리가 핵심입니다.',
    '추세장': '뚜렷한 추세가 진행 중입니다. 추세 방향으로의 포지션이 유리하며, 역추세 매매는 위험합니다.',
    '횡보장': '방향성 없는 횡보 구간입니다. 박스권 상하단 매매가 적합하며, 추세 추종 전략은 손실 구간입니다.',
    '전환기': '추세가 바뀌고 있는 전환 구간입니다. 기존 포지션 정리와 새 방향 확인이 필요합니다.',
  };
  return { label, tone: direction === 'UP' ? 'bullish' : direction === 'DOWN' ? 'bearish' : 'neutral', text: TEXT[label] || '시장 상태를 분석 중입니다.' };
};

// ════════════════════════════════════════════════════════════
//  2단계: 복합 상황 해석 (2~3개 지표 조합)
//  ind = calcIndicators 결과 또는 scrQuickScore.ind
// ════════════════════════════════════════════════════════════

SXI.composite = function(ind) {
  const notes = [];
  if (!ind) return notes;
  const rsi = ind.rsi?.val ?? ind.rsiLegacy ?? 50;
  const macdH = ind.macd?.hist ?? ind.macd?.histogram ?? 0;
  const macdG = ind.macd?.recentGolden ?? ind.macdLegacy?.recentGolden;
  const macdD = ind.macd?.recentDead ?? ind.macdLegacy?.recentDead;
  const maArr = ind.maAlign?.bullish ? 'bull' : ind.maAlign?.bearish ? 'bear' : 'mixed';
  const obvT = ind.obv?.trend;
  const obvDiv = ind.obv?.div ?? ind.obv?.divergence;
  const bbPctB = ind.bb?.pctB;
  const squeeze = ind.squeeze?.squeeze ?? ind.bb?.isSqueeze;
  const volR = ind.volPattern?.volRatio ?? 1;
  const adxV = ind.adx?.adx ?? ind.adx ?? 0;

  // 바닥 반등 콤보
  if (rsi <= 30 && macdG) notes.push({ tone: 'bullish', icon: '🔥', title: 'RSI 과매도 + MACD 골든크로스', text: '가장 강력한 반등 신호 조합입니다. 과매도 상태에서 모멘텀이 전환되고 있어, 단기 반등 확률이 높습니다.' });
  // 과매도 + BB 하단
  else if (rsi <= 30 && bbPctB != null && bbPctB <= 0.1) notes.push({ tone: 'bullish', icon: '📉', title: 'RSI 과매도 + BB 하단 이탈', text: '이중 과매도 신호입니다. 기술적 반등 가능성이 높지만, 하락 추세가 강하면 더 하락할 수 있어 거래량 확인이 필요합니다.' });

  // 정배열 + OBV 상승
  if (maArr === 'bull' && obvT === 'up') notes.push({ tone: 'bullish', icon: '📈', title: '정배열 + OBV 상승', text: '추세와 수급이 모두 상승을 지지하고 있습니다. 가장 건강한 상승 패턴이며 눌림목 매수에 적합합니다.' });

  // 정배열 + OBV 하락 (괴리)
  if (maArr === 'bull' && obvT === 'down') notes.push({ tone: 'warning', icon: '⚠️', title: '가격↑ OBV↓ 괴리', text: '가격은 상승하지만 거래량은 빠지고 있습니다. 상승 신뢰도가 낮으며, 매물 출회 시 급락할 수 있습니다.' });

  // MACD 데드크로스 + 역배열
  if (macdD && maArr === 'bear') notes.push({ tone: 'danger', icon: '🔻', title: 'MACD 데드크로스 + 역배열', text: '모멘텀과 추세가 모두 하락을 가리키고 있습니다. 강한 매도 신호이며, 보유 중이면 손절을 검토하세요.' });

  // 스퀴즈 + 정배열
  if (squeeze && maArr === 'bull') notes.push({ tone: 'bullish', icon: '💥', title: 'BB 스퀴즈 + 정배열', text: '변동성이 극도로 수축된 상태에서 상승 추세가 유지되고 있습니다. 상방 돌파 시 강한 상승이 예상됩니다.' });

  // 거래량 폭발 + 양봉
  if (volR >= 2 && ind.candle?.bullish) notes.push({ tone: 'bullish', icon: '🚀', title: '거래량 폭발 + 강세 캔들', text: `거래량이 평소의 ${volR.toFixed(1)}배로 급증하며 양봉이 나왔습니다. 세력 진입 가능성이 높으며 추세 시작 신호입니다.` });

  // 거래량 폭발 + 음봉
  if (volR >= 2 && ind.candle?.bearish) notes.push({ tone: 'danger', icon: '💣', title: '거래량 폭발 + 약세 캔들', text: `거래량이 평소의 ${volR.toFixed(1)}배로 급증하며 음봉이 나왔습니다. 대량 매도가 발생한 것으로, 추가 하락에 대비하세요.` });

  // OBV 다이버전스
  if (obvDiv === 'bullish') notes.push({ tone: 'bullish', icon: '🔍', title: 'OBV 상승 다이버전스', text: '가격은 하락하지만 거래량은 유입 중입니다. 세력 매집 가능성이 높으며, 상승 전환 초기 신호입니다.' });
  if (obvDiv === 'bearish') notes.push({ tone: 'bearish', icon: '🔍', title: 'OBV 하락 다이버전스', text: '가격은 상승하지만 거래량은 빠지고 있습니다. 상승 지속이 어려울 수 있으며 매도 물량에 주의하세요.' });

  // 과매수 과열
  if (rsi >= 75 && bbPctB != null && bbPctB >= 0.95) notes.push({ tone: 'danger', icon: '🌡️', title: 'RSI 과매수 + BB 상단 돌파', text: '이중 과열 신호입니다. 급락 위험이 높으며, 보유 중이면 분할 매도를 적극 검토하세요.' });

  // 강한 추세 + 높은 ADX
  if (adxV >= 35 && maArr === 'bull') notes.push({ tone: 'bullish', icon: '⚡', title: '강한 상승 추세 (ADX ' + Math.round(adxV) + ')', text: 'ADX가 높고 정배열 상태입니다. 매우 강한 상승 추세이며 추세 추종 전략에 최적입니다.' });
  if (adxV >= 35 && maArr === 'bear') notes.push({ tone: 'danger', icon: '⚡', title: '강한 하락 추세 (ADX ' + Math.round(adxV) + ')', text: 'ADX가 높고 역배열 상태입니다. 매우 강한 하락 추세이며 매수를 자제하세요.' });

  return notes;
};

// ════════════════════════════════════════════════════════════
//  3단계: 종합평 생성
//  action = 'BUY'|'SELL'|'HOLD', score = 0~100
// ════════════════════════════════════════════════════════════

SXI.summary = function(action, score, reasons, ind) {
  const composites = SXI.composite(ind);

  // 핵심 이유 추출 (최대 3개)
  const keyReasons = composites.slice(0, 3);

  // 위험 요소
  const risks = composites.filter(c => c.tone === 'danger' || c.tone === 'warning');

  // 종합평 생성
  let tone, mainText;
  if (action === 'BUY') {
    tone = 'bullish';
    if (score >= 75) mainText = '강한 매수 신호가 포착되었습니다. 여러 지표가 상승을 지지하고 있으며, 적극적인 진입을 고려할 수 있는 구간입니다.';
    else if (score >= 65) mainText = '매수 우위 상황입니다. 기술적 지표가 상승을 가리키고 있지만, 거래량과 추세 확인 후 분할 진입을 권장합니다.';
    else mainText = '약한 매수 신호입니다. 조건부 진입이 가능하지만, 손절 기준을 명확히 설정하고 소액으로 접근하세요.';
  } else if (action === 'SELL') {
    tone = 'bearish';
    if (score <= 25) mainText = '강한 매도 신호입니다. 여러 지표가 하락을 가리키고 있으며, 보유 중이면 손절 또는 비중 축소를 적극 검토하세요.';
    else if (score <= 35) mainText = '매도 우위 상황입니다. 추세가 하락으로 전환되고 있으며, 신규 매수를 자제하고 기존 포지션을 점검하세요.';
    else mainText = '약한 매도 신호입니다. 즉각적인 매도보다는 추이를 지켜보되, 추가 하락에 대비한 손절 기준을 설정하세요.';
  } else {
    tone = 'neutral';
    if (score >= 55) mainText = '약간 매수 우위지만 확신할 수 없는 구간입니다. 추세가 명확해질 때까지 관망하거나, 소액 분할 진입을 고려하세요.';
    else if (score >= 45) mainText = '중립 구간입니다. 매수/매도 어느 쪽도 우위가 아니며, 다음 방향 결정을 기다리는 것이 현명합니다.';
    else mainText = '약간 매도 우위지만 추세가 확정되지 않았습니다. 보유 중이면 손절 기준을 확인하고, 미보유면 관망하세요.';
  }

  // 안전필터 차단 이유 반영
  if (reasons && reasons.length) {
    mainText += ' 단, 안전필터에서 ' + reasons.join(', ') + ' 조건이 감지되어 주의가 필요합니다.';
  }

  return {
    tone,
    mainText,
    keyReasons,
    risks,
    composites,
  };
};

// ════════════════════════════════════════════════════════════
//  헬퍼: 전체 해석 일괄 생성 (분석 오버레이용)
//  ind = calcIndicators 또는 scrQuickScore.ind 결과
// ════════════════════════════════════════════════════════════

SXI.interpretAll = function(ind) {
  if (!ind) return {};
  const rsiV = ind.rsi?.val ?? ind.rsiLegacy ?? null;
  const macdObj = ind.macd || ind.macdLegacy || {};
  const stochObj = ind.stoch || ind.stochLegacy || {};
  const adxObj = ind.adx || ind.adxLegacy || {};
  const bbObj = ind.bb || ind.bbLegacy || {};
  const obvObj = ind.obv || ind.obvLegacy || {};
  const candleObj = ind.candle || ind.patterns || ind.patternsLegacy || {};
  const atrObj = ind.atr || {};
  const maAlign = ind.maAlign || {};
  const psarObj = ind.psar || {};
  const swingObj = ind.swingStruct || ind.swingStructLegacy || {};
  const maConvObj = ind.maConv || {};
  const vwapObj = ind.vwap || ind.vwapLegacy || {};
  const ichimokuObj = ind.ichimoku || ind.ichimokuLegacy || {};
  const regimeObj = ind.regime || {};
  const pullbackScore = ind.pullback?.score ?? null;

  return {
    rsi: SXI.rsi(rsiV),
    macd: SXI.macd(macdObj.hist ?? macdObj.histogram, macdObj.prevHist, macdObj.recentGolden, macdObj.recentDead),
    stoch: SXI.stoch(stochObj.k, stochObj.d),
    adx: SXI.adx(adxObj.adx, adxObj.pdi ?? adxObj.plusDI, adxObj.mdi ?? adxObj.minusDI),
    cci: SXI.cci(ind.cci),
    mfi: SXI.mfi(ind.mfi),
    bb: SXI.bb(bbObj.pctB, bbObj.width, bbObj.isSqueeze ?? ind.squeeze?.squeeze),
    bbWidth: SXI.bbWidth(bbObj.width, bbObj.isSqueeze ?? ind.squeeze?.squeeze),
    obv: SXI.obv(obvObj.trend, obvObj.div ?? obvObj.divergence),
    ma: SXI.ma(maAlign.bullish ? 'bullish' : maAlign.bearish ? 'bearish' : null, ind.ma5, ind.ma20, ind.ma60, ind.ma120),
    atr: SXI.atr(atrObj.pct ?? atrObj.ratio),
    sar: SXI.sar(psarObj.trend),
    candle: SXI.candle(candleObj.patterns ? [...candleObj.patterns] : null),
    pullback: SXI.pullback(pullbackScore),
    swingStruct: SXI.swingStruct(swingObj.higherHighs, swingObj.lowerLows),
    maConvergence: SXI.maConvergence(maConvObj.converging, maConvObj.spread),
    vwap: SXI.vwap(vwapObj.position, vwapObj.pct),
    ichimoku: SXI.ichimoku(ichimokuObj.priceVsCloud, ichimokuObj.cloud, ichimokuObj.signal),
    regime: SXI.regime(regimeObj.label, regimeObj.direction, regimeObj.adx),
  };
};

// ── 버전 ──
SXI.version = '1.0';
