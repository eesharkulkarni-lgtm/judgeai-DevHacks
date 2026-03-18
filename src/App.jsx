import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const UP = "#10b981";
const DN = "#ef4444";
const AC = "#38bdf8";
const AM = "#f59e0b";

const SYMS = ["AAPL","TSLA","NVDA","MSFT","AMZN","META","SPY","BTC-USD"];

const SEED = {
  "AAPL":    { name:"Apple Inc.",        exch:"NASDAQ", sector:"Technology",    mc:"3.28T", pe:28.4, pb:8.2,  eps:6.43,  roe:"28.4%", div:"0.52%", de:1.45, bv:4.84,  price:213.49, vol:0.014, trend: 0.00020, h52:237.23, l52:164.08, avgVol:"62.4M" },
  "TSLA":    { name:"Tesla Inc.",         exch:"NASDAQ", sector:"EV / Auto",     mc:"793B",  pe:62.1, pb:12.4, eps:3.62,  roe:"13.2%", div:"0.00%", de:0.18, bv:19.48, price:248.71, vol:0.028, trend:-0.00030, h52:358.64, l52:138.80, avgVol:"98.1M" },
  "NVDA":    { name:"NVIDIA Corp.",       exch:"NASDAQ", sector:"Semiconductors",mc:"2.15T", pe:55.2, pb:42.1, eps:15.97, roe:"91.4%", div:"0.03%", de:0.41, bv:20.53, price:875.40, vol:0.022, trend: 0.00050, h52:974.00, l52:430.12, avgVol:"41.2M" },
  "MSFT":    { name:"Microsoft Corp.",    exch:"NASDAQ", sector:"Technology",    mc:"3.09T", pe:34.2, pb:13.1, eps:12.07, roe:"38.5%", div:"0.72%", de:0.31, bv:37.18, price:415.22, vol:0.012, trend: 0.00030, h52:468.35, l52:362.90, avgVol:"21.3M" },
  "AMZN":    { name:"Amazon.com Inc.",    exch:"NASDAQ", sector:"E-Commerce",    mc:"2.02T", pe:42.8, pb:9.4,  eps:4.89,  roe:"22.1%", div:"0.00%", de:0.72, bv:20.34, price:192.45, vol:0.016, trend: 0.00030, h52:230.25, l52:151.61, avgVol:"35.8M" },
  "META":    { name:"Meta Platforms",     exch:"NASDAQ", sector:"Technology",    mc:"1.31T", pe:24.8, pb:7.1,  eps:19.24, roe:"34.2%", div:"0.36%", de:0.13, bv:67.40, price:512.33, vol:0.016, trend: 0.00040, h52:589.69, l52:274.38, avgVol:"14.8M" },
  "SPY":     { name:"S&P 500 ETF",        exch:"NYSE",   sector:"ETF",           mc:"—",    pe:22.1, pb:4.8,  eps:18.94, roe:"—",    div:"1.24%", de:"—",  bv:"—",   price:524.18, vol:0.010, trend: 0.00020, h52:541.03, l52:410.44, avgVol:"82.3M" },
  "BTC-USD": { name:"Bitcoin / USD",      exch:"CRYPTO", sector:"Crypto",        mc:"1.33T", pe:"—",  pb:"—",  eps:"—",   roe:"—",    div:"—",    de:"—",  bv:"—",   price:67420,  vol:0.032, trend: 0.00040, h52:73780,  l52:38500,  avgVol:"$28.4B"},
};

