// ════════════════════════════════════════════════════════════
//  SIGNAL X — Interpret Engine v2.4
//  지표별 해석 + 복합상황 해석 + 종합평(행동가이드) 생성
//  S47: advMarketEnv ORACLE 의존 제거
//  sx_screener 종목분석 탭 해석카드용
//  S39→S40: 해석 엔진 대규모 보강
//    - 기존 단건 함수 실전형 문장 보강 (RSI/MACD/ADX/BB/ATR/OBV/MA)
//    - 신규 단건 6개 (priceChannel/pivot/maDisparity/volumeMA/adLine/stochSlow)
//    - 복합 4계열 분리 (momentum/trend/flow/risk) + 신규 8조합
//    - 종합평에 stateLine/actionGuide/invalidation/buyTrigger 4필드
//    - tone 5단계 (bullish/bearish/neutral/warning/danger) 통일
//  S42: 엔진 연결 수정 (priceChannel/pivot/maDisparity/adLine 필드명 불일치 해결)
//  S43: 매거진 해석 특화 전면 보강
//    - 모든 기존 단건 해석 함수 상세화 (RSI/MACD/ADX/BB/ATR/OBV/MA/Stoch/CCI/MFI 등)
//    - 부문별 점수 해석 (sectorScores) — 4부문 각각 구성지표+등급+상세 해석
//    - MA 배열 상세 해석 (maAlignment) — 5/20/60/120 위치+간격+GC/DC 근접
//    - 캔들 패턴 행동 가이드 (candle) — 22종 패턴별 구체적 진입/손절/관망
//    - 기본 정보 의미 해석 (basicInfo) — 시총/거래대금/외국인/등락률 맥락 문장
//    - VWAP/스윙구조/일목균형표 실전 맥락 보강
//  S46: 고급분석 전용 모듈 신규 + 고급해석 대폭 보강
//    - adv* 11개 함수 신규 (시장환경/눌림목/RSI다이버전스/OBV다이버전스/
//      Stoch다이버전스/스윙/MA수렴도/추세/구조위치/심리가격대/맥락분석)
//    - 기존 deep 함수 상세화 (priceChannel/pivot/maDisparity/volumeMA/adLine/
//      vwap/ichimoku/regime/pullback/swingStruct/maConvergence)
//    - 모든 해석 3~6줄 + 크로스체크 조건 + 실전 액션가이드
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
  if(v<=20) return {label:'극단적 과매도',tone:'bullish',text:`RSI가 ${v.toFixed(1)}로 극단적 과매도 상태입니다. 매도 세력이 거의 소진된 구간으로 기술적 반등 가능성이 높습니다. 다만 강한 하락 추세에서는 RSI가 10~15까지 추가 하락도 가능하므로, MACD 골든크로스나 거래량 급증 같은 보조 확인이 동반될 때 신뢰도가 크게 높아집니다. 2~3개 지표 동시 확인 후 접근을 권합니다.`};
  if(v<=30) return {label:'과매도',tone:'bullish',text:`RSI가 ${v.toFixed(1)}로 과매도 구간입니다. 매도 압력이 과도한 상태이며 반등 첫 번째 후보 구간입니다. MACD 골든크로스·거래량 증가·BB 하단 반등이 함께 나타나면 신뢰도가 높아집니다. 다만 하락 추세가 강할 경우 과매도가 수일간 지속되므로, 실제 반전 양봉 확인 후가 안전합니다.`};
  if(v<=40) return {label:'약세 구간',tone:'bearish',text:`RSI가 ${v.toFixed(1)}로 매도세 우위 약세 구간입니다. 아직 과매도는 아니라 반등 신호로 보기엔 이릅니다. 추세 전환 신호(MACD 방향 전환, 지지선 확인) 없이 매수하면 추가 하락 노출 위험이 큽니다. RSI 30 이하 또는 반전 양봉까지 대기가 유리합니다.`};
  if(v<=50) return {label:'중립 약세',tone:'neutral',text:`RSI가 ${v.toFixed(1)}로 중립~약세입니다. RSI 단독으로 방향 판단이 어려운 탐색 구간이며, MA 배열·거래량 방향을 함께 확인해야 합니다. 횡보장에서 이 구간이 오래 지속되면 에너지 축적 후 돌파가 나올 수 있습니다.`};
  if(v<=60) return {label:'중립 강세',tone:'neutral',text:`RSI가 ${v.toFixed(1)}로 중립~강세입니다. 약한 매수 우위이나 추세 확인은 안 된 상태입니다. MA 정배열·거래량 동반 여부를 함께 보면 신뢰도가 높아집니다. 상승 추세 초기 또는 횡보 상단에서 자주 나타나는 구간입니다.`};
  if(v<=70) return {label:'강세 구간',tone:'bullish',text:`RSI가 ${v.toFixed(1)}로 매수세 우위 강세 구간입니다. 상승 추세 추종에 유리하며, MA 정배열과 함께 나타나면 추세 건강성이 높습니다. 눌림목 접근이 적합한 RSI 영역이며, 70 근접 시 과매수 진입을 주시하세요.`};
  if(v<=80) return {label:'과매수',tone:'warning',text:`RSI가 ${v.toFixed(1)}로 과매수 구간입니다. 강한 추세장에서는 과매수가 2~3주 이상 지속될 수 있어, RSI 70 돌파만으로 바로 매도하면 수익 기회를 놓칠 수 있습니다. 다만 MACD 둔화, 거래량 감소, 윗꼬리 음봉 등 모멘텀 약화가 동반되면 단기 고점을 의심하세요. 신규 매수는 매우 불리합니다.`};
  return {label:'극단적 과매수',tone:'danger',text:`RSI가 ${v.toFixed(1)}로 극단적 과열입니다. 급락이나 급조정이 임박 가능성이 높으며, 보유 중이면 최소 절반 분할 매도를 적극 검토하세요. 신규 진입은 절대 피해야 할 자리입니다.`};
};

SXI.macd = function(hist, prevHist, recentGolden, recentDead){
  if(hist==null) return null;
  const h=+hist, pH=prevHist!=null?+prevHist:null;
  if(recentGolden && h>=0) return {label:'골든크로스 (제로선 위)',tone:'bullish',text:'MACD선이 시그널선을 상향 돌파하면서 제로선 위에 있습니다. 기존 상승 추세가 재가속되는 강력한 신호이며, 거래량 동반 시 신뢰도가 매우 높아집니다. 눌림목 매수 진입 타이밍으로 적합하며, 히스토그램이 빠르게 줄어들기 시작하면 모멘텀 피로를 의심하세요.'};
  if(recentGolden) return {label:'골든크로스 (제로선 아래)',tone:'bullish',text:'MACD선이 제로선 아래에서 골든크로스했습니다. 하락 추세 내 방향 전환 초기 신호이며, 아직 완전한 추세 전환이라 단정하기 이릅니다. 제로선을 상향 돌파하면 추세 전환 확정이며, 그때까지는 기술적 반등으로 접근이 안전합니다.'};
  if(recentDead && h<=0) return {label:'데드크로스 (제로선 아래)',tone:'danger',text:'MACD선이 제로선 아래에서 데드크로스했습니다. 하락 모멘텀이 본격 강화되는 구간으로 가장 위험한 MACD 조합 중 하나입니다. 보유 중이면 손절 기준 재점검 후 비중 축소를 우선 실행하세요. ADX 30 이상과 동시 발생 시 하락 가속 가능성이 매우 높습니다.'};
  if(recentDead) return {label:'데드크로스 (제로선 위)',tone:'bearish',text:'MACD선이 제로선 위에서 데드크로스했습니다. 상승 모멘텀이 피로를 보이는 단계이며, 추세 꺾임 초기 경고입니다. 추가 매수 자제하고, 히스토그램이 음수 전환되는지 주시하세요.'};
  if(h>0 && pH!=null && h>pH) return {label:'양수 확대',tone:'bullish',text:'MACD 히스토그램이 양수이면서 확대 중이어서 상승 모멘텀 가속입니다. 추세 지속 구간의 전형적 패턴이며, 보유 유지에 가장 유리합니다. 확대 폭이 줄어들기 시작하면 모멘텀 둔화 초기 신호이므로 익절 준비를 시작하세요.'};
  if(h>0 && pH!=null && h<=pH) return {label:'양수 축소',tone:'warning',text:'히스토그램이 양수이지만 줄어들고 있어 상승 속도가 둔화 중입니다. 아직 추세가 꺾인 것은 아니지만, 단기 익절과 추격 자제 쪽에 무게를 두세요. 히스토그램이 0 아래로 전환되면 본격적인 매도 압력이 시작될 수 있습니다.'};
  if(h<0 && pH!=null && h<pH) return {label:'음수 확대',tone:'bearish',text:'MACD 히스토그램 음수가 확대 중이어서 하락 모멘텀이 강화되고 있습니다. 신규 매수는 매우 위험하며, 음수 확대가 멈추고 축소 전환을 확인한 후에야 반등 가능성을 검토할 수 있습니다.'};
  if(h<0 && pH!=null && h>=pH) return {label:'음수 축소',tone:'neutral',text:'히스토그램 음수가 줄어들고 있어 하락 모멘텀이 약해지는 중입니다. 바닥 다지기 초기일 수 있으며, RSI 반등과 거래량 증가가 동반되면 반전 가능성이 높아집니다. 양수 전환을 확인하는 것이 안전합니다.'};
  return {label:'중립',tone:'neutral',text:'MACD가 제로선 부근에서 방향성이 약합니다. 다른 지표(RSI, ADX, MA)와 종합 판단이 필요하며, 제로선 부근 횡보는 곧 방향이 결정될 수 있다는 신호이기도 합니다.'};
};

SXI.stoch = function(k, d){
  if(k==null) return null;
  const kv=+k, dv=+(d||k);
  if(kv<=20 && kv>dv) return {label:'과매도 반전',tone:'bullish',text:`%K(${kv.toFixed(1)})가 과매도 구간에서 %D(${dv.toFixed(1)})를 상향 돌파했습니다. 강력한 단기 반등 신호이며, RSI 과매도·BB 하단 반등과 동시 발생 시 3중 확인이 됩니다. 다만 강한 하락 추세에서는 빈 골든크로스도 있으므로 2~3봉 확인 후 진입이 안전합니다.`};
  if(kv<=20) return {label:'과매도',tone:'bullish',text:`스토캐스틱 %K가 ${kv.toFixed(1)}로 과매도 구간입니다. 반등 가능성이 높지만, %K가 %D를 상향 돌파하는 실제 반전 신호를 기다리는 것이 안전합니다. ADX가 높은 하락 추세에서는 과매도가 오래 지속됩니다.`};
  if(kv<=50) return {label:'하단 중립',tone:'neutral',text:`스토캐스틱 %K가 ${kv.toFixed(1)}로 중간 아래입니다. 뚜렷한 신호는 없으며, MA 정배열이면 눌림목 성격, 역배열이면 약세 지속으로 해석할 수 있습니다.`};
  if(kv<=80) return {label:'상단 중립',tone:'neutral',text:`스토캐스틱 %K가 ${kv.toFixed(1)}로 중간 위에서 약한 매수 우위입니다. 강한 추세에서는 이 구간이 오래 유지되며, ADX 25 이상 + MA 정배열이면 추세 추종 유지가 유리합니다.`};
  if(kv>80 && kv<dv) return {label:'과매수 반전',tone:'bearish',text:`%K(${kv.toFixed(1)})가 과매수 구간에서 %D(${dv.toFixed(1)})를 하향 돌파했습니다. 단기 조정 시작 신호이며, RSI 과매수·MACD 둔화와 함께 나타나면 매도 전환 확률이 높습니다. 분할 익절 검토하세요.`};
  return {label:'과매수',tone:'warning',text:`스토캐스틱 %K가 ${kv.toFixed(1)}로 과매수 구간입니다. 강한 추세에서는 장기 지속 가능하므로, %K가 %D를 하향 돌파하는 실제 반전 신호 확인 후 대응이 효과적입니다.`};
};

