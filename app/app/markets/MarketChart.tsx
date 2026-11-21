"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChartNoAxesCombined, Maximize2, Minimize2, Star } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const markets = {
  Stocks: [["NASDAQ:AAPL", "Apple"], ["NASDAQ:NVDA", "NVIDIA"], ["NASDAQ:MSFT", "Microsoft"], ["AMEX:SPY", "S&P 500 ETF"], ["NYSE:BRK.B", "Berkshire Hathaway"]],
  Crypto: [["BINANCE:BTCUSDT", "Bitcoin / USDT"], ["BINANCE:ETHUSDT", "Ethereum / USDT"], ["BINANCE:SOLUSDT", "Solana / USDT"], ["COINBASE:BTCUSD", "Bitcoin / USD"], ["BINANCE:BNBUSDT", "BNB / USDT"]],
  Forex: [["FX:EURUSD", "EUR / USD"], ["FX:GBPUSD", "GBP / USD"], ["FX:USDJPY", "USD / JPY"], ["FX:AUDUSD", "AUD / USD"]],
  Indices: [["SP:SPX", "S&P 500"], ["NASDAQ:NDX", "Nasdaq 100"], ["DJ:DJI", "Dow Jones"], ["TVC:DXY", "US Dollar Index"]],
  Commodities: [["COMEX:GC1!", "Gold Futures"], ["NYMEX:CL1!", "Crude Oil Futures"], ["COMEX:SI1!", "Silver Futures"]],
  Futures: [["CME_MINI:ES1!", "E-mini S&P 500"], ["CME_MINI:NQ1!", "E-mini Nasdaq 100"], ["CBOT:ZB1!", "30Y T-Bond"], ["CME:BTC1!", "Bitcoin Futures"]]
} as const;
type Category = keyof typeof markets;

