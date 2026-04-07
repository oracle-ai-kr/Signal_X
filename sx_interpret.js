// ════════════════════════════════════════════════════════════
//  SIGNAL X — Interpret Engine v2.0
//  지표별 해석 + 복합상황 해석 + 종합평(행동가이드) 생성
//  sx_screener 종목분석 탭 해석카드용
//  S39→S40: 해석 엔진 대규모 보강
//    - 기존 단건 함수 실전형 문장 보강 (RSI/MACD/ADX/BB/ATR/OBV/MA)
//    - 신규 단건 6개 (priceChannel/pivot/maDisparity/volumeMA/adLine/stochSlow)
//    - 복합 4계열 분리 (momentum/trend/flow/risk) + 신규 8조합
//    - 종합평에 stateLine/actionGuide/invalidation/buyTrigger 4필드
//    - tone 5단계 (bullish/bearish/neutral/warning/danger) 통일
// ════════════════════════════════════════════════════════════

const SXI = {};

// ════════════════════════════════════════════════════════════
//  1단계: 지표별 구간 해석
//  반환: { label, tone, text } | null
//  tone: 'bullish'|'bearish'|'neutral'|'warning'|'danger'
// ════════════════════════════════════════════════════════════

SXI.rsi = function(val){
  if(val==null) return null;
  const v=+val;
  if(v<=20) return {label:'극단적 과매도',tone:'bullish',text:'매도 세력이 거의 소진된 상태입니다. 기술적 반등 가능성이 높지만, 강한 하락 추세에서는 추가 하락도 가능하므로 MACD 골든크로스나 거래량 증가 같은 보조 확인이 필요합니다.'};
  if(v<=30) return {label:'과매도',tone:'bullish',text:'매도 압력이 과도한 구간입니다. MACD 골든크로스·거래량 증가와 함께 나타나면 반등 신뢰도가 높아집니다. 단독으로는 하락 지속 가능성도 열어두세요.'};
  if(v<=40) return {label:'약세 구간',tone:'bearish',text:'매도세가 우위이며 아직 과매도는 아닙니다. 추세 전환 신호(MACD 방향 전환, 지지선 확인) 없이 매수 진입은 시기상조입니다.'};
  if(v<=50) return {label:'중립 약세',tone:'neutral',text:'중립에서 약세 쪽으로 기울어져 있습니다. 뚜렷한 방향이 없으므로 MA 배열·거래량 방향 등 추세 확인 후 판단하세요.'};
  if(v<=60) return {label:'중립 강세',tone:'neutral',text:'중립에서 강세 쪽입니다. 약한 매수 우위이나 추세 확인이 안 된 상태이므로, 정배열·거래량 동반 여부를 함께 보세요.'};
  if(v<=70) return {label:'강세 구간',tone:'bullish',text:'매수세가 우위인 구간입니다. 상승 추세 추종 전략에 유리하며, 추세가 살아 있는 동안 눌림목 접근이 적합합니다.'};
  if(v<=80) return {label:'과매수',tone:'warning',text:'과매수권이지만 강한 추세장에서는 과매수 상태가 오래 지속될 수 있습니다. 단순 수치만으로 매도하기보다 MACD 둔화나 거래량 감소가 같이 나오는지 확인하는 편이 안전합니다.'};
  return {label:'극단적 과매수',tone:'danger',text:'극단적 과열 상태입니다. 급락 위험이 높으며, 이미 보유 중이라면 분할 매도를 검토하세요. 신규 진입은 매우 불리한 자리입니다.'};
};

SXI.macd = function(hist, prevHist, recentGolden, recentDead){
  if(hist==null) return null;
  const h=+hist, pH=prevHist!=null?+prevHist:null;
  if(recentGolden && h>=0) return {label:'골든크로스 (제로선 위)',tone:'bullish',text:'MACD선이 시그널선을 상향 돌파하면서 제로선 위에 있습니다. 추세 지속 강화 신호에 가깝습니다. 거래량 동반 시 신뢰도가 높아집니다.'};
  if(recentGolden) return {label:'골든크로스 (제로선 아래)',tone:'bullish',text:'MACD선이 제로선 아래에서 골든크로스했습니다. 방향 전환 초기 신호이지만, 아직 하락 추세 안에서의 기술적 반등일 수 있어 거래량 동반 여부가 중요합니다.'};
  if(recentDead && h<=0) return {label:'데드크로스 (제로선 아래)',tone:'danger',text:'MACD선이 제로선 아래에서 데드크로스했습니다. 하락 모멘텀이 강화되는 구간이며, 보유 중이면 손절 기준을 반드시 점검하세요.'};
  if(recentDead) return {label:'데드크로스 (제로선 위)',tone:'bearish',text:'MACD선이 제로선 위에서 데드크로스했습니다. 상승 모멘텀이 피로를 보이는 단계이며, 추세 꺾임 가능성을 열어둬야 합니다.'};
  if(h>0 && pH!=null && h>pH) return {label:'양수 확대',tone:'bullish',text:'상승 모멘텀이 가속되고 있습니다. 추세 지속 구간이며, 보유 유지에 유리한 환경입니다.'};
  if(h>0 && pH!=null && h<=pH) return {label:'양수 축소',tone:'warning',text:'히스토그램이 양수이지만 줄어들고 있어 상승 속도가 둔화되고 있습니다. 추세가 꺾였다고 단정할 단계는 아니지만, 단기 익절과 추격 자제 쪽에 무게가 실립니다.'};
  if(h<0 && pH!=null && h<pH) return {label:'음수 확대',tone:'bearish',text:'하락 모멘텀이 강화되고 있습니다. 매도세가 가속되는 구간이며, 신규 매수 진입은 위험합니다.'};
  if(h<0 && pH!=null && h>=pH) return {label:'음수 축소',tone:'neutral',text:'하락 모멘텀이 줄어들고 있습니다. 바닥을 다지는 중일 수 있으며, 골든크로스 전환 여부를 주시하세요.'};
  return {label:'중립',tone:'neutral',text:'MACD가 제로선 부근으로 방향성이 약합니다. 다른 지표와 함께 판단을 보강하세요.'};
};

