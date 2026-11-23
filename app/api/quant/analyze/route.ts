import { NextRequest, NextResponse } from "next/server";
import { getHistoricalBars, INSTRUMENTS, MarketDataError } from "@/lib/market-data";

export const runtime = "nodejs";

type Model = "stochastic-volatility" | "hmm" | "machine-learning" | "sabr";

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function returns(bars: { close: number }[]) { return bars.slice(1).map((bar, i) => Math.log(bar.close / bars[i].close)); }
function mean(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length); }
function variance(values: number[]) { const avg = mean(values); return mean(values.map((value) => (value - avg) ** 2)); }
function quantile(values: number[], q: number) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))] ?? 0; }

function fitHmm(emissions: number[]) {
  const means = [quantile(emissions, .2), quantile(emissions, .55), quantile(emissions, .9)];
  const globalVar = Math.max(variance(emissions), 1e-8);
  let vars = [globalVar, globalVar, globalVar];
  let transition = [[.86,.1,.04],[.08,.84,.08],[.04,.1,.86]];
  let initial = [1/3,1/3,1/3];
  let gamma: number[][] = [];
  for (let iteration = 0; iteration < 18; iteration++) {
    const emit = emissions.map((value) => means.map((avg, state) => Math.exp(-((value-avg)**2)/(2*Math.max(vars[state],1e-8))) / Math.sqrt(2*Math.PI*Math.max(vars[state],1e-8))));
    const alpha = Array.from({length: emissions.length}, () => [0,0,0]); const scale = Array(emissions.length).fill(0);
    for (let s=0;s<3;s++) alpha[0][s]=initial[s]*emit[0][s]; scale[0]=Math.max(alpha[0].reduce((a,b)=>a+b,0),1e-300); alpha[0]=alpha[0].map((x)=>x/scale[0]);
    for(let t=1;t<emissions.length;t++){for(let j=0;j<3;j++)alpha[t][j]=emit[t][j]*alpha[t-1].reduce((sum,a,i)=>sum+a*transition[i][j],0);scale[t]=Math.max(alpha[t].reduce((a,b)=>a+b,0),1e-300);alpha[t]=alpha[t].map((x)=>x/scale[t]);}
    const beta=Array.from({length:emissions.length},()=>[1,1,1]);
    for(let t=emissions.length-2;t>=0;t--)for(let i=0;i<3;i++)beta[t][i]=transition[i].reduce((sum,p,j)=>sum+p*emit[t+1][j]*beta[t+1][j],0)/scale[t+1];
    gamma=alpha.map((row,t)=>{const g=row.map((x,s)=>x*beta[t][s]);const z=Math.max(g.reduce((a,b)=>a+b,0),1e-300);return g.map(x=>x/z)});
    const counts=Array.from({length:3},()=>[1,1,1]);
    for(let t=0;t<emissions.length-1;t++){const denom=alpha[t].reduce((sum,a,i)=>sum+a*transition[i].reduce((inner,p,j)=>inner+p*emit[t+1][j]*beta[t+1][j],0),0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)counts[i][j]+=alpha[t][i]*transition[i][j]*emit[t+1][j]*beta[t+1][j]/Math.max(denom,1e-300);}
    transition=counts.map(row=>{const z=row.reduce((a,b)=>a+b,0);return row.map(x=>x/z)});
    initial=gamma[0];
    for(let s=0;s<3;s++){const weight=gamma.reduce((sum,row)=>sum+row[s],0);means[s]=gamma.reduce((sum,row,t)=>sum+row[s]*emissions[t],0)/Math.max(weight,1e-12);vars[s]=Math.max(gamma.reduce((sum,row,t)=>sum+row[s]*(emissions[t]-means[s])**2,0)/Math.max(weight,1e-12),1e-8);}
  }
  const order=[0,1,2].sort((a,b)=>means[a]-means[b]);
  const map=order.map((old)=>old); const probabilities=gamma.at(-1) ?? [0,0,0];
  return { probabilities:map.map((state)=>probabilities[state]), transition:map.map((i)=>map.map((j)=>transition[i][j])), states:gamma.map((row)=>map.indexOf(row.indexOf(Math.max(...row)))) };
}