SXI.adx = function(adx, pdi, mdi){
  if(adx==null) return null;
  const v=+adx;
  let dir='', dirAction='', dirDetail='';
  if(pdi!=null && mdi!=null){dir=+pdi>+mdi?'상승':'하락'; dirAction=+pdi>+mdi?'매수 보유 쪽이 유리합니다':'매수보다 관망이 낫습니다'; dirDetail=` +DI(${(+pdi).toFixed(1)}) vs -DI(${(+mdi).toFixed(1)}): ${+pdi>+mdi?'매수세 우위':'매도세 우위'}.`;}
  if(v<20) return {label:'추세 없음',tone:'neutral',text:`ADX가 ${v.toFixed(1)}로 뚜렷한 추세가 없습니다.${dirDetail} 횡보 구간일 가능성이 높고, 박스권 매매가 더 적합합니다. ADX가 20을 넘어서면 새 추세 형성이므로 돌파 방향을 주시하세요.`};
  if(v<30){const t=dir?`약한 ${dir} 추세가 형성되기 시작했습니다.`:'추세 형성 초기 단계입니다.'; return {label:'약한 추세',tone:'neutral',text:`${t} ADX ${v.toFixed(1)}.${dirDetail} ADX가 25~30을 넘어가면 추세가 본격화되므로, 현재는 포지션 준비 단계입니다.`};}
  if(v<50) return {label:'강한 추세',tone:dir==='상승'?'bullish':'bearish',text:`ADX ${v.toFixed(1)}로 강한 ${dir} 추세 진행 중.${dirDetail} 추세를 따라가는 전략이 유리하며, 역방향 매매는 매우 위험합니다. ${dir==='상승'?'눌림목 분할 매수가 효과적이며 MA20 지지를 확인하세요':'반등 시 비중 축소를 검토하세요'}.`};
  return {label:'극강 추세',tone:dir==='상승'?'bullish':'danger',text:`ADX ${v.toFixed(1)}로 매우 강한 ${dir} 추세.${dirDetail} 추세의 힘이 극강이지만 동시에 과열 경고입니다. ${dir==='상승'?'익절 시점을 적극 검토하고 신규 진입은 추격이므로 자제하세요':'손절을 반드시 지키세요. ADX 하락 전환 확인 후에야 반등 논의가 가능합니다'}.`};
};

SXI.cci = function(val){
  if(val==null) return null;
  const v=+val;
  if(v<=-200) return {label:'극단적 과매도',tone:'bullish',text:`CCI가 ${v.toFixed(0)}으로 매도 압력이 극심합니다. CCI -200 이하는 매우 드문 수치이며, 기술적 반등 여지가 큽니다. 다만 패닉 구간에서는 추가 하락도 가능하므로, 반전 양봉이나 MACD 골든크로스 같은 보조 확인을 기다리세요.`};
  if(v<=-100) return {label:'과매도',tone:'bullish',text:`CCI가 ${v.toFixed(0)}으로 과매도 구간입니다. 반등 시작 시 초기 매수 구간이 될 수 있으며, RSI·스토캐스틱도 함께 과매도인지 확인하면 신뢰도가 높아집니다. CCI가 -100을 상향 돌파하는 시점이 기술적 기준점입니다.`};
  if(v<=100) return {label:'중립',tone:'neutral',text:`CCI가 ${v.toFixed(0)}으로 정상 범위입니다. 과열이나 침체 신호는 없으며, 다른 모멘텀·추세 지표와 종합 판단이 필요합니다.`};
  if(v<=200) return {label:'과매수',tone:'warning',text:`CCI가 ${v.toFixed(0)}으로 과매수 구간입니다. 이동평균선 대비 가격이 많이 올라간 상태이며, CCI가 +100을 하향 돌파하면 본격적인 조정 신호입니다.`};
  return {label:'극단적 과매수',tone:'danger',text:`CCI가 ${v.toFixed(0)}으로 극단적 과열입니다. 급락 위험이 높으며, 보유 중이면 분할 매도를 검토하세요.`};
};

SXI.mfi = function(val){
  if(val==null) return null;
  const v=+val;
  if(v<=20) return {label:'과매도 (자금유출)',tone:'bullish',text:`MFI가 ${v.toFixed(1)}로 자금 대량 유출 상태입니다. RSI에 거래량 가중치를 더한 MFI가 이 수준이면 실질적 매도 압력이 극에 달했음을 의미합니다. 기술적 반등 시 거래량 동반 상승과 함께 빠른 회복이 나올 수 있습니다.`};
  if(v<=40) return {label:'약세',tone:'neutral',text:`MFI가 ${v.toFixed(1)}로 자금 유출 진행 중이며 매수세가 약합니다. 가격 지지력이 약한 상태이며, 20 이하 진입 시 과매도 반등 구간이 될 수 있습니다.`};
  if(v<=60) return {label:'중립',tone:'neutral',text:`MFI가 ${v.toFixed(1)}로 자금 흐름이 균형입니다. 뚜렷한 방향성이 없어 다른 지표와 종합 판단하세요.`};
  if(v<=80) return {label:'강세',tone:'bullish',text:`MFI가 ${v.toFixed(1)}로 자금 유입 중이며 매수세 우위입니다. 거래량을 동반한 매수 흐름이 상승 추세를 뒷받침하고 있습니다. OBV 상승과 함께라면 건강한 상승입니다.`};
  return {label:'과매수 (자금과잉)',tone:'warning',text:`MFI가 ${v.toFixed(1)}로 자금이 과도하게 유입된 상태입니다. 거래량 기준으로도 과열이며, 대규모 차익실현 매물이 나올 수 있습니다. 익절 타이밍을 검토하세요.`};
};

SXI.bb = function(pctB, width, isSqueeze){
  if(pctB==null) return null;
  const b=+pctB; let res;
  if(b<=0) res={label:'하단 이탈',tone:'bullish',text:`BB 하단 이탈(%B ${(b*100).toFixed(1)}%). 극단적 과매도 상태이며, 통계적으로 밴드 밖 체류 시간은 짧아 반등 가능성이 높습니다. 다만 강한 하락 추세에서는 밴드 워킹(연속 이탈)이 가능하므로, 반전 양봉+거래량 증가 확인 후 접근이 안전합니다. RSI 과매도 동시 발생 시 반등 확률이 크게 높아집니다.`};
  else if(b<=0.2) res={label:'하단 근접',tone:'bullish',text:`BB 하단 근접(%B ${(b*100).toFixed(1)}%). 매수 관심 구간이며, 양봉 전환·거래량 증가 동반 시 반등 확률이 높아집니다. 하단 이탈로 확대되면 추가 하락이므로, 지지 확인 후 분할 접근이 적절합니다.`};
  else if(b<=0.5) res={label:'하단~중심',tone:'neutral',text:`BB 중심선 아래(%B ${(b*100).toFixed(1)}%). 약한 매도 우위이며, MA20(중심선) 회복 여부가 단기 방향의 열쇠입니다.`};
  else if(b<=0.8) res={label:'중심~상단',tone:'neutral',text:`BB 중심선 위(%B ${(b*100).toFixed(1)}%). 약한 매수 우위이며 상승 추세 유지 중. 중심선이 지지선 역할을 합니다.`};
  else if(b<=1.0) res={label:'상단 근접',tone:'warning',text:`BB 상단 근접(%B ${(b*100).toFixed(1)}%). 단기 과열 가능성이 있으며, 강한 추세에서는 밴드 워킹이 나올 수 있지만 모멘텀 둔화 시 되돌림도 클 수 있습니다.`};
  else res={label:'상단 돌파',tone:'danger',text:`BB 상단 돌파(%B ${(b*100).toFixed(1)}%). 과열 상태이며, 통계적으로 밴드 밖에 오래 머물기 어렵습니다. 신규 진입은 추격이므로 위험하며, 눌림 확인 후 재진입이 안전합니다.`};
  if(isSqueeze) res.text+=' 현재 BB폭 수축(스퀴즈) 상태 — 에너지 축적 중이며 돌파 시 폭발적 움직임 예상. 돌파 방향이 핵심입니다.';
  return res;
};

SXI.bbWidth = function(width, isSqueeze){
  if(width==null) return null;
  if(isSqueeze) return {label:'스퀴즈 (수축)',tone:'neutral',text:`BB폭이 ${(+width).toFixed(1)}%로 극도로 좁아진 스퀴즈 상태입니다. 시장이 에너지를 축적 중이며, 방향이 정해지면 폭발적 움직임이 예상됩니다. 역사적으로 BB 스퀴즈 후 돌파는 큰 추세의 시작이 되는 경우가 많습니다. 돌파 방향 확인 후 따라가는 전략이 안전합니다.`};
  if(+width>5) return {label:'확장 (고변동)',tone:'warning',text:`BB폭이 ${(+width).toFixed(1)}%로 크게 벌어져 변동성이 높은 구간입니다. 방향이 맞아도 진폭이 넓어 심리적 부담이 크며, 손절 간격도 넓혀야 합니다. 비중 축소 또는 분할 전략으로 접근하세요.`};
  return {label:'보통',tone:'neutral',text:`BB폭이 ${(+width).toFixed(1)}%로 정상 범위입니다. 일반적인 매매 환경입니다.`};
};

SXI.obv = function(trend, divergence){
  if(!trend) return null;
  if(divergence==='bullish'||divergence===true) return {label:'OBV 상승 다이버전스',tone:'bullish',text:'가격은 하락했지만 누적 거래량(OBV)은 개선 중입니다. 저가 매집 세력이 있음을 시사하며, 바닥 형성의 대표적 선행 지표입니다. RSI 과매도 동시 발생 시 반등 확률이 크게 높아집니다.'};
  if(divergence==='bearish') return {label:'OBV 하락 다이버전스',tone:'warning',text:'가격은 상승했지만 OBV는 빠지고 있어, 상승을 뒷받침할 실질 매수 수급이 약해지고 있습니다. 고점권에서 이 신호가 나오면 분할 익절을 검토하세요.'};
  if(trend==='up') return {label:'OBV 상승',tone:'bullish',text:'누적 거래량(OBV)이 상승 추세로 매수세가 지속 유입 중입니다. 가격+OBV 동반 상승은 건강한 상승이며, 가격 횡보+OBV 상승이면 매집 구간일 수 있습니다. 수급 뒷받침 상승은 지속력이 강합니다.'};
  if(trend==='down') return {label:'OBV 하락',tone:'bearish',text:'누적 거래량(OBV)이 감소 추세로 매도세 우위입니다. 가격 횡보 중에도 OBV 하락이면 물량이 빠져나가는 것이며, 지지선 이탈 시 급락 연결 가능. 보유 중이면 손절 라인을 점검하세요.'};
  return {label:'OBV 보합',tone:'neutral',text:'OBV가 횡보 중으로 뚜렷한 수급 방향이 없습니다. 방향이 정해지기를 기다리는 구간입니다.'};
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
  if(v<1.5) return {label:'저변동',tone:'neutral',text:`변동성 ${v.toFixed(1)}%로 매우 낮아 시장이 숨을 고르고 있습니다. 저변동이 오래 지속되면 에너지 축적 후 돌파 시 빠르고 큰 움직임이 나옵니다. BB 스퀴즈와 함께라면 돌파 준비 구간입니다.`};
  if(v<3) return {label:'보통',tone:'neutral',text:`변동성 ${v.toFixed(1)}%로 정상 범위이며 일반적인 매매 환경입니다.`};
  if(v<5) return {label:'고변동',tone:'warning',text:`변동성 ${v.toFixed(1)}%로 높은 구간입니다. 하루 움직임이 크기 때문에 손절 폭을 넓혀야 하며, 비중 축소 또는 추격 자제가 안전합니다.`};
  return {label:'극변동',tone:'danger',text:`변동성 ${v.toFixed(1)}%로 극단적입니다. 큰 수익과 큰 손실이 동시에 열려 있으며, 소액만 진입하거나 관망이 현명합니다. 반드시 사전에 손절 라인을 정해두세요.`};
};

SXI.sar = function(trend){
  if(!trend) return null;
  if(trend==='up') return {label:'상승추세',tone:'bullish',text:'Parabolic SAR이 가격 아래에 위치해 상승 추세를 뒷받침합니다. 추세 추종 관점에서 보유 유지 구간이며, SAR 가격 이탈 시 추세 전환 신호로 빠른 대응이 필요합니다. MA 정배열과 동시 확인 시 추세 건강성이 높습니다.'};
  return {label:'하락추세',tone:'bearish',text:'Parabolic SAR이 가격 위에 있어 하락 추세입니다. 추세 전환 확인 전까지 매수 보류가 안전하며, SAR이 가격 아래로 반전하면 추세 전환 시도의 첫 번째 신호입니다.'};
};