SXI.stoch = function(k, d){
  if(k==null) return null;
  const kv=+k, dv=+(d||k);
  if(kv<=20 && kv>dv) return {label:'과매도 반전',tone:'bullish',text:'%K가 과매도 구간에서 %D를 상향 돌파했습니다. 강력한 단기 반등 신호이며, RSI 과매도와 동시 발생 시 신뢰도가 높아집니다.'};
  if(kv<=20) return {label:'과매도',tone:'bullish',text:'스토캐스틱이 과매도 구간입니다. 반등 가능성이 높지만, %K가 %D를 상향 돌파할 때까지 기다리는 것이 안전합니다.'};
  if(kv<=50) return {label:'하단 중립',tone:'neutral',text:'스토캐스틱이 중간 아래에 있습니다. 뚜렷한 신호는 없으며, 추세 방향과 다른 지표를 함께 확인하세요.'};
  if(kv<=80) return {label:'상단 중립',tone:'neutral',text:'스토캐스틱이 중간 위에 있어 약한 매수 우위입니다. 과매수 진입 전 단계이며, 추세가 강하면 유지 가능합니다.'};
  if(kv>80 && kv<dv) return {label:'과매수 반전',tone:'bearish',text:'%K가 과매수 구간에서 %D를 하향 돌파했습니다. 단기 조정 시작 신호이며, RSI 과매수와 함께 나타나면 조정 확률이 높습니다.'};
  return {label:'과매수',tone:'warning',text:'스토캐스틱이 과매수 구간입니다. 강한 추세에서는 과매수가 지속되지만, %K가 %D를 하향 돌파하면 매도 신호로 전환됩니다.'};
};

SXI.adx = function(adx, pdi, mdi){
  if(adx==null) return null;
  const v=+adx;
  let dir='', dirAction='';
  if(pdi!=null && mdi!=null){dir=+pdi>+mdi?'상승':'하락'; dirAction=+pdi>+mdi?'매수 보유가 유리':'매수 자제·관망이 적절';}
  if(v<20) return {label:'추세 없음',tone:'neutral',text:'ADX가 낮아 추세 강도가 약합니다. 횡보 구간일 가능성이 높으며 추세 추종 전략보다 박스권 매매가 적합합니다.'};
  if(v<30) return {label:'약한 추세',tone:'neutral',text:`약한 ${dir} 추세 형성 초기입니다. ADX는 방향이 아니라 강도를 나타내므로, +DI/-DI 방향을 함께 확인해야 합니다. 현재 ${dirAction}합니다.`};
  if(v<50) return {label:'강한 추세',tone:dir==='상승'?'bullish':'bearish',text:`강한 ${dir} 추세가 진행 중입니다(ADX ${v.toFixed(0)}). 추세 추종 전략에 유리하며, ${dirAction}합니다.`};
  return {label:'극강 추세',tone:dir==='상승'?'bullish':'danger',text:`매우 강한 ${dir} 추세입니다(ADX ${v.toFixed(0)}). 과열 구간일 수 있어 ${dir==='상승'?'익절 시점 점검과 비중 축소':'손절 필수'} 구간입니다.`};
};

SXI.cci = function(val){
  if(val==null) return null;
  const v=+val;
  if(v<=-200) return {label:'극단적 과매도',tone:'bullish',text:'극심한 매도 과잉입니다. 기술적 반등 가능성이 높지만, 추세 전환 확인 후 진입이 안전합니다.'};
  if(v<=-100) return {label:'과매도',tone:'bullish',text:'CCI가 과매도 구간이라 반등 시 초기 매수 구간이 될 수 있습니다.'};
  if(v<=100) return {label:'중립',tone:'neutral',text:'CCI가 정상 범위 내에 있어 뚜렷한 과열/침체 신호는 없습니다.'};
  if(v<=200) return {label:'과매수',tone:'warning',text:'CCI가 과매수 구간입니다. 단기 조정 가능성이 있으며, 추가 매수는 신중하게 접근하세요.'};
  return {label:'극단적 과매수',tone:'danger',text:'극심한 매수 과잉 상태이며 급락 위험이 높은 구간입니다.'};
};

SXI.mfi = function(val){
  if(val==null) return null;
  const v=+val;
  if(v<=20) return {label:'과매도 (자금유출)',tone:'bullish',text:'자금이 대량 유출된 상태입니다. 매도 압력이 극에 달해 반등 가능성이 높습니다.'};
  if(v<=40) return {label:'약세',tone:'neutral',text:'자금 유출이 진행 중이며 매수세가 약합니다.'};
  if(v<=60) return {label:'중립',tone:'neutral',text:'자금 흐름이 균형 상태로 뚜렷한 방향성이 없습니다.'};
  if(v<=80) return {label:'강세',tone:'bullish',text:'자금이 유입되며 매수세가 우위입니다. 상승 추세를 뒷받침합니다.'};
  return {label:'과매수 (자금과잉)',tone:'warning',text:'자금이 과도하게 유입된 상태입니다. 단기 고점 근처일 수 있으며 익절 타이밍을 고려하세요.'};
};

SXI.bb = function(pctB, width, isSqueeze){
  if(pctB==null) return null;
  const b=+pctB; let res;
  if(b<=0) res={label:'하단 이탈',tone:'bullish',text:'볼린저밴드 하단을 이탈한 극단적 과매도 상태입니다. 반등 가능성이 높지만 하락 추세에서는 밴드 워킹(연속 이탈)도 가능하므로 추세 확인이 필요합니다.'};
  else if(b<=0.2) res={label:'하단 근접',tone:'bullish',text:'밴드 하단 근처로 매수 관심 구간입니다. 지지 확인(양봉·거래량 증가) 후 접근이 안전합니다.'};
  else if(b<=0.5) res={label:'하단~중심',tone:'neutral',text:'밴드 중심 아래로 약한 매도 우위이지만 뚜렷한 신호는 아닙니다.'};
  else if(b<=0.8) res={label:'중심~상단',tone:'neutral',text:'밴드 중심 위로 약한 매수 우위이며 상승 추세 유지 중입니다.'};
  else if(b<=1.0) res={label:'상단 근접',tone:'warning',text:'밴드 상단 근처로 단기 과열 가능성이 있습니다. 추세가 살아 있을 때는 가속 구간일 수 있지만, 과열 구간에서는 되돌림도 크게 나올 수 있습니다.'};
  else res={label:'상단 돌파',tone:'danger',text:'볼린저밴드 상단을 돌파한 과열 상태입니다. 신규 진입은 추격보다 눌림 확인 후 접근이 안전합니다.'};
  if(isSqueeze) res.text+=' 현재 BB폭이 수축(스퀴즈) 상태로 에너지가 축적되어 있으며, 방향이 터질 때 속도가 빠를 수 있습니다.';
  return res;
};

