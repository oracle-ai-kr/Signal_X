// ════════════════════════════════════════════════════════════
//  SIGNAL X — Interpret Engine v2.2
//  지표별 해석 + 복합상황 해석 + 종합평(행동가이드) 생성
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

// ── 고급 분석 해석 (기존 보강) ──

SXI.pullback = function(score){
  if(score==null) return null;
  const s=+score;
  if(s>=70) return {label:'눌림목 매수 적기',tone:'bullish',text:'상승 추세 안에서 조정이 충분히 진행됐습니다. 이평선 지지와 과매도 조건이 겹치는 자리로, 분할 매수를 고려할 만합니다. MA20을 깨고 내려가면 이 해석은 무효가 됩니다.'};
  if(s>=50) return {label:'눌림목 관심',tone:'neutral',text:'조정이 진행 중이지만 아직 최적 타이밍은 아닙니다. 좀 더 눌려서 지지선을 확인한 뒤 접근해도 늦지 않습니다.'};
  if(s>=30) return {label:'눌림목 약함',tone:'neutral',text:'눌림목 조건이 일부만 갖춰진 상태입니다. 추세가 강하지 않거나 조정이 아직 부족합니다.'};
  return {label:'해당없음',tone:'neutral',text:'현재 눌림목 매수 조건에는 해당하지 않습니다.'};
};

SXI.swingStruct = function(higherHighs, lowerLows){
  if(higherHighs && !lowerLows) return {label:'상승 구조 (HH+HL)',tone:'bullish',text:'고점과 저점이 모두 높아지는 상승 구조입니다. 눌림이 오면 직전 저점에서 지지되는지가 핵심이고, 저점이 깨지면 구조가 무너진 것으로 봐야 합니다.'};
  if(higherHighs && lowerLows) return {label:'확산형',tone:'warning',text:'고점은 높아지는데 저점도 낮아지는 확산형입니다. 변동성이 커지고 있고 방향이 불분명하니 비중 조절에 신경 쓸 때입니다.'};
  if(!higherHighs && lowerLows) return {label:'하락 구조 (LH+LL)',tone:'bearish',text:'저점이 계속 내려가는 하락 구조입니다. 반등이 나와도 고점을 넘기 전까지는 추세 전환으로 보기 어렵습니다.'};
  return {label:'횡보 구조',tone:'neutral',text:'뚜렷한 고저점 패턴 없이 옆으로 움직이고 있습니다. 방향이 정해질 때까지 기다리는 게 유리합니다.'};
};

SXI.maConvergence = function(converging, spread){
  if(converging==null) return null;
  if(converging) return {label:'수렴 중',tone:'neutral',text:`이평선들이 모이고 있습니다(분산 ${(+spread).toFixed(1)}%). 방향이 정해지면 빠르게 움직일 수 있는 구간이니 돌파 방향을 눈여겨보세요.`};
  if(+spread>5) return {label:'크게 벌어짐',tone:'warning',text:`이평선 간격이 넓습니다(분산 ${(+spread).toFixed(1)}%). 추세가 과열됐을 수 있고, 평균으로 되돌아가려는 힘이 작용할 수 있습니다.`};
  return {label:'보통',tone:'neutral',text:`이평선 분산 ${(+spread).toFixed(1)}%로 정상 범위입니다.`};
};

SXI.vwap = function(position, pct){
  if(!position) return null;
  const p = pct!=null?(+pct).toFixed(1):'';
  if(position==='above_far') return {label:'VWAP 크게 상회',tone:'warning',text:`가격이 단기 평균 매입단가를 ${p}% 상회하고 있습니다. 차익실현 매물이 나올 수 있는 과열 구간이며, 추격보다 눌림 확인 후 접근이 유리합니다.`};
  if(position==='above') return {label:'VWAP 상회',tone:'bullish',text:'가격이 단기 평균 매입단가 위에서 유지되고 있습니다. 단기 수급은 매수 우위로 해석할 수 있으며, 눌림이 나오더라도 VWAP 부근이 1차 지지 역할을 할 수 있습니다.'};
  if(position==='near') return {label:'VWAP 공방',tone:'neutral',text:'가격이 VWAP 부근에서 매수/매도 공방 중입니다. 방향성이 확정되지 않은 자리이므로 돌파 또는 이탈 확인이 우선입니다.'};
  if(position==='below') return {label:'VWAP 하회',tone:'bearish',text:'가격이 단기 평균 매입단가 아래에 위치합니다. 단기 반등이 나오더라도 VWAP가 저항으로 작용할 수 있어 추격 매수는 보수적으로 봐야 합니다.'};
  return {label:'VWAP 크게 하회',tone:'danger',text:`가격이 단기 평균 매입단가를 ${p?Math.abs(+p).toFixed(1)+'% ':'크게 '}하회하고 있습니다. 매도 압력이 강한 구간이며, 반등이 나오더라도 VWAP 자체가 저항이 될 수 있습니다.`};
};