SXI.candle = function(patterns){
  if(!patterns||!patterns.length) return null;
  const strongest = patterns.sort((a,b)=>Math.abs(b.score||0)-Math.abs(a.score||0))[0];
  if(!strongest) return null;
  const dir = strongest.dir>0?'bullish':strongest.dir<0?'bearish':'neutral';
  const CT = {'장대양봉':'강한 매수세로 종가가 고가 근처에서 마감. 상승 추세에서는 지속 확인, 하락 후 지지선에서 나타나면 반전 시작. 다음 봉에서 50% 이상 되돌리지 않으면 상승 지속 확률이 높습니다.','장대음봉':'강한 매도세로 종가가 저가 근처에서 마감. 고점에서 나타나면 반전 경고이며, 다음 봉에서 고가를 회복하지 못하면 손절을 실행하세요.','해머':'하락 중 긴 아래꼬리는 저가 매수세 유입을 보여줍니다. 지지선이나 BB 하단에서 나타나면 신뢰도↑. 다음 봉 양봉 확인 시 진입 고려하되, 해머 저점이 손절 라인.','슈팅스타':'상승 중 긴 윗꼬리는 고가 매도세를 보여줍니다. 저항선이나 BB 상단에서 나타나면 조정 확률↑. 기존 보유자는 분할 익절 검토.','도지':'매수/매도 팽팽. 상승 후 도지는 하락 전환, 하락 후 도지는 상승 전환의 전조일 수 있으며, 다음 봉 방향이 핵심.','스피닝탑':'매수/매도 비슷한 힘. 위아래 꼬리가 길어 방향이 정해지지 않았습니다.','모닝스타':'3봉 강세 반전 패턴(음봉→짧은 몸통→양봉). 하락 바닥에서 나타나면 강력한 매수 진입 신호. 둘째 봉 저점이 손절 라인.','이브닝스타':'3봉 약세 반전 패턴(양봉→짧은 몸통→음봉). 상승 고점에서 나타나면 강력한 매도 신호. 보유 중이면 분할 매도를 즉시 실행.','상승장악':'전일 음봉을 완전히 감싸는 양봉. 강한 매수 반전이며, 거래량 동반 시 세력 매수 가능. 이 양봉의 저점이 강한 지지선.','하락장악':'전일 양봉을 완전히 감싸는 음봉. 강한 매도 반전이며, 거래량 급증 동반 시 대규모 매도 이탈. 즉시 비중 축소 검토.','하라미상승':'큰 음봉 안 작은 양봉. 하락 모멘텀 약화 초기 신호. 다음 봉 양봉 확인 후 진입 고려.','하라미하락':'큰 양봉 안 작은 음봉. 상승 모멘텀 약화 초기 조정 신호. 추가 매수 보류.','피어싱라인':'전일 음봉 50%+ 회복 양봉. 반등 초기 신호. 전일 음봉 저점을 손절 라인으로 설정.','다크클라우드':'전일 양봉 50%+ 하락 음봉. 반락 초기 신호. 분할 익절 검토.','적삼병':'3연 양봉. 강한 상승 지속 패턴. 셋째 봉 윗꼬리가 길면 피로 누적 주의.','흑삼병':'3연 음봉. 강한 하락 지속. 보유 중이면 손절 실행.','갭상승':'전일 고가보다 높게 시작. 갭을 메우지 않으면 상승 확인. 갭을 메우고 다시 올라가면 강한 지지 확인.','갭하락':'전일 저가보다 낮게 시작. 갭을 메우지 않으면 하락 확인. 갭 하단이 손절 기준.','집게바닥':'두 봉 저가 동일 수준. 지지선 형성이며, 깨지면 하락 가속.','집게천정':'두 봉 고가 동일 수준. 저항선 형성이며, 돌파 실패 시 조정.','인사이드데이':'금일 고저가가 전일 범위 안. 변동성 수축. 전일 고가 돌파 시 매수, 저가 이탈 시 매도.','아웃사이드데이':'금일 고저가가 전일 범위 초과. 변동성 확대. 양봉=강세, 음봉=약세.'};
  return {label:strongest.name, tone:dir, text:CT[strongest.name]||`${strongest.name} 패턴이 감지되었습니다.`};
};

// ════════════════════════════════════════════════════════════
//  고급 분석(Advanced Analysis) 전용 모듈 — S46 신규
//  "고급 분석" 섹션 해석카드: 시장환경/눌림목/다이버전스/스윙/
//  MA수렴도/추세/구조위치/심리가격대/맥락분석 등
//  기술적 지표 해석과 동등 이상의 상세도 목표
// ════════════════════════════════════════════════════════════

SXI.advMarketEnv = function(state, stateLabel, indices){
  if(!state || state==='unknown') return null;
  const bull = state.includes('bull'), bear = state.includes('bear');
  const idxStr = indices&&indices.length ? indices.join(' · ') : '지수 데이터 없음';
  if(bull && state.includes('strong')){
    return {tone:'bullish',label:'강한 강세장',text:`${idxStr}. 시장 전반이 강한 상승 흐름입니다. 매수 신호의 신뢰도가 크게 높아지며, 대부분의 종목이 시장 베타를 따라 상승하는 구간입니다. 눌림목 매수·추세 추종 전략이 가장 효과적이며, 약세 종목도 시장 분위기에 끌려 반등이 나올 수 있습니다. 다만 과열 구간에 접어들면 일시 조정이 빠르게 오므로, 개별 종목의 과매수 지표(RSI 80+, BB 상단 이탈)를 함께 점검하세요.`};
  }
  if(bull){
    return {tone:'bullish',label:'강세',text:`${idxStr}. 시장 환경이 우호적이어서 매수 신호의 신뢰도가 높아집니다. 정배열 종목의 눌림목 매수, 거래량 동반 돌파 전략이 유리하며, 약간의 기술적 조정은 매수 기회로 활용할 수 있습니다. 시장 전체가 양호하더라도 업종별 차별화는 존재하므로, 개별 종목의 모멘텀과 수급을 반드시 확인하세요.`};
  }
  if(bear && state.includes('strong')){
    return {tone:'danger',label:'강한 약세장',text:`${idxStr}. 시장 전반이 강한 하락 압력을 받고 있습니다. 대부분의 매수 신호가 무력화되기 쉬우며, 기술적 반등도 짧고 약하게 끝나는 경우가 많습니다. 현금 비중을 높이고, 기존 보유 종목은 손절 기준을 타이트하게 관리하세요. 신규 매수는 시장 반등 신호(지수 양봉 + 거래량 급증 + VIX 하락)가 확인된 후에만 소액으로 접근하는 것이 안전합니다.`};
  }
  if(bear){
    return {tone:'bearish',label:'약세',text:`${idxStr}. 시장 환경이 비우호적이어서 매수 신호에 대한 보수적 접근이 필요합니다. 강한 개별 모멘텀이 있는 종목만 선별적으로 접근하되, 진입 비중을 평소의 50~70%로 줄이고 손절 기준을 엄격히 적용하세요. 시장 약세기에는 방어주·고배당주·역발상 매수보다 현금 확보가 최우선이며, 추세 반전 신호가 나올 때까지 관망하는 것도 좋은 전략입니다.`};
  }
  return {tone:'neutral',label:'중립',text:`${idxStr}. 시장 전반의 환경이 중립적이어서 개별 종목의 기술적 신호에 집중해야 합니다. 지수 방향이 명확하지 않을 때는 업종·테마 순환에 따라 종목별 차별화가 심해지므로, 시장 전체 흐름보다 개별 종목의 수급·모멘텀·차트 구조를 더 비중 있게 판단하세요. 양방향 시나리오를 모두 준비하고, 핵심 지지/저항 이탈 시에만 대응하는 전략이 효율적입니다.`};
};

SXI.advPullback = function(score, maArrange, rsi, volRatio, bbPctB){
  if(score==null) return null;
  const s=+score;
  const maOk = maArrange==='bullish';
  const rsiV = rsi!=null ? +rsi : null;
  const volR = volRatio!=null ? +volRatio : null;
  const bbB = bbPctB!=null ? +bbPctB : null;
  const extras = [];
  if(maOk) extras.push('MA 정배열 지지');
  if(rsiV!=null && rsiV<=40) extras.push(`RSI ${rsiV.toFixed(0)} 과매도 근접`);
  if(volR!=null && volR<0.8) extras.push('거래량 수축(에너지 축적)');
  if(bbB!=null && bbB<=0.3) extras.push('BB 하단 근접');
  const extraStr = extras.length ? ' 보조 확인: '+extras.join(', ')+'.' : '';

  if(s>=80) return {label:'최적 눌림목',tone:'bullish',text:`눌림목 점수 ${s}점. 상승 추세 안에서 조정이 충분히 진행된 이상적 매수 구간입니다.${extraStr} MA20 지지 + RSI 40~50 회복 + 양봉 전환이 동시에 나타나면 신뢰도가 극대화됩니다. 진입 시 직전 스윙 저점을 손절 라인으로 설정하고, 1차 목표는 직전 고점 부근입니다. MA20을 종가 기준 이탈하면 눌림목 해석이 무효화되므로 즉시 대응하세요.`};
  if(s>=60) return {label:'눌림목 양호',tone:'bullish',text:`눌림목 점수 ${s}점. 상승 추세 내 조정이 진행 중이며 매수 관심 구간에 진입하고 있습니다.${extraStr} 아직 최적 타이밍은 아닐 수 있으므로, MA20 또는 MA60 지지 확인 + 거래량 반등 신호를 기다린 뒤 분할 진입이 안전합니다. 추세가 살아 있는 한 조정은 기회이지만, 지지선 이탈 시에는 빠르게 시나리오를 전환해야 합니다.`};
  if(s>=40) return {label:'눌림목 보통',tone:'neutral',text:`눌림목 점수 ${s}점. 조건이 일부만 갖춰진 상태입니다.${extraStr} 추세가 아직 강하지 않거나, 조정 폭이 충분하지 않아 매수 진입에는 리스크가 있습니다. RSI가 40 이하로 더 눌리거나, 명확한 지지선(MA20/MA60/피벗 S1)에서 반등이 나올 때까지 기다리는 것이 유리합니다. 성급한 진입은 추가 하락에 노출될 수 있습니다.`};
  if(s>=20) return {label:'눌림목 약함',tone:'neutral',text:`눌림목 점수 ${s}점. 눌림목 매수 조건에 거의 부합하지 않습니다.${extraStr} 추세 자체가 불분명하거나 조정이 시작되지 않은 상태일 수 있습니다. 현 시점에서 눌림목 전략을 적용하기보다는, 추세 방향이 명확해지고 조정이 진행된 후 재검토하는 것이 바람직합니다.`};
  return {label:'해당없음',tone:'neutral',text:`눌림목 점수 ${s}점. 현재 눌림목 매수 조건에 해당하지 않습니다.${extraStr} 역배열이거나 하락 추세 구간에서는 눌림목 전략 자체가 위험합니다. 추세 전환 신호(MA 정배열 회복, MACD 골든크로스, 스윙 구조 HH+HL 형성)를 확인한 후에야 눌림목 접근이 가능합니다.`};
};

SXI.advRsiDiv = function(div, rsiVal, trendPct){
  if(!div || div==='없음' || div==='none') return null;
  const rsiStr = rsiVal!=null ? ` (현재 RSI ${(+rsiVal).toFixed(1)})` : '';
  const trendStr = trendPct!=null ? ` 추세 강도 ${(+trendPct).toFixed(1)}%.` : '';
  if(div==='bullish') return {tone:'bullish',label:'상승 다이버전스',text:`가격은 저점을 갱신했으나 RSI는 저점이 높아지고 있습니다${rsiStr}. 하락 에너지가 약화되며 반등 가능성이 높아지는 전형적인 바닥 선행 신호입니다.${trendStr} 다이버전스 단독으로는 즉시 반전을 의미하지 않으며, 실제 반전 확인 신호(양봉 전환, MACD 골든크로스, 거래량 증가)가 동반될 때 신뢰도가 크게 상승합니다. OBV 다이버전스 또는 Stoch 다이버전스가 동시에 발생하면 "다중 다이버전스"로 반전 확률이 매우 높아집니다. 진입 시 다이버전스 시작점(최저가)을 손절 라인으로 설정하세요.`};
  return {tone:'bearish',label:'하락 다이버전스',text:`가격은 고점을 갱신했으나 RSI는 고점이 낮아지고 있습니다${rsiStr}. 상승 탄력이 약화되며 조정 또는 하락 반전 가능성이 있습니다.${trendStr} 하락 다이버전스는 즉시 급락을 의미하기보다 "상승 속도 둔화"의 경고로 해석하세요. 거래량 감소, MACD 히스토그램 축소, BB 상단 이탈 후 복귀 등이 동반되면 조정 확률이 높아집니다. 보유 중이면 익절 또는 후행 손절을 타이트하게 조정하고, 신규 매수는 조정 완료 후 재진입 시점을 기다리는 것이 안전합니다.`};
};

SXI.advObvDiv = function(div, obvTrend, volRatio){
  if(!div || div==='없음' || div==='none') return null;
  const volStr = volRatio!=null ? ` 거래량 비율 ${(+volRatio).toFixed(1)}x.` : '';
  if(div==='bullish') return {tone:'bullish',label:'매집 신호',text:`가격 하락에도 OBV(누적 거래량)는 상승 중입니다.${volStr} 이는 가격이 내려가는 와중에 거래량 기반의 스마트머니가 저가 매집을 진행하고 있음을 시사합니다. OBV 상승 다이버전스는 바닥 형성의 대표적인 선행 지표로, RSI 과매도 동시 발생 시 반등 확률이 매우 높아집니다. 다만 매집 과정은 시간이 걸릴 수 있으므로, 가격 반등이 실제로 시작되는 것을 확인한 후 진입해도 늦지 않습니다. 세력 매집이 완료되면 거래량 폭발과 함께 급등이 나올 수 있으니, 거래량 증가 + 양봉 돌파 시점을 주시하세요.`};
  return {tone:'bearish',label:'분산 신호',text:`가격 상승에도 OBV는 하락 중입니다.${volStr} 겉보기에는 상승하지만 실질적인 매수 수급이 빠지고 있는 위험한 패턴입니다. 기관이나 세력이 고점에서 물량을 분산 매도하고 있을 가능성이 높으며, 차익실현 매물이 쏟아지면 급락으로 이어질 수 있습니다. 보유 중이면 분할 익절을 적극 검토하고, 신규 매수는 OBV 추세가 회복될 때까지 보류하세요. RSI 과매수 또는 BB 상단 이탈이 동반되면 조정 확률이 매우 높습니다.`};
};