SXI.bbWidth = function(width, isSqueeze){
  if(width==null) return null;
  if(isSqueeze) return {label:'스퀴즈 (수축)',tone:'neutral',text:'볼린저밴드 폭이 좁아져 에너지 축적 구간에 가깝습니다. 방향이 터질 때 속도가 빠를 수 있으므로, 돌파 방향을 주시하세요.'};
  if(+width>5) return {label:'확장 (고변동)',tone:'warning',text:'볼린저밴드가 크게 벌어져 있어 단기 변동성이 매우 높습니다. 방향은 맞아도 흔들림이 큰 구간이므로, 진입하더라도 비중 축소와 손절 간격 조정이 필요합니다.'};
  return {label:'보통',tone:'neutral',text:'볼린저밴드 폭이 정상 범위입니다.'};
};

SXI.obv = function(trend, divergence){
  if(!trend) return null;
  if(divergence==='bullish'||divergence===true) return {label:'OBV 상승 다이버전스',tone:'bullish',text:'가격은 하락했지만 누적 거래량 흐름은 개선되고 있어, 저가 매집 가능성을 시사합니다.'};
  if(divergence==='bearish') return {label:'OBV 하락 다이버전스',tone:'warning',text:'가격은 상승했지만 거래량 흐름은 빠지고 있어, 상승 지속이 어려울 수 있습니다.'};
  if(trend==='up') return {label:'OBV 상승',tone:'bullish',text:'누적 거래량이 증가 추세로 매수세가 지속 유입되고 있습니다. 가격과 함께 올라가면 건강한 상승이며, 가격 횡보+OBV 상승이면 매집 구간일 수 있습니다.'};
  if(trend==='down') return {label:'OBV 하락',tone:'bearish',text:'누적 거래량이 감소 추세로 매도세가 우위입니다.'};
  return {label:'OBV 보합',tone:'neutral',text:'OBV가 횡보 중으로 뚜렷한 수급 방향이 없습니다.'};
};

SXI.ma = function(arrangement){
  if(!arrangement) return null;
  if(arrangement==='bullish') return {label:'정배열',tone:'bullish',text:'단기 이평선이 장기 위에 정렬된 상승 추세입니다. 눌림목 매수 전략에 적합하며, MA20 부근 지지 시 재진입 구간이 됩니다. MA20 이탈 시 눌림 해석이 약화됩니다.'};
  if(arrangement==='bearish') return {label:'역배열',tone:'bearish',text:'단기 이평선이 장기 아래에 정렬된 하락 추세입니다. 반등이 나와도 이평선이 저항으로 작용하므로, 추세 전환 확인 전 매수는 위험합니다.'};
  return {label:'혼조',tone:'neutral',text:'이평선이 뒤엉켜 있어 추세 전환기일 수 있습니다. 방향이 정리될 때까지 관망이 유리합니다.'};
};

SXI.atr = function(ratio){
  if(ratio==null) return null;
  const v=+ratio;
  if(v<1.5) return {label:'저변동',tone:'neutral',text:'변동성이 매우 낮아 에너지 축적 구간에 가깝습니다. 방향이 터질 때 속도가 빠를 수 있으므로 돌파 대기 구간입니다.'};
  if(v<3) return {label:'보통',tone:'neutral',text:'변동성이 정상 범위로 일반적인 매매 환경입니다.'};
  if(v<5) return {label:'고변동',tone:'warning',text:'변동성이 높아 손절 폭이 넓어질 수 있는 구간입니다. 같은 방향을 보더라도 비중을 줄이거나 추격 진입을 피하는 쪽이 안전합니다.'};
  return {label:'극변동',tone:'danger',text:'변동성이 극단적으로 높습니다. 큰 수익과 큰 손실이 동시에 가능하며, 소액 진입 또는 관망을 권장합니다.'};
};

SXI.sar = function(trend){
  if(!trend) return null;
  if(trend==='up') return {label:'상승추세',tone:'bullish',text:'Parabolic SAR이 가격 아래에 있어 상승 추세를 확인합니다. SAR 가격 이탈 시 추세 전환 신호입니다.'};
  return {label:'하락추세',tone:'bearish',text:'Parabolic SAR이 가격 위에 있어 하락 추세입니다. 매수 보류가 적절하며 추세 전환을 기다리세요.'};
};

SXI.candle = function(patterns){
  if(!patterns||!patterns.length) return null;
  const strongest = patterns.sort((a,b)=>Math.abs(b.score||0)-Math.abs(a.score||0))[0];
  if(!strongest) return null;
  const dir = strongest.dir>0?'bullish':strongest.dir<0?'bearish':'neutral';
  const CT = {'장대양봉':'강한 매수세로 종가가 고가 근처에서 마감했습니다. 상승 추세 시작이나 지속 신호입니다.','장대음봉':'강한 매도세로 종가가 저가 근처에서 마감했습니다. 하락 추세 시작이나 지속 신호입니다.','해머':'하락 중 나타나면 반등 신호입니다. 긴 아래꼬리가 저가에서 매수세 유입을 보여줍니다.','슈팅스타':'상승 중 나타나면 반락 신호입니다. 긴 윗꼬리가 고가에서 매도세 유입을 보여줍니다.','도지':'매수/매도 세력이 팽팽한 상태입니다. 추세 전환 가능성이 있으며, 다음 봉의 방향이 중요합니다.','스피닝탑':'매수/매도 세력이 비슷한 힘을 보이고 있습니다. 방향성이 약한 상태입니다.','모닝스타':'3봉 강세 반전 패턴입니다. 하락 후 나타나면 강력한 매수 신호로, 신뢰도가 높습니다.','이브닝스타':'3봉 약세 반전 패턴입니다. 상승 후 나타나면 강력한 매도 신호입니다.','상승장악':'전일 음봉을 완전히 감싸는 양봉입니다. 강한 매수 반전 신호입니다.','하락장악':'전일 양봉을 완전히 감싸는 음봉입니다. 강한 매도 반전 신호입니다.','하라미상승':'큰 음봉 안에 작은 양봉이 나타났습니다. 하락 모멘텀 약화·반등 가능성이 있습니다.','하라미하락':'큰 양봉 안에 작은 음봉이 나타났습니다. 상승 모멘텀 약화·조정 가능성이 있습니다.','피어싱라인':'전일 음봉의 50% 이상을 회복하는 양봉입니다. 반등 초기 신호입니다.','다크클라우드':'전일 양봉의 50% 이상을 하락하는 음봉입니다. 반락 초기 신호입니다.','적삼병':'3일 연속 양봉으로 강한 상승 지속 패턴입니다.','흑삼병':'3일 연속 음봉으로 강한 하락 지속 패턴입니다.','갭상승':'전일 고가보다 높게 시작. 갭을 메우지 않으면 상승 추세 확인입니다.','갭하락':'전일 저가보다 낮게 시작. 갭을 메우지 않으면 하락 추세 확인입니다.','집게바닥':'두 봉의 저가가 거의 같은 수준으로 지지선 형성, 반등 가능성이 높습니다.','집게천정':'두 봉의 고가가 거의 같은 수준으로 저항선 형성, 하락 가능성이 높습니다.','인사이드데이':'금일 고저가가 전일 범위 안에 있어 변동성 수축 상태입니다. 돌파 방향 주시가 필요합니다.','아웃사이드데이':'금일 고저가가 전일 범위를 넘어 변동성 확대 중입니다. 방향 결정 시 큰 움직임이 나올 수 있습니다.'};
  return {label:strongest.name, tone:dir, text:CT[strongest.name]||`${strongest.name} 패턴이 감지되었습니다.`};
};