// ─────────────────────────────────────────────
// OHLCV GENERATOR
// ─────────────────────────────────────────────
function makeOHLCV(seed, n) {
  n = n || 80;
  var rng = function(s) { var x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  var O=[],H=[],L=[],C=[],V=[];
  var p = seed.price * (0.88 + rng(seed.price) * 0.15);
  for (var i=0; i<n; i++) {
    var r1=rng(seed.price+i*3.71), r2=rng(seed.price+i*7.13), r3=rng(seed.price+i*13.7);
    var ret = seed.trend + Math.sin(i/20)*0.001 + (r1-0.48)*seed.vol*2.2;
    var o=p, c=p*(1+ret), range=Math.abs(c-o)*(1+r2*1.5)+p*seed.vol*0.5;
    var h=Math.max(o,c)+range*r3*0.8, l=Math.min(o,c)-range*(1-r3)*0.8;
    O.push(+o.toFixed(2)); H.push(+h.toFixed(2)); L.push(+l.toFixed(2)); C.push(+c.toFixed(2));
    V.push(Math.floor((3e6+r2*8e6)*(1+Math.abs(ret/seed.vol)*3)));
    p = c;
  }
  var sc = seed.price / C[C.length-1];
  return {
    opens:  O.map(function(v){return +(v*sc).toFixed(2);}),
    highs:  H.map(function(v){return +(v*sc).toFixed(2);}),
    lows:   L.map(function(v){return +(v*sc).toFixed(2);}),
    closes: C.map(function(v){return +(v*sc).toFixed(2);}),
    volumes:V
  };
}

// ─────────────────────────────────────────────
// TA ENGINE
// ─────────────────────────────────────────────
function calcEMA(d, p) {
  var k=2/(p+1), e=d[0];
  return d.map(function(v,i){ if(!i)return e; e=v*k+e*(1-k); return +e.toFixed(4); });
}
function calcSMA(d, p) {
  return d.map(function(_,i){
    if(i<p-1)return null;
    var s=0; for(var j=i-p+1;j<=i;j++)s+=d[j];
    return +(s/p).toFixed(3);
  });
}
function calcRSI(d) {
  var p=14, ch=[];
  for(var i=1;i<d.length;i++) ch.push(d[i]-d[i-1]);
  var g=0,l=0;
  for(var i=0;i<p;i++){ if(ch[i]>0)g+=ch[i]; else l-=ch[i]; }
  g/=p; l/=p;
  var r=Array(p+1).fill(null);
  for(var i=p;i<ch.length;i++){
    g=(g*(p-1)+(ch[i]>0?ch[i]:0))/p;
    l=(l*(p-1)+(ch[i]<0?-ch[i]:0))/p;
    r.push(+(100-100/(1+(l===0?100:g/l))).toFixed(2));
  }
  return r;
}
function calcMACD(d) {
  var ef=calcEMA(d,12), es=calcEMA(d,26);
  var ml=ef.map(function(v,i){return +(v-es[i]).toFixed(4);});
  var sl=calcEMA(ml,9);
  return { macd:ml, signal:sl, hist:ml.map(function(v,i){return +(v-sl[i]).toFixed(4);}) };
}
function calcBB(d) {
  var p=20;
  return d.map(function(_,i){
    if(i<p-1)return null;
    var sl=d.slice(i-p+1,i+1), m=sl.reduce(function(a,b){return a+b;})/p;
    var std=Math.sqrt(sl.reduce(function(a,b){return a+(b-m)*(b-m);},0)/p);
    return {upper:+(m+2*std).toFixed(2),mid:+m.toFixed(2),lower:+(m-2*std).toFixed(2)};
  });
}
function calcStoch(H,L,C) {
  var k=14;
  return C.map(function(c,i){
    if(i<k-1)return null;
    var hs=H.slice(i-k+1,i+1), ls=L.slice(i-k+1,i+1);
    var hh=Math.max.apply(null,hs), ll=Math.min.apply(null,ls);
    return hh===ll?50:+((c-ll)/(hh-ll)*100).toFixed(2);
  });
}
function calcATR(H,L,C) {
  var tr=H.map(function(h,i){
    if(i===0)return h-L[i];
    return Math.max(h-L[i],Math.abs(h-C[i-1]),Math.abs(L[i]-C[i-1]));
  });
  return calcEMA(tr,14).map(function(v){return +v.toFixed(2);});
}
function calcWR(H,L,C) {
  var p=14;
  return C.map(function(c,i){
    if(i<p-1)return null;
    var hh=Math.max.apply(null,H.slice(i-p+1,i+1));
    var ll=Math.min.apply(null,L.slice(i-p+1,i+1));
    return hh===ll?-50:+((hh-c)/(hh-ll)*-100).toFixed(2);
  });
}
function calcOBV(C,V) {
  var o=0;
  return C.map(function(c,i){
    if(!i)return 0;
    o+=c>C[i-1]?V[i]:c<C[i-1]?-V[i]:0;
    return o;
  });
}
function calcVWAP(H,L,C,V) {
  var cp=0,cv=0;
  return C.map(function(c,i){
    var tp=(H[i]+L[i]+c)/3; cp+=tp*V[i]; cv+=V[i];
    return +(cp/cv).toFixed(2);
  });
}
function calcSupports(C) {
  var lb=10, lvls=[];
  for(var i=lb;i<C.length-lb;i++){
    var sl=C.slice(i-lb,i+lb);
    if(C[i]===Math.min.apply(null,sl)||C[i]===Math.max.apply(null,sl))
      lvls.push(+C[i].toFixed(2));
  }
  var uniq=[]; lvls.forEach(function(v){if(uniq.indexOf(v)<0)uniq.push(v);}); return uniq.slice(-8);
}

// ─────────────────────────────────────────────
// BUILD STOCK (pre-compute all TA)
// ─────────────────────────────────────────────
function buildStock(sym) {
  var s = SEED[sym];
  var ohlcv = makeOHLCV(s);
  var O=ohlcv.opens, H=ohlcv.highs, L=ohlcv.lows, C=ohlcv.closes, V=ohlcv.volumes;
  var rsi=calcRSI(C), macdD=calcMACD(C), bb=calcBB(C);
  var stoch=calcStoch(H,L,C), atr=calcATR(H,L,C), wr=calcWR(H,L,C);
  var sma20=calcSMA(C,20), sma50=calcSMA(C,50), ema9=calcEMA(C,9);
  var obv=calcOBV(C,V), vwap=calcVWAP(H,L,C,V), levels=calcSupports(C);
  var price=C[C.length-1], prev=C[C.length-2];
  function lastValid(arr){ for(var i=arr.length-1;i>=0;i--){if(arr[i]!==null&&!isNaN(arr[i]))return arr[i];} return null; }
  var avgVol20=V.slice(-20).reduce(function(a,b){return a+b;},0)/20;
  return Object.assign({}, s, {
    sym:sym,
    ohlcv:ohlcv,
    price:price,
    prevClose:prev,
    change:+(price-prev).toFixed(2),
    changePct:prev>0?+((price-prev)/prev*100).toFixed(2):0,
    open:O[O.length-1],
    dayHigh:H[H.length-1],
    dayLow:L[L.length-1],
    volume:V[V.length-1],
    avgVol20:avgVol20,
    volRatio:+(V[V.length-1]/avgVol20).toFixed(2),
    computed:{rsi:rsi,macd:macdD,bb:bb,stoch:stoch,atr:atr,wr:wr,sma20:sma20,sma50:sma50,ema9:ema9,obv:obv,vwap:vwap,levels:levels},
    lastRSI:lastValid(rsi)||50,
    lastMACD:macdD.macd[macdD.macd.length-1]||0,
    lastSignal:macdD.signal[macdD.signal.length-1]||0,
    lastHist:macdD.hist[macdD.hist.length-1]||0,
    lastBB:lastValid(bb)||null,
    lastStochK:lastValid(stoch)||50,
    lastATR:atr[atr.length-1]||price*0.02,
    lastWR:lastValid(wr)||-50,
    lastSMA20:lastValid(sma20)||price,
    lastSMA50:lastValid(sma50)||price,
    lastEMA9:ema9[ema9.length-1]||price,
    lastVWAP:vwap[vwap.length-1]||price,
    lastOBV:obv[obv.length-1]||0,
  });
}

var STOCKS = {};
SYMS.forEach(function(sym){ STOCKS[sym]=buildStock(sym); });

// ─────────────────────────────────────────────
// LIVE TICK SIMULATION
// ─────────────────────────────────────────────
function nextTick(state, seed) {
  var price = state.price || seed.price;
  var prevClose = state.prevClose || seed.price;
  var dayHigh = state.dayHigh || price;
  var dayLow = state.dayLow || price;
  var sigma = seed.vol / Math.sqrt(252*26);
  var meanRev = (seed.price - price) * 0.00005;
  var shock = (Math.random()-0.499)*sigma*price*3.5;
  var newP = Math.max(price + seed.trend*price*0.0001 + meanRev + shock, price*0.85);
  var p = +newP.toFixed(newP>100?2:4);
  var chg = +(p-prevClose).toFixed(2);
  var chgPct = prevClose>0 ? +(chg/prevClose*100).toFixed(2) : 0;
  return {
    price:p, prevClose:prevClose, change:chg, changePct:chgPct,
    dayHigh:+Math.max(dayHigh,p).toFixed(2),
    dayLow:+Math.min(dayLow,p).toFixed(2),
    volume:(state.volume||0)+Math.floor(50000+Math.random()*200000)
  };
}

// ─────────────────────────────────────────────
// AI SCORING ENGINE
// ─────────────────────────────────────────────
function computeAI(d) {
  var p=d.price, rsi=d.lastRSI, macd=d.lastMACD, hist=d.lastHist;
  var bb=d.lastBB, stochK=d.lastStochK, wr=d.lastWR;
  var sma20=d.lastSMA20, sma50=d.lastSMA50, vwap=d.lastVWAP;
  var atr=d.lastATR, volRatio=d.volRatio, change=d.change;
  var scores=[], reasons=[];
  function add(s,r){scores.push(s);reasons.push(r);}
  var as20=p>sma20, as50=p>sma50;
  add((as20?1:-1)+(as50?1:-1), as20&&as50?"Price above SMA20 & SMA50 — uptrend confirmed":!as20&&!as50?"Price below both SMAs — bearish structure":"Mixed SMA signals — consolidation zone");
  add(p>vwap?1:-1, p>vwap?"Above VWAP $"+vwap.toFixed(2)+" — intraday buyers in control":"Below VWAP $"+vwap.toFixed(2)+" — sellers dominate");
  if(rsi>70)add(-1,"RSI "+rsi+" — overbought, exhaustion risk");
  else if(rsi<30)add(2,"RSI "+rsi+" — oversold, mean-reversion setup");
  else if(rsi>55)add(1,"RSI "+rsi+" — bullish momentum zone");
  else if(rsi<45)add(-1,"RSI "+rsi+" — weak momentum, bears slightly ahead");
  else add(0,"RSI "+rsi+" — neutral, no strong conviction");
  add(hist>0?(macd>0?2:1):(macd<0?-2:-1), hist>0?"MACD histogram +"+hist.toFixed(3)+" — bullish momentum":"MACD histogram "+hist.toFixed(3)+" — bearish pressure");
  var bbPct = bb?(p-bb.lower)/(bb.upper-bb.lower):0.5;
  if(bbPct>0.95)add(-1,"Upper Bollinger Band — statistically extended");
  else if(bbPct<0.05)add(2,"Lower Bollinger Band — value zone, bounce likely");
  else if(bbPct>0.65)add(1,"Upper BB half — bullish with room to run");
  else add(-1,"Below BB midline — short-term bearish bias");
  if(stochK>80)add(-1,"Stochastic %K "+stochK+" — overbought");
  else if(stochK<20)add(2,"Stochastic %K "+stochK+" — oversold, crossover setup");
  else add(stochK>50?1:-1,"Stochastic %K "+stochK+" — "+(stochK>50?"bullish":"bearish")+" zone");
  if(wr>-20)add(-1,"Williams %R "+wr+" — overbought territory");
  else if(wr<-80)add(2,"Williams %R "+wr+" — oversold reversal zone");
  else add(wr>-50?1:-1,"Williams %R "+wr+" — "+(wr>-50?"bullish":"bearish"));
  if(volRatio>1.5&&change>0)add(2,"Volume "+volRatio+"x avg on up move — institutional accumulation");
  else if(volRatio>1.5&&change<0)add(-2,"Volume "+volRatio+"x avg on down move — distribution signal");
  else add(change>0?1:-1,"Volume "+volRatio+"x — "+(volRatio<0.7?"low conviction":"moderate signal"));
  var raw=scores.reduce(function(a,b){return a+b;},0), mx=scores.length*2;
  var norm=Math.round(((raw+mx)/(2*mx))*100);
  var winProb=Math.min(Math.max(norm,15),88);
  var confidence=Math.min(Math.max(55+Math.abs(raw)*2,50),91);
  var action, sentiment;
  if(raw>=10){action="STRONG BUY";sentiment="VERY BULLISH";}
  else if(raw>=5){action="BUY";sentiment="BULLISH";}
  else if(raw>=2){action="MILD BUY";sentiment="BULLISH";}
  else if(raw>=-2){action="HOLD";sentiment="NEUTRAL";}
  else if(raw>=-6){action="WAIT";sentiment="BEARISH";}
  else{action="AVOID";sentiment="VERY BEARISH";}
  var stopLoss=+(p-atr*2).toFixed(2);
  var target=+(p+atr*3.5).toFixed(2);
  var rrNum=(target-p)/(p-stopLoss);
  var riskReward="1:"+(isNaN(rrNum)||!isFinite(rrNum)?"2.0":rrNum.toFixed(1));
  // Plain-English reasons (no jargon)
  var plainReasons=[];
  if(as20&&as50) plainReasons.push("📈 Price is trending upward — it's above its recent averages, which is a good sign");
  else if(!as20&&!as50) plainReasons.push("📉 Price is in a downtrend — it's below its recent averages, which is a warning sign");
  else plainReasons.push("↔️ Price is mixed — not clearly going up or down right now");

  if(p>vwap) plainReasons.push("💚 More people are buying than selling today — buyers are in control");
  else plainReasons.push("🔴 More people are selling than buying today — sellers are in control");

  if(rsi>70) plainReasons.push("⚠️ The stock has gone up too fast recently — it's overheated and due for a rest");
  else if(rsi<30) plainReasons.push("💡 The stock has been oversold — it may be undervalued and ready to bounce back");
  else if(rsi>55) plainReasons.push("✅ Buying momentum is healthy — not too hot, not too cold");
  else if(rsi<45) plainReasons.push("⚠️ Buying momentum is weak — more sellers than buyers recently");
  else plainReasons.push("➡️ Momentum is neutral — no clear direction yet");

  if(hist>0) plainReasons.push("📊 Short-term momentum is accelerating upward");
  else plainReasons.push("📊 Short-term momentum is fading or turning downward");

  if(bbPct>0.9) plainReasons.push("🔴 Price is stretched very high — statistically likely to pull back soon");
  else if(bbPct<0.1) plainReasons.push("💚 Price is near a historically low zone — potential bargain territory");
  else if(bbPct>0.6) plainReasons.push("✅ Price has room to keep moving up without being overextended");
  else plainReasons.push("⚠️ Price is in the lower half of its recent range");

  if(stochK>80) plainReasons.push("⚠️ Short-term buying pressure is maxed out — a dip is possible");
  else if(stochK<20) plainReasons.push("💡 Short-term selling pressure is maxed out — a recovery is possible");
  else plainReasons.push(stochK>50?"✅ Short-term momentum favors buyers":"⚠️ Short-term momentum favors sellers");

  if(volRatio>1.5&&change>0) plainReasons.push("💪 Big money is stepping in — unusually high buying volume today");
  else if(volRatio>1.5&&change<0) plainReasons.push("🚨 Big money is stepping out — unusually high selling volume today");
  else plainReasons.push(change>0?"➡️ Normal volume on an up day — steady but not explosive":"➡️ Normal volume on a down day — no panic selling");

  var dp=p>100?2:4;
  var actionVerb=action==="STRONG BUY"||action==="BUY"?"BUY":action==="MILD BUY"?"CAUTIOUSLY BUY":action==="HOLD"?"HOLD":action==="WAIT"?"WAIT — DON'T BUY YET":"AVOID BUYING";

  // Simple plain-English judgment
  var whyStr=as20&&as50?"The price is moving in the right direction and buyers are in charge.":!as20&&!as50?"The price is moving in the wrong direction — sellers are in charge.":"The price is going sideways with no clear direction.";
  var rsiStr=rsi>70?"It's gotten a bit expensive recently, so there might be a pullback first.":rsi<30?"It's been beaten down a lot and looks like a potential bargain.":"The buying energy is at a good level — not overheated.";
  var doStr=action.indexOf("BUY")>=0?"If you decide to buy: enter around $"+p.toFixed(dp)+", set a stop-loss at $"+stopLoss+" (your maximum loss), and aim to sell at $"+target+". That gives you a "+riskReward+" reward-to-risk ratio — meaning for every $1 you risk, you could make $"+parseFloat(riskReward.split(":")[1]).toFixed(1)+".":action==="HOLD"?"If you already own it, keep holding for now. If you don't own it yet, don't jump in here — wait for a better moment.":"Keep your money safe for now. Wait until the price shows clearer signs of recovery before buying.";

  var judgment=actionVerb+" "+d.sym+". "+whyStr+" "+rsiStr+" "+doStr;
  return {
    action:action, sentiment:sentiment, winProb:winProb, confidence:confidence,
    raw:raw, mx:mx, sentimentScore:norm, stopLoss:stopLoss, target:target,
    riskReward:riskReward, reasons:plainReasons, judgment:judgment,
    bbPct:+(bbPct*100).toFixed(1),
    scores:{trend:(as20?1:-1)+(as50?1:-1), momentum:(rsi>55?1:rsi<45?-1:0)+(hist>0?1:-1), mean_rev:(bbPct>0.65?1:-1)+(stochK>50?1:-1)+(wr>-50?1:-1), volume:volRatio>1.5?(change>0?2:-2):0}
  };
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function hex2rgb(h) {
  return parseInt(h.slice(1,3),16)+","+parseInt(h.slice(3,5),16)+","+parseInt(h.slice(5,7),16);
}
function lerp(a,b,t){return a+(b-a)*t;}
function fmtN(v){
  if(v===null||v===undefined||isNaN(v))return"—";
  var a=Math.abs(v);
  if(a>=1e12)return (v/1e12).toFixed(2)+"T";
  if(a>=1e9)return (v/1e9).toFixed(1)+"B";
  if(a>=1e6)return (v/1e6).toFixed(1)+"M";
  return v.toLocaleString();
}

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────
function useAnim(val, ms) {
  ms = ms || 700;
  var ref = useRef(val);
  var _s = useState(val);
  var v = _s[0], setV = _s[1];
  useEffect(function(){
    var from=ref.current; ref.current=val;
    var t0=performance.now();
    function tick(now){
      var t=Math.min((now-t0)/ms,1);
      setV(lerp(from,val,1-Math.pow(1-t,3)));
      if(t<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  },[val]);
  return v;
}

// ─────────────────────────────────────────────
// CANVAS COMPONENTS
// ─────────────────────────────────────────────
function SparkLine(props) {
  var data=props.data, color=props.color, height=props.height||60;
  var ref = useRef(null);
  useEffect(function(){
    if(!ref.current||!data||!data.length)return;
    var canvas=ref.current, ctx=canvas.getContext("2d");
    var dpr=window.devicePixelRatio||1;
    var w=canvas.parentElement?canvas.parentElement.offsetWidth:300;
    canvas.width=w*dpr; canvas.height=height*dpr;
    canvas.style.width=w+"px"; canvas.style.height=height+"px";
    ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,height);
    var min=Math.min.apply(null,data), max=Math.max.apply(null,data), range=max-min||1;
    var pts=data.map(function(v,i){return{x:(i/Math.max(data.length-1,1))*w, y:height-((v-min)/range)*(height-6)-3};});
    var gr=ctx.createLinearGradient(0,0,0,height);
    gr.addColorStop(0,color+"44"); gr.addColorStop(1,color+"00");
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p){ctx.lineTo(p.x,p.y);});
    ctx.lineTo(pts[pts.length-1].x,height); ctx.lineTo(0,height); ctx.closePath();
    ctx.fillStyle=gr; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p){ctx.lineTo(p.x,p.y);});
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.lineJoin="round"; ctx.stroke();
    var lp=pts[pts.length-1];
    ctx.beginPath(); ctx.arc(lp.x,lp.y,3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
  },[data,color,height]);
  return React.createElement("canvas",{ref:ref,style:{display:"block",width:"100%",height:height}});
}

