export type AssetClass = "equity" | "crypto";
export type Interval = "1d";
export type Bar = { time: string; open: number; high: number; low: number; close: number; volume: number };
export type Instrument = { id: string; assetClass: AssetClass; exchange: string; providerSymbol: string; fallbackSymbol?: string };
export type HistoricalRequest = { instrumentId: string; startDate?: string; endDate?: string; interval?: Interval; lookback: number };
export type HistoricalResult = {
  instrument: Instrument; interval: Interval; bars: Bar[]; source: string; sourceStatus: "historical";
  fetchedAt: string; lastBarAt: string; requestedRange: { startDate: string; endDate: string };
  cache: "hit" | "miss"; fallbackFrom?: string;
  adjustmentStatus: "provider-dependent; not independently verified";
  quality: { gapCount: number; outlierCount: number; invalidCount: number; duplicateCount: number; stale: boolean; warnings: string[] };
};
type ProviderName = "Binance" | "Twelve Data" | "Alpha Vantage";
type ProviderIssue = { provider: ProviderName; status?: number; code?: string; category: string; detail: string; responseBody?: string };
type CacheEntry = { result: Omit<HistoricalResult, "cache">; expiresAt: number };
type Dependencies = { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch; now?: () => Date; cache?: Map<string, CacheEntry> };
const DAY = 86_400_000;
const CACHE = new Map<string, CacheEntry>();
export const INSTRUMENTS: Record<string, Instrument> = {
  "NASDAQ:AAPL": { id: "NASDAQ:AAPL", assetClass: "equity", exchange: "NASDAQ", providerSymbol: "AAPL" },
  "NASDAQ:NVDA": { id: "NASDAQ:NVDA", assetClass: "equity", exchange: "NASDAQ", providerSymbol: "NVDA" },
  "NASDAQ:MSFT": { id: "NASDAQ:MSFT", assetClass: "equity", exchange: "NASDAQ", providerSymbol: "MSFT" },
  "AMEX:SPY": { id: "AMEX:SPY", assetClass: "equity", exchange: "NYSE Arca", providerSymbol: "SPY" },
  "BINANCE:BTCUSDT": { id: "BINANCE:BTCUSDT", assetClass: "crypto", exchange: "Binance", providerSymbol: "BTCUSDT", fallbackSymbol: "BTC/USD" },
  "BINANCE:ETHUSDT": { id: "BINANCE:ETHUSDT", assetClass: "crypto", exchange: "Binance", providerSymbol: "ETHUSDT", fallbackSymbol: "ETH/USD" },
  "BINANCE:SOLUSDT": { id: "BINANCE:SOLUSDT", assetClass: "crypto", exchange: "Binance", providerSymbol: "SOLUSDT", fallbackSymbol: "SOL/USD" },
  "BINANCE:BNBUSDT": { id: "BINANCE:BNBUSDT", assetClass: "crypto", exchange: "Binance", providerSymbol: "BNBUSDT", fallbackSymbol: "BNB/USD" },
};
export class MarketDataError extends Error {
  readonly issues: ProviderIssue[]; readonly status: number;
  constructor(issues: ProviderIssue[]) {
    const summary = issues.map((i) => `${i.provider}: ${i.detail}${i.status ? ` (HTTP ${i.status})` : ""}`).join("; ");
    super(`Historical data unavailable. ${summary || "No configured provider is available."}`);
    this.name = "MarketDataError"; this.issues = issues; this.status = issues.at(-1)?.category === "rate_limit" ? 503 : 502;
  }
}
export function clearMarketDataCache(cache = CACHE) { cache.clear(); }
function isoDay(date: Date) { return date.toISOString().slice(0, 10); }
function dateRange(request: HistoricalRequest, now: Date) {
  const endDate = request.endDate ?? isoDay(now);
  const startDate = request.startDate ?? isoDay(new Date(Date.parse(`${endDate}T00:00:00.000Z`) - Math.ceil(request.lookback * 1.8) * DAY));
  const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))&&isoDay(new Date(`${value}T00:00:00.000Z`))===value;
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) throw new Error("Date range must use valid YYYY-MM-DD dates with startDate on or before endDate.");
  return { startDate, endDate };
}
function normalize(raw: Bar[]) {
  const byDate = new Map<string, Bar>();
  let invalidCount=0,duplicateCount=0;
  for (const x of Array.isArray(raw) ? raw : []) {
    const b = { time: String(x.time ?? "").slice(0, 10), open: Number(x.open), high: Number(x.high), low: Number(x.low), close: Number(x.close), volume: Number(x.volume) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.time) || ![b.open,b.high,b.low,b.close,b.volume].every(Number.isFinite)||b.close<=0||b.open<=0||b.low<=0||b.high<=0||b.volume<0||b.low>Math.min(b.open,b.close)||b.high<Math.max(b.open,b.close)||b.low>b.high) { invalidCount++; continue; }
    if(byDate.has(b.time))duplicateCount++;
    byDate.set(b.time, b);
  }
  return {bars:[...byDate.values()].sort((a,b)=>a.time.localeCompare(b.time)),invalidCount,duplicateCount};
}
function quality(bars: Bar[],invalidCount:number,duplicateCount:number,stale:boolean) {
  let gapCount=0,outlierCount=0;
  for(let i=1;i<bars.length;i++) { if((Date.parse(`${bars[i].time}T00:00:00Z`)-Date.parse(`${bars[i-1].time}T00:00:00Z`))/DAY>5)gapCount++; if(Math.abs(bars[i].close/bars[i-1].close-1)>.75)outlierCount++; }
  const warnings:string[]=[]; if(gapCount)warnings.push(`${gapCount} calendar gaps over five days; check for missing sessions or provider coverage.`); if(outlierCount)warnings.push(`${outlierCount} daily moves exceed 75%; verify corporate actions and source data before interpretation.`); if(invalidCount)warnings.push(`${invalidCount} invalid OHLCV observations were excluded.`); if(duplicateCount)warnings.push(`${duplicateCount} duplicate timestamps were removed.`); if(stale)warnings.push("The latest provider bar is more than seven days old relative to the requested current date.");
  return {gapCount,outlierCount,invalidCount,duplicateCount,stale,warnings};
}
function issueDetail(status: number | undefined, body: string) {
  if(status===401)return "provider authentication failed; check the configured API key";
  if(status===403)return "provider denied access or the account lacks the required entitlement";
  if(status===404)return "provider endpoint or instrument was not found";
  if(status===429)return "provider rate limit or quota was reached";
  if(status&&status>=500)return "provider server error";
  return body.replace(/\b(?:apikey|api_key|token|authorization)[=:" ]+[^&\s,"}]+/gi,"[credential redacted]").slice(0,240)||"provider returned an invalid or empty response";
}
function safeBody(body: string, apiKey?: string) {
  let safe=body;
  if(apiKey)safe=safe.split(apiKey).join("[credential redacted]");
  return safe.replace(/\b(?:apikey|api_key|token|authorization)[=:" ]+[^&\s,"}]+/gi,"[credential redacted]").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[email redacted]").slice(0,500);
}
class ProviderFailure extends Error { readonly issue: ProviderIssue; constructor(issue: ProviderIssue) { super(issue.detail); this.issue=issue; this.name="ProviderFailure"; } }
async function readProvider(provider: ProviderName,url: URL,apiKey: string|undefined,fetchImpl: typeof fetch) {
  if(apiKey)url.searchParams.set("apikey",apiKey);
  for(let attempt=0;attempt<2;attempt++) {
    try {
      const response=await fetchImpl(url,{signal:AbortSignal.timeout(8000),cache:"no-store"}); const body=await response.text();
      if(!response.ok) { const issue={provider,status:response.status,category:response.status===429?"rate_limit":response.status===403?"access_denied":response.status===401?"authentication":response.status>=500?"server_error":"request_error",detail:issueDetail(response.status,body),responseBody:safeBody(body,apiKey)}; if(response.status>=500&&attempt===0){await new Promise(r=>setTimeout(r,180));continue;} throw new ProviderFailure(issue); }
      let json:any; try{json=JSON.parse(body);}catch{throw new ProviderFailure({provider,status:response.status,category:"invalid_response",detail:"provider response was not valid JSON"});}
      if(json.status==="error"||json.Note||json.Information||json["Error Message"]) { const msg=String(json.message??json.Note??json.Information??json["Error Message"]); const category=/premium|entitlement|permission|access/i.test(msg)?"access_denied":/rate|frequency|limit|quota/i.test(msg)?"rate_limit":/api.?key|invalid key/i.test(msg)?"authentication":"provider_error"; throw new ProviderFailure({provider,status:response.status,code:json.code==null?undefined:String(json.code),category,detail:issueDetail(undefined,msg),responseBody:safeBody(body,apiKey)}); }
      return json;
    } catch(error) { if(error instanceof ProviderFailure)throw error; const timeout=error instanceof Error&&error.name==="TimeoutError"; if(timeout&&attempt===0){await new Promise(r=>setTimeout(r,180));continue;} throw new ProviderFailure({provider,category:timeout?"timeout":"network_error",detail:timeout?"provider request timed out":"network request failed"}); }
  }
  throw new ProviderFailure({provider,category:"unknown",detail:"request failed"});
}
function parseTwelve(json:any):Bar[]{return(json.values??[]).map((x:any)=>({time:x.datetime,open:x.open,high:x.high,low:x.low,close:x.close,volume:x.volume}));}
function parseAlpha(json:any):Bar[]{const k=Object.keys(json).find(x=>x.toLowerCase().includes("time series"));if(!k)return[];return Object.entries(json[k] as Record<string,any>).map(([time,x])=>({time,open:x["1. open"],high:x["2. high"],low:x["3. low"],close:x["4. close"],volume:x["5. volume"]}));}
function parseBinance(json:any):Bar[]{return(Array.isArray(json)?json:[]).map((x:any[])=>({time:isoDay(new Date(Number(x[0]))),open:x[1],high:x[2],low:x[3],close:x[4],volume:x[5]}));}
export async function getHistoricalBars(request: HistoricalRequest, dependencies: Dependencies = {}): Promise<HistoricalResult> {
  const instrument=INSTRUMENTS[request.instrumentId]; if(!instrument)throw new Error(`Unsupported instrument: ${request.instrumentId}`);
  if(request.interval&&request.interval!=="1d")throw new Error("Only the 1d interval is currently supported by this historical model feed.");
  if(!Number.isInteger(request.lookback)||request.lookback<1||request.lookback>500)throw new Error("lookback must be an integer between 1 and 500.");
  const now=dependencies.now?.()??new Date(); const range=dateRange(request,now); const cache=dependencies.cache??CACHE; const key=[instrument.id,"1d",range.startDate,range.endDate,request.lookback].join("|");
  const hit=cache.get(key);if(hit&&hit.expiresAt>now.getTime())return{...hit.result,cache:"hit"};if(hit)cache.delete(key);
  const fetchImpl=dependencies.fetchImpl??fetch;const env=dependencies.env??process.env;const issues:ProviderIssue[]=[];const providers:ProviderName[]=instrument.assetClass==="crypto"?["Binance","Twelve Data"]:["Twelve Data","Alpha Vantage"];
  for(const provider of providers) {
    const apiKey=provider==="Twelve Data"?env.TWELVE_DATA_API_KEY:provider==="Alpha Vantage"?env.ALPHA_VANTAGE_API_KEY:undefined;
    if(provider!=="Binance"&&!apiKey){issues.push({provider,category:"not_configured",detail:`${provider} API key is not configured`});continue;}
    try {
      let raw:Bar[];
      if(provider==="Binance") {const url=new URL("https://api.binance.com/api/v3/klines");url.searchParams.set("symbol",instrument.providerSymbol);url.searchParams.set("interval","1d");url.searchParams.set("startTime",String(Date.parse(`${range.startDate}T00:00:00Z`)));url.searchParams.set("endTime",String(Date.parse(`${range.endDate}T23:59:59Z`)));url.searchParams.set("limit","1000");raw=parseBinance(await readProvider(provider,url,undefined,fetchImpl));}
      else if(provider==="Twelve Data"){const url=new URL("https://api.twelvedata.com/time_series");url.searchParams.set("symbol",instrument.fallbackSymbol??instrument.providerSymbol);url.searchParams.set("exchange",instrument.assetClass==="crypto"?"Binance":instrument.exchange==="NYSE Arca"?"NYSE":instrument.exchange);url.searchParams.set("interval","1day");url.searchParams.set("start_date",range.startDate);url.searchParams.set("end_date",range.endDate);url.searchParams.set("order","ASC");raw=parseTwelve(await readProvider(provider,url,apiKey,fetchImpl));}
      else{const url=new URL("https://www.alphavantage.co/query");url.searchParams.set("function","TIME_SERIES_DAILY");url.searchParams.set("symbol",instrument.providerSymbol);url.searchParams.set("outputsize","full");raw=parseAlpha(await readProvider(provider,url,apiKey,fetchImpl));}
      const normalized=normalize(raw);const bars=normalized.bars.filter(x=>x.time>=range.startDate&&x.time<=range.endDate).slice(-request.lookback);
      const minimumBars=Math.max(2,request.lookback-5);
      if(bars.length<minimumBars)throw new ProviderFailure({provider,category:"insufficient_data",detail:`provider returned ${bars.length} valid observations; at least ${minimumBars} are required for the selected model lookback`});
      const fetchedAt=now.toISOString();const lastBarAt=bars.at(-1)!.time;const stale=range.endDate===isoDay(now)&&(now.getTime()-Date.parse(`${lastBarAt}T00:00:00.000Z`))/(DAY)>7;
      const result:Omit<HistoricalResult,"cache">={instrument,interval:"1d",bars,source:provider,sourceStatus:"historical",fetchedAt,lastBarAt,requestedRange:range,adjustmentStatus:"provider-dependent; not independently verified",...(issues.some(x=>x.category!=="not_configured")?{fallbackFrom:issues.find(x=>x.category!=="not_configured")!.provider}:{}),quality:quality(bars,normalized.invalidCount,normalized.duplicateCount,stale)};
      cache.set(key,{result,expiresAt:now.getTime()+(instrument.assetClass==="crypto"?5:15)*60_000});return{...result,cache:"miss"};
    } catch(error) {const issue=error instanceof ProviderFailure?error.issue:{provider,category:"normalization",detail:error instanceof Error?error.message:"provider response could not be validated"};issues.push(issue);console.warn("[MARKET_DATA_PROVIDER_FAILURE]",{provider:issue.provider,status:issue.status,code:issue.code,category:issue.category,detail:issue.detail,responseBody:issue.responseBody});}
  }
  throw new MarketDataError(issues);
}