// ── 고급 분석 해석 (기존 보강) ──

SXI.pullback = function(score){
  if(score==null) return null;
  const s=+score;
  if(s>=70) return {label:'눌림목 매수 적기',tone:'bullish',text:'상승 추세 내 조정이 충분히 진행된 상태입니다. 이평선 지지+과매도 조건이 갖춰져 분할 매수에 적합합니다. MA20 이탈 시 해석이 약화됩니다.'};
  if(s>=50) return {label:'눌림목 관심',tone:'neutral',text:'조정 진행 중이나 아직 최적 진입은 아닙니다. 추가 눌림 시 매수 기회가 될 수 있으니 지지선 확인 후 접근하세요.'};
  if(s>=30) return {label:'눌림목 약함',tone:'neutral',text:'눌림목 조건이 일부만 충족됩니다. 추세가 강하지 않거나 조정이 충분하지 않은 상태입니다.'};
  return {label:'해당없음',tone:'neutral',text:'눌림목 매수 조건에 해당하지 않습니다.'};
};

SXI.swingStruct = function(higherHighs, lowerLows){
  if(higherHighs && !lowerLows) return {label:'상승 구조 (HH+HL)',tone:'bullish',text:'스윙 구조가 상방으로 정리되고 있어 추세 지속형 흐름에 가깝습니다. 눌림 시 직전 저점 지지 여부가 핵심이며, 저점 이탈 시 구조가 무너집니다.'};
  if(higherHighs && lowerLows) return {label:'확산형',tone:'warning',text:'고점은 높아지지만 저점도 낮아지는 확산형 구조입니다. 변동성 확대 중이며 방향성이 불명확합니다.'};
  if(!higherHighs && lowerLows) return {label:'하락 구조 (LH+LL)',tone:'bearish',text:'저점이 계속 낮아지는 구조라 반등이 나와도 추세 전환으로 보기엔 이릅니다. 고점 돌파 전까지 보수적 접근하세요.'};
  return {label:'횡보 구조',tone:'neutral',text:'뚜렷한 고저점 패턴이 형성되지 않은 횡보 구간입니다. 방향 결정까지 대기하세요.'};
};

SXI.maConvergence = function(converging, spread){
  if(converging==null) return null;
  if(converging) return {label:'수렴 중',tone:'neutral',text:`이평선들이 모이고 있습니다(분산 ${(+spread).toFixed(1)}%). 에너지 축적 구간에 가까우며 방향이 터질 때 속도가 빠를 수 있습니다.`};
  if(+spread>5) return {label:'크게 벌어짐',tone:'warning',text:`이평선 간격이 넓습니다(분산 ${(+spread).toFixed(1)}%). 추세 과열 상태일 수 있으며 평균 회귀 가능성에 유의하세요.`};
  return {label:'보통',tone:'neutral',text:`이평선 분산 ${(+spread).toFixed(1)}%로 정상 범위입니다.`};
};

SXI.vwap = function(position, pct){
  if(!position) return null;
  const p = pct!=null?(+pct).toFixed(1):'';
  if(position==='above_far') return {label:'VWAP 크게 상회',tone:'warning',text:`가격이 단기 평균 매입단가를 ${p}% 상회하고 있습니다. 차익실현 매물이 나올 수 있는 과열 구간이며, 추격보다 눌림 확인 후 접근이 유리합니다.`};
  if(position==='above') return {label:'VWAP 상회',tone:'bullish',text:'가격이 단기 평균 매입단가 위에서 유지되고 있습니다. 단기 수급은 매수 우위로 해석할 수 있으며, 눌림이 나오더라도 VWAP 부근이 1차 지지 역할을 할 수 있습니다.'};
  if(position==='near') return {label:'VWAP 공방',tone:'neutral',text:'가격이 VWAP 부근에서 매수/매도 공방 중입니다. 방향성이 확정되지 않은 자리이므로 돌파 또는 이탈 확인이 우선입니다.'};
  if(position==='below') return {label:'VWAP 하회',tone:'bearish',text:'가격이 단기 평균 매입단가 아래에 위치합니다. 단기 반등이 나오더라도 VWAP가 저항으로 작용할 수 있어 추격 매수는 보수적으로 봐야 합니다.'};
  return {label:'VWAP 크게 하회',tone:'danger',text:`가격이 단기 평균 매입단가를 ${p?Math.abs(+p).toFixed(1):''}% 하회하고 있습니다. 심각한 매도 압력 구간이며, 반등이 나오더라도 저항으로 작용할 수 있습니다.`};
};

SXI.ichimoku = function(priceVsCloud, cloud, signal){
  if(!priceVsCloud) return null;
  if(priceVsCloud==='above' && cloud==='bullish') return {label:'구름 위 (양운)',tone:'bullish',text:'가격이 구름 위에 있고 전환선이 기준선 위에 있어 중기 추세 우위가 유지됩니다. 다만 구름 상단과 괴리가 커질수록 단기 되돌림 가능성도 함께 봐야 합니다.'};
  if(priceVsCloud==='above') return {label:'구름 위',tone:'bullish',text:'가격이 구름 위에 있어 중기 기준 상승 추세입니다. 구름이 얇아지거나 음운 전환 시 주의가 필요합니다.'};
  if(priceVsCloud==='inside') return {label:'구름 안',tone:'neutral',text:'가격이 구름 안에 있어 중기 기준 약세 흐름입니다. 반등이 나오더라도 구름 하단 돌파 전까지는 추세 전환으로 보기 어렵습니다.'};
  if(priceVsCloud==='below' && cloud==='bearish') return {label:'구름 아래 (음운)',tone:'danger',text:'가격이 음운(하락 구름) 아래로 가장 약한 상태입니다. 구름이 두꺼운 저항으로 작용하여 반등 폭이 제한될 수 있습니다.'};
  return {label:'구름 아래',tone:'bearish',text:'가격이 구름 아래에 있어 하락 추세입니다. 구름 돌파 전까지 매수는 위험합니다.'};
};