SXI.advStochDiv = function(div, rsiDiv){
  if(!div) return null;
  const rsiSync = rsiDiv && ((div==='bullish'&&rsiDiv==='bullish')||(div==='bearish'&&rsiDiv==='bearish'));
  if(div==='bullish'){
    const syncStr = rsiSync ? ' RSI 다이버전스도 동시에 발생하여 "이중 다이버전스" 상태입니다 — 반전 신뢰도가 매우 높아지며, 역사적으로 이 조합에서의 반등 확률은 상당히 높습니다. OBV 상승 다이버전스까지 3중으로 겹치면 강력한 바닥 신호입니다.' : ' RSI 다이버전스가 동시에 발생하지 않은 상태이므로 단독 신호로는 신뢰도가 보통입니다. RSI나 OBV에서도 다이버전스가 나타나는지 추가 확인이 필요합니다.';
    return {tone:'bullish',label:'Stoch 상승 다이버전스',text:`스토캐스틱이 가격보다 먼저 반등 신호를 보내고 있습니다. 가격은 저점을 낮추었지만 Stoch %K는 저점이 높아지며, 하락 모멘텀의 약화를 나타냅니다.${syncStr} 실제 반전 양봉과 거래량 증가가 동반되면 진입 시점으로 판단할 수 있습니다.`};
  }
  const syncStr = rsiSync ? ' RSI 하락 다이버전스도 동시에 발생하여 이중 확인 상태입니다. 상승 피로가 확실히 누적되고 있으며, 조정 가능성이 높습니다.' : '';
  return {tone:'bearish',label:'Stoch 하락 다이버전스',text:`스토캐스틱이 가격보다 먼저 고점 하향 신호를 보내고 있습니다. 가격은 고점을 높이지만 Stoch %K의 고점은 낮아지고 있어 상승 탄력이 약화되는 조짐입니다.${syncStr} 보유 중이면 후행 손절을 타이트하게 조정하고, 익절을 검토하세요.`};
};

SXI.advSwing = function(higherHighs, lowerLows, recentSwings){
  const swingCount = recentSwings ? ` 최근 스윙 ${recentSwings}회 감지.` : '';
  if(higherHighs && !lowerLows) return {tone:'bullish',label:'상승 구조 (HH+HL)',text:`고점과 저점이 모두 높아지는 전형적 상승 구조입니다.${swingCount} 추세 추종 전략에 가장 적합한 환경으로, 눌림이 올 때 직전 저점(HL) 부근에서 지지가 확인되면 분할 매수 진입 구간이 됩니다. 핵심 손절 기준은 직전 스윙 저점(HL) 이탈이며, 이 라인이 깨지면 상승 구조가 붕괴된 것으로 판단하고 즉시 대응해야 합니다. 상승 구조에서의 매수는 리스크/리워드 비율이 유리하지만, 고점 추격보다는 조정 후 재진입이 더 효율적입니다. ADX가 25 이상이면 추세 강도가 충분하고, 거래량이 고점 갱신 시 동반 증가하면 구조 건강성이 확인됩니다.`};
  if(higherHighs && lowerLows) return {tone:'warning',label:'확산형 (변동성 확대)',text:`고점은 높아지는데 저점도 낮아지는 확산형 구간입니다.${swingCount} 변동성이 급격히 커지고 있으며, 방향이 불분명한 상태입니다. 이 구간에서는 추세 추종이든 역추세든 손실 위험이 크므로, 비중을 크게 줄이거나 관망하는 것이 안전합니다. 확산형이 해소되는 방식(상방 수렴 또는 하방 수렴)을 확인한 뒤 방향을 잡는 것이 현명합니다. BB 폭이 동시에 확장 중이면 변동성 리스크가 더 커집니다.`};
  if(!higherHighs && lowerLows) return {tone:'bearish',label:'하락 구조 (LH+LL)',text:`저점과 고점이 모두 낮아지는 하락 구조입니다.${swingCount} 반등이 나와도 직전 고점(LH)을 넘지 못하면 추세 전환이 아니라 단순 기술적 반등에 불과합니다. 보유 중이면 반등 시 비중 축소를 우선 고려하고, 미보유면 구조 전환(직전 LH 돌파 + 거래량 증가)이 확인될 때까지 매수를 보류하세요. 하락 구조에서 무릎에서 잡겠다는 역발상 매수는 "떨어지는 칼 잡기"가 될 수 있으며, 손절 기준 없이 진입하면 큰 손실로 이어집니다. ADX 30 이상 + 역배열이면 하락이 가속 중이므로 특히 주의하세요.`};
  return {tone:'neutral',label:'횡보 구조',text:`뚜렷한 고저점 패턴 없이 옆으로 움직이고 있습니다.${swingCount} 추세가 형성되지 않은 박스권 상태로, 추세 추종 전략보다 레인지 매매(하단 매수 / 상단 매도)가 더 적합합니다. 횡보가 오래 지속되면 에너지 축적 후 방향이 정해질 때 강한 움직임이 나올 수 있으므로, BB 스퀴즈 · ADX 상승 · 거래량 급증 같은 돌파 전조를 주시하세요. 방향 결정 전까지는 소액 분할로 접근하고, 레인지 이탈 시 빠르게 따라가는 전략이 효율적입니다.`};
};

SXI.advMaConv = function(converging, spread, maArrange, bbSqueeze){
  if(converging==null) return null;
  const sp = (+spread).toFixed(1);
  const extras = [];
  if(bbSqueeze) extras.push('BB 스퀴즈 동시 발생 — 에너지 축적 극대화');
  if(maArrange==='bullish') extras.push('정배열 유지 중');
  else if(maArrange==='bearish') extras.push('역배열 유지 중');
  const extraStr = extras.length ? ' '+extras.join('. ')+'.' : '';

  if(converging && +spread<=2) return {tone:'neutral',label:'강한 수렴 (변곡점 임박)',text:`MA5/20/60 이격 ${sp}%. 이동평균선이 거의 한 점으로 수렴하고 있어 강력한 변곡점이 임박했습니다.${extraStr} 이 수준의 수렴은 역사적으로 큰 추세의 시작점이 되는 경우가 많습니다. 볼린저 밴드 스퀴즈와 동시에 나타나면 돌파 시 폭발적 움직임이 예상됩니다. 방향을 예단하기보다, 돌파 방향(상방: MA5가 MA60 상향 돌파 + 양봉 + 거래량 증가 / 하방: MA5가 MA60 하향 이탈 + 음봉)을 확인한 후 따라가는 전략이 안전합니다. 거짓 돌파에 대비해 첫 진입은 소액으로 하고, 방향이 확인되면 추가 진입하세요.`};
  if(converging) return {tone:'neutral',label:'수렴 중',text:`MA5/20/60 이격 ${sp}%. 이동평균선이 모이고 있으며 방향 전환 또는 추세 재개의 전조입니다.${extraStr} 수렴이 더 진행되면 변곡점 임박 단계로 넘어갑니다. 현재는 방향이 정해지지 않은 관망 구간이며, 수렴 해소(이평선이 다시 벌어지기 시작) 방향이 핵심입니다. 수렴 중 거래량이 줄어드는 것은 정상이며, 거래량 급증과 함께 이평선이 벌어지면 새 추세의 시작입니다.`};
  if(+spread>8) return {tone:'warning',label:'과도한 분산',text:`MA5/20/60 이격 ${sp}%. 이동평균선이 매우 크게 벌어져 있어 추세가 과열된 상태입니다.${extraStr} 이 수준의 분산은 단기적으로 평균 회귀(조정)가 나올 가능성이 높습니다. 정배열 과분산이면 상승 과열 → 눌림 조정 예상, 역배열 과분산이면 하락 과매도 → 기술적 반등 예상입니다. 새로운 포지션 진입보다는 기존 포지션 정리를, 반대 방향 진입은 반전 신호 확인 후에 접근하세요.`};
  if(+spread>5) return {tone:'neutral',label:'분산 (추세 진행)',text:`MA5/20/60 이격 ${sp}%. 이동평균선이 벌어져 있어 현재 추세가 진행 중입니다.${extraStr} 정배열이면 상승 추세, 역배열이면 하락 추세가 유지되고 있습니다. 추세 방향 포지션 유지가 유리하며, 이격이 더 벌어지면 과열 구간으로 주의가 필요합니다. 이평선이 다시 모이기 시작하면 추세 둔화의 첫 번째 신호이므로 주의하세요.`};
  return {tone:'neutral',label:'보통',text:`MA5/20/60 이격 ${sp}%. 이동평균선 간격이 정상 범위입니다.${extraStr} 추세가 형성 중이거나 횡보 구간이며, 이격이 벌어지는 방향을 주시하면 추세 방향을 알 수 있습니다.`};
};

SXI.advTrend = function(trendPct, adxVal, maArrange, volTrend){
  if(trendPct==null) return null;
  const pct = +trendPct;
  const extras = [];
  if(adxVal!=null && +adxVal>25) extras.push(`ADX ${(+adxVal).toFixed(0)} (추세 확인)`);
  if(maArrange==='bullish') extras.push('MA 정배열');
  else if(maArrange==='bearish') extras.push('MA 역배열');
  if(volTrend==='up') extras.push('거래량 상승 동반');
  else if(volTrend==='down') extras.push('거래량 감소 주의');
  const extraStr = extras.length ? ' '+extras.join(', ')+'.' : '';

  if(pct>10) return {tone:'bullish',label:'매우 강한 상승',text:`추세 강도 ${pct.toFixed(1)}%. 단기 모멘텀이 매우 강하게 상승 중입니다.${extraStr} 이 수준의 추세 강도는 시장 전체에서도 상위권에 해당하며, 추세 추종 전략이 최적입니다. 다만 급등 후에는 차익실현 매물이 나올 수 있으므로, 과열 지표(RSI 80+, BB 상단 돌파, CCI 200+)를 함께 점검하세요. 보유 중이면 후행 손절을 설정하고 수익을 보호하되, 추세가 살아 있는 한 조기 매도는 자제합니다.`};
  if(pct>5) return {tone:'bullish',label:'강한 상승',text:`추세 강도 ${pct.toFixed(1)}%. 단기 모멘텀이 강하게 상승 중입니다.${extraStr} 추세 추종 전략 유효하며, 눌림 조정 시 분할 추가 매수를 고려할 수 있습니다. 과열 구간 진입 시(RSI 75+) 분할 매도로 수익 실현을 시작하되, 추세가 지속되는 한 전량 청산은 자제하세요. 거래량이 동반 증가하면 추세 건강성이 확인되고, 거래량 감소 시 모멘텀 약화를 의심합니다.`};
  if(pct>1) return {tone:'bullish',label:'완만한 상승',text:`추세 강도 ${pct.toFixed(1)}%. 안정적이지만 약한 상승 흐름입니다.${extraStr} 급등보다 점진적 우상향이 지속되는 패턴으로, 눌림목 구간에서의 분할 매수 전략이 가장 적합합니다. 추세가 약하므로 큰 비중 진입보다 소액 분할로 접근하고, MA20 지지 여부를 핵심 기준으로 삼으세요.`};
  if(pct>-1) return {tone:'neutral',label:'횡보',text:`추세 강도 ${pct.toFixed(1)}%. 뚜렷한 방향 없이 횡보 중입니다.${extraStr} 돌파 방향을 확인한 뒤 진입하는 것이 안전하며, 박스권 상단/하단에서의 레인지 매매를 고려해볼 수 있습니다. 횡보가 오래 지속되면 에너지 축적 후 강한 돌파가 나올 수 있으므로, BB 스퀴즈 · 거래량 급증 신호를 주시하세요.`};
  if(pct>-5) return {tone:'bearish',label:'완만한 하락',text:`추세 강도 ${pct.toFixed(1)}%. 하락 압력이 지속되고 있습니다.${extraStr} 반등이 나와도 이평선 저항에 막혀 다시 하락하는 패턴이 반복될 수 있습니다. 보유 중이면 반등 시 비중 축소를 우선 고려하고, 미보유면 하락 추세 반전(MACD 골든크로스 + 스윙 구조 전환)이 확인될 때까지 관망이 유리합니다.`};
  if(pct>-10) return {tone:'bearish',label:'강한 하락',text:`추세 강도 ${pct.toFixed(1)}%. 강한 하락 모멘텀이 진행 중입니다.${extraStr} 반등 매수("물타기")는 매우 위험하며, 하락 추세에서의 반등은 대부분 짧고 약합니다. 보유 중이면 손절 기준을 엄격히 적용하고, 관망 후 바닥 확인(거래량 급증 양봉 + MACD 양수 전환 + 스윙 구조 HH+HL 형성)을 기다리세요.`};
  return {tone:'danger',label:'매우 강한 하락',text:`추세 강도 ${pct.toFixed(1)}%. 매우 강한 하락 모멘텀으로 패닉 구간에 근접합니다.${extraStr} 손실이 빠르게 확대될 수 있으며, 보유 중이면 즉시 손절을 실행하세요. 기술적 반등이 나오더라도 짧고 약할 가능성이 높으며, 반등에 진입하면 다시 하락에 갇힐 수 있습니다. 시장 전체의 공포 지수가 극에 달할 때까지 현금 보유가 최선의 전략입니다.`};
};

