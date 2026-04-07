// ════════════════════════════════════════════════════════════
//  SX Chart Module v1.0 — S34
//  캔들차트 + MA(5/10/20/60/120) + BB + 거래량 + RSI + MACD
//  양봉=빨강, 음봉=파랑
// ════════════════════════════════════════════════════════════
const SXChart = (function(){
'use strict';

const BULL = '#e8365a';
const BEAR = '#3b82f6';
const MA_COLORS = {5:'#f59e0b',10:'#ef4444',20:'#3b82f6',60:'#a855f7',120:'#6b7280'};
const BB_FILL  = 'rgba(168,85,247,.06)';
const BB_EDGE  = 'rgba(168,85,247,.3)';
const BB_MID   = 'rgba(168,85,247,.45)';
const VOL_BULL = 'rgba(232,54,90,.45)';
const VOL_BEAR = 'rgba(59,130,246,.45)';
const RSI_COLOR = '#f59e0b';
const MACD_COLOR = '#3b82f6';
const SIG_COLOR  = '#ef4444';
const HIST_P = 'rgba(232,54,90,.5)';
const HIST_N = 'rgba(59,130,246,.5)';
const GRID = 'rgba(128,128,128,.12)';
const TXT = '#888';

/* ── 계산 유틸 ── */
function sma(arr,p){const r=[];for(let i=0;i<arr.length;i++){if(i<p-1){r.push(null);continue;}let s=0;for(let j=i-p+1;j<=i;j++)s+=arr[j];r.push(s/p);}return r;}
function ema(arr,p){const r=[],k=2/(p+1);for(let i=0;i<arr.length;i++){if(i===0)r.push(arr[0]);else r.push(arr[i]*k+r[i-1]*(1-k));}return r;}
function calcBB(c,p,m){p=p||20;m=m||2;const mid=sma(c,p),u=[],l=[];for(let i=0;i<c.length;i++){if(mid[i]==null){u.push(null);l.push(null);continue;}let s=0;for(let j=i-p+1;j<=i;j++)s+=(c[j]-mid[i])**2;const sd=Math.sqrt(s/p);u.push(mid[i]+m*sd);l.push(mid[i]-m*sd);}return{mid:mid,upper:u,lower:l};}
function calcRSI(c,p){p=p||14;const r=[];let ag=0,al=0;for(let i=0;i<c.length;i++){if(i===0){r.push(50);continue;}const d=c[i]-c[i-1],g=d>0?d:0,lo=d<0?-d:0;if(i<=p){ag+=g/p;al+=lo/p;r.push(i===p?(al===0?100:100-100/(1+ag/al)):50);}else{ag=(ag*(p-1)+g)/p;al=(al*(p-1)+lo)/p;r.push(al===0?100:100-100/(1+ag/al));}}return r;}
function calcMACD(c,f,s,sig){f=f||12;s=s||26;sig=sig||9;const fast=ema(c,f),slow=ema(c,s),m=fast.map(function(v,i){return v-slow[i];}),sl=ema(m,sig),h=m.map(function(v,i){return v-sl[i];});return{macd:m,signal:sl,hist:h};}

/* ── 캔버스 셋업 ── */
function setupCanvas(canvas, w, h){
  // getBoundingClientRect로 실제 렌더링 크기 읽기 (시그널랩 방식)
  var rect = canvas.getBoundingClientRect();
  var rw = Math.round(rect.width);
  var rh = Math.round(rect.height);
  if(rw > 10) w = rw;
  if(rh > 10) h = rh;
  if(!w || w<10) w = 360;
  if(!h || h<10) h = 160;
  var dpr = window.devicePixelRatio||1;
  canvas.width = Math.round(w*dpr);
  canvas.height = Math.round(h*dpr);
  canvas.style.width = w+'px';
  canvas.style.height = h+'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  // 흰색 배경 먼저 칠하기
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,w,h);
  return ctx;
}

/* ── 그리드 + 가격 라벨 ── */
function drawGrid(ctx, pad, W, H, lo, hi, lines){
  lines = lines||4;
  ctx.strokeStyle = GRID; ctx.lineWidth = 0.5;
  ctx.fillStyle = TXT; ctx.font = '8px Outfit,sans-serif'; ctx.textAlign = 'right';
  var range = hi-lo||1;
  for(var i=0;i<=lines;i++){
    var v = lo + range * (1 - i/lines);
    var y = pad.t + (i/lines) * (H - pad.t - pad.b);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y); ctx.stroke();
    ctx.fillText(v>=1000?Math.round(v).toLocaleString():v.toFixed(1), W-3, y+3);
  }
}