SXI.regime = function(label, direction, adx){
  if(!label) return null;
  const T = {'추세+변동':'추세가 있으면서 변동성도 높은 구간입니다. 방향이 맞으면 수익이 빠르지만, 틀리면 손실도 빨라 비중 조절이 핵심입니다.','추세장':'뚜렷한 추세가 진행 중입니다. 추세 방향 포지션이 유리하며 역추세 매매는 위험합니다.','횡보장':'방향성 없는 횡보 구간입니다. 박스권 매매가 적합하며 추세 추종 전략은 손실 구간입니다.','전환기':'추세가 바뀌고 있는 전환 구간입니다. 기존 포지션 정리와 새 방향 확인이 필요합니다.'};
  return {label, tone:direction==='UP'?'bullish':direction==='DOWN'?'bearish':'neutral', text:T[label]||'시장 상태를 분석 중입니다.'};
};

// ════════════════════════════════════════════════════════════
//  1단계-B: 신규 단건 해석 함수 (v2.0)
// ════════════════════════════════════════════════════════════

SXI.priceChannel = function(pos, nearHigh, nearLow){
  if(!pos && !nearHigh && !nearLow) return null;
  if(nearHigh) return {label:'채널 상단 근접',tone:'warning',text:'최근 가격 범위 상단에 접근했습니다. 돌파 시 추세 가속 가능성이 있지만, 실패하면 되돌림 압력도 커질 수 있습니다.'};
  if(nearLow) return {label:'채널 하단 근접',tone:'bullish',text:'최근 가격 범위 하단에 접근했습니다. 지지 확인 시 반등 여지가 있으나, 이탈 시 추가 약세가 열립니다.'};
  if(pos==='upper') return {label:'채널 상단',tone:'warning',text:'최근 가격 범위 상단권에 위치합니다. 돌파 확인 전까지는 추격보다 확인 접근이 유리합니다.'};
  if(pos==='lower') return {label:'채널 하단',tone:'bullish',text:'최근 가격 범위 하단권에 위치합니다. 지지 확인 시 반등 시도 구간으로 볼 수 있습니다.'};
  return {label:'채널 중간',tone:'neutral',text:'최근 가격 범위 중간 부근으로 특별한 위치 신호는 없습니다.'};
};

SXI.pivot = function(priceVsPivot, nearR, nearS){
  if(priceVsPivot==null && !nearR && !nearS) return null;
  if(nearR) return {label:'피벗 저항 근접',tone:'warning',text:'당일 피벗 저항 구간에 가까워 돌파 전까지는 추격보다 확인 접근이 유리합니다.'};
  if(nearS) return {label:'피벗 지지 근접',tone:'bullish',text:'구조상 지지 영역에 가까워 반등 시도 구간으로 볼 수 있으나, 이탈 시 약세가 빨라질 수 있습니다.'};
  if(priceVsPivot==='above') return {label:'피벗 위',tone:'bullish',text:'현재가가 피벗 위에 있어 당일/단기 기준 매수 우위입니다.'};
  if(priceVsPivot==='below') return {label:'피벗 아래',tone:'bearish',text:'현재가가 피벗 아래에 머물러 단기 기준 약세 우위입니다. 피벗 회복 전까지 보수적 접근이 적절합니다.'};
  return {label:'피벗 근처',tone:'neutral',text:'현재가가 피벗 부근으로 방향 결정 전 단계입니다.'};
};

SXI.maDisparity = function(d20, d60){
  if(d20==null && d60==null) return null;
  const primary = d20!=null?+d20:(d60!=null?+d60:0);
  if(primary>8) return {label:'MA 크게 과열',tone:'danger',text:'이동평균선 대비 괴리가 크게 벌어졌습니다. 추세는 강할 수 있지만 신규 진입 기준으로는 과열 부담이 큽니다.'};
  if(primary>4) return {label:'MA 과열',tone:'warning',text:'이동평균선 대비 괴리가 벌어지고 있습니다. 추세가 살아 있다면 가속이지만, 조정 시 되돌림 폭도 커질 수 있습니다.'};
  if(primary<-8) return {label:'MA 크게 이격',tone:'bullish',text:'이동평균선 대비 하방 괴리가 매우 큽니다. 기술적 반등 가능성이 높지만 추세 확인이 필요합니다.'};
  if(primary<-4) return {label:'MA 눌림',tone:'neutral',text:'이동평균선과의 괴리가 줄어드는 중입니다. 추세가 살아 있다면 눌림목 성격으로 볼 수 있습니다.'};
  return {label:'MA 이격 보통',tone:'neutral',text:'이동평균선과의 괴리가 정상 범위입니다.'};
};

SXI.volumeMA = function(volRatio){
  if(volRatio==null) return null;
  const r=+volRatio;
  if(r>=3) return {label:'거래량 폭발',tone:'bullish',text:`현재 거래량이 평균의 ${r.toFixed(1)}배로 급증했습니다. 가격 방향과 거래량 방향이 같은지 함께 확인하세요.`};
  if(r>=1.5) return {label:'거래량 증가',tone:'bullish',text:'현재 거래량이 평균을 상회해 움직임의 신뢰도가 높아지고 있습니다.'};
  if(r>=0.7) return {label:'거래량 보통',tone:'neutral',text:'거래량이 평균 수준으로 특별한 신호는 없습니다.'};
  return {label:'거래량 감소',tone:'neutral',text:'거래량이 평균보다 약해 돌파 신뢰도는 다소 떨어집니다.'};
};