SXI.advStructPos = function(pos, nearSupport, nearResistance, supportPrice, resistPrice){
  if(pos==null) return null;
  const pct = (+pos*100).toFixed(0);
  const supStr = supportPrice ? ` 지지선 약 ${(+supportPrice).toLocaleString()}` : '';
  const resStr = resistPrice ? ` 저항선 약 ${(+resistPrice).toLocaleString()}` : '';

  if(nearSupport && nearResistance) return {tone:'warning',label:'수렴 구간',text:`현재가가 최근 레인지의 ${pct}% 위치이며 지지와 저항이 모두 근접한 수렴 구간입니다.${supStr},${resStr}. 레인지가 극도로 좁아진 상태로, 돌파 방향에 따라 큰 움직임이 나올 수 있습니다. 돌파 전까지는 비중을 줄이고, 돌파 확인(거래량 동반 + 종가 기준) 후 따라가는 전략이 안전합니다.`};
  if(nearSupport) return {tone:'bullish',label:'지지 근접',text:`현재가가 최근 레인지의 ${pct}% 위치로 지지선에 근접합니다.${supStr}. 손절 라인이 가까워 리스크/리워드 비율이 유리한 구간입니다. 지지선에서 반등(양봉 전환 + 거래량 증가)이 확인되면 매수 진입 적합 구간이며, 손절은 지지선 하방 2~3%에 설정합니다. 지지선이 깨지면 다음 지지선까지 빠르게 하락할 수 있으므로, 지지 이탈 시 즉시 대응이 필수입니다. RSI 과매도 또는 BB 하단 접근이 동반되면 반등 확률이 더 높아집니다.`};
  if(nearResistance) return {tone:'bearish',label:'저항 근접',text:`현재가가 최근 레인지의 ${pct}% 위치로 저항선에 근접합니다.${resStr}. 돌파 실패 시 하락 반전 가능성이 있으며, 신규 매수보다 기존 물량 일부 익절을 우선 고려하세요. 저항 돌파 시에는 거래량 동반 여부가 핵심 — 거래량 없는 돌파는 거짓 돌파(fakeout)일 확률이 높습니다. 돌파 확인 후 되돌림(pullback to breakout)에서 재진입하는 전략이 가장 안전하며, 돌파 실패 시 빠른 손절이 필요합니다.`};
  if(+pos*100>=70) return {tone:'neutral',label:'상단권',text:`현재가가 최근 레인지의 ${pct}% 위치로 상단권에 있습니다. 저항에 가까워지고 있으며, 돌파 여부에 따라 추가 상승 또는 조정이 결정됩니다. 추격 매수보다는 돌파 확인 또는 눌림 후 재진입이 효율적입니다.`};
  if(+pos*100<=30) return {tone:'neutral',label:'하단권',text:`현재가가 최근 레인지의 ${pct}% 위치로 하단권에 있습니다. 지지에 가까워지고 있으며, 지지 여부에 따라 반등 또는 추가 하락이 결정됩니다. 지지 확인 후 분할 접근을 고려할 수 있습니다.`};
  return {tone:'neutral',label:'중간 위치',text:`현재가가 최근 레인지의 ${pct}% 위치입니다. 지지/저항 모두에서 거리가 있는 중간 구간으로, 방향성 확인이 어렵습니다. 핵심 지지/저항 도달 시에만 대응하는 전략이 효율적이며, 현 위치에서의 성급한 진입은 어느 방향으로든 불리할 수 있습니다.`};
};

SXI.advPsychLevel = function(near, level, price){
  if(!near && near!==false) return null;
  const priceStr = price ? ` (현재가 ${(+price).toLocaleString()})` : '';
  const levelStr = level ? ` 심리가 ${(+level).toLocaleString()}` : '';
  if(near) return {tone:'bullish',label:'심리가 근접',text:`현재가가 라운드넘버(만원단위/천원단위) 근처에 있습니다${priceStr}${levelStr}. 심리적 가격대는 시장 참여자들의 주문이 집중되는 지점으로, 강력한 지지/저항 역할을 합니다. 라운드넘버 위에서 유지되면 지지 확인으로 매수 근거가 되고, 라운드넘버를 하향 이탈하면 심리적 지지 붕괴로 급락 가속이 가능합니다. 옵션 만기일이나 선물 만기일에는 심리가 효과가 더 강해집니다. 돌파 시 다음 라운드넘버까지 빠르게 이동하는 경향이 있어, 돌파 확인 후 진입이 유효합니다.`};
  return {tone:'neutral',label:'심리가 이격',text:`주요 심리적 가격대에서 떨어져 있어 라운드넘버 효과가 미미합니다${priceStr}. 기술적 지표와 차트 구조 중심으로 판단하세요. 다음 라운드넘버 접근 시 심리가 효과가 다시 작용할 수 있으므로, 접근 시점에서 재확인이 필요합니다.`};
};

SXI.advContext = function(bonus, notes, topFactors){
  if(!notes || !notes.length) return null;
  const b = +bonus||0;
  const noteStr = (topFactors||notes).slice(0,5).join(' · ');
  if(b>10) return {tone:'bullish',label:'강한 매수 맥락',text:`복합 맥락 보정 +${b}점. 주요 요인: ${noteStr}. 다수의 기술적 요인이 동시에 매수를 지지하고 있습니다. 정배열 + 상승추세 + 수급 유입 + 모멘텀 강세 등이 겹치는 "컨플루언스(Confluence)" 구간으로, 매수 신호의 신뢰도가 매우 높습니다. 다만 모든 것이 좋아 보일 때가 오히려 과열의 시작일 수 있으므로, 과매수 지표와 거래량 추이를 병행 점검하세요. 분할 진입으로 리스크를 관리하면서도 추세를 놓치지 않는 전략이 최적입니다.`};
  if(b>5) return {tone:'bullish',label:'매수 우위 맥락',text:`복합 맥락 보정 +${b}점. 주요 요인: ${noteStr}. 기술적 요인 다수가 매수 쪽으로 기울어져 있어 약간의 매수 우위가 형성됩니다. 강한 확신 구간은 아니지만, 손절 기준을 명확히 설정한 상태에서 분할 접근이 가능합니다. 추가 호재료(거래량 증가, 돌파 확인)가 나오면 비중을 높이세요.`};
  if(b>0) return {tone:'neutral',label:'약간 매수 우위',text:`복합 맥락 보정 +${b}점. 주요 요인: ${noteStr}. 매수 쪽 요인이 조금 우세하나 확정적이지 않습니다. 방향이 좀 더 명확해질 때까지 소액 관찰 매수 또는 관망이 적절합니다.`};
  if(b>-5) return {tone:'neutral',label:'혼합 맥락',text:`복합 맥락 보정 ${b>0?'+':''}${b}점. 주요 요인: ${noteStr}. 매수와 매도 요인이 혼재되어 뚜렷한 방향성이 없습니다. 추세가 불분명할 때는 포지션 비중을 줄이고, 한쪽 방향이 확실해질 때까지 기다리는 것이 리스크 관리에 유리합니다.`};
  if(b>-10) return {tone:'bearish',label:'매도 우위 맥락',text:`복합 맥락 보정 ${b}점. 주요 요인: ${noteStr}. 기술적 요인 다수가 매도 쪽으로 기울어져 있습니다. 보유 중이면 반등 시 비중 축소를 검토하고, 미보유면 신규 매수를 보류하세요. 시장 환경 개선 + 추세 반전 신호가 나올 때까지 관망이 안전합니다.`};
  return {tone:'danger',label:'강한 매도 맥락',text:`복합 맥락 보정 ${b}점. 주요 요인: ${noteStr}. 다수의 기술적 요인이 동시에 매도를 가리키고 있습니다. 역배열 + 하락추세 + 수급 유출 + 모멘텀 약세 등이 겹치는 위험 구간으로, 보유 중이면 손절 또는 대폭 비중 축소를 즉시 실행하세요. 기술적 반등이 나와도 짧고 약할 가능성이 높으며, 반등에 진입하면 다시 하락에 갇힐 수 있습니다.`};
};

// ════════════════════════════════════════════════════════════
//  고급 해석(Deep Interpretation) 보강 — S46
//  기존 함수들을 대폭 상세화
// ════════════════════════════════════════════════════════════

SXI.pullback = function(score){
  if(score==null) return null;
  const s=+score;
  if(s>=80) return {label:'최적 눌림목',tone:'bullish',text:`눌림목 점수 ${s}. 상승 추세 안에서 조정이 충분히 진행된 이상적 매수 구간입니다. MA20 지지와 RSI 반등이 겹치는 자리로, 분할 매수를 적극 고려할 만합니다. 직전 스윙 저점을 손절 라인으로 설정하고, MA20 종가 이탈 시 해석이 무효화됩니다.`};
  if(s>=60) return {label:'눌림목 양호',tone:'bullish',text:`눌림목 점수 ${s}. 조정이 진행 중이며 매수 관심 구간에 진입하고 있습니다. 아직 최적은 아닐 수 있으므로, 지지 확인 + 거래량 반등을 기다린 뒤 분할 진입이 안전합니다.`};
  if(s>=40) return {label:'눌림목 보통',tone:'neutral',text:`눌림목 점수 ${s}. 조건이 일부만 갖춰진 상태로, 추세가 강하지 않거나 조정 폭이 부족합니다. 지지선 도달 시 재검토하세요.`};
  if(s>=20) return {label:'눌림목 약함',tone:'neutral',text:`눌림목 점수 ${s}. 눌림목 매수 조건에 거의 부합하지 않습니다. 추세 방향이 명확해진 후 재검토가 바람직합니다.`};
  return {label:'해당없음',tone:'neutral',text:`눌림목 점수 ${s}. 눌림목 매수 조건에 해당하지 않습니다. 역배열이거나 하락 추세에서는 눌림목 전략 자체가 위험합니다.`};
};

SXI.swingStruct = function(higherHighs, lowerLows){
  if(higherHighs && !lowerLows) return {label:'상승 구조 (HH+HL)',tone:'bullish',text:'고점과 저점이 모두 높아지는 상승 구조입니다. 눌림이 오면 직전 저점에서 지지되는지가 핵심이고, 저점이 깨지면 구조가 무너진 것으로 봐야 합니다. ADX 25 이상이면 추세 강도 확인, 거래량 동반 고점 갱신이면 구조 건강성 양호.'};
  if(higherHighs && lowerLows) return {label:'확산형',tone:'warning',text:'고점은 높아지는데 저점도 낮아지는 확산형입니다. 변동성이 커지고 있고 방향이 불분명하니, 비중을 줄이고 확산 해소 방향을 기다리세요.'};
  if(!higherHighs && lowerLows) return {label:'하락 구조 (LH+LL)',tone:'bearish',text:'저점이 계속 내려가는 하락 구조입니다. 반등이 나와도 고점을 넘기 전까지 추세 전환으로 보기 어렵습니다. 보유 시 반등 비중 축소, 미보유 시 구조 전환 확인까지 관망.'};
  return {label:'횡보 구조',tone:'neutral',text:'뚜렷한 고저점 패턴 없이 옆으로 움직이고 있습니다. 방향이 정해질 때까지 기다리되, BB 스퀴즈·거래량 급증 같은 돌파 전조를 주시하세요.'};
};