function solve(matrix: number[][], vector: number[]) {
  const n=vector.length; const a=matrix.map((row,i)=>[...row,vector[i]]);
  for(let i=0;i<n;i++){let pivot=i;for(let r=i+1;r<n;r++)if(Math.abs(a[r][i])>Math.abs(a[pivot][i]))pivot=r;[a[i],a[pivot]]=[a[pivot],a[i]];const d=a[i][i]||1e-10;for(let c=i;c<=n;c++)a[i][c]/=d;for(let r=0;r<n;r++)if(r!==i){const f=a[r][i];for(let c=i;c<=n;c++)a[r][c]-=f*a[i][c];}}
  return a.map((row)=>row[n]);
}

function ridgeFit(xs: number[][], ys: number[], lambda=1e-3) {
  const p=xs[0].length+1;const gram=Array.from({length:p},()=>Array(p).fill(0));const rhs=Array(p).fill(0);
  for(let n=0;n<xs.length;n++){const row=[1,...xs[n]];for(let i=0;i<p;i++){rhs[i]+=row[i]*ys[n];for(let j=0;j<p;j++)gram[i][j]+=row[i]*row[j];}}
  for(let i=1;i<p;i++)gram[i][i]+=lambda;
  return solve(gram,rhs);
}

export async function POST(request: NextRequest) {
  let body: { model?: Model; symbol?: string; lookback?: number; horizon?: number };
  try { body = await request.json(); } catch { return fail("Request body must be valid JSON."); }
  const model=body.model;const symbol=body.symbol;const lookback=Number(body.lookback??252);const horizon=Number(body.horizon??20);
  if(!["stochastic-volatility","hmm","machine-learning","sabr"].includes(model??""))return fail("Choose a supported model.");
  if(!symbol||!INSTRUMENTS[symbol])return fail("This instrument is not currently supported for quantitative analysis. Supported markets: selected U.S. equities and Binance crypto pairs.");
  if(!Number.isInteger(lookback)||lookback<90||lookback>500)return fail("Lookback must be between 90 and 500 daily bars.");
  if(!Number.isInteger(horizon)||horizon<1||horizon>60)return fail("Forecast horizon must be between 1 and 60 days.");
  if(model==="sabr")return NextResponse.json({error:"SABR calibration is unavailable because this workspace has no options-chain or implied-volatility-surface feed. No calibrated smile was generated.",missing:"Options quotes, forward price, expiry, and market implied volatilities",simulatedAvailable:true},{status:422});
  try {
    const dataset=await getHistoricalBars({instrumentId:symbol,lookback:Math.min(lookback+5,500),interval:"1d"});
    const bars=dataset.bars;
    if(bars.length<Math.max(90,Math.floor(lookback*.8)))return fail(`Only ${bars.length} valid daily observations were returned; at least ${Math.max(90,Math.floor(lookback*.8))} are required. No model result was generated.`,422);
    const sample=bars.slice(-lookback);const rs=returns(sample);const updatedAt=dataset.fetchedAt;const base={symbol,assetClass:dataset.instrument.assetClass,exchange:dataset.instrument.exchange,source:dataset.source,dataStatus:dataset.sourceStatus,interval:dataset.interval,updatedAt,fetchedAt:dataset.fetchedAt,lastBarAt:dataset.lastBarAt,requestedRange:dataset.requestedRange,cache:dataset.cache,fallbackFrom:dataset.fallbackFrom,quality:dataset.quality,bars:sample.map(({time,close})=>({time,close})),lookback:sample.length,horizon,modelVersion:"valtiera-quant-0.2.0"};
    if(model==="stochastic-volatility"){
      const rv=rs.map((_,i)=>Math.sqrt(mean(rs.slice(Math.max(0,i-19),i+1).map((x)=>x*x))*252));const pairs=rv.slice(1).map((v,i)=>[rv[i],v-rv[i]] as const);const xmean=mean(pairs.map(x=>x[0])),ymean=mean(pairs.map(x=>x[1]));const slope=pairs.reduce((s,p)=>s+(p[0]-xmean)*(p[1]-ymean),0)/Math.max(1e-12,pairs.reduce((s,p)=>s+(p[0]-xmean)**2,0));const kappa=Math.max(.01,Math.min(5,-slope*252));const theta=Math.max(.01,Math.min(3,Math.sqrt(Math.max(0,mean(rv.map(v=>v*v))))));const current=rv.at(-1)??0;const residualSd=Math.sqrt(variance(pairs.map(p=>p[1]-ymean-slope*(p[0]-xmean)))*252);const forecast=Array.from({length:horizon},(_,i)=>{const d=i+1;const center=Math.sqrt(Math.max(0,theta**2+(current**2-theta**2)*Math.exp(-kappa*d/252)));const width=Math.min(.8,residualSd*Math.sqrt(d/252));return{day:d,volatility:center,lower:Math.max(0,center-width),upper:center+width};});
      return NextResponse.json({...base,model,findings:{currentVolatility:current,longRunVolatility:theta,meanReversionSpeed:kappa,historicalVolatility:rv.slice(-100),forecast,assumptions:["Daily log returns are used; annualization assumes 252 trading sessions.","A mean-reverting variance approximation is fit to rolling realized volatility; this is not a full likelihood-calibrated Heston process.","Intervals are approximate residual-based bands, not guaranteed coverage."],validation:"Parameter fit uses the selected historical lookback. No walk-forward forecast validation has been run."}});
    }
    if(model==="hmm"){
      const emissions=rs.map((_,i)=>Math.abs(rs[i]));const fit=fitHmm(emissions);const names=["Low volatility","Moderate volatility","High volatility"];const currentIndex=fit.probabilities.indexOf(Math.max(...fit.probabilities));const direction=mean(rs.slice(-20));const directionLabel=direction>0.0007?"upward drift":direction<-.0007?"downward drift":"sideways drift";
      return NextResponse.json({...base,model,findings:{regimes:names,probabilities:fit.probabilities,transition:fit.transition,currentRegime:names[currentIndex],direction:directionLabel,history:fit.states.slice(-120),confidence:Math.max(...fit.probabilities),assumptions:["Three-state Gaussian HMM is estimated on absolute daily returns using Baum–Welch EM.","Regime labels are ordered by fitted emission mean; they describe volatility levels, not guaranteed market states.","Direction is a separate trailing-return descriptor and is not an HMM directional forecast."],validation:"In-sample maximum-likelihood state fit; no out-of-sample regime validation has been run."}});
    }
    const features: number[][]=[];const targets:number[]=[];for(let i=5;i<rs.length;i++){features.push(rs.slice(i-5,i));targets.push(rs[i]);}const split=Math.max(30,Math.floor(features.length*.8));const coefficients=ridgeFit(features.slice(0,split),targets.slice(0,split));const predictions:number[]=[];for(let i=split;i<features.length;i++){const beta=ridgeFit(features.slice(0,i),targets.slice(0,i));predictions.push(beta[0]+features[i].reduce((s,x,j)=>s+x*beta[j+1],0));}const actual=targets.slice(split);const mae=mean(predictions.map((p,i)=>Math.abs(p-actual[i])));const baseline=mean(actual.map(Math.abs));const last=rs.slice(-5);const pred=coefficients[0]+last.reduce((s,x,j)=>s+x*coefficients[j+1],0);const residuals=actual.map((x,i)=>x-predictions[i]);const sigma=Math.sqrt(variance(residuals));let state=[...last];let cumulativeReturn=0;const scenarios=Array.from({length:horizon},(_,i)=>{const daily=coefficients[0]+state.reduce((s,x,j)=>s+x*coefficients[j+1],0);state=[daily,...state.slice(0,4)];cumulativeReturn+=daily;const width=1.96*sigma*Math.sqrt(i+1);return{day:i+1,medianReturn:Math.exp(cumulativeReturn)-1,lowerReturn:Math.exp(cumulativeReturn-width)-1,upperReturn:Math.exp(cumulativeReturn+width)-1};});
    return NextResponse.json({...base,model,findings:{predictedNextDayReturn:pred,scenarios,mae,zeroBaselineMae:baseline,directionalAccuracy:predictions.filter((p,i)=>Math.sign(p)===Math.sign(actual[i])).length/Math.max(1,actual.length),trainObservations:split,testObservations:actual.length,featureImportance:coefficients.slice(1).map((value,i)=>({feature:`Return lag ${i+1}`,coefficient:value})),assumptions:["A ridge regression uses five lagged daily returns; features use only observations before each target.","The displayed scenario iterates this small autoregressive model and accumulates residual-based intervals.","This is a baseline research model, not XGBoost, LSTM, transformer or production-grade ensemble."],validation:"Expanding-window one-step predictions over the final 20% of available samples; MAE and direction hit rate are historical sample metrics and do not imply future performance."}});
  } catch(error) {
    if(error instanceof MarketDataError){
      console.error("[QUANT_MARKET_DATA_ERROR]",{symbol,issues:error.issues});
      return fail(error.message,error.status);
    }
    console.error("[QUANT_ANALYSIS_ERROR]",{symbol,message:error instanceof Error?error.message:"Unknown analysis failure"});
    return fail(error instanceof Error?error.message:"Quantitative analysis failed.",500);
  }
}