SXI.adLine = function(trend, div){
  if(!trend) return null;
  if(div==='bullish') return {label:'A/D 상승 다이버전스',tone:'bullish',text:'가격 조정 대비 종가 기준 수급 흐름이 개선되고 있어, 저가 매집 가능성을 시사합니다.'};
  if(div==='bearish') return {label:'A/D 하락 다이버전스',tone:'warning',text:'A/D 라인이 꺾이며 분산 조짐이 나타납니다. 고점권이라면 차익 실현 물량 출회 가능성을 봐야 합니다.'};
  if(trend==='up') return {label:'A/D 상승',tone:'bullish',text:'A/D 라인이 상승해 종가 기준 매집 성격이 확인됩니다. 가격이 횡보여도 내부 수급은 개선될 수 있습니다.'};
  if(trend==='down') return {label:'A/D 하락',tone:'bearish',text:'A/D 라인이 하락하며 분산 조짐이 나타납니다.'};
  return {label:'A/D 보합',tone:'neutral',text:'A/D 라인이 횡보 중으로 뚜렷한 수급 방향이 없습니다.'};
};

// ════════════════════════════════════════════════════════════
//  2단계: 복합 상황 해석 (4계열 분리)
// ════════════════════════════════════════════════════════════

SXI.compositeMomentum = function(ind){
  const notes=[];
  if(!ind) return notes;
  const rsi=ind.rsi?.val??ind.rsiLegacy??50;
  const stK=ind.stoch?.k??50, stD=ind.stoch?.d??50;
  const macdH=ind.macd?.hist??ind.macd?.histogram??0;
  const macdPH=ind.macd?.prevHist??null;
  const macdG=ind.macd?.recentGolden??ind.macdLegacy?.recentGolden;
  if(rsi<=30 && stK<=25 && stK>stD) notes.push({tone:'bullish',icon:'🔥',title:'RSI 과매도 + Stoch 골든크로스',text:'단기 반등 조건이 동시에 형성되고 있습니다. 추세 하락 중이라면 기술적 반등, 횡보 하단이라면 매수 시도 구간으로 볼 수 있습니다.'});
  else if(macdG && macdH<0 && macdPH!=null && macdH>macdPH) notes.push({tone:'bullish',icon:'🔄',title:'MACD 골든크로스 + 모멘텀 회복',text:'하락 모멘텀이 약해지며 방향 전환 초기 신호가 나타납니다. 거래량 증가가 동반되면 신뢰도가 높아집니다.'});
  if(rsi>=72 && macdH>0 && macdPH!=null && macdH<=macdPH) notes.push({tone:'warning',icon:'🌡️',title:'과열 후 모멘텀 둔화',text:'가격은 강하지만 상승 속도는 둔화되고 있습니다. 단기 익절과 추격 자제 쪽에 무게가 실립니다.'});
  return notes;
};

SXI.compositeTrend = function(ind){
  const notes=[];
  if(!ind) return notes;
  const maArr=ind.maAlign?.bullish?'bull':ind.maAlign?.bearish?'bear':'mixed';
  const macdD=ind.macd?.recentDead??ind.macdLegacy?.recentDead;
  const rsi=ind.rsi?.val??ind.rsiLegacy??50;
  const squeeze=ind.squeeze?.squeeze??ind.bb?.isSqueeze;
  const disp20=ind.disparity?.disparity20??null;
  const swHH=ind.swingStruct?.higherHighs??ind.swingStructLegacy?.higherHighs;
  const swLL=ind.swingStruct?.lowerLows??ind.swingStructLegacy?.lowerLows;
  if(maArr==='bull' && disp20!=null && Math.abs(disp20)<=2.5) notes.push({tone:'bullish',icon:'📐',title:'정배열 눌림 구간',text:'상승 추세가 유지되는 가운데 눌림 조정이 진행 중입니다. 추세 추종 관점에선 재진입 후보 구간입니다.'});
  if(squeeze && maArr==='bull') notes.push({tone:'bullish',icon:'💥',title:'BB 스퀴즈 + 정배열',text:'변동성이 극도로 수축된 상태에서 상승 추세가 유지되고 있습니다. 상방 돌파 시 강한 상승이 예상됩니다.'});
  if(macdD && maArr==='bear') notes.push({tone:'danger',icon:'🔻',title:'MACD 데드크로스 + 역배열',text:'모멘텀과 추세가 모두 하락을 가리킵니다. 보유 중이면 손절을 검토하세요.'});
  if(swHH && !swLL && rsi>=50 && rsi<=70) notes.push({tone:'bullish',icon:'📊',title:'상승 스윙 + 적정 RSI',text:'스윙 구조가 상방 정리되면서 RSI도 과열 없이 강세 구간에 있습니다. 추세 지속 가능성이 높습니다.'});
  return notes;
};

SXI.compositeFlow = function(ind){
  const notes=[];
  if(!ind) return notes;
  const maArr=ind.maAlign?.bullish?'bull':ind.maAlign?.bearish?'bear':'mixed';
  const obvT=ind.obv?.trend;
  const obvDiv=ind.obv?.div??ind.obv?.divergence;
  const vwapPos=ind.vwap?.position??ind.vwapLegacy?.position;
  const volR=ind.volPattern?.volRatio??1;
  const rsi=ind.rsi?.val??ind.rsiLegacy??50;
  const bbPctB=ind.bb?.pctB;
  if(maArr==='bull' && obvT==='up') notes.push({tone:'bullish',icon:'📈',title:'정배열 + OBV 상승',text:'추세와 수급이 모두 상승을 지지합니다. 건강한 상승 패턴이며 눌림목 매수에 적합합니다.'});
  if(maArr==='bull' && obvT==='down') notes.push({tone:'warning',icon:'⚠️',title:'가격↑ OBV↓ 괴리',text:'가격은 상승하지만 거래량은 빠지고 있습니다. 매물 출회 시 급락 가능성에 유의하세요.'});
  if(obvT==='up' && maArr!=='bull' && maArr!=='bear') notes.push({tone:'bullish',icon:'🔍',title:'횡보 속 매집 가능성',text:'가격은 정체되어도 누적 거래량 흐름은 개선되고 있습니다. 세력성 매집 가능성을 의심할 수 있는 구간입니다.'});
  if((vwapPos==='above'||vwapPos==='above_far') && volR>=1.5) notes.push({tone:'bullish',icon:'💧',title:'VWAP 상회 + 거래량 유입',text:'단기 평균 매입단가 위에서 거래량까지 붙고 있어 매수 우위 흐름이 강화됩니다.'});
  if(obvDiv==='bullish') notes.push({tone:'bullish',icon:'🔍',title:'OBV 상승 다이버전스',text:'가격은 저점을 낮추지만 모멘텀 둔화가 확인됩니다. 하락 압력이 약해지는 초기 반전 신호로 볼 수 있습니다.'});
  if(obvDiv==='bearish') notes.push({tone:'bearish',icon:'🔍',title:'OBV 하락 다이버전스',text:'가격 상승 대비 상승 모멘텀이 약해지고 있어, 추세 피로 누적 가능성이 있습니다.'});
  if(volR>=2){
    if(ind.candle?.bullish) notes.push({tone:'bullish',icon:'🚀',title:'거래량 폭발 + 강세 캔들',text:`거래량이 평소의 ${volR.toFixed(1)}배로 급증하며 양봉이 나왔습니다. 세력 진입 가능성이 높습니다.`});
    if(ind.candle?.bearish) notes.push({tone:'danger',icon:'💣',title:'거래량 폭발 + 약세 캔들',text:`거래량이 평소의 ${volR.toFixed(1)}배로 급증하며 음봉이 나왔습니다. 대량 매도 발생으로 추가 하락에 대비하세요.`});
  }
  if(bbPctB!=null && bbPctB<=0.1 && rsi<=35) notes.push({tone:'bullish',icon:'📉',title:'BB 하단 + RSI 과매도',text:'가격 조정은 이어졌지만 하락 강도는 약해지고 있습니다. 단기 바닥 탐색 구간으로 해석할 수 있습니다.'});
  return notes;
};