/* ── 라인 그리기 ── */
function drawLine(ctx, vals, pad, cw, yFn, color, lw, startIdx){
  if(!vals||vals.length<2) return;
  lw = lw||0.8; startIdx = startIdx||0;
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=lw;
  var started=false;
  for(var i=0;i<vals.length;i++){
    if(vals[i]==null){started=false;continue;}
    var x=pad.l+(startIdx+i)*cw+cw/2, y=yFn(vals[i]);
    if(!started){ctx.moveTo(x,y);started=true;} else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

/* ── BB 채우기 ── */
function drawBBFill(ctx, bb, pad, cw, yFn){
  var upper=bb.upper, lower=bb.lower, mid=bb.mid;
  ctx.beginPath(); ctx.fillStyle=BB_FILL;
  var started=false;
  for(var i=0;i<upper.length;i++){
    if(upper[i]==null) continue;
    var x=pad.l+i*cw+cw/2;
    if(!started){ctx.moveTo(x,yFn(upper[i]));started=true;} else ctx.lineTo(x,yFn(upper[i]));
  }
  for(var i=upper.length-1;i>=0;i--){
    if(lower[i]==null) continue;
    var x=pad.l+i*cw+cw/2;
    ctx.lineTo(x,yFn(lower[i]));
  }
  ctx.closePath(); ctx.fill();
  drawLine(ctx, upper, pad, cw, yFn, BB_EDGE, 0.6);
  drawLine(ctx, lower, pad, cw, yFn, BB_EDGE, 0.6);
  drawLine(ctx, mid, pad, cw, yFn, BB_MID, 0.6);
}

/* ── 캔들 그리기 공통 (양봉=빨강꽉참, 음봉=파랑꽉참) ── */
function drawCandles(ctx, data, pad, cw, yFn, thick){
  thick = thick||false;
  data.forEach(function(d,i){
    var x=pad.l+i*cw+cw/2;
    var bull=d.close>=d.open;
    var col=bull?BULL:BEAR;
    // wick
    ctx.strokeStyle=col; ctx.lineWidth=thick?0.8:0.7;
    ctx.beginPath(); ctx.moveTo(x,yFn(d.high)); ctx.lineTo(x,yFn(d.low)); ctx.stroke();
    // body (양봉/음봉 모두 꽉 채움)
    var bTop=yFn(Math.max(d.open,d.close)), bBot=yFn(Math.min(d.open,d.close));
    var bH=Math.max(bBot-bTop, thick?1:0.8), bw=Math.max(cw*(thick?0.62:0.55), thick?2:1);
    ctx.fillStyle=col;
    ctx.fillRect(x-bw/2,bTop,bw,bH);
    // 테두리
    ctx.strokeStyle=bull?'#cc2244':'#2563eb'; ctx.lineWidth=0.5;
    ctx.strokeRect(x-bw/2,bTop,bw,bH);
  });
}

/* ── MA 범례 ── */
function drawMALegend(ctx, closes, pad, H, fontSize){
  ctx.font=(fontSize||8)+'px Outfit,sans-serif';
  var lx=pad.l+2;
  var ly=H-3;
  [5,10,20,60,120].forEach(function(p){
    if(closes.length<p) return;
    ctx.fillStyle=MA_COLORS[p];
    ctx.fillText('MA'+p, lx, ly);
    lx+=ctx.measureText('MA'+p).width+5;
  });
  ctx.fillStyle=BB_MID;
  ctx.fillText('BB', lx, ly);
}

/* ════════════════════════════════════════════════════════════
   미니 차트 (분석탭 상단 — 클릭 시 풀차트 열림)
   ════════════════════════════════════════════════════════════ */
function drawMini(canvasId, rows){
  var canvas = document.getElementById(canvasId);
  if(!canvas) return;
  var rect=canvas.getBoundingClientRect(); var W=Math.round(rect.width)||360;
  var H = 160;
  var ctx = setupCanvas(canvas, W, H);


  var data = rows.slice(-60);
  if(data.length<5) return;

  var pad = {t:6,b:18,l:8,r:42};
  var cw = (W-pad.l-pad.r)/data.length;
  var closes = data.map(function(d){return d.close;});
  var allV = data.flatMap(function(d){return [d.high,d.low];});

  var bb = calcBB(closes, 20, 2);
  bb.upper.forEach(function(v){if(v!=null) allV.push(v);});
  bb.lower.forEach(function(v){if(v!=null) allV.push(v);});

  var hi=Math.max.apply(null,allV), lo=Math.min.apply(null,allV);
  var range=hi-lo||1;
  var yFn=function(v){return pad.t+(hi-v)/range*(H-pad.t-pad.b);};

  drawGrid(ctx, pad, W, H, lo, hi, 3);
  drawBBFill(ctx, bb, pad, cw, yFn);
  drawCandles(ctx, data, pad, cw, yFn, false);

  [5,10,20,60,120].forEach(function(p){
    if(data.length<p) return;
    drawLine(ctx, sma(closes,p), pad, cw, yFn, MA_COLORS[p], 0.8);
  });

  drawMALegend(ctx, closes, pad, H, 8);
}

/* ════════════════════════════════════════════════════════════
   풀 차트 오버레이 (캔들 + 거래량 + RSI + MACD)
   ════════════════════════════════════════════════════════════ */
function openFull(rows, stockName){
  if(!rows||rows.length<10) return;

  var ov = document.getElementById('sxChartOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'sxChartOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:500;display:flex;flex-direction:column;overflow:hidden';
    document.body.appendChild(ov);
  }
  ov.style.display = 'flex';

  var data = rows.slice(-60);
  var closes = data.map(function(d){return d.close;});
  var rsiArr = calcRSI(closes, 14);
  var macdObj = calcMACD(closes, 12, 26, 9);
  var bb = calcBB(closes, 20, 2);

  history.pushState({view:'sxchart'},'');

  ov.innerHTML =
    '<div style="display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid #e5e7eb;flex-shrink:0;background:#fff">' +
      '<button onclick="SXChart.closeFull()" style="border:none;background:none;font-size:16px;cursor:pointer;color:#333;padding:4px 8px">\u2039</button>' +
      '<span style="font-size:13px;font-weight:700;flex:1;text-align:center;color:#333">' + (stockName||'') + ' 상세 차트</span>' +
      '<span style="width:32px"></span>' +
    '</div>' +
    '<div style="flex:1;overflow-y:auto;padding:10px 10px 20px;background:#fff" id="sxChartBody">' +
      '<div style="font-size:10px;font-weight:600;color:#888;margin-bottom:4px">캔들 + MA + BB (최근 ' + data.length + '봉)</div>' +
      '<canvas id="sxFullCandle" style="width:100%;height:240px;display:block;background:#fff;border:1px solid #e5e7eb;border-radius:8px"></canvas>' +
      '<div style="font-size:10px;font-weight:600;color:#888;margin:12px 0 4px">거래량</div>' +
      '<canvas id="sxFullVol" style="width:100%;height:70px;display:block;background:#fff;border:1px solid #e5e7eb;border-radius:8px"></canvas>' +
      '<div style="font-size:10px;font-weight:600;color:#888;margin:12px 0 4px">RSI (14)</div>' +
      '<canvas id="sxFullRSI" style="width:100%;height:90px;display:block;background:#fff;border:1px solid #e5e7eb;border-radius:8px"></canvas>' +
      '<div style="font-size:10px;font-weight:600;color:#888;margin:12px 0 4px">MACD (12, 26, 9)</div>' +
      '<canvas id="sxFullMACD" style="width:100%;height:90px;display:block;background:#fff;border:1px solid #e5e7eb;border-radius:8px"></canvas>' +
    '</div>';

  setTimeout(function(){
    _drawFullCandle('sxFullCandle', data, closes, bb, 240);
    _drawFullVolume('sxFullVol', data, 70);
    _drawFullRSI('sxFullRSI', rsiArr, 90);
    _drawFullMACD('sxFullMACD', macdObj, 90);
  }, 80);
}

function closeFull(){
  var ov = document.getElementById('sxChartOverlay');
  if(ov && ov.style.display!=='none'){
    ov.style.display='none';
    // popstate에서 이미 닫혀있으므로 skip됨
    try{ history.back(); }catch(e){}
  }
}

/* ── 풀차트: 캔들 + MA + BB ── */
function _drawFullCandle(id, data, closes, bb, H){
  var canvas = document.getElementById(id);
  if(!canvas) return;
  var rect=canvas.getBoundingClientRect(); var W=Math.round(rect.width)||360;
  var ctx = setupCanvas(canvas, W, H);

  var pad = {t:8,b:20,l:8,r:42};
  var cw = (W-pad.l-pad.r)/data.length;

  var allV = data.flatMap(function(d){return [d.high,d.low];});
  bb.upper.forEach(function(v){if(v!=null) allV.push(v);});
  bb.lower.forEach(function(v){if(v!=null) allV.push(v);});
  var hi=Math.max.apply(null,allV), lo=Math.min.apply(null,allV);
  var range=hi-lo||1;
  var yFn=function(v){return pad.t+(hi-v)/range*(H-pad.t-pad.b);};

  drawGrid(ctx, pad, W, H, lo, hi, 4);
  drawBBFill(ctx, bb, pad, cw, yFn);
  drawCandles(ctx, data, pad, cw, yFn, true);

  [5,10,20,60,120].forEach(function(p){
    if(closes.length<p) return;
    drawLine(ctx, sma(closes,p), pad, cw, yFn, MA_COLORS[p], 1);
  });

  drawMALegend(ctx, closes, pad, H, 9);
}

/* ── 풀차트: 거래량 ── */
function _drawFullVolume(id, data, H){
  var canvas = document.getElementById(id);
  if(!canvas) return;
  var rect=canvas.getBoundingClientRect(); var W=Math.round(rect.width)||360;
  var ctx = setupCanvas(canvas, W, H);

  var pad = {t:4,b:4,l:8,r:42};
  var cw = (W-pad.l-pad.r)/data.length;
  var maxVol = Math.max.apply(null, data.map(function(d){return d.volume;}))||1;
  var chartH = H-pad.t-pad.b;

  var vols = data.map(function(d){return d.volume;});
  var volMA = sma(vols, 20);

  data.forEach(function(d,i){
    var x=pad.l+i*cw;
    var bw=Math.max(cw*0.65,1);
    var h=(d.volume/maxVol)*chartH;
    ctx.fillStyle=d.close>=d.open?VOL_BULL:VOL_BEAR;
    ctx.fillRect(x+(cw-bw)/2, H-pad.b-h, bw, h);
  });

  drawLine(ctx, volMA, pad, cw, function(v){return H-pad.b-(v/maxVol)*chartH;}, '#f59e0b', 0.8);

  ctx.font='8px Outfit,sans-serif'; ctx.fillStyle=TXT; ctx.textAlign='right';
  ctx.fillText(maxVol>=1e6?(maxVol/1e6).toFixed(0)+'M':maxVol>=1e3?(maxVol/1e3).toFixed(0)+'K':maxVol.toFixed(0), W-3, pad.t+8);
}

/* ── 풀차트: RSI ── */
function _drawFullRSI(id, rsiArr, H){
  var canvas = document.getElementById(id);
  if(!canvas) return;
  var rect=canvas.getBoundingClientRect(); var W=Math.round(rect.width)||360;
  var ctx = setupCanvas(canvas, W, H);

  var pad = {t:8,b:12,l:8,r:42};
  var cw = (W-pad.l-pad.r)/rsiArr.length;
  var chartH = H-pad.t-pad.b;
  var yFn = function(v){return pad.t+(100-v)/100*chartH;};

  ctx.fillStyle='rgba(232,54,90,.04)';
  ctx.fillRect(pad.l, yFn(100), W-pad.l-pad.r, yFn(70)-yFn(100));
  ctx.fillStyle='rgba(59,130,246,.04)';
  ctx.fillRect(pad.l, yFn(30), W-pad.l-pad.r, yFn(0)-yFn(30));

  [70,50,30].forEach(function(v){
    ctx.strokeStyle=GRID; ctx.lineWidth=0.5; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(pad.l,yFn(v)); ctx.lineTo(W-pad.r,yFn(v)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=TXT; ctx.font='8px Outfit,sans-serif'; ctx.textAlign='right';
    ctx.fillText(v, W-3, yFn(v)+3);
  });

  drawLine(ctx, rsiArr, pad, cw, yFn, RSI_COLOR, 1.2);

  var last = rsiArr[rsiArr.length-1];
  if(last!=null){
    ctx.fillStyle=last>70?BULL:last<30?BEAR:RSI_COLOR;
    ctx.font='bold 9px Outfit,sans-serif'; ctx.textAlign='left';
    ctx.fillText(last.toFixed(1), pad.l+4, pad.t+10);
  }
}

/* ── 풀차트: MACD ── */
function _drawFullMACD(id, macdObj, H){
  var canvas = document.getElementById(id);
  if(!canvas) return;
  var rect=canvas.getBoundingClientRect(); var W=Math.round(rect.width)||360;
  var ctx = setupCanvas(canvas, W, H);

  var pad = {t:8,b:14,l:8,r:42};
  var macd=macdObj.macd, signal=macdObj.signal, hist=macdObj.hist;
  var cw = (W-pad.l-pad.r)/macd.length;

  var allV = macd.concat(signal,hist).filter(function(v){return v!=null&&isFinite(v);});
  var hi=Math.max.apply(null,allV), lo=Math.min.apply(null,allV);
  var absMax=Math.max(Math.abs(hi),Math.abs(lo))||1;
  var chartH=H-pad.t-pad.b;
  var yFn=function(v){return pad.t+chartH/2-(v/absMax)*(chartH/2);};

  ctx.strokeStyle=GRID; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.moveTo(pad.l,yFn(0)); ctx.lineTo(W-pad.r,yFn(0)); ctx.stroke();

  hist.forEach(function(v,i){
    if(v==null||!isFinite(v)) return;
    var x=pad.l+i*cw;
    var bw=Math.max(cw*0.5,1);
    var y0=yFn(0), y1=yFn(v);
    ctx.fillStyle=v>=0?HIST_P:HIST_N;
    ctx.fillRect(x+(cw-bw)/2, Math.min(y0,y1), bw, Math.abs(y1-y0)||0.5);
  });

  drawLine(ctx, macd, pad, cw, yFn, MACD_COLOR, 1);
  drawLine(ctx, signal, pad, cw, yFn, SIG_COLOR, 1);

  ctx.font='8px Outfit,sans-serif';
  ctx.fillStyle=MACD_COLOR; ctx.fillText('MACD', pad.l+4, H-3);
  ctx.fillStyle=SIG_COLOR; ctx.fillText('Signal', pad.l+34, H-3);

  ctx.fillStyle=TXT; ctx.textAlign='right'; ctx.font='8px Outfit,sans-serif';
  ctx.fillText(absMax.toFixed(1), W-3, pad.t+8);
  ctx.fillText((-absMax).toFixed(1), W-3, H-pad.b-2);
}

/* popstate는 sx_screener.html에서 통합 처리 */

return { drawMini: drawMini, openFull: openFull, closeFull: closeFull };
})();