function CandleChart(props) {
  var ohlcv=props.ohlcv, bbArr=props.bbArr, sma20=props.sma20, sma50=props.sma50, height=props.height||280;
  var ref = useRef(null);
  // Only redraw when the historical data changes (not on every live price tick)
  var lastCloseRef = useRef(null);
  useEffect(function(){
    if(!ref.current||!ohlcv||!ohlcv.closes||!ohlcv.closes.length)return;
    // Skip redraw if same candle data
    var lastClose = ohlcv.closes[ohlcv.closes.length-1];
    if(lastClose === lastCloseRef.current) return;
    lastCloseRef.current = lastClose;
    var canvas=ref.current, ctx=canvas.getContext("2d");
    var dpr=window.devicePixelRatio||1;
    var w=canvas.parentElement?canvas.parentElement.offsetWidth:700;
    canvas.width=w*dpr; canvas.height=height*dpr;
    canvas.style.width=w+"px"; canvas.style.height=height+"px";
    ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,height);
    var n=Math.min(60,ohlcv.closes.length), pad=50, bw=(w-pad)/n*0.6;
    var O=ohlcv.opens.slice(-n), H=ohlcv.highs.slice(-n), L=ohlcv.lows.slice(-n), C=ohlcv.closes.slice(-n);
    var vBB=(bbArr||[]).filter(function(v){return v!==null;}).slice(-n);
    var vs20=(sma20||[]).filter(function(v){return v!==null;}).slice(-n);
    var vs50=(sma50||[]).filter(function(v){return v!==null;}).slice(-n);
    var allV=[].concat(H,L,vBB.map(function(b){return b.upper;}),vBB.map(function(b){return b.lower;})).filter(function(v){return !isNaN(v)&&v>0;});
    if(!allV.length)return;
    var vMin=Math.min.apply(null,allV)*0.998, vMax=Math.max.apply(null,allV)*1.002;
    var vy=function(v){return pad/2+(1-(v-vMin)/(vMax-vMin))*(height-pad);};
    var vx=function(i){return pad/2+i*((w-pad)/n);};
    if(vBB.length>1){
      ctx.beginPath(); ctx.moveTo(vx(0),vy(vBB[0].upper));
      vBB.forEach(function(b,i){ctx.lineTo(vx(i),vy(b.upper));});
      vBB.slice().reverse().forEach(function(b,i){ctx.lineTo(vx(vBB.length-1-i),vy(b.lower));});
      ctx.closePath(); ctx.fillStyle="rgba(56,189,248,0.05)"; ctx.fill();
      [vBB.map(function(b){return b.upper;}),vBB.map(function(b){return b.lower;})].forEach(function(arr){
        ctx.beginPath(); ctx.moveTo(vx(0),vy(arr[0]));
        arr.forEach(function(v,i){ctx.lineTo(vx(i),vy(v));});
        ctx.strokeStyle="rgba(56,189,248,0.3)"; ctx.lineWidth=1; ctx.stroke();
      });
    }
    [[vs20,AM],[vs50,"#a78bfa"]].forEach(function(pair){
      var arr=pair[0], col=pair[1];
      if(!arr.length)return;
      ctx.beginPath();
      arr.forEach(function(v,i){if(v!==null){i===0?ctx.moveTo(vx(i),vy(v)):ctx.lineTo(vx(i),vy(v));}});
      ctx.strokeStyle=col+"bb"; ctx.lineWidth=1.5; ctx.stroke();
    });
    for(var i=0;i<n;i++){
      var up=C[i]>=O[i], col=up?UP:DN, x=vx(i);
      ctx.strokeStyle=col; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x,vy(H[i])); ctx.lineTo(x,vy(L[i])); ctx.stroke();
      var bt=vy(Math.max(O[i],C[i])), bb2=vy(Math.min(O[i],C[i])), bh=Math.max(bb2-bt,1);
      ctx.fillStyle=up?UP+"cc":DN+"cc";
      ctx.fillRect(x-bw/2,bt,bw,bh); ctx.strokeRect(x-bw/2,bt,bw,bh);
    }
    [0.2,0.5,0.8].forEach(function(r){
      var v=vMin+(vMax-vMin)*r;
      ctx.fillStyle="rgba(255,255,255,0.18)"; ctx.font="9px monospace"; ctx.textAlign="right";
      ctx.fillText("$"+v.toFixed(2),w-4,vy(v)+3);
      ctx.strokeStyle="rgba(255,255,255,0.05)"; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(0,vy(v)); ctx.lineTo(w-40,vy(v)); ctx.stroke();
    });
    ctx.strokeStyle="rgba(56,189,248,0.4)"; ctx.lineWidth=0.8; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(0,vy(C[C.length-1])); ctx.lineTo(w,vy(C[C.length-1])); ctx.stroke();
    ctx.setLineDash([]);
  });
  return React.createElement("canvas",{ref:ref,style:{display:"block",width:"100%",height:height}});
}

function VolChart(props) {
  var volumes=props.volumes, closes=props.closes, height=props.height||52;
  var ref = useRef(null);
  useEffect(function(){
    if(!ref.current)return;
    var canvas=ref.current, ctx=canvas.getContext("2d");
    var dpr=window.devicePixelRatio||1;
    var w=canvas.parentElement?canvas.parentElement.offsetWidth:700;
    canvas.width=w*dpr; canvas.height=height*dpr;
    canvas.style.width=w+"px"; canvas.style.height=height+"px";
    ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,height);
    var n=60, pad=50, bw=(w-pad)/n*0.6;
    var vols=volumes.slice(-n), cls=closes.slice(-n);
    var maxV=Math.max.apply(null,vols);
    for(var i=0;i<Math.min(n,vols.length);i++){
      var x=pad/2+i*((w-pad)/n), barH=(vols[i]/maxV)*(height-4);
      ctx.fillStyle=(cls[i]>=(cls[i-1]||cls[i])?UP:DN)+"55";
      ctx.fillRect(x-bw/2,height-barH,bw,barH);
    }
  },[volumes,closes,height]);
  return React.createElement("canvas",{ref:ref,style:{display:"block",width:"100%",height:height}});
}