SXI.ichimoku = function(priceVsCloud, cloud, signal){
  if(!priceVsCloud) return null;
  if(priceVsCloud==='above' && cloud==='bullish') return {label:'구름 위 (양운)',tone:'bullish',text:'가격이 구름 위에 있고 전환선이 기준선 위에 있어 중기 추세 우위가 유지됩니다. 다만 구름 상단과 괴리가 커질수록 단기 되돌림 가능성도 함께 봐야 합니다.'};
  if(priceVsCloud==='above') return {label:'구름 위',tone:'bullish',text:'가격이 구름 위에 있어 중기 기준 상승 추세입니다. 구름이 얇아지거나 음운 전환 시 주의가 필요합니다.'};
  if(priceVsCloud==='inside') return {label:'구름 안',tone:'neutral',text:'가격이 구름 안에 갇혀 있어 방향이 정해지지 않은 구간입니다. 구름 상단 돌파 시 상승 전환, 하단 이탈 시 하락 가속으로 볼 수 있으니 돌파 방향을 기다리는 것이 안전합니다.'};
  if(priceVsCloud==='below' && cloud==='bearish') return {label:'구름 아래 (음운)',tone:'danger',text:'가격이 음운(하락 구름) 아래로 가장 약한 상태입니다. 구름이 두꺼운 저항으로 작용하여 반등 폭이 제한될 수 있습니다.'};
  return {label:'구름 아래',tone:'bearish',text:'가격이 구름 아래에 있어 하락 추세입니다. 구름 돌파 전까지 매수는 위험합니다.'};
};

SXI.regime = function(label, direction, adx){
  if(!label) return null;
  const T = {'추세+변동':'추세가 있으면서 변동성도 높은 구간입니다. 방향이 맞으면 수익이 빠르지만, 틀리면 손실도 빨라 비중 조절이 핵심입니다.','추세장':'뚜렷한 추세가 진행 중입니다. 추세를 따라가는 포지션이 유리하고, 역방향 매매는 위험합니다.','횡보장':'방향 없이 옆으로 움직이는 구간입니다. 추세 추종보다 박스권 매매가 더 맞는 환경입니다.','전환기':'추세가 바뀌고 있는 과도기입니다. 기존 포지션을 정리하고 새 방향이 확인될 때까지 지켜보는 게 낫습니다.'};
  return {label, tone:direction==='UP'?'bullish':direction==='DOWN'?'bearish':'neutral', text:T[label]||'시장 상태를 분석 중입니다.'};
};

// ════════════════════════════════════════════════════════════
//  1단계-B: 신규 단건 해석 함수 (v2.0)
// ════════════════════════════════════════════════════════════