SXI.compositeRisk = function(ind){
  const notes=[];
  if(!ind) return notes;
  const rsi=ind.rsi?.val??ind.rsiLegacy??50;
  const bbPctB=ind.bb?.pctB;
  const atrR=ind.atr?.ratio??ind.atr?.pct??0;
  const adxV=ind.adx?.adx??ind.adx??0;
  const maArr=ind.maAlign?.bullish?'bull':ind.maAlign?.bearish?'bear':'mixed';
  const nearR=ind.nearResistance??ind.priceChannel?.nearHigh??false;
  const volR=ind.volPattern?.volRatio??1;
  const vwapPos=ind.vwap?.position??ind.vwapLegacy?.position;
  const macdH=ind.macd?.hist??ind.macd?.histogram??0;
  const macdPH=ind.macd?.prevHist??null;
  if(rsi>=75 && bbPctB!=null && bbPctB>=0.95) notes.push({tone:'danger',icon:'🌡️',title:'이중 과열 (RSI+BB)',text:'이중 과열 신호입니다. 급락 위험이 높으며 보유 중이면 분할 매도를 적극 검토하세요.'});
  if(atrR>=4 && adxV>=30) notes.push({tone:'warning',icon:'⚡',title:'강한 추세 + 큰 흔들림',text:'추세는 강하지만 흔들림도 큰 구간입니다. 맞는 방향이면 수익이 빠르지만 반대로 가면 손실도 빨라 비중 조절이 중요합니다.'});
  if(nearR && volR<0.8) notes.push({tone:'warning',icon:'🚧',title:'저항 앞 힘 약화',text:'상단 저항은 가까운데 거래량이 약합니다. 돌파보다 한 차례 눌림이나 실패 가능성까지 열어두는 편이 좋습니다.'});
  if((vwapPos==='below'||vwapPos==='below_far') && macdH<0 && macdPH!=null && macdH<macdPH) notes.push({tone:'bearish',icon:'📉',title:'반등보다 하방 우위',text:'단기 평균단가 아래에서 하락 모멘텀까지 강화되고 있습니다. 반등이 나오더라도 기술적 반등 성격으로 보는 편이 보수적입니다.'});
  if(adxV>=35 && maArr==='bear') notes.push({tone:'danger',icon:'⚡',title:'강한 하락 추세 (ADX '+Math.round(adxV)+')',text:'ADX가 높고 역배열 상태입니다. 매우 강한 하락 추세이며 매수를 자제하세요.'});
  return notes;
};

SXI.composite = function(ind){
  return [...SXI.compositeMomentum(ind),...SXI.compositeTrend(ind),...SXI.compositeFlow(ind),...SXI.compositeRisk(ind)];
};

// ════════════════════════════════════════════════════════════
//  3단계: 종합평 생성 (v2.0 확장)
//  반환: tone, mainText, keyReasons, risks, composites,
//        stateLine, actionGuide, invalidation, buyTrigger
// ════════════════════════════════════════════════════════════