// ─────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────
function ArcGauge(props) {
  var value=props.value, size=props.size||120, color=props.color, label=props.label;
  var a = useAnim(value, 1000);
  var r=size/2-11, cx=size/2, cy=size/2, sd=-215, ed=35, total=ed-sd;
  function toXY(deg){return{x:cx+r*Math.cos(deg*Math.PI/180),y:cy+r*Math.sin(deg*Math.PI/180)};}
  var s=toXY(sd), e=toXY(ed), f=toXY(sd+total*a/100);
  var large=(total*a/100)>180?1:0;
  var uid="gauge_"+label.replace(/\W/g,"")+"_"+size;
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center"}},
    React.createElement("svg",{width:size,height:size*0.72,viewBox:"0 0 "+size+" "+size,style:{overflow:"visible"}},
      React.createElement("defs",null,
        React.createElement("filter",{id:uid},
          React.createElement("feGaussianBlur",{stdDeviation:"3",result:"b"}),
          React.createElement("feMerge",null,React.createElement("feMergeNode",{in:"b"}),React.createElement("feMergeNode",{in:"SourceGraphic"}))
        )
      ),
      React.createElement("path",{d:"M "+s.x+" "+s.y+" A "+r+" "+r+" 0 1 1 "+e.x+" "+e.y,fill:"none",stroke:"rgba(255,255,255,0.05)",strokeWidth:"8",strokeLinecap:"round"}),
      a>0.5&&React.createElement("path",{d:"M "+s.x+" "+s.y+" A "+r+" "+r+" 0 "+large+" 1 "+f.x+" "+f.y,fill:"none",stroke:color,strokeWidth:"8",strokeLinecap:"round",filter:"url(#"+uid+")"}),
      React.createElement("text",{x:cx,y:cy+7,textAnchor:"middle",fill:"#ffffff",fontSize:size*0.22,fontWeight:"700",fontFamily:"monospace"},Math.round(a)),
      React.createElement("text",{x:cx,y:cy+21,textAnchor:"middle",fill:"rgba(255,255,255,0.55)",fontSize:"10",fontFamily:"monospace"},"/100")
    ),
    React.createElement("span",{style:{fontSize:10,color:"rgba(255,255,255,0.6)",letterSpacing:"0.13em",textTransform:"uppercase",marginTop:-4}},label)
  );
}

function SentBar(props) {
  var value=props.value;
  var pos=useAnim(value,1000);
  var label=value>75?"EXTREME GREED":value>60?"GREED":value>40?"NEUTRAL":value>25?"FEAR":"EXTREME FEAR";
  var c=value>60?UP:value<40?DN:AM;
  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:7}},
      React.createElement("span",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.1em"}},"FEAR & GREED INDEX"),
      React.createElement("span",{style:{fontSize:11,color:c,fontWeight:600}},label)
    ),
    React.createElement("div",{style:{height:8,borderRadius:4,background:"linear-gradient(to right,#ef4444,#f59e0b,#10b981)",position:"relative"}},
      React.createElement("div",{style:{position:"absolute",top:"50%",left:pos+"%",transform:"translate(-50%,-50%)",width:14,height:14,borderRadius:"50%",background:"#080c1a",border:"2.5px solid "+c,transition:"left 1s cubic-bezier(.23,1,.32,1)",boxShadow:"0 0 12px "+c}})
    ),
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginTop:4}},
      ["EXT FEAR","FEAR","NEUTRAL","GREED","EXT GREED"].map(function(l,i){
        return React.createElement("span",{key:i,style:{fontSize:8,color:"rgba(255,255,255,0.15)"}},l);
      })
    )
  );
}

function Badge(props) {
  var action=props.action;
  var cfgMap={
    "STRONG BUY":[UP,0.15,0.4],"BUY":[UP,0.1,0.3],"MILD BUY":["#6ee7b7",0.08,0.25],
    "HOLD":[AM,0.1,0.3],"WAIT":["#94a3b8",0.08,0.25],"AVOID":[DN,0.1,0.3]
  };
  var cfg=cfgMap[action]||["#fff",0.05,0.2];
  var c=cfg[0], a1=cfg[1], a2=cfg[2];
  return React.createElement("div",{style:{display:"inline-flex",alignItems:"center",gap:7,padding:"7px 18px",borderRadius:8,background:"rgba("+hex2rgb(c)+","+a1+")",border:"1px solid rgba("+hex2rgb(c)+","+a2+")"}},
    React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:c,boxShadow:"0 0 10px "+c,animation:"pulseDot 2s infinite"}}),
    React.createElement("span",{style:{fontSize:13,fontWeight:700,color:c,fontFamily:"monospace",letterSpacing:"0.14em"}},action)
  );
}