SXI.priceChannel = function(position, upper, lower, price){
  if(!position) return null;
  const pFmt = (v)=> v!=null ? (+v).toLocaleString() : '';
  if(position==='breakout_up') return {label:'채널 상단 돌파',tone:'bullish',text:`가격(${pFmt(price)})이 최근 가격 범위 상단(${pFmt(upper)})을 돌파했습니다. 추세 가속 신호이며, 거래량 동반 시 신뢰도가 높아집니다. 돌파 직후 되돌림 여부를 확인하세요.`};
  if(position==='breakout_down') return {label:'채널 하단 이탈',tone:'danger',text:`가격(${pFmt(price)})이 최근 가격 범위 하단(${pFmt(lower)})을 이탈했습니다. 하락 가속 위험이 있으며, 보유 중이면 손절 기준을 점검하세요.`};
  if(position==='upper_half') return {label:'채널 상단권',tone:'warning',text:`가격이 최근 가격 범위(${pFmt(lower)}~${pFmt(upper)}) 상단권에 위치합니다. 돌파 확인 전까지는 추격보다 확인 접근이 유리합니다.`};
  if(position==='lower_half') return {label:'채널 하단권',tone:'bullish',text:`가격이 최근 가격 범위(${pFmt(lower)}~${pFmt(upper)}) 하단권에 위치합니다. 지지 확인 시 반등 시도 구간으로 볼 수 있으나, 이탈 시 추가 약세가 열립니다.`};
  return {label:'채널 중간',tone:'neutral',text:'최근 가격 범위 중간 부근으로 특별한 위치 신호는 없습니다.'};
};

SXI.pivot = function(level, P, R1, S1, price){
  if(!level || level==='none') return null;
  const pFmt = (v)=> v!=null ? (+v).toLocaleString() : '';
  if(level==='R2+') return {label:'피벗 R2 이상',tone:'warning',text:`가격(${pFmt(price)})이 피벗 R2 이상에 위치해 단기 과열 구간입니다. 추격 진입보다 눌림 확인이 유리합니다. 피벗(${pFmt(P)}).`};
  if(level==='R1~R2') return {label:'피벗 R1~R2',tone:'bullish',text:`가격이 피벗(${pFmt(P)})과 R1(${pFmt(R1)}) 위에 있어 단기 매수 우위입니다. R2 돌파 시 추세 가속, 실패 시 R1 지지 여부가 핵심입니다.`};
  if(level==='P~R1') return {label:'피벗~R1',tone:'bullish',text:`가격이 피벗(${pFmt(P)}) 위에서 R1(${pFmt(R1)})을 향하고 있어 약한 매수 우위입니다. 피벗 이탈 시 약세 전환에 유의하세요.`};
  if(level==='S1~P') return {label:'S1~피벗',tone:'neutral',text:`가격이 피벗(${pFmt(P)}) 아래로 내려왔지만 S1(${pFmt(S1)}) 위에서 지지를 받고 있습니다. 피벗 회복 시 매수 신호, S1 이탈 시 추가 하락에 유의하세요.`};
  if(level==='S1~S2') return {label:'피벗 S1~S2',tone:'bearish',text:`가격이 S1(${pFmt(S1)}) 아래로 하락해 단기 기준 약세 우위입니다. 추가 하락 가능성이 있으며 보수적 접근이 필요합니다.`};
  if(level==='S2-') return {label:'피벗 S2 이하',tone:'danger',text:`가격(${pFmt(price)})이 피벗 S2 이하로 크게 하락한 상태입니다. 극단적 약세 구간이며, 반등이 나오더라도 상단 피벗이 저항으로 작용할 수 있습니다.`};
  return {label:'피벗 근처',tone:'neutral',text:'현재가가 피벗 부근으로 방향 결정 전 단계입니다.'};
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
  if(primary>8) return {label:'MA 크게 과열',tone:'danger',text:`이동평균선 대비 괴리가 크게 벌어졌습니다(${dtxt}). 추세는 강할 수 있지만 신규 진입 기준으로는 과열 부담이 큽니다.`};
  if(primary>4) return {label:'MA 과열',tone:'warning',text:`이동평균선 대비 괴리가 벌어지고 있습니다(${dtxt}). 추세가 살아 있다면 가속이지만, 조정 시 되돌림 폭도 커질 수 있습니다.`};
  if(primary<-8) return {label:'MA 크게 이격',tone:'bullish',text:`이동평균선 대비 하방 괴리가 매우 큽니다(${dtxt}). 기술적 반등 가능성이 높지만 추세 확인이 필요합니다.`};
  if(primary<-4) return {label:'MA 눌림',tone:'neutral',text:`이동평균선과의 괴리가 줄어드는 중입니다(${dtxt}). 추세가 살아 있다면 눌림목 성격으로 볼 수 있습니다.`};
  return {label:'MA 이격 보통',tone:'neutral',text:`이동평균선과의 괴리가 정상 범위입니다(${dtxt}).`};
};