SXI.summary = function(action, score, reasons, ind){
  const composites = SXI.composite(ind);
  const keyReasons = composites.filter(c=>c.tone==='bullish'||c.tone==='bearish').slice(0,3);
  const risks = composites.filter(c=>c.tone==='danger'||c.tone==='warning');
  let tone='neutral',mainText='',stateLine='',actionGuide='',invalidation='',buyTrigger='';
  const maArr=ind?.maAlign?.bullish?'bull':ind?.maAlign?.bearish?'bear':'mixed';
  const vwapPos=ind?.vwap?.position??ind?.vwapLegacy?.position??'';
  const swHH=ind?.swingStruct?.higherHighs??ind?.swingStructLegacy?.higherHighs;

  if(action==='BUY'){
    tone='bullish';
    if(score>=75){stateLine='강한 상승 우위 구간';mainText='여러 지표가 상승을 지지하고 있습니다. 다만 추격 진입보다는 구조상 지지 확인이 함께 나오면 더 안정적입니다.';actionGuide='추세 방향 보유 유지가 유리하며, 눌림 시 분할 추가 매수 고려 가능합니다.';}
    else if(score>=65){stateLine='매수 우위 구간';mainText='매수 우위 흐름이지만 확신 구간은 아닙니다. 거래량과 추세 지속 여부를 함께 확인하세요.';actionGuide='분할 진입이 적절하며, 한 번에 풀 비중 진입은 피하세요.';}
    else{stateLine='약한 매수 신호';mainText='조건부 진입이 가능하지만, 손절 기준을 명확히 설정하고 소액으로 접근하세요.';actionGuide='소액 분할 진입 후 추세 확인 시 추가 진입을 고려하세요.';}
    invalidation=(vwapPos==='above'||vwapPos==='above_far')?'VWAP 이탈 또는 최근 스윙 저점 이탈 시 매수 해석이 약화됩니다.':'MA20 이탈 또는 직전 저점 이탈 시 매수 해석이 약화됩니다.';
    buyTrigger='거래량 증가 + 저항 돌파가 나오면 매수 해석이 강화됩니다.';
  } else if(action==='SELL'){
    tone='bearish';
    if(score<=25){stateLine='강한 하락 우위 구간';mainText='여러 지표가 하락을 가리키고 있으며, 보유 중이면 손절 또는 비중 축소를 적극 검토하세요.';actionGuide='보유 중이면 손절 기준을 반드시 지키고, 미보유면 관망하세요.';}
    else if(score<=35){stateLine='매도 우위 구간';mainText='추세가 하락으로 전환되고 있으며, 신규 매수를 자제하고 기존 포지션을 점검하세요.';actionGuide='추가 매수를 자제하고, 반등 시 비중 축소를 고려하세요.';}
    else{stateLine='약한 매도 신호';mainText='즉각적인 매도보다는 추이를 지켜보되, 추가 하락에 대비한 손절 기준을 설정하세요.';actionGuide='손절 기준을 확인하고 추세 악화 시 비중 축소를 준비하세요.';}
    invalidation='주요 이평선 회복 또는 거래량 동반 양봉 출현 시 매도 해석이 약화됩니다.';
    buyTrigger='';
  } else {
    tone='neutral';
    if(score>=55){stateLine=maArr==='bull'?'상승 추세 내 눌림 조정 구간':'약한 매수 우위';mainText='추세는 아직 살아 있고 수급도 크게 무너지지 않았습니다. 다만 저항 인접 여부와 거래량 회복을 함께 확인해야 합니다.';actionGuide=swHH?'추격 진입보다 MA20 또는 VWAP 재지지 확인 후 분할 접근이 유리합니다.':'추세 확인 후 소액 분할 접근을 고려하세요.';}
    else if(score>=45){stateLine='중립 구간';mainText='매수/매도 어느 쪽도 우위가 아닙니다. 다음 방향 결정을 기다리는 것이 현명합니다.';actionGuide='신규 진입을 보류하고, 방향이 정리된 후 접근하세요.';}
    else{stateLine='약한 매도 우위';mainText='약간 매도 우위지만 추세가 확정되지 않았습니다. 보유 중이면 손절 기준을 확인하세요.';actionGuide='보유 중이면 손절 기준을 점검하고, 미보유면 관망하세요.';}
    invalidation=maArr==='bull'?'VWAP 이탈 또는 최근 스윙 저점 이탈 시 눌림목 해석은 약화됩니다.':'추가 하락 시 매도 전환 가능성을 열어두세요.';
    buyTrigger='거래량 증가 + 저항 돌파가 나오면 BUY 전환 가능성이 높아집니다.';
  }
  if(reasons && reasons.length) mainText+=' 단, 안전필터에서 '+reasons.join(', ')+' 조건이 감지되어 주의가 필요합니다.';
  return {tone,mainText,keyReasons,risks,composites,stateLine,actionGuide,invalidation,buyTrigger};
};

// ════════════════════════════════════════════════════════════
//  4단계: 전체 조립 함수 (분석 오버레이용)
// ════════════════════════════════════════════════════════════

SXI.interpretAll = function(ind){
  if(!ind) return {};
  const rsiV=ind.rsi?.val??ind.rsiLegacy??null;
  const macdObj=ind.macd||ind.macdLegacy||{};
  const stochObj=ind.stoch||ind.stochLegacy||{};
  const adxObj=ind.adx||ind.adxLegacy||{};
  const bbObj=ind.bb||ind.bbLegacy||{};
  const obvObj=ind.obv||ind.obvLegacy||{};
  const candleObj=ind.candle||ind.patterns||ind.patternsLegacy||{};
  const atrObj=ind.atr||{};
  const maAlign=ind.maAlign||{};
  const psarObj=ind.psar||{};
  const swingObj=ind.swingStruct||ind.swingStructLegacy||{};
  const maConvObj=ind.maConv||{};
  const vwapObj=ind.vwap||ind.vwapLegacy||{};
  const ichimokuObj=ind.ichimoku||ind.ichimokuLegacy||{};
  const regimeObj=ind.regime||{};
  const pchObj=ind.priceChannel||{};
  const pivotObj=ind.pivot||{};
  const dispObj=ind.disparity||{};
  const adLineObj=ind.adLine||{};

  return {
    rsi: SXI.rsi(rsiV),
    macd: SXI.macd(macdObj.hist??macdObj.histogram, macdObj.prevHist, macdObj.recentGolden, macdObj.recentDead),
    stoch: SXI.stoch(stochObj.k, stochObj.d),
    adx: SXI.adx(adxObj.adx, adxObj.pdi??adxObj.plusDI, adxObj.mdi??adxObj.minusDI),
    cci: SXI.cci(ind.cci),
    mfi: SXI.mfi(ind.mfi),
    bb: SXI.bb(bbObj.pctB, bbObj.width, bbObj.isSqueeze??ind.squeeze?.squeeze),
    bbWidth: SXI.bbWidth(bbObj.width, bbObj.isSqueeze??ind.squeeze?.squeeze),
    obv: SXI.obv(obvObj.trend, obvObj.div??obvObj.divergence),
    ma: SXI.ma(maAlign.bullish?'bullish':maAlign.bearish?'bearish':null),
    atr: SXI.atr(atrObj.pct??atrObj.ratio),
    sar: SXI.sar(psarObj.trend),
    candle: SXI.candle(candleObj.patterns?[...candleObj.patterns]:null),
    pullback: SXI.pullback(ind.pullback?.score??null),
    swingStruct: SXI.swingStruct(swingObj.higherHighs, swingObj.lowerLows),
    maConvergence: SXI.maConvergence(maConvObj.converging, maConvObj.spread),
    vwap: SXI.vwap(vwapObj.position, vwapObj.pct),
    ichimoku: SXI.ichimoku(ichimokuObj.priceVsCloud, ichimokuObj.cloud, ichimokuObj.signal),
    regime: SXI.regime(regimeObj.label, regimeObj.direction, regimeObj.adx),
    priceChannel: SXI.priceChannel(pchObj.pos, pchObj.nearHigh, pchObj.nearLow),
    pivot: SXI.pivot(pivotObj.priceVsPivot, pivotObj.nearR, pivotObj.nearS),
    maDisparity: SXI.maDisparity(dispObj.disparity20, dispObj.disparity60),
    volumeMA: SXI.volumeMA(ind.volPattern?.volRatio),
    adLine: SXI.adLine(adLineObj.trend, adLineObj.div),
  };
};

// ── 버전 ──
SXI.version = '2.0';