function IndBar(props) {
  var label=props.label,value=props.value,min=props.min,max=props.max,good=props.good,color=props.color,fmt=props.fmt;
  var pct=Math.min(Math.max((value-min)/(max-min)*100,0),100);
  var w=useAnim(pct,900);
  var col=color||AC;
  return React.createElement("div",{style:{marginBottom:12}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},
      React.createElement("span",{style:{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em"}},label),
      React.createElement("span",{style:{fontSize:11,color:col,fontWeight:600}},fmt?fmt(value):value)
    ),
    React.createElement("div",{style:{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,position:"relative"}},
      good&&React.createElement("div",{style:{position:"absolute",left:((good[0]-min)/(max-min)*100)+"%",width:((good[1]-good[0])/(max-min)*100)+"%",height:"100%",background:"rgba(16,185,129,0.12)",borderRadius:2}}),
      React.createElement("div",{style:{width:w+"%",height:"100%",background:col,borderRadius:2,transition:"width 0.9s cubic-bezier(.23,1,.32,1)",boxShadow:"0 0 8px "+col+"88"}})
    )
  );
}

function TypeWriter(props) {
  var text=props.text;
  var _s=useState(""); var out=_s[0], setOut=_s[1];
  var _d=useState(false); var done=_d[0], setDone=_d[1];
  var prev=useRef("");
  useEffect(function(){
    if(text===prev.current)return;
    prev.current=text;
    setOut(""); setDone(false);
    var i=0;
    var t=setInterval(function(){
      if(i<text.length){i++;setOut(text.slice(0,i));}
      else{clearInterval(t);setDone(true);}
    },13);
    return function(){clearInterval(t);};
  },[text]);
  return React.createElement(React.Fragment,null,out,React.createElement("span",{style:{color:AC,opacity:done?0:1}},"▌"));
}

function LivePrice(props) {
  var price=props.price, change=props.change, changePct=props.changePct;
  var _f=useState(null); var flash=_f[0], setFlash=_f[1];
  var prev=useRef(price);
  useEffect(function(){
    if(price!==prev.current){
      setFlash(price>prev.current?"up":"down");
      prev.current=price;
      var t=setTimeout(function(){setFlash(null);},500);
      return function(){clearTimeout(t);};
    }
  },[price]);
  var isUp=change>=0;
  var dp=price>100?2:4;
  var col=flash==="up"?UP:flash==="down"?DN:"#fff";
  return React.createElement("div",{style:{display:"flex",alignItems:"baseline",gap:14,flexWrap:"wrap",marginTop:4}},
    React.createElement("span",{style:{fontSize:42,fontWeight:800,fontFamily:"'Syne',sans-serif",transition:"color 0.2s",color:col}},
      "$"+(typeof price==="number"?price.toFixed(dp):price)
    ),
    React.createElement("span",{style:{fontSize:16,color:isUp?UP:DN,fontWeight:600}},
      (isUp?"+":"")+change.toFixed(2)+" ("+(isUp?"+":"")+changePct.toFixed(2)+"%)"
    )
  );
}

function SRow(props) {
  var r=props.r;
  var isBull=/bullish|above|positive|oversold|accumulation|bounce/.test(r);
  var isBear=/bearish|below|negative|overbought|distribut|risk/.test(r);
  var dc=isBull?UP:isBear?DN:AM;
  return React.createElement("div",{style:{display:"flex",gap:10,padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,0.02)",border:"0.5px solid "+dc+"33"}},
    React.createElement("div",{style:{width:5,height:5,borderRadius:"50%",background:dc,flexShrink:0,marginTop:4,boxShadow:"0 0 6px "+dc}}),
    React.createElement("span",{style:{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.6}},r)
  );
}

// ─────────────────────────────────────────────
// CHATBOT
// ─────────────────────────────────────────────
function Chatbot(props) {
  var d=props.d, ai=props.ai, sym=props.sym;
  var _o=useState(false); var open=_o[0], setOpen=_o[1];
  var _m=useState([{role:"ai",text:"Hey! I'm your JUDGEAI assistant. Ask me anything about "+sym+" — entry, stop loss, technicals, or overall analysis."}]);
  var msgs=_m[0], setMsgs=_m[1];
  var _i=useState(""); var input=_i[0], setInput=_i[1];
  var _t=useState(false); var typing=_t[0], setTyping=_t[1];
  var bottomRef=useRef(null);
  useEffect(function(){
    setMsgs([{role:"ai",text:"Switched to "+sym+". Ask me about entry, stop loss, RSI, MACD, trend, or overall analysis."}]);
  },[sym]);
  useEffect(function(){
    if(open&&bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});
  },[msgs,open]);
  function respond(q){
    if(!d||!ai)return"Loading data...";
    var ql=q.toLowerCase();
    var p=d.price, rsi=d.lastRSI, as20=p>d.lastSMA20, as50=p>d.lastSMA50;
    var dp=p>100?2:4;
    if(/buy|entry|should i|worth/.test(ql))return ai.action.indexOf("BUY")>=0?"My recommendation: "+ai.action+" "+sym+". The price is "+(as20&&as50?"moving upward — that's a good sign":"not clearly trending up — be careful")+". If you buy at $"+p.toFixed(dp)+", set a safety exit at $"+ai.stopLoss+" to limit losses, and aim to sell at $"+ai.target+". That's a "+ai.riskReward+" reward-to-risk ratio.":"My recommendation: "+ai.action+" — not a good time to buy "+sym+". "+(as20||as50?"The trend is unclear.":"The price is going down.")+". Wait for conditions to improve before putting money in.";
    if(/compare|vs|better|which/.test(ql)){var scores=SYMS.map(function(s){return{sym:s,sai:computeAI(STOCKS[s])};}).sort(function(a,b){return b.sai.winProb-a.sai.winProb;});var top=scores[0];return"Right now "+top.sym+" looks like the strongest option with "+top.sai.winProb+"% win probability and a "+top.sai.action+" signal. "+sym+" scores "+ai.winProb+"%. Check the full comparison table in the AI Trader page!";}
    if(/stop|loss|risk|safe/.test(ql))return"If you buy "+sym+" at $"+p.toFixed(dp)+", set your stop-loss at $"+ai.stopLoss+". That means: if the price drops to $"+ai.stopLoss+", sell automatically to prevent bigger losses. The maximum you'd lose per share is about $"+(p-ai.stopLoss).toFixed(dp)+".";
    if(/target|profit|sell|exit/.test(ql))return"The target price is $"+ai.target+" — that's a potential gain of "+((ai.target-p)/p*100).toFixed(1)+"% from today's price of $"+p.toFixed(dp)+". When it gets there, consider selling to lock in your profit.";
    if(/trend|direction|going up|going down/.test(ql))return sym+" is "+(as20&&as50?"in an uptrend — price is above its recent averages, which is a positive sign.":!as20&&!as50?"in a downtrend — price has fallen below its recent averages. That's a warning sign.":"in a mixed zone — not clearly going up or down.");
    if(/rsi|overb|overs|hot|cold/.test(ql))return"The buying pressure score is "+rsi+"/100. "+(rsi>70?"It's above 70 — the stock has been bought a lot recently and might be overpriced short-term. Could pull back.":rsi<30?"It's below 30 — the stock has been heavily sold and might be undervalued. Potential bounce opportunity.":"It's in a healthy zone between 30–70. No extreme readings.");
    if(/sentiment|market|mood|feeling/.test(ql))return"The overall mood around "+sym+" scores "+ai.sentimentScore+"/100. "+(ai.sentimentScore>70?"People are quite optimistic — which can mean the stock is already priced high. Be cautious.":ai.sentimentScore<30?"People are fearful — this can actually be a buying opportunity since fear creates discounts.":"The mood is balanced — no extreme optimism or pessimism right now.");
    if(/summary|explain|help|overview|tell me/.test(ql))return sym+" in plain terms: currently $"+p.toFixed(dp)+", "+(d.change>=0?"up":"down")+" "+Math.abs(d.changePct||0).toFixed(1)+"% today. My verdict: "+ai.action+". Confidence: "+ai.winProb+"%. If buying: entry $"+p.toFixed(dp)+", stop-loss $"+ai.stopLoss+", profit target $"+ai.target+". Ask me 'should I buy?' or 'compare stocks'!";
    if(/hi|hello|hey/.test(ql))return"Hey! I can help you figure out whether to buy "+sym+" without the confusing finance terms. Try asking: 'Should I buy?', 'Compare stocks', or 'What's the risk?'";
    return"For "+sym+" right now: verdict is "+ai.action+" with "+ai.winProb+"% confidence. If you buy: entry $"+p.toFixed(dp)+", stop-loss $"+ai.stopLoss+", target $"+ai.target+". Ask me anything — 'should I buy?', 'compare stocks', or 'what's the risk?'";
  }
  function send(){
    if(!input.trim())return;
    var q=input.trim(); setInput("");
    setMsgs(function(m){return m.concat([{role:"user",text:q}]);});
    setTyping(true);
    setTimeout(function(){
      var ans=respond(q);
      setMsgs(function(m){return m.concat([{role:"ai",text:ans}]);});
      setTyping(false);
    },500+Math.random()*400);
  }
  var chips=["Should I buy?","Compare stocks","What's the risk?","Summary","Is it going up?"];
  return React.createElement(React.Fragment,null,
    React.createElement("button",{onClick:function(){setOpen(function(o){return !o;});},style:{position:"fixed",bottom:24,right:24,width:52,height:52,borderRadius:"50%",background:"rgba(56,189,248,0.15)",border:"1.5px solid rgba(56,189,248,0.5)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,boxShadow:"0 0 20px rgba(56,189,248,0.3)",fontSize:22,color:"#fff"}},open?"✕":"💬"),
    open&&React.createElement("div",{style:{position:"fixed",bottom:86,right:24,width:340,height:480,background:"#0d1529",border:"0.5px solid rgba(56,189,248,0.2)",borderRadius:14,display:"flex",flexDirection:"column",zIndex:999,boxShadow:"0 20px 60px rgba(0,0,0,0.6)",overflow:"hidden"}},
      React.createElement("div",{style:{padding:"12px 16px",borderBottom:"0.5px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:8,background:"rgba(56,189,248,0.05)"}},
        React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:AC,animation:"pulseDot 2s infinite"}}),
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:12,fontWeight:700,color:AC,fontFamily:"monospace"}},"JUDGEAI ASSISTANT"),
          React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}},"LIVE · "+sym+" ANALYST")
        )
      ),
      React.createElement("div",{style:{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}},
        msgs.map(function(m,i){
          return React.createElement("div",{key:i,style:{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}},
            React.createElement("div",{style:{maxWidth:"85%",padding:"9px 12px",borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px",background:m.role==="user"?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.05)",border:"0.5px solid "+(m.role==="user"?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.08)"),fontSize:12,color:m.role==="user"?AC:"rgba(255,255,255,0.8)",lineHeight:1.6,fontFamily:"monospace"}},m.text)
          );
        }),
        typing&&React.createElement("div",{style:{display:"flex",gap:4,padding:"6px 10px"}},
          [0,1,2].map(function(i){return React.createElement("div",{key:i,style:{width:6,height:6,borderRadius:"50%",background:AC,opacity:0.6,animation:"pulseDot 1.2s "+(i*0.2)+"s infinite"}});})
        ),
        React.createElement("div",{ref:bottomRef})
      ),
      React.createElement("div",{style:{padding:"6px 12px",display:"flex",gap:6,overflowX:"auto",borderTop:"0.5px solid rgba(255,255,255,0.05)"}},
        chips.map(function(s,i){
          return React.createElement("button",{key:i,onClick:function(){setInput(s);},style:{whiteSpace:"nowrap",padding:"4px 10px",borderRadius:12,fontSize:10,background:"rgba(56,189,248,0.08)",border:"0.5px solid rgba(56,189,248,0.25)",color:AC,cursor:"pointer",fontFamily:"monospace"}},s);
        })
      ),
      React.createElement("div",{style:{padding:"10px 12px",borderTop:"0.5px solid rgba(255,255,255,0.07)",display:"flex",gap:8}},
        React.createElement("input",{value:input,onChange:function(e){setInput(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")send();},placeholder:"Ask about this stock...",style:{flex:1,background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#e2e8f0",fontFamily:"monospace",outline:"none"}}),
        React.createElement("button",{onClick:send,style:{background:"rgba(56,189,248,0.2)",border:"0.5px solid rgba(56,189,248,0.4)",borderRadius:8,padding:"8px 12px",fontSize:14,color:AC,cursor:"pointer"}},"↑")
      )
    )
  );
}

// ─────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────
function Nav(props) {
  var page=props.page, setPage=props.setPage, sym=props.sym, setSym=props.setSym;
  var liveData=props.liveData, tickCount=props.tickCount;
  return React.createElement("div",{style:{borderBottom:"0.5px solid rgba(255,255,255,0.06)",padding:"11px 20px",display:"flex",alignItems:"center",gap:12,background:"rgba(8,12,26,0.96)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50,flexWrap:"wrap"}},
    React.createElement("div",null,
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:AC,boxShadow:"0 0 14px "+AC,animation:"glowPulse 2.5s infinite"}}),
        React.createElement("span",{style:{fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff"}},"JUDGE",React.createElement("span",{style:{color:AC}},"AI"))
      ),
      React.createElement("div",{style:{fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:"0.18em"}},"LIVE SIM · DEVHACKS S3 · TICK #"+tickCount)
    ),
    React.createElement("div",{style:{display:"flex",gap:4}},
      [["dashboard","DASHBOARD"],["technicals","TECHNICAL"],["ai-trader","AI TRADER"]].map(function(pair){
        var k=pair[0], l=pair[1];
        return React.createElement("button",{key:k,onClick:function(){setPage(k);},style:{padding:"6px 13px",borderRadius:7,fontSize:10,fontFamily:"monospace",fontWeight:600,letterSpacing:"0.1em",cursor:"pointer",background:page===k?"rgba(56,189,248,0.13)":"transparent",border:page===k?"1px solid rgba(56,189,248,0.38)":"0.5px solid rgba(255,255,255,0.07)",color:page===k?AC:"rgba(255,255,255,0.38)"}},l);
      })
    ),
    React.createElement("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},
      SYMS.map(function(t){
        var ld=liveData[t]||{};
        return React.createElement("button",{key:t,onClick:function(){setSym(t);},style:{padding:"5px 11px",borderRadius:6,fontSize:10,fontFamily:"monospace",fontWeight:600,cursor:"pointer",background:sym===t?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",border:sym===t?"1px solid rgba(56,189,248,0.38)":"0.5px solid rgba(255,255,255,0.07)",color:sym===t?AC:"rgba(255,255,255,0.32)"}},
          t," ",React.createElement("span",{style:{fontSize:8,color:(ld.change||0)>=0?UP:DN}},(ld.change||0)>=0?"▲":"▼")
        );
      })
    ),
    React.createElement("div",{style:{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}},
      React.createElement("div",{style:{width:6,height:6,borderRadius:"50%",background:UP,animation:"pulseDot 2s infinite"}}),
      React.createElement("span",{style:{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}},"LIVE · 2s TICKS")
    )
  );
}

// ─────────────────────────────────────────────
// TICKER TAPE
// ─────────────────────────────────────────────
function Tape(props) {
  var liveData=props.liveData;
  var items=[].concat(SYMS,SYMS).map(function(t,i){
    var ld=liveData[t]||STOCKS[t];
    var c=(ld.change||0)>=0?UP:DN;
    var dp=ld.price>100?2:4;
    return React.createElement("span",{key:i,style:{fontSize:10,whiteSpace:"nowrap",color:c,marginRight:44}},
      React.createElement("span",{style:{color:"rgba(255,255,255,0.3)",marginRight:5}},t),
      "$"+(typeof ld.price==="number"?ld.price.toFixed(dp):"-"),
      " ",(ld.change||0)>=0?"▲":"▼",Math.abs(ld.changePct||0).toFixed(2),"%"
    );
  });
  return React.createElement("div",{style:{background:"rgba(0,0,0,0.25)",borderBottom:"0.5px solid rgba(255,255,255,0.04)",overflow:"hidden",padding:"5px 0"}},
    React.createElement("div",{style:{display:"flex",animation:"scroll 32s linear infinite",width:"max-content"}},items)
  );
}

// ─────────────────────────────────────────────
// VERDICT CARD — the "what should I do?" block
// ─────────────────────────────────────────────
function VerdictCard(props) {
  var d=props.d, ai=props.ai;
  var dp=d.price>100?2:4;
  var p=d.price;

  // Plain-English verdict map
  var verdictMap={
    "STRONG BUY": {
      emoji:"🟢", headline:"BUY NOW",
      sub:"Strong multi-indicator bullish confluence. Enter at market price.",
      detail:"All key indicators align: price above SMA20/50, MACD positive, RSI in momentum zone. High-conviction long setup.",
      color:UP, bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.35)"
    },
    "BUY":{
      emoji:"🟢", headline:"BUY",
      sub:"Bullish setup confirmed. Risk-managed entry recommended.",
      detail:"Technical trend, momentum, and volume support a long position. Enter near current price with defined stop.",
      color:UP, bg:"rgba(16,185,129,0.06)", border:"rgba(16,185,129,0.28)"
    },
    "MILD BUY":{
      emoji:"🟡", headline:"CAUTIOUS BUY",
      sub:"Lean bullish but with lighter position size.",
      detail:"More bullish signals than bearish, but setup lacks full conviction. Consider half-size position.",
      color:"#6ee7b7", bg:"rgba(110,231,183,0.06)", border:"rgba(110,231,183,0.25)"
    },
    "HOLD":{
      emoji:"🟡", headline:"HOLD — DO NOT ADD",
      sub:"Mixed signals. Stay put if already in, don't enter fresh.",
      detail:"Indicators are conflicting. If you own it, hold your position. If you don't, wait for a clearer setup.",
      color:AM, bg:"rgba(245,158,11,0.07)", border:"rgba(245,158,11,0.28)"
    },
    "WAIT":{
      emoji:"🔴", headline:"WAIT — STAY OUT",
      sub:"Bearish lean. Not the time to buy.",
      detail:"More bearish signals than bullish. Price structure is weak. Wait for RSI reset and SMA20 reclaim before considering entry.",
      color:DN, bg:"rgba(239,68,68,0.07)", border:"rgba(239,68,68,0.28)"
    },
    "AVOID":{
      emoji:"🔴", headline:"DO NOT BUY — AVOID",
      sub:"Strong bearish structure. High risk of further decline.",
      detail:"Multiple indicators confirm downtrend. No long entries until trend reverses. Protect capital — staying in cash is a position.",
      color:DN, bg:"rgba(239,68,68,0.1)", border:"rgba(239,68,68,0.4)"
    }
  };
  var v=verdictMap[ai.action]||verdictMap["HOLD"];

  return React.createElement("div",{style:{background:v.bg, border:"1px solid "+v.border, borderRadius:14, padding:"20px 24px", display:"flex", flexDirection:"column", gap:14}},
    // Top row: big verdict + win prob
    React.createElement("div",{style:{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12}},
      React.createElement("div",null,
        React.createElement("div",{style:{fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.18em", marginBottom:6}},"▸ AI VERDICT — WHAT SHOULD YOU DO?"),
        React.createElement("div",{style:{display:"flex", alignItems:"center", gap:12}},
          React.createElement("span",{style:{fontSize:36, fontWeight:800, fontFamily:"'Syne',sans-serif", color:v.color, letterSpacing:"-0.01em"}},v.emoji+" "+v.headline),
          React.createElement("div",{style:{padding:"5px 14px", borderRadius:20, background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(255,255,255,0.12)", fontSize:11, color:"rgba(255,255,255,0.55)", fontFamily:"monospace"}},ai.winProb+"% WIN PROB")
        ),
        React.createElement("div",{style:{fontSize:14, color:"rgba(255,255,255,0.65)", marginTop:6, fontStyle:"italic"}},v.sub)
      ),
      // Confidence meter
      React.createElement("div",{style:{minWidth:160, textAlign:"right"}},
        React.createElement("div",{style:{fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginBottom:5}},"SIGNAL CONFIDENCE"),
        React.createElement("div",{style:{height:8, background:"rgba(255,255,255,0.07)", borderRadius:4, overflow:"hidden"}},
          React.createElement("div",{style:{width:ai.confidence+"%", height:"100%", background:v.color, borderRadius:4, boxShadow:"0 0 10px "+v.color+"88", transition:"width 1s ease"}})
        ),
        React.createElement("div",{style:{fontSize:16, fontWeight:700, color:v.color, fontFamily:"monospace", marginTop:5}},ai.confidence+"%")
      )
    ),
    // Directive detail
    React.createElement("div",{style:{fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:8, borderLeft:"3px solid "+v.color}},
      v.detail
    ),
    // Action plan
    React.createElement("div",{style:{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10}},
      [
        {l:"ENTRY PRICE", v:"$"+p.toFixed(dp), c:v.color, note:"current market"},
        {l:"STOP LOSS",   v:"$"+ai.stopLoss,   c:DN,      note:"exit if wrong"},
        {l:"PRICE TARGET",v:"$"+ai.target,     c:UP,      note:"+"+((ai.target-p)/p*100).toFixed(1)+"% upside"},
        {l:"RISK/REWARD", v:ai.riskReward,     c:AC,      note:"per $ risked"},
      ].map(function(item,i){
        return React.createElement("div",{key:i, style:{background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)", borderRadius:9, padding:"12px 12px"}},
          React.createElement("div",{style:{fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginBottom:4}},item.l),
          React.createElement("div",{style:{fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", color:item.c}},item.v),
          React.createElement("div",{style:{fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:3}},item.note)
        );
      })
    )
  );
}
function DashboardPage(props) {
  var d=props.d, ai=props.ai, hist=props.hist;
  var isUp=d.change>=0, priceC=isUp?UP:DN;
  var dp=d.price>100?2:4;
  return React.createElement("div",{style:{padding:"18px 22px",maxWidth:1380,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}},
    // VERDICT — what should I do?
    React.createElement(VerdictCard,{d:d,ai:ai}),
    // Hero
    React.createElement("div",{className:"gcard"},
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"start"}},
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.16em",marginBottom:4}},d.exch+" · "+d.name),
          React.createElement("span",{style:{fontSize:32,fontWeight:800,fontFamily:"'Syne',sans-serif"}},d.sym),
          React.createElement(LivePrice,{price:d.price,change:d.change,changePct:d.changePct}),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginTop:14,maxWidth:580}},
            [["OPEN","$"+d.open.toFixed(2)],["PREV CLOSE","$"+d.prevClose.toFixed(2)],["DAY HIGH","$"+d.dayHigh.toFixed(2)],["DAY LOW","$"+d.dayLow.toFixed(2)],["MKT CAP",d.mc]].map(function(pair,i){
              return React.createElement("div",{key:i,style:{background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"8px 10px",border:"0.5px solid rgba(255,255,255,0.06)"}},
                React.createElement("div",{style:{fontSize:8,color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em",marginBottom:3}},pair[0]),
                React.createElement("div",{style:{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.75)"}},pair[1])
              );
            })
          ),
          React.createElement("div",{style:{display:"flex",gap:8,marginTop:14,flexWrap:"wrap",alignItems:"center"}},
            React.createElement(Badge,{action:ai.action}),
            React.createElement("div",{style:{padding:"7px 13px",borderRadius:7,background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"0.08em"}},ai.sentiment),
            React.createElement("div",{style:{padding:"7px 13px",borderRadius:7,background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"0.08em"}},"AVG VOL "+d.avgVol)
          )
        ),
        React.createElement("div",{style:{minWidth:270}},
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:5}},
            React.createElement("span",{style:{fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"0.12em"}},"LIVE PRICE FEED"),
            React.createElement("span",{style:{fontSize:9,color:UP}},hist.length+" TICKS")
          ),
          React.createElement(SparkLine,{data:hist,color:priceC,height:75}),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10}},
            [["ATR(14)","$"+d.lastATR,AM],["VOL RATIO",d.volRatio+"x",d.volRatio>1.5?AM:"rgba(255,255,255,0.5)"],["VWAP","$"+d.lastVWAP.toFixed(2),d.price>d.lastVWAP?UP:DN]].map(function(row,i){
              return React.createElement("div",{key:i,style:{textAlign:"center"}},
                React.createElement("div",{style:{fontSize:8,color:"rgba(255,255,255,0.22)",letterSpacing:"0.1em"}},row[0]),
                React.createElement("div",{style:{fontSize:12,color:row[2],fontWeight:600,marginTop:2}},row[1])
              );
            })
          )
        )
      )
    ),
    // Gauges
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}},
      [{val:ai.winProb,label:"Win Probability",color:ai.winProb>60?UP:ai.winProb<40?DN:AM},{val:ai.confidence,label:"AI Confidence",color:AC},{val:ai.sentimentScore,label:"Sentiment Index",color:ai.sentimentScore>60?UP:ai.sentimentScore<40?DN:AM}].map(function(g,i){
        return React.createElement("div",{key:i,className:"card",style:{display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 16px"}},
          React.createElement(ArcGauge,{value:g.val,size:130,color:g.color,label:g.label})
        );
      })
    ),
    // Fundamentals + Signals
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ FUNDAMENTALS"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr"}},
          [["Market Cap",d.mc],["P/E (TTM)",d.pe],["P/B Ratio",d.pb],["EPS (TTM)",d.eps],["ROE",d.roe],["Div. Yield",d.div],["Debt/Equity",d.de],["Book Value",d.bv]].map(function(pair,i){
            return React.createElement("div",{key:i,style:{padding:"8px 0",borderBottom:"0.5px solid rgba(255,255,255,0.05)",paddingRight:i%2===0?12:0,paddingLeft:i%2===1?12:0,borderLeft:i%2===1?"0.5px solid rgba(255,255,255,0.05)":"none"}},
              React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.28)"}},pair[0]),
              React.createElement("div",{style:{fontSize:13,color:"rgba(255,255,255,0.75)",fontWeight:600,marginTop:2}},pair[1])
            );
          })
        )
      ),
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ LIVE SIGNAL SUMMARY"),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:7}},
          ai.reasons.slice(0,6).map(function(r,i){return React.createElement(SRow,{key:i,r:r});})
        )
      )
    ),
    // Sentiment + R/R
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ MARKET SENTIMENT"),
        React.createElement(SentBar,{value:ai.sentimentScore})
      ),
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:12}},"▸ RISK / REWARD"),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}},
          [{l:"TARGET",v:"$"+ai.target,c:UP,sub:"+"+((ai.target-d.price)/d.price*100).toFixed(1)+"%"},{l:"STOP LOSS",v:"$"+ai.stopLoss,c:DN,sub:((ai.stopLoss-d.price)/d.price*100).toFixed(1)+"%"},{l:"R:R",v:ai.riskReward,c:AC,sub:"Risk/Reward"}].map(function(item,i){
            return React.createElement("div",{key:i,style:{background:"rgba("+hex2rgb(item.c)+",0.07)",border:"0.5px solid rgba("+hex2rgb(item.c)+",0.3)",borderRadius:9,padding:"12px 10px",textAlign:"center"}},
              React.createElement("div",{style:{fontSize:8,color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em",marginBottom:5}},item.l),
              React.createElement("div",{style:{fontSize:19,fontWeight:800,fontFamily:"'Syne',sans-serif",color:item.c}},item.v),
              React.createElement("div",{style:{fontSize:9,color:"rgba("+hex2rgb(item.c)+",0.7)",marginTop:3}},item.sub)
            );
          })
        )
      )
    ),
    React.createElement("div",{style:{textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.1)",paddingBottom:8}},"SIMULATED DATA FOR DEMO · NOT FINANCIAL ADVICE · JUDGEAI © 2025 · DEVHACKS S3")
  );
}