SXI.volumeMA = function(volRatio){
  if(volRatio==null) return null;
  const r=+volRatio;
  if(r>=3) return {label:'거래량 폭발',tone:'bullish',text:`거래량이 평균의 ${r.toFixed(1)}배로 급증했습니다. 세력이 움직이고 있을 수 있으니, 가격 방향과 같은지 꼭 확인하세요.`};
  if(r>=1.5) return {label:'거래량 증가',tone:'bullish',text:'거래량이 평균을 넘어서고 있어 현재 움직임에 힘이 실리고 있습니다.'};
  if(r>=0.7) return {label:'거래량 보통',tone:'neutral',text:'거래량이 평균 수준이라 특별한 신호는 보이지 않습니다.'};
  return {label:'거래량 감소',tone:'neutral',text:'거래량이 평균보다 적어 돌파나 전환의 신뢰도가 떨어질 수 있습니다.'};
};

SXI.adLine = function(trend, div){
  if(!trend) return null;
  if(div==='bullish') return {label:'A/D 상승 다이버전스',tone:'bullish',text:'가격은 조정을 받았지만 종가 기준 수급은 오히려 개선되고 있어, 누군가 조용히 모으고 있을 가능성이 있습니다.'};
  if(div==='bearish') return {label:'A/D 하락 다이버전스',tone:'warning',text:'A/D 라인이 꺾이면서 물량이 빠져나가는 조짐이 보입니다. 고점권이라면 차익 실현 매물에 주의할 필요가 있습니다.'};
  if(trend==='up') return {label:'A/D 상승',tone:'bullish',text:'A/D 라인이 올라가고 있어 종가 기준으로 매수세가 우위입니다. 가격이 횡보하더라도 내부 수급은 개선 중일 수 있습니다.'};
  if(trend==='down') return {label:'A/D 하락',tone:'bearish',text:'A/D 라인이 내려가며 물량이 빠지는 흐름입니다.'};
  return {label:'A/D 보합',tone:'neutral',text:'A/D 라인이 횡보 중이라 뚜렷한 수급 방향이 보이지 않습니다.'};
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
SXI.version = '2.2';

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
  const mc=stock.marketCap||0;
  if(mc>=100000) res.marketCap={text:`시총 ${(mc/10000).toFixed(1)}조 — 국내 최대급 대형주. 유동성 풍부, 슬리피지 적음. 시장 전체 영향을 크게 받습니다.`};
  else if(mc>=10000) res.marketCap={text:`시총 ${(mc/10000).toFixed(1)}조 — 대형주. 기관 관심 대상이며 안정성과 유동성 양호.`};
  else if(mc>=3000) res.marketCap={text:`시총 ${mc.toLocaleString()}억 — 중형주. 개별 이슈에 민감하며 성장성과 밸류 균형이 중요.`};
  else if(mc>=500) res.marketCap={text:`시총 ${mc.toLocaleString()}억 — 소형주. 변동성 크고 세력 급등락 빈번. 소액 분할 접근 필수.`};
  else if(mc>0) res.marketCap={text:`시총 ${mc.toLocaleString()}억 — 초소형주. 극심한 변동성과 유동성 부족. 극소액만 투입하세요.`};
  else res.marketCap={text:'시총 정보 없음.'};

  const ta=stock.tradeAmount||0;
  if(ta>=100000) res.tradeAmount={text:`거래대금 ${(ta/10000).toFixed(0)}억+ — 시장 관심 집중. 체결 빠르고 슬리피지 거의 없음.`};
  else if(ta>=10000) res.tradeAmount={text:`거래대금 ${(ta/10000).toFixed(1)}억 — 적정 수준. 일반 매매 지장 없음.`};
  else if(ta>=1000) res.tradeAmount={text:`거래대금 ${(ta/10000).toFixed(1)}억 — 다소 적음. 분할 매매 필요.`};
  else if(ta>0) res.tradeAmount={text:`거래대금 ${(ta/10000).toFixed(2)}억 — 매우 적음. 유동성 부족으로 체결 어려울 수 있음.`};
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