SXI.maConvergence = function(converging, spread){
  if(converging==null) return null;
  const sp = (+spread).toFixed(1);
  if(converging && +spread<=2) return {label:'강한 수렴',tone:'neutral',text:`이평선이 거의 한 점으로 수렴 중(${sp}%). 강력한 변곡점 임박. BB 스퀴즈 동반 시 돌파 폭발 예상. 방향 확인 후 진입.`};
  if(converging) return {label:'수렴 중',tone:'neutral',text:`이평선들이 모이고 있습니다(분산 ${sp}%). 방향이 정해지면 빠르게 움직일 수 있는 구간이니 돌파 방향을 눈여겨보세요.`};
  if(+spread>8) return {label:'과도한 분산',tone:'warning',text:`이평선 간격이 매우 넓습니다(분산 ${sp}%). 추세 과열 상태이며, 평균 회귀(조정)가 나올 가능성이 높습니다.`};
  if(+spread>5) return {label:'크게 벌어짐',tone:'warning',text:`이평선 간격이 넓습니다(분산 ${sp}%). 추세가 과열됐을 수 있고, 평균으로 되돌아가려는 힘이 작용할 수 있습니다.`};
  return {label:'보통',tone:'neutral',text:`이평선 분산 ${sp}%로 정상 범위입니다.`};
};

SXI.vwap = function(position, pct){
  if(!position) return null;
  const p = pct!=null?(+pct).toFixed(1):'';
  if(position==='above_far') return {label:'VWAP 크게 상회',tone:'warning',text:`가격이 단기 평균 매입단가를 ${p}% 상회합니다. 대부분의 단기 매수자가 수익 중이어서 차익실현 매물 출회 가능성이 높습니다. 추격 매수는 위험하며, 눌림 조정 후 VWAP 부근 지지 확인 시 재진입이 안전합니다. 거래량이 줄어들면서 가격이 유지되면 건전한 상승, 거래량 급감이면 매수 고갈 신호입니다.`};
  if(position==='above') return {label:'VWAP 상회',tone:'bullish',text:'가격이 단기 평균 매입단가 위에서 유지되어 단기 수급이 매수 우위입니다. 눌림이 나오더라도 VWAP이 1차 지지 역할을 하며, VWAP 지지 후 반등은 건강한 상승의 전형적 패턴입니다. VWAP 이탈 시 매수 해석 약화에 주의하세요.'};
  if(position==='near') return {label:'VWAP 공방',tone:'neutral',text:'가격이 VWAP 부근에서 공방 중입니다. 매수/매도 균형 상태이며 방향 결정 전 단계입니다. VWAP 위 안착은 매수 신호, 아래 이탈은 단기 약세 신호입니다. 거래량과 캔들 방향을 함께 확인하세요.'};
  if(position==='below') return {label:'VWAP 하회',tone:'bearish',text:'가격이 단기 평균 매입단가 아래입니다. 단기 매수자 대부분이 손실 상태이며, 반등이 나와도 VWAP이 저항으로 작용할 수 있습니다. 추격 매수보다 VWAP 회복 확인 후 접근이 안전합니다.'};
  return {label:'VWAP 크게 하회',tone:'danger',text:`가격이 단기 평균 매입단가를 ${p?Math.abs(+p).toFixed(1)+'% ':'크게 '}하회합니다. 매도 압력이 강한 구간이며, 단기 매수자 대부분이 큰 손실 상태입니다. 반등이 나와도 VWAP과 이평선이 다중 저항으로 작용하여 회복이 어렵습니다. 기술적 반등 시도 시에도 VWAP 부근에서 매도 물량이 쏟아질 수 있으므로 극도의 보수적 접근이 필요합니다.`};
};

SXI.ichimoku = function(priceVsCloud, cloud, signal){
  if(!priceVsCloud) return null;
  if(priceVsCloud==='above' && cloud==='bullish') return {label:'구름 위 (양운)',tone:'bullish',text:'가격이 양운(상승 구름) 위에 있고 전환선이 기준선 위에 있어 중기 추세가 확실히 상승 우위입니다. 일목균형표의 삼역호전(三役好轉) 중 2가지 이상이 충족된 상태로, 눌림목 매수에 가장 유리한 구름 환경입니다. 구름 상단이 지지선 역할을 하며, 구름이 두꺼울수록 지지가 강합니다. 다만 구름과의 괴리가 커지면 단기 되돌림 가능성도 함께 보세요.'};
  if(priceVsCloud==='above') return {label:'구름 위',tone:'bullish',text:'가격이 구름 위에 있어 중기 기준 상승 추세입니다. 구름이 얇아지거나 음운 전환(선행스팬A < 선행스팬B) 시 추세 약화 경고입니다. 전환선과 기준선의 교차 방향도 함께 확인하면 단기 방향 판단에 도움됩니다.'};
  if(priceVsCloud==='inside') return {label:'구름 안',tone:'neutral',text:'가격이 구름 안에 갇혀 있어 방향이 정해지지 않은 과도기 구간입니다. 구름 상단 돌파 시 상승 전환, 하단 이탈 시 하락 가속으로 볼 수 있습니다. 구름이 두꺼울수록 돌파 시 에너지가 크고, 얇을수록 빠르게 통과합니다. 돌파 방향을 기다리되, 거짓 돌파에 대비해 2봉 이상 확인 후 대응하세요.'};
  if(priceVsCloud==='below' && cloud==='bearish') return {label:'구름 아래 (음운)',tone:'danger',text:'가격이 음운(하락 구름) 아래로 가장 약한 상태입니다. 구름이 두꺼운 저항으로 작용하여 반등 폭이 제한됩니다. 구름 돌파에는 상당한 에너지(거래량 + 모멘텀)가 필요하며, 단순 기술적 반등으로는 구름 하단에서 막히기 쉽습니다. 매수는 구름 돌파 확인 후에만 고려하세요.'};
  return {label:'구름 아래',tone:'bearish',text:'가격이 구름 아래에 있어 하락 추세입니다. 구름이 저항으로 작용하며, 구름 돌파 전까지 매수는 위험합니다. 전환선이 기준선 위로 올라오면 반전 초기 신호이지만, 구름 돌파까지는 본격 전환으로 보기 어렵습니다.'};
};

SXI.regime = function(label, direction, adx){
  if(!label) return null;
  const adxStr = adx!=null ? ` ADX ${(+adx).toFixed(0)}.` : '';
  const T = {
    '추세+변동':`추세가 있으면서 변동성도 높은 구간입니다.${adxStr} 방향이 맞으면 수익이 빠르지만 틀리면 손실도 빨라 비중 조절이 핵심입니다. 손절 폭을 평소보다 넓게 잡되 비중을 줄이는 전략이 유효합니다.`,
    '추세장':`뚜렷한 추세가 진행 중입니다.${adxStr} 추세를 따라가는 포지션이 유리하고, 역방향 매매는 위험합니다. 눌림목 매수(상승 시) 또는 반등 매도(하락 시) 전략이 최적입니다.`,
    '횡보장':`방향 없이 옆으로 움직이는 구간입니다.${adxStr} 추세 추종보다 박스권 매매가 더 맞는 환경이며, 돌파 시 빠르게 따라가는 준비를 하세요.`,
    '전환기':`추세가 바뀌고 있는 과도기입니다.${adxStr} 기존 포지션을 정리하고 새 방향이 확인될 때까지 지켜보세요. 전환 초기에 성급하게 진입하면 거짓 신호에 당할 수 있습니다.`
  };
  return {label, tone:direction==='UP'?'bullish':direction==='DOWN'?'bearish':'neutral', text:T[label]||`시장 상태를 분석 중입니다.${adxStr}`};
};

// ════════════════════════════════════════════════════════════
//  1단계-B: 신규 단건 해석 함수 (v2.0)
// ════════════════════════════════════════════════════════════

SXI.priceChannel = function(position, upper, lower, price){
  if(!position) return null;
  const pFmt = (v)=> v!=null ? (+v).toLocaleString() : '';
  const range = upper&&lower ? ` 채널 범위 ${pFmt(lower)}~${pFmt(upper)}.` : '';
  if(position==='breakout_up') return {label:'채널 상단 돌파',tone:'bullish',text:`가격(${pFmt(price)})이 최근 가격 범위 상단(${pFmt(upper)})을 돌파했습니다.${range} N일간의 고점을 돌파한 것으로, 새로운 상승 추세의 시작일 수 있습니다. 거래량이 평소의 1.5배 이상 동반되면 진짜 돌파 확률이 높아지며, 거래량 없는 돌파는 거짓 돌파 위험이 있습니다. 돌파 직후 되돌림(pullback to breakout level) 시 이전 상단이 지지로 전환되면 추가 진입 구간이 됩니다. 되돌림이 채널 안으로 다시 빠지면 거짓 돌파이므로 즉시 청산하세요.`};
  if(position==='breakout_down') return {label:'채널 하단 이탈',tone:'danger',text:`가격(${pFmt(price)})이 최근 가격 범위 하단(${pFmt(lower)})을 이탈했습니다.${range} N일간의 저점을 깨뜨린 것으로 하락 가속 위험이 큽니다. 보유 중이면 즉시 손절 기준을 점검하고, 이탈이 종가 기준으로 확정되면 비중 축소를 실행하세요. 채널 하단 이탈 후 급등 복귀(V자 반등)는 드물며, 대부분 추가 하락 또는 횡보가 이어집니다.`};
  if(position==='upper_half') return {label:'채널 상단권',tone:'warning',text:`가격이 채널 상단권에 위치합니다.${range} 돌파 직전 구간으로, 돌파 성공 시 급등이 가능하지만 실패 시 되돌림이 빠를 수 있습니다. 거래량 증가와 함께 상단 접근이면 돌파 확률↑, 거래량 감소면 저항 가능성↑. 돌파 확인 전까지는 추격보다 확인 접근이 유리합니다.`};
  if(position==='lower_half') return {label:'채널 하단권',tone:'bullish',text:`가격이 채널 하단권에 위치합니다.${range} 지지 확인 시 반등 시도 구간으로, 하단에서 양봉 전환 + 거래량 증가가 나오면 매수 근거가 됩니다. 다만 하단 이탈 시 추가 약세가 열리므로, 채널 하단을 손절 라인으로 설정하고 진입하세요.`};
  return {label:'채널 중간',tone:'neutral',text:`최근 가격 범위 중간 부근입니다.${range} 상단이든 하단이든 방향 결정 전 단계이며, 위치 기반 신호는 약합니다.`};
};

SXI.pivot = function(level, P, R1, S1, price){
  if(!level || level==='none') return null;
  const pFmt = (v)=> v!=null ? (+v).toLocaleString() : '';
  if(level==='R2+') return {label:'피벗 R2 이상',tone:'warning',text:`가격(${pFmt(price)})이 피벗 R2 이상에 위치해 단기 과열 구간입니다. 피벗(${pFmt(P)}). 피벗 포인트 기준으로 상당히 높은 위치이며, 전일 대비 상승 폭이 큽니다. 기관·데이트레이더의 차익 실현 매물이 집중될 수 있는 구간이므로, 추격 진입보다 눌림 확인이 유리합니다. R2 이상에서 양봉이 지속되면 추세가 매우 강한 것이지만, 거래량 감소와 함께면 고점 피로 신호입니다.`};
  if(level==='R1~R2') return {label:'피벗 R1~R2',tone:'bullish',text:`가격이 피벗(${pFmt(P)})과 R1(${pFmt(R1)}) 위에 있어 단기 매수 우위입니다. R2 돌파 시 추세 가속이 예상되며, 실패 시 R1이 1차 지지가 됩니다. R1 지지 확인 후 추가 매수를 고려할 수 있고, R1 이탈 시 피벗까지 조정 가능성을 열어두세요.`};
  if(level==='P~R1') return {label:'피벗~R1',tone:'bullish',text:`가격이 피벗(${pFmt(P)}) 위에서 R1(${pFmt(R1)})을 향하고 있어 약한 매수 우위입니다. 피벗 위 유지가 핵심이며, 피벗 이탈 시 약세 전환에 유의하세요. 거래량이 늘면서 R1에 접근하면 돌파 확률이 높아집니다.`};
  if(level==='S1~P') return {label:'S1~피벗',tone:'neutral',text:`가격이 피벗(${pFmt(P)}) 아래로 내려왔지만 S1(${pFmt(S1)}) 위에서 지지를 받고 있습니다. 피벗 회복 시 매수 신호, S1 이탈 시 추가 하락에 유의하세요. 이 구간은 단기 매수/매도 공방 구간으로, 방향 결정까지 관망이 유리합니다.`};
  if(level==='S1~S2') return {label:'피벗 S1~S2',tone:'bearish',text:`가격이 S1(${pFmt(S1)}) 아래로 하락해 단기 기준 약세 우위입니다. 추가 하락 가능성이 있으며, 반등이 나와도 S1과 피벗이 다중 저항으로 작용합니다. 보수적 접근이 필요하며, 신규 매수보다 관망이 안전합니다.`};
  if(level==='S2-') return {label:'피벗 S2 이하',tone:'danger',text:`가격(${pFmt(price)})이 피벗 S2 이하로 크게 하락한 상태입니다. 극단적 약세 구간이며, 전일 대비 낙폭이 매우 큽니다. 패닉 셀링 가능성이 있으며, 기술적 반등이 나와도 상단의 S1, 피벗이 모두 저항이 되어 회복이 어렵습니다. 매수보다 손절 및 관망이 우선입니다.`};
  return {label:'피벗 근처',tone:'neutral',text:'현재가가 피벗 부근으로 방향 결정 전 단계입니다. 피벗 위 안착은 매수 우위, 아래 이탈은 매도 우위 신호입니다.'};
};