export function MarketChart() {
  const [category, setCategory] = useState<Category>("Stocks");
  const [symbol, setSymbol] = useState<string>(markets.Stocks[0][0]);
  const [uid,setUid]=useState<string|null>(null),[watchlist,setWatchlist]=useState<{id:string;symbol:string;asset_type:string}[]>([]),[fullscreen,setFullscreen]=useState(false),[watchError,setWatchError]=useState("");
  const card=useRef<HTMLElement>(null),client=useMemo(()=>{try{return supabaseBrowser()}catch{return null}},[]);
  const selected = Object.values(markets).flat().find(([ticker]) => ticker === symbol)?.[1] ?? symbol;
  const assetType:Record<Category,string>={Stocks:"stock",Crypto:"crypto",Forex:"forex",Indices:"index",Commodities:"commodity",Futures:"future"};
  useEffect(()=>{if(!client)return;void client.auth.getUser().then(async({data})=>{setUid(data.user?.id??null);if(data.user){const r=await client.from("watchlists").select("id,symbol,asset_type").eq("user_id",data.user.id).order("created_at");if(!r.error)setWatchlist(r.data)}})},[client]);
  useEffect(()=>{const onChange=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener("fullscreenchange",onChange);return()=>document.removeEventListener("fullscreenchange",onChange)},[]);
  async function toggleWatch(){if(!client||!uid){setWatchError("Sign in to sync a personal watchlist.");return}setWatchError("");const found=watchlist.find(x=>x.symbol===symbol);const r=found?await client.from("watchlists").delete().eq("id",found.id):await client.from("watchlists").insert({user_id:uid,symbol,asset_type:assetType[category]}).select("id,symbol,asset_type").single();if(r.error)setWatchError(r.error.message);else if(found)setWatchlist(items=>items.filter(x=>x.id!==found.id));else if("data" in r&&r.data)setWatchlist(items=>[...items,r.data])}
  return <section className={fullscreen?"tv-card chart-fullscreen":"tv-card"} ref={card}>
    <div className="chart-toolbar market-category-toolbar"><div className="chart-kind-switch" aria-label="Market category">{(Object.keys(markets) as Category[]).map(item => <button key={item} className={item === category ? "selected" : ""} onClick={() => { setCategory(item); setSymbol(markets[item][0][0]); }}>{item}</button>)}</div></div>
    <div className="chart-asset-heading"><div><span>{category.toUpperCase()} · TRADINGVIEW ADVANCED CHART</span><h2>{selected}</h2></div><div className="chart-actions"><span className="demo-tag">PROVIDER DATA · STATUS SHOWN IN CHART</span><button className={watchlist.some(x=>x.symbol===symbol)?"watch-symbol active":"watch-symbol"} onClick={()=>void toggleWatch()} aria-label="Add or remove from watchlist"><Star size={15}/>{watchlist.some(x=>x.symbol===symbol)?"Watching":"Watch"}</button><button className="watch-symbol" onClick={()=>{if(!document.fullscreenElement)void card.current?.requestFullscreen();else void document.exitFullscreen()}} aria-label={fullscreen?"Exit full screen":"Expand chart to full screen"}>{fullscreen?<Minimize2 size={15}/>:<Maximize2 size={15}/>}<span>{fullscreen?"Exit":"Expand"}</span></button></div></div>
    <TradingViewEmbed symbol={symbol} />
    <div className="tv-attribution"><span><ChartNoAxesCombined size={13}/> Price, movement, and any provider delay are labeled in the chart. Data availability depends on the market.</span><a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`} target="_blank" rel="noreferrer">Open in TradingView <ArrowUpRight size={12}/></a></div>
    <div className="chart-market-select"><label htmlFor="market-symbol">Quick symbol</label><select id="market-symbol" value={symbol} onChange={e => setSymbol(e.target.value)}>{markets[category].map(([ticker, name]) => <option key={ticker} value={ticker}>{name} · {ticker}</option>)}</select><span>Use the chart’s symbol search to find additional instruments and exchanges.</span></div>
    {watchlist.length>0&&<div className="market-watchlist"><b>YOUR WATCHLIST</b>{watchlist.map(item=><button key={item.id} onClick={()=>{setSymbol(item.symbol);const found=(Object.entries(markets) as [Category,readonly (readonly [string,string])[]][]).find(([,symbols])=>symbols.some(([s])=>s===item.symbol));if(found)setCategory(found[0])}}>{item.symbol}</button>)}<a href="/app/profile">Manage in your profile</a></div>}{watchError&&<p className="watch-error">{watchError}</p>}
  </section>;
}

function TradingViewEmbed({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const widget = document.createElement("div"); widget.className = "tradingview-widget-container__widget"; ref.current.appendChild(widget);
    const script = document.createElement("script"); script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"; script.async = true; script.type = "text/javascript";
    script.text = JSON.stringify({ autosize: true, symbol, interval: "D", timezone: "Etc/UTC", theme: "light", style: "1", locale: "en", backgroundColor: "#ffffff", gridColor: "rgba(0,0,0,0.06)", overrides: { "paneProperties.background": "#ffffff", "paneProperties.vertGridProperties.color": "rgba(0,0,0,0.06)", "paneProperties.horzGridProperties.color": "rgba(0,0,0,0.06)", "mainSeriesProperties.candleStyle.upColor": "#2B2644", "mainSeriesProperties.candleStyle.downColor": "#A13B3B", "mainSeriesProperties.candleStyle.borderUpColor": "#2B2644", "mainSeriesProperties.candleStyle.borderDownColor": "#A13B3B", "mainSeriesProperties.candleStyle.wickUpColor": "#2B2644", "mainSeriesProperties.candleStyle.wickDownColor": "#A13B3B" }, allow_symbol_change: true, hide_side_toolbar: false, withdateranges: true, details: true, calendar: false, studies: ["STD;RSI", "STD;MACD"], support_host: "https://www.tradingview.com" });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [symbol]);
  return <div className="tradingview-widget-container" ref={ref} />;
}