// ─────────────────────────────────────────────
// TECHNICALS PAGE
// ─────────────────────────────────────────────
function TechnicalsPage(props) {
  var d=props.d, ai=props.ai;
  var isUp=d.change>=0, priceC=isUp?UP:DN;

  // Safe getters — all TA values may be null on first render
  var safeN=function(v,fallback){return (v!==null&&v!==undefined&&!isNaN(v))?v:(fallback||0);};
  var safeF=function(v,dec,fallback){var n=safeN(v,fallback);return n.toFixed(dec===undefined?2:dec);};

  var lastRSI=safeN(d.lastRSI,50);
  var lastStochK=safeN(d.lastStochK,50);
  var lastWR=safeN(d.lastWR,-50);
  var lastCCI=safeN(d.lastCCI,0);
  var lastMACD=safeN(d.lastMACD,0);
  var lastSignal=safeN(d.lastSignal,0);
  var lastHist=safeN(d.lastHist,0);
  var lastSMA20=safeN(d.lastSMA20,d.price);
  var lastSMA50=safeN(d.lastSMA50,d.price);
  var lastEMA9=safeN(d.lastEMA9,d.price);
  var lastVWAP=safeN(d.lastVWAP,d.price);
  var lastATR=safeN(d.lastATR,0);
  var price=safeN(d.price,0);

  var wrColor=lastWR>-20?DN:lastWR<-80?UP:"rgba(255,255,255,0.6)";
  var cciColor=lastCCI>100?DN:lastCCI<-100?UP:"rgba(255,255,255,0.6)";
  var wrFmt=lastWR.toFixed(1)+" — "+(lastWR>-20?"OB":lastWR<-80?"OS":"NEUTRAL");
  var cciFmt=lastCCI.toFixed(1)+" — "+(lastCCI>100?"OB":lastCCI<-100?"OS":"NEUTRAL");
  var cciVal=Math.min(Math.max(lastCCI+200,0),400);

  var trendRows=[
    ["MACD Line",   lastMACD.toFixed(3),   lastMACD>0?UP:DN],
    ["MACD Signal", lastSignal.toFixed(3), "rgba(255,255,255,0.5)"],
    ["Histogram",   lastHist.toFixed(3),   lastHist>0?UP:DN],
    ["SMA 20",      "$"+lastSMA20.toFixed(2), price>lastSMA20?UP:DN],
    ["SMA 50",      "$"+lastSMA50.toFixed(2), price>lastSMA50?UP:DN],
    ["EMA 9",       "$"+lastEMA9.toFixed(2),  price>lastEMA9?UP:DN],
    ["VWAP",        "$"+lastVWAP.toFixed(2),  price>lastVWAP?UP:DN],
    ["ATR (14)",    "$"+lastATR,              AM],
  ];

  var lastBB=d.lastBB||null;
  var bbRows = lastBB ? [
    ["Upper",  "$"+lastBB.upper, DN],
    ["Middle", "$"+lastBB.mid,   AM],
    ["Lower",  "$"+lastBB.lower, UP],
    ["Width",  "$"+(lastBB.upper-lastBB.lower).toFixed(2), "rgba(255,255,255,0.5)"],
    ["BB %",   (ai.bbPct||0)+"%", AC],
  ] : [];
  var levels=(d.computed&&d.computed.levels)||[];

  return React.createElement("div",{style:{padding:"18px 22px",maxWidth:1380,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}},
    React.createElement("div",{className:"card"},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.12em"}},
          "▸ CANDLESTICK · 60D  |  SMA20 / SMA50 / BOLLINGER"
        ),
        React.createElement("span",{style:{fontSize:13,color:priceC,fontWeight:700}},
          "$"+d.price.toFixed(d.price>100?2:4)+" "+(isUp?"▲":"▼")+Math.abs(d.changePct||0).toFixed(2)+"%"
        )
      ),
      React.createElement(CandleChart,{ohlcv:d.ohlcv,bbArr:(d.computed&&d.computed.bb)||[],sma20:(d.computed&&d.computed.sma20)||[],sma50:(d.computed&&d.computed.sma50)||[],height:295}),
      React.createElement("div",{style:{marginTop:8}},
        React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:3}},"VOLUME"),
        React.createElement(VolChart,{volumes:d.ohlcv.volumes,closes:d.ohlcv.closes,height:52})
      )
    ),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}},
      // Oscillators
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ MOMENTUM OSCILLATORS"),
        React.createElement(IndBar,{label:"RSI (14)",    value:lastRSI,   min:0,max:100,good:[30,70], color:lastRSI>70?DN:lastRSI<30?UP:AC, fmt:function(v){return v+" — "+(v>70?"OVERBOUGHT":v<30?"OVERSOLD":"NEUTRAL");}}),
        React.createElement(IndBar,{label:"STOCH %K",   value:lastStochK,min:0,max:100,good:[20,80], color:lastStochK>80?DN:lastStochK<20?UP:AM, fmt:function(v){return v+" — "+(v>80?"OB":v<20?"OS":"NEUTRAL");}}),
        React.createElement(IndBar,{label:"WILLIAMS %R",value:Math.abs(lastWR),min:0,max:100, color:wrColor, fmt:function(){return wrFmt;}}),
        React.createElement(IndBar,{label:"CCI",        value:cciVal,      min:0,max:400, color:cciColor, fmt:function(){return cciFmt;}})
      ),
      // Trend
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ TREND INDICATORS"),
        trendRows.map(function(row,i){
          return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"0.5px solid rgba(255,255,255,0.05)"}},
            React.createElement("span",{style:{fontSize:10,color:"rgba(255,255,255,0.28)"}},row[0]),
            React.createElement("span",{style:{fontSize:11,color:row[2],fontWeight:600}},row[1])
          );
        })
      ),
      // Bollinger + Levels
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ BOLLINGER & LEVELS"),
        bbRows.length>0&&React.createElement("div",{style:{marginBottom:14}},
          React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:8}},"BOLLINGER BANDS (20,2)"),
          bbRows.map(function(row,i){
            return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid rgba(255,255,255,0.04)"}},
              React.createElement("span",{style:{fontSize:10,color:"rgba(255,255,255,0.28)"}},row[0]),
              React.createElement("span",{style:{fontSize:11,color:row[2],fontWeight:600}},row[1])
            );
          })
        ),
        React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:8}},"KEY PRICE LEVELS"),
        levels.map(function(lvl,i){
          var isR=lvl>d.price;
          var close=Math.abs((lvl-d.price)/d.price)<0.025;
          return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid rgba(255,255,255,0.04)"}},
            React.createElement("span",{style:{fontSize:9,color:close?AM:"rgba(255,255,255,0.25)"}},isR?"RESISTANCE":"SUPPORT",close?" ★":""),
            React.createElement("span",{style:{fontSize:11,color:isR?DN+"cc":UP+"cc",fontWeight:600}},"$"+lvl)
          );
        })
      )
    )
  );
}