SXI.maDisparity = function(d20, d60){
  if(d20==null && d60==null) return null;
  const v20 = d20!=null ? +d20 : null;
  const v60 = d60!=null ? +d60 : null;
  const primary = v20 != null ? v20 : v60;
  const detail = [];
  if(v20!=null) detail.push(`MA20 이격 ${v20>=0?'+':''}${v20.toFixed(1)}%`);
  if(v60!=null) detail.push(`MA60 이격 ${v60>=0?'+':''}${v60.toFixed(1)}%`);
  const dtxt = detail.join(', ');
  if(primary>10) return {label:'MA 극단 과열',tone:'danger',text:`이동평균선 대비 극단적으로 벌어졌습니다(${dtxt}). 이 수준의 괴리는 통계적으로 매우 드물며, 급격한 되돌림(평균 회귀)이 임박할 가능성이 높습니다. 보유 중이면 분할 익절을 즉시 시작하고, 신규 진입은 절대 자제하세요.`};
  if(primary>8) return {label:'MA 크게 과열',tone:'danger',text:`이동평균선 대비 괴리가 크게 벌어졌습니다(${dtxt}). 추세는 강할 수 있지만 신규 진입 기준으로는 과열 부담이 큽니다. 조정 시 이격이 줄어드는 과정에서 낙폭이 클 수 있으므로 주의하세요.`};
  if(primary>4) return {label:'MA 과열',tone:'warning',text:`이동평균선 대비 괴리가 벌어지고 있습니다(${dtxt}). 추세가 살아 있다면 가속이지만, 이격이 커질수록 이평선으로의 회귀 압력도 커집니다. 눌림 조정 시 이평선 근처까지 내려올 수 있으므로 추격 매수는 비중을 낮추세요.`};
  if(primary<-10) return {label:'MA 극단 이격',tone:'bullish',text:`이동평균선 대비 하방 괴리가 극단적입니다(${dtxt}). 패닉 셀링 구간일 수 있으며, 기술적 반등 시 폭이 클 수 있습니다. 다만 추세 확인 없이 역발상 매수는 위험하므로, 반전 신호(양봉+거래량) 확인 후 소액 접근하세요.`};
  if(primary<-8) return {label:'MA 크게 이격',tone:'bullish',text:`이동평균선 대비 하방 괴리가 매우 큽니다(${dtxt}). 기술적 반등 가능성이 높지만, 추세 확인이 동반되어야 합니다. 이평선까지의 반등을 1차 목표로 설정할 수 있습니다.`};
  if(primary<-4) return {label:'MA 눌림',tone:'neutral',text:`이동평균선과의 괴리가 줄어드는 중입니다(${dtxt}). 추세가 살아 있다면 눌림목 성격으로 볼 수 있으며, 이평선 근접 시 지지 여부가 핵심입니다.`};
  return {label:'MA 이격 보통',tone:'neutral',text:`이동평균선과의 괴리가 정상 범위입니다(${dtxt}). 이평선과 가격이 균형을 이루고 있어 과열/침체 신호는 없습니다.`};
};

SXI.volumeMA = function(volRatio){
  if(volRatio==null) return null;
  const r=+volRatio;
  if(r>=5) return {label:'거래량 폭등',tone:'bullish',text:`거래량이 평균의 ${r.toFixed(1)}배로 폭등했습니다. 극단적인 거래량은 세력 진입, 중대 뉴스, 또는 패닉 매도를 의미합니다. 양봉이면 강력한 매수 신호, 음봉이면 투매 가능성을 확인하세요. 거래량 폭등 후에는 변동성이 크게 확대되므로 비중 관리에 주의가 필요합니다.`};
  if(r>=3) return {label:'거래량 폭발',tone:'bullish',text:`거래량이 평균의 ${r.toFixed(1)}배로 급증했습니다. 세력이 움직이고 있을 수 있으며, 가격 방향(양봉/음봉)과 일치하는지가 핵심입니다. 돌파 시점의 거래량 폭발은 진짜 돌파의 강력한 확인 신호이며, 조정 시 거래량 감소가 동반되면 건강한 조정입니다.`};
  if(r>=1.5) return {label:'거래량 증가',tone:'bullish',text:`거래량이 평균을 넘어서(${r.toFixed(1)}x) 현재 움직임에 힘이 실리고 있습니다. 추세 방향과 거래량이 일치하면 추세 건강성이 확인되며, 돌파/이탈 시의 거래량 증가는 방향성에 대한 확신을 높여줍니다.`};
  if(r>=0.7) return {label:'거래량 보통',tone:'neutral',text:`거래량이 평균 수준(${r.toFixed(1)}x)이라 특별한 수급 신호는 보이지 않습니다. 돌파나 반전 판단에는 거래량 변화가 동반되어야 신뢰도가 높아집니다.`};
  return {label:'거래량 감소',tone:'neutral',text:`거래량이 평균보다 적습니다(${r.toFixed(1)}x). 시장 참여자의 관심이 줄어든 상태이며, 돌파나 전환의 신뢰도가 떨어집니다. 다만 수축이 오래 지속되면 에너지 축적 후 폭발적 움직임이 나올 수 있어, BB 스퀴즈 동반 시 주의하세요.`};
};

SXI.adLine = function(trend, div){
  if(!trend) return null;
  if(div==='bullish') return {label:'A/D 상승 다이버전스',tone:'bullish',text:'가격은 조정을 받았지만 A/D(Accumulation/Distribution) 라인은 오히려 개선 중입니다. 종가 기준으로 매수세가 살아 있으며, 누군가 조용히 모으고 있을 가능성이 높습니다. OBV 상승 다이버전스와 동시 발생 시 매집 확률이 매우 높아지며, 가격 반등 시 급등으로 이어질 수 있습니다.'};
  if(div==='bearish') return {label:'A/D 하락 다이버전스',tone:'warning',text:'A/D 라인이 꺾이면서 종가 기준 물량이 빠져나가는 조짐이 보입니다. 가격은 상승하지만 실질 수급은 약해지고 있어, 고점권이라면 차익 실현 매물에 특히 주의해야 합니다. OBV도 하락이면 이중 분산 신호입니다.'};
  if(trend==='up') return {label:'A/D 상승',tone:'bullish',text:'A/D 라인이 올라가며 종가 기준으로 매수세가 우위입니다. 가격이 횡보하더라도 내부 수급은 개선 중일 수 있으며, 향후 가격 상승의 선행 지표가 됩니다. OBV 상승과 함께라면 수급 건강성이 확실합니다.'};
  if(trend==='down') return {label:'A/D 하락',tone:'bearish',text:'A/D 라인이 내려가며 종가 기준 매도세가 우위입니다. 물량이 빠지는 흐름이 지속되고 있어, 지지선 이탈 시 급락으로 연결될 수 있습니다. OBV도 하락이면 수급 악화가 확실합니다.'};
  return {label:'A/D 보합',tone:'neutral',text:'A/D 라인이 횡보 중이라 뚜렷한 수급 방향이 보이지 않습니다. 방향이 정해지기를 기다리는 구간입니다.'};
};

// ════════════════════════════════════════════════════════════
//  2단계: 복합 상황 해석 (4계열 분리)
// ════════════════════════════════════════════════════════════

SXI.compositeMomentum = function(ind){
  const notes=[];
  if(!ind) return notes;
  const rsi=typeof ind.rsi==="number"?ind.rsi:(ind.rsi?.val??ind.rsiLegacy??50);
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
  const rsi=typeof ind.rsi==="number"?ind.rsi:(ind.rsi?.val??ind.rsiLegacy??50);
  const squeeze=ind.squeeze?.squeeze??ind.bb?.isSqueeze;
  const disp20=ind.maDisparity?.disparity20??ind.maDisparityLegacy?.disparity20??null;
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
  const rsi=typeof ind.rsi==="number"?ind.rsi:(ind.rsi?.val??ind.rsiLegacy??50);
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
  const rsi=typeof ind.rsi==="number"?ind.rsi:(ind.rsi?.val??ind.rsiLegacy??50);
  const bbPctB=ind.bb?.pctB;
  const atrR=ind.atr?.ratio??ind.atr?.pct??0;
  const adxV=ind.adx?.adx??ind.adx??0;
  const maArr=ind.maAlign?.bullish?'bull':ind.maAlign?.bearish?'bear':'mixed';
  const nearR=ind.trend?.struct?.nearResistance??(ind.priceChannel?.position==='upper_half'||ind.priceChannel?.position==='breakout_up')??false;
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
  const adv = ind._advanced || ind; // calcIndicators 래퍼 경유 시 _advanced에 전체 데이터
  const rsiV=typeof ind.rsi==='number'?ind.rsi:(ind.rsi?.val??ind.rsiLegacy??null);
  const macdObj=ind.macd||ind.macdLegacy||{};
  const stochObj=ind.stoch||ind.stochLegacy||{};
  const adxObj=ind.adx||ind.adxLegacy||{};
  const bbObj=ind.bb||ind.bbLegacy||{};
  const obvObj=ind.obv||ind.obvLegacy||{};
  const candleObj=ind.candle||ind.patterns||ind.patternsLegacy||adv.candle||{};
  const atrObj=ind.atr||{};
  const maAlign=ind.maAlign||adv.maAlign||{};
  const psarObj=ind.psar||{};
  const swingObj=ind.swingStruct||ind.swingStructLegacy||adv.swingStruct||{};
  const maConvObj=ind.maConv||adv.maConv||{};
  const vwapObj=ind.vwap||ind.vwapLegacy||{};
  const ichimokuObj=ind.ichimoku||ind.ichimokuLegacy||{};
  const regimeObj=ind.regime||adv.regime||{};
  const pchObj=ind.priceChannel||ind.priceChannelLegacy||{};
  const pivotObj=ind.pivot||ind.pivotLegacy||{};
  const dispObj=ind.maDisparity||ind.maDisparityLegacy||{};
  const adLineObj=ind.ad||ind.adLegacy||{};
  const pullbackScore=ind.pullback?.score??adv.pullback?.score??null;
  const volRatio=ind.volPattern?.volRatio??adv.volPattern?.volRatio??null;

  return {
    rsi: SXI.rsi(rsiV),
    macd: SXI.macd(macdObj.hist??macdObj.histogram, macdObj.prevHist, macdObj.recentGolden, macdObj.recentDead),
    stoch: SXI.stoch(stochObj.k, stochObj.d),
    adx: SXI.adx(adxObj.adx, adxObj.pdi??adxObj.plusDI, adxObj.mdi??adxObj.minusDI),
    cci: SXI.cci(ind.cci),
    mfi: SXI.mfi(ind.mfi),
    bb: SXI.bb(bbObj.pctB, bbObj.width, bbObj.isSqueeze??ind.squeeze?.squeeze??adv.squeeze?.squeeze),
    bbWidth: SXI.bbWidth(bbObj.width, bbObj.isSqueeze??ind.squeeze?.squeeze??adv.squeeze?.squeeze),
    obv: SXI.obv(obvObj.trend, obvObj.div??obvObj.divergence),
    ma: SXI.ma(maAlign.bullish?'bullish':maAlign.bearish?'bearish':null),
    atr: SXI.atr(atrObj.pct??atrObj.ratio),
    sar: SXI.sar(psarObj.trend),
    candle: SXI.candle(candleObj.patterns?[...candleObj.patterns]:null),
    pullback: SXI.pullback(pullbackScore),
    swingStruct: SXI.swingStruct(swingObj.higherHighs, swingObj.lowerLows),
    maConvergence: SXI.maConvergence(maConvObj.converging, maConvObj.spread),
    vwap: SXI.vwap(vwapObj.position, vwapObj.pct),
    ichimoku: SXI.ichimoku(ichimokuObj.priceVsCloud, ichimokuObj.cloud, ichimokuObj.signal),
    regime: SXI.regime(regimeObj.label, regimeObj.direction, regimeObj.adx),
    priceChannel: SXI.priceChannel(pchObj.position, pchObj.upper, pchObj.lower, pchObj.price),
    pivot: SXI.pivot(pivotObj.level, pivotObj.P, pivotObj.R1, pivotObj.S1, pivotObj.price),
    maDisparity: SXI.maDisparity(dispObj.disparity20, dispObj.disparity60),
    volumeMA: SXI.volumeMA(volRatio),
    adLine: SXI.adLine(adLineObj.trend, adLineObj.score!=null?(adLineObj.score>3?'bullish':adLineObj.score<-3?'bearish':null):null),
  };
};

// ── 버전 ──
SXI.version = '2.3';