// ─────────────────────────────────────────────
// AI TRADER PAGE
// ─────────────────────────────────────────────
var SCORE_CATS=[
  {key:"trend",    label:"Is the price going up?",      max:4},
  {key:"momentum", label:"Is buying energy strong?",    max:4},
  {key:"mean_rev", label:"Is it over or underpriced?",  max:6},
  {key:"volume",   label:"Are big investors buying?",   max:4},
];

function AITraderPage(props) {
  var d=props.d, ai=props.ai, judgment=props.judgment;
  var isUp=d.change>=0, priceC=isUp?UP:DN;
  var dp=d.price>100?2:4;
  var upside=ai.target&&d.price?(((ai.target-d.price)/d.price)*100).toFixed(1):"0.0";
  var downside=ai.stopLoss&&d.price?(((ai.stopLoss-d.price)/d.price)*100).toFixed(1):"0.0";
  return React.createElement("div",{style:{padding:"18px 22px",maxWidth:1380,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}},
    // VERDICT first
    React.createElement(VerdictCard,{d:d,ai:ai}),
    // Header
    React.createElement("div",{className:"gcard"},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}},
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:10,color:AC,letterSpacing:"0.16em",marginBottom:10}},"▸ EXPERIENCED TRADER AI · LIVE MULTI-INDICATOR ANALYSIS"),
          React.createElement("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}},
            React.createElement(Badge,{action:ai.action}),
            React.createElement("div",{style:{padding:"7px 14px",borderRadius:7,background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"monospace"}},
              "SCORE: ",React.createElement("span",{style:{color:ai.raw>0?UP:ai.raw<0?DN:AM,fontWeight:700}},(ai.raw>0?"+":"")+ai.raw+"/"+ai.mx)
            ),
            React.createElement("div",{style:{padding:"7px 14px",borderRadius:7,background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",fontSize:11,color:priceC,fontFamily:"monospace",fontWeight:700}},
              "$"+d.price.toFixed(dp)+" "+(isUp?"▲":"▼")+" "+Math.abs(d.changePct||0).toFixed(2)+"%"
            )
          )
        ),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}},
          [{l:"TARGET",v:"$"+ai.target,c:UP,sub:"+"+upside+"%"},{l:"STOP LOSS",v:"$"+ai.stopLoss,c:DN,sub:downside+"%"},{l:"R:R RATIO",v:ai.riskReward,c:AC,sub:"Risk/Reward"}].map(function(item,i){
            return React.createElement("div",{key:i,style:{background:"rgba("+hex2rgb(item.c)+",0.07)",border:"0.5px solid rgba("+hex2rgb(item.c)+",0.3)",borderRadius:9,padding:"12px 14px",textAlign:"center",minWidth:90}},
              React.createElement("div",{style:{fontSize:8,color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em",marginBottom:5}},item.l),
              React.createElement("div",{style:{fontSize:20,fontWeight:800,fontFamily:"'Syne',sans-serif",color:item.c}},item.v),
              React.createElement("div",{style:{fontSize:9,color:"rgba("+hex2rgb(item.c)+",0.65)",marginTop:3}},item.sub)
            );
          })
        )
      )
    ),
    // Gauges
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}},
      [{val:ai.winProb,label:"Win Probability",color:ai.winProb>60?UP:ai.winProb<40?DN:AM},{val:ai.confidence,label:"Signal Confidence",color:AC},{val:ai.sentimentScore,label:"Composite Sentiment",color:ai.sentimentScore>60?UP:ai.sentimentScore<40?DN:AM}].map(function(g,i){
        return React.createElement("div",{key:i,className:"card",style:{display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 16px"}},
          React.createElement(ArcGauge,{value:g.val,size:130,color:g.color,label:g.label})
        );
      })
    ),
    // Judgment
    React.createElement("div",{className:"gcard"},
      React.createElement("div",{style:{fontSize:10,color:AC,letterSpacing:"0.16em",marginBottom:12}},"▸ WHAT SHOULD YOU DO? — PLAIN ENGLISH EXPLANATION"),
      React.createElement("p",{style:{fontSize:14,lineHeight:1.9,color:"rgba(255,255,255,0.82)",minHeight:80}},
        React.createElement(TypeWriter,{text:judgment||ai.judgment})
      )
    ),
    // Stock comparison table
    React.createElement("div",{className:"card"},
      React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ COMPARE ALL STOCKS — WHICH ONE IS THE BEST BUY RIGHT NOW?"),
      React.createElement("div",{style:{overflowX:"auto"}},
        React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12}},
          React.createElement("thead",null,
            React.createElement("tr",null,
              ["Stock","Price","Today","Verdict","Win %","Stop Loss","Target","Upside"].map(function(h,i){
                return React.createElement("th",{key:i,style:{textAlign:i===0?"left":"center",padding:"8px 10px",fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",borderBottom:"0.5px solid rgba(255,255,255,0.08)",fontWeight:600}},h);
              })
            )
          ),
          React.createElement("tbody",null,
            SYMS.map(function(s){
              var sd=STOCKS[s];
              var sal=computeAI(sd);
              var isCurrent=s===d.sym;
              var isUp2=sd.change>=0;
              var dp2=sd.price>100?2:4;
              var upside2=((sal.target-sd.price)/sd.price*100).toFixed(1);
              var verdColor=sal.action==="STRONG BUY"||sal.action==="BUY"?UP:sal.action==="MILD BUY"?"#6ee7b7":sal.action==="HOLD"?AM:DN;
              return React.createElement("tr",{key:s,style:{background:isCurrent?"rgba(56,189,248,0.06)":"transparent",borderBottom:"0.5px solid rgba(255,255,255,0.05)"}},
                React.createElement("td",{style:{padding:"10px 10px",fontWeight:700,color:isCurrent?AC:"rgba(255,255,255,0.8)",fontSize:12}},
                  s,isCurrent&&React.createElement("span",{style:{fontSize:9,color:AC,marginLeft:6}},"◀ current")
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px",color:"rgba(255,255,255,0.7)",fontFamily:"monospace"}},
                  "$"+sd.price.toFixed(dp2)
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px",color:isUp2?UP:DN,fontFamily:"monospace",fontWeight:600}},
                  (isUp2?"+":"")+sd.changePct.toFixed(2)+"%"
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px"}},
                  React.createElement("span",{style:{padding:"3px 10px",borderRadius:12,background:"rgba("+hex2rgb(verdColor)+",0.12)",border:"0.5px solid rgba("+hex2rgb(verdColor)+",0.35)",fontSize:10,color:verdColor,fontWeight:700}},sal.action)
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px",color:"#fff",fontFamily:"monospace",fontWeight:700}},
                  sal.winProb+"%"
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px",color:DN,fontFamily:"monospace"}},
                  "$"+sal.stopLoss
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px",color:UP,fontFamily:"monospace"}},
                  "$"+sal.target
                ),
                React.createElement("td",{style:{textAlign:"center",padding:"10px 10px",color:parseFloat(upside2)>0?UP:DN,fontFamily:"monospace",fontWeight:600}},
                  (parseFloat(upside2)>0?"+":"")+upside2+"%"
                )
              );
            })
          )
        )
      ),
      React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:10,textAlign:"right"}},"Click any ticker in the nav bar to switch and get the full analysis")
    ),
    // Scores + Evidence
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}},
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:16}},"▸ HOW STRONG IS EACH SIGNAL?"),
        SCORE_CATS.map(function(cat){
          var sc=(ai.scores&&ai.scores[cat.key]!==undefined)?ai.scores[cat.key]:0;
          var pct=Math.round(((sc+cat.max)/(2*cat.max))*100);
          var c=pct>65?UP:pct<35?DN:AM;
          var friendly=pct>65?"Looking good":"Looking weak";
          return React.createElement("div",{key:cat.key,style:{marginBottom:14}},
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:5}},
              React.createElement("span",{style:{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:600}},cat.label),
              React.createElement("span",{style:{fontSize:11,color:c,fontWeight:700}},friendly)
            ),
            React.createElement("div",{style:{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3}},
              React.createElement("div",{style:{width:pct+"%",height:"100%",background:c,borderRadius:3,boxShadow:"0 0 8px "+c+"55",transition:"width 0.8s cubic-bezier(.23,1,.32,1)"}})
            )
          );
        }),
        React.createElement("div",{style:{marginTop:18,paddingTop:14,borderTop:"0.5px solid rgba(255,255,255,0.07)"}},
          React.createElement(SentBar,{value:ai.sentimentScore})
        )
      ),
      React.createElement("div",{className:"card"},
        React.createElement("div",{style:{fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",marginBottom:14}},"▸ WHY IS THE AI SAYING THIS?"),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflowY:"auto",paddingRight:4}},
          (ai.reasons||[]).map(function(r,i){
            return React.createElement("div",{key:i,style:{padding:"10px 14px",borderRadius:9,background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.07)",fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.6}},r);
          })
        )
      )
    )
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  var _sym=useState("AAPL"); var sym=_sym[0], setSym=_sym[1];
  var _page=useState("dashboard"); var page=_page[0], setPage=_page[1];
  var _tick=useState(0); var tickCount=_tick[0], setTickCount=_tick[1];

  var initLive=function(){
    var d={};
    SYMS.forEach(function(s){
      var st=STOCKS[s];
      d[s]={price:st.price,prevClose:st.prevClose,change:st.change,changePct:st.changePct,dayHigh:st.dayHigh,dayLow:st.dayLow,volume:st.volume};
    });
    return d;
  };
  var _live=useState(initLive); var liveData=_live[0], setLiveData=_live[1];

  var initHist=function(){
    var h={};
    SYMS.forEach(function(s){h[s]=[STOCKS[s].price];});
    return h;
  };
  var _hist=useState(initHist); var priceHist=_hist[0], setPriceHist=_hist[1];

  // Stable judgment: only update on sym change or action change
  var _judg=useState(""); var judgment=_judg[0], setJudgment=_judg[1];
  var lastActionRef=useRef("");
  var lastSymRef=useRef(sym);

  var handleSym=function(s){
    if(s===sym)return;
    setSym(s);
    setPage("dashboard");
    lastActionRef.current="";
    lastSymRef.current=s;
  };

  // Tick loop
  useEffect(function(){
    var id=setInterval(function(){
      setLiveData(function(prev){
        var next={};
        SYMS.forEach(function(s){next[s]=nextTick(prev[s],SEED[s]);});
        setPriceHist(function(ph){
          var nph={};
          SYMS.forEach(function(s){nph[s]=[].concat((ph[s]||[]).slice(-180),[next[s].price]);});
          return nph;
        });
        return next;
      });
      setTickCount(function(c){return c+1;});
    },2000);
    return function(){clearInterval(id);};
  },[]);

  var base=STOCKS[sym];
  var live=liveData[sym]||{};
  var d=Object.assign({},base,live);
  var ai=computeAI(d);
  var hist=priceHist[sym]||[d.price];

  // Update judgment when action or sym changes
  useEffect(function(){
    if(ai.action!==lastActionRef.current||sym!==lastSymRef.current){
      lastActionRef.current=ai.action;
      lastSymRef.current=sym;
      setJudgment(ai.judgment);
    }
  },[ai.action,sym]);

  // Init judgment
  useEffect(function(){setJudgment(ai.judgment);},[]);

  return React.createElement("div",{style:{background:"#080c1a",minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:"#e2e8f0"}},
    React.createElement("style",null,`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.75)}}
      @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:1}}
      @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      .card{background:rgba(255,255,255,.025);border:.5px solid rgba(255,255,255,.07);border-radius:13px;padding:18px 20px}
      .gcard{background:rgba(56,189,248,.03);border:.5px solid rgba(56,189,248,.13);border-radius:13px;padding:18px 20px}
      button:hover{filter:brightness(1.2)}
      ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}
    `),
    React.createElement(Nav,{page:page,setPage:setPage,sym:sym,setSym:handleSym,liveData:liveData,tickCount:tickCount}),
    React.createElement(Tape,{liveData:liveData}),
    page==="dashboard"  && React.createElement(DashboardPage, {d:d,ai:ai,hist:hist}),
    page==="technicals" && React.createElement(TechnicalsPage,{d:d,ai:ai}),
    page==="ai-trader"  && React.createElement(AITraderPage,  {d:d,ai:ai,judgment:judgment||ai.judgment}),
    React.createElement(Chatbot,{d:d,ai:ai,sym:sym})
  );
}