// ════════════════════════════════════════════════════════════
//  5단계: 부문별 점수 해석 (S43 신규)
// ════════════════════════════════════════════════════════════
SXI.sectorScores = function(scores, stock, ind){
  if(!scores) return null;
  const res = {};
  const m=scores.momentum, mG=m>=70?'A':m>=55?'B':m>=40?'C':m>=25?'D':'F';
  let mT=`${m}점 (${mG}등급). `;
  if(ind){
    const rsi=typeof ind.rsi==='number'?ind.rsi:(ind.rsi?.val??50);
    const macdUp=ind.macd?.macd>ind.macd?.signal;
    const cr=stock?.changeRate||0;
    mT+=`RSI ${rsi.toFixed(0)}${rsi>60?' (매수↑)':rsi<40?' (매도↑)':''}, MACD ${macdUp?'시그널↑':'시그널↓'}, 등락률 ${cr>0?'+':''}${cr.toFixed(1)}%. `;
    if(m>=70) mT+='상승 모멘텀이 매우 강하며 추세 추종에 유리합니다.';
    else if(m>=55) mT+='상승 모멘텀 우위이지만 강하지는 않습니다.';
    else if(m>=40) mT+='모멘텀이 약세 쪽이며 관망이 유리합니다.';
    else mT+='하락 모멘텀이 강합니다. 반전 신호를 기다리세요.';
  }
  res.momentum={score:m,grade:mG,tone:m>=55?'bullish':m<=45?'bearish':'neutral',text:mT};

  const v=scores.value, vG=v>=70?'A':v>=55?'B':v>=40?'C':v>=25?'D':'F';
  const fr=stock?.foreignRatio||0;
  let vT=`${v}점 (${vG}등급). 외국인 ${fr.toFixed(1)}%`;
  if(fr>30) vT+=' — 외국인 선호 우량주, 하방 제한적.';
  else if(fr>15) vT+=' — 보통 수준.';
  else if(fr>5) vT+=' — 낮은 편, 유동성 주의.';
  else vT+=' — 매우 낮음, 급등락 빈번 가능.';
  vT+=' ※ 재무 데이터 통합은 향후 추가 예정.';
  res.value={score:v,grade:vG,tone:v>=55?'bullish':v<=45?'bearish':'neutral',text:vT};

  const vo=scores.volume, voG=vo>=70?'A':vo>=55?'B':vo>=40?'C':vo>=25?'D':'F';
  let voT=`${vo}점 (${voG}등급). `;
  if(ind){
    const mfi=ind.mfi,vr=ind.vr,obvT=ind.obv?.trend;
    voT+=`MFI ${typeof mfi==='number'?mfi.toFixed(0):'N/A'}${mfi>60?' (유입)':mfi<40?' (유출)':''}, VR ${typeof vr==='number'?vr.toFixed(0):'N/A'}, OBV ${obvT==='up'?'↑':obvT==='down'?'↓':'—'}. `;
    if(vo>=70) voT+='수급이 확실히 뒷받침되어 추세 지속력이 높습니다.';
    else if(vo>=55) voT+='매수 수급이 살아있습니다.';
    else if(vo>=40) voT+='뚜렷한 수급 방향이 없습니다.';
    else voT+='거래량 부족으로 신뢰도가 낮습니다.';
  }
  res.volume={score:vo,grade:voG,tone:vo>=55?'bullish':vo<=45?'bearish':'neutral',text:voT};

  const t=scores.trend, tG=t>=70?'A':t>=55?'B':t>=40?'C':t>=25?'D':'F';
  let tT=`${t}점 (${tG}등급). `;
  if(ind){
    const adxV=ind.adx?.adx??0;
    const bull=ind.ma5&&ind.ma20&&ind.ma60&&ind.ma5>ind.ma20&&ind.ma20>ind.ma60;
    const sarUp=ind.psar?.trend==='up';
    tT+=`ADX ${adxV.toFixed(0)}${adxV>25?' (추세↑)':' (추세↓)'}, MA ${bull?'정배열':'혼조/역배열'}, SAR ${sarUp?'↑':'↓'}. `;
    if(t>=70) tT+='상승 추세가 강하며 추세 추종에 최적입니다.';
    else if(t>=55) tT+='약한 상승 추세 형성 중.';
    else if(t>=40) tT+='추세가 약하거나 횡보 중.';
    else tT+='하락 추세 또는 추세 부재.';
  }
  res.trend={score:t,grade:tG,tone:t>=55?'bullish':t<=45?'bearish':'neutral',text:tT};
  return res;
};

// ════════════════════════════════════════════════════════════
//  6단계: MA 배열 상세 해석 (S43 신규)
// ════════════════════════════════════════════════════════════
SXI.maAlignment = function(ind){
  if(!ind) return null;
  const last=ind.last||ind.price||0;
  const ma5=ind.ma5,ma20=ind.ma20,ma60=ind.ma60,ma120=ind.ma120;
  if(!ma5&&!ma20) return null;
  const pD=(a,b)=>b?((a-b)/b*100).toFixed(1):'N/A';
  const lines=[];
  if(ma5) lines.push({n:'MA5',v:ma5,ab:last>ma5,d:pD(last,ma5)});
  if(ma20) lines.push({n:'MA20',v:ma20,ab:last>ma20,d:pD(last,ma20)});
  if(ma60) lines.push({n:'MA60',v:ma60,ab:last>ma60,d:pD(last,ma60)});
  if(ma120) lines.push({n:'MA120',v:ma120,ab:last>ma120,d:pD(last,ma120)});
  const bull=ma5&&ma20&&ma60&&ma5>ma20&&ma20>ma60;
  const bear=ma5&&ma20&&ma60&&ma5<ma20&&ma20<ma60;
  const fullBull=bull&&ma120&&ma60>ma120;
  const fullBear=bear&&ma120&&ma60<ma120;
  let gcDc='';
  if(ma5&&ma20){const gap=((ma5-ma20)/ma20)*100; if(Math.abs(gap)<1) gcDc=gap>0?'⚡ MA5/MA20 근접 — GC 직후 또는 DC 직전':'⚡ MA5/MA20 근접 — DC 직후 또는 GC 직전';}
  let srNote='';
  if(ma20&&last>ma20){const d=((last-ma20)/ma20)*100;if(d<2) srNote=`현재가 MA20 바로 위(${d.toFixed(1)}%) — 지지 테스트 중`;}
  else if(ma20&&last<ma20){const d=((ma20-last)/last)*100;if(d<2) srNote=`현재가 MA20 바로 아래(${d.toFixed(1)}%) — 저항 테스트 중`;}
  const arr=fullBull?'완전 정배열 (5>20>60>120)':fullBear?'완전 역배열':bull?'정배열 (5>20>60)':bear?'역배열':'혼조';
  const tone=fullBull||bull?'bullish':fullBear||bear?'bearish':'neutral';
  let text=`【${arr}】\n`;
  lines.forEach(l=>{text+=`${l.n}: ${(+l.v).toLocaleString()} — 현재가 ${l.ab?'위':'아래'} (${l.d}%)\n`;});
  if(gcDc) text+=gcDc+'\n';
  if(srNote) text+=srNote+'\n';
  if(fullBull) text+='\n모든 이평선이 상승 정렬로 가장 강한 구조. 눌림목 매수 최적이며 MA20 지지 확인하며 보유. MA20 이탈 시 경고, MA60 이탈 시 추세 전환.';
  else if(bull) text+='\n단기·중기 정배열 상승 추세. MA120이 아직 뒤따라오지 못해 장기 전환 초기일 수 있습니다.';
  else if(fullBear) text+='\n모든 이평선이 하락 정렬로 가장 약한 구조. 반등이 나와도 모든 이평선이 저항. 매수 매우 위험.';
  else if(bear) text+='\n단기·중기 역배열 하락 추세. 반등이 MA20·MA60에서 막히기 쉽습니다.';
  else text+='\n이평선 뒤엉킴 — 추세 전환기. 방향 정리까지 관망 유리.';
  return {label:arr,tone,text,lines,gcDc,srNote};
};

// ════════════════════════════════════════════════════════════
//  7단계: 기본 정보 의미 해석 (S43 신규)
// ════════════════════════════════════════════════════════════
SXI.basicInfo = function(stock){
  if(!stock) return null;
  const res={};
  // mc는 억원 단위가 정상이나, 원단위가 들어올 수 있음 → 자동 정규화
  let mc=stock.marketCap||0;
  if(mc>100000000) mc = mc / 100000000; // 원→억 변환 (100억 이상이 원단위로 들어온 경우)
  const fmtMC = (v) => v>=10000 ? `${(v/10000).toFixed(1)}조` : v>=1 ? `${Math.round(v).toLocaleString()}억` : '정보 없음';
  if(mc>=100000) res.marketCap={text:`시총 ${fmtMC(mc)} — 국내 최대급 대형주. 유동성 풍부, 슬리피지 적음. 시장 전체 영향을 크게 받습니다.`};
  else if(mc>=10000) res.marketCap={text:`시총 ${fmtMC(mc)} — 대형주. 기관 관심 대상이며 안정성과 유동성 양호.`};
  else if(mc>=3000) res.marketCap={text:`시총 ${fmtMC(mc)} — 중형주. 개별 이슈에 민감하며 성장성과 밸류 균형이 중요.`};
  else if(mc>=500) res.marketCap={text:`시총 ${fmtMC(mc)} — 소형주. 변동성 크고 세력 급등락 빈번. 소액 분할 접근 필수.`};
  else if(mc>0) res.marketCap={text:`시총 ${fmtMC(mc)} — 초소형주. 극심한 변동성과 유동성 부족. 극소액만 투입하세요.`};
  else res.marketCap={text:'시총 정보 없음.'};

  // ta는 백만원 단위가 정상이나, 원단위가 들어올 수 있음 → 자동 정규화
  let ta=stock.tradeAmount||0;
  if(ta>1000000000) ta = ta / 1000000; // 원→백만원 변환
  const fmtTA = (v) => v>=1000000 ? `${(v/1000000).toFixed(1)}조` : v>=100 ? `${(v/100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}억` : v>=1 ? `${Math.round(v)}백만` : '정보 없음';
  if(ta>=100000) res.tradeAmount={text:`거래대금 ${fmtTA(ta)} — 시장 관심 집중. 체결 빠르고 슬리피지 거의 없음.`};
  else if(ta>=10000) res.tradeAmount={text:`거래대금 ${fmtTA(ta)} — 적정 수준. 일반 매매 지장 없음.`};
  else if(ta>=1000) res.tradeAmount={text:`거래대금 ${fmtTA(ta)} — 다소 적음. 분할 매매 필요.`};
  else if(ta>0) res.tradeAmount={text:`거래대금 ${fmtTA(ta)} — 매우 적음. 유동성 부족으로 체결 어려울 수 있음.`};
  else res.tradeAmount={text:'거래대금 정보 없음.'};

  const fr=stock.foreignRatio||0;
  if(fr>40) res.foreignRatio={text:`외국인 ${fr.toFixed(1)}% — 매우 높음. 글로벌 기관 참여, 재무 신뢰 높음. 외국인 순매도 전환 시 하방 압력 주의.`};
  else if(fr>20) res.foreignRatio={text:`외국인 ${fr.toFixed(1)}% — 양호. 밸류에이션 프리미엄 반영 가능.`};
  else if(fr>5) res.foreignRatio={text:`외국인 ${fr.toFixed(1)}% — 낮은 편. 국내 수급에 더 민감.`};
  else if(fr>0) res.foreignRatio={text:`외국인 ${fr.toFixed(1)}% — 매우 낮음. 개인 투자자 비중 높아 수급 변동성 큼.`};
  else res.foreignRatio={text:'외국인 지분 정보 없음.'};

  const cr=stock.changeRate||0;
  if(cr>=10) res.changeRate={text:`등락률 +${cr.toFixed(2)}% — 급등. 추격 매수 매우 위험. 다음 날 갭하락 빈번.`};
  else if(cr>=5) res.changeRate={text:`등락률 +${cr.toFixed(2)}% — 강한 상승. 거래량 동반 여부가 추세 판단의 열쇠.`};
  else if(cr>=2) res.changeRate={text:`등락률 +${cr.toFixed(2)}% — 양호한 상승. 건강한 추세에서 자주 보이는 수준.`};
  else if(cr>0) res.changeRate={text:`등락률 +${cr.toFixed(2)}% — 소폭 상승. 큰 방향성은 없음.`};
  else if(cr>-2) res.changeRate={text:`등락률 ${cr.toFixed(2)}% — 소폭 하락. 일상적 변동 범위.`};
  else if(cr>-5) res.changeRate={text:`등락률 ${cr.toFixed(2)}% — 약세. 지지선 확인 필요.`};
  else if(cr>-10) res.changeRate={text:`등락률 ${cr.toFixed(2)}% — 강한 하락. 손절 기준 점검하세요.`};
  else res.changeRate={text:`등락률 ${cr.toFixed(2)}% — 급락. 반등 기대보다 리스크 관리가 우선.`};
  return res;
};
