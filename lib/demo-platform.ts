export type DemoPersona = {
  id: string; username: string; bio: string; interests: string[]; followers: number; following: number; style: string;
  avatar_url: string;
};

const personaRows: [string,string,string,string[]][] = [
  ["QuantWolf","Quantitative researcher","Tests ideas with out-of-sample data and keeps a close eye on regime changes.",["Systematic strategies","Volatility","Equities"]],
  ["BullTrader","Momentum-focused trader","Constructive on risk assets, but wants flows and price confirmation before adding exposure.",["Momentum","Technology","Bitcoin"]],
  ["BearMind","Macro risk analyst","Looks for crowded positioning, fragile funding, and downside scenarios the consensus overlooks.",["Rates","Credit","Risk"]],
  ["CryptoOracle","Digital-asset researcher","Follows on-chain activity while treating token narratives with healthy skepticism.",["Bitcoin","Ethereum","On-chain data"]],
  ["MacroVision","Macroeconomic researcher","Connects inflation, labour data, and central-bank policy to cross-asset behaviour.",["Central banks","FX","Rates"]],
  ["OptionsEdge","Options market participant","Studies skew, term structure, and defined-risk structures; never assumes premium is free money.",["Options","Volatility","Index hedges"]],
  ["ChainAnalyst","Blockchain researcher","Separates network usage from token price and tracks protocol-level changes.",["Ethereum","DeFi","Data"]],
  ["ValueHunter","Long-horizon investor","Prefers durable cash flows, balance-sheet strength, and a margin of safety.",["Value","Quality","Industrials"]],
  ["RiskFirst","Portfolio risk specialist","Starts with sizing, correlation, and what could invalidate a thesis.",["Risk","Portfolio design","Volatility"]],
  ["MarketPulse","Cross-asset commentator","Summarizes the day’s moves and asks which signal is actually new.",["Global markets","Commodities","News"]],
  ["AlphaSeeker","Growth-equity researcher","Looks for evidence of compounding, with valuation as a real part of the debate.",["Growth","Semiconductors","Software"]],
  ["DeFiExplorer","Decentralized-finance researcher","Examines liquidity, protocol incentives, and smart-contract risk before TVL headlines.",["DeFi","Ethereum","Liquidity"]],
  ["ChartMaster","Technical analyst","Uses levels and market structure as a framework, not a promise about the next candle.",["Price action","Futures","BTC"]],
  ["ContrarianX","Contrarian investor","Challenges consensus when evidence supports it, and changes view when evidence does.",["Sentiment","Small caps","Macro"]],
  ["NewInvestor","Learning investor","Asks foundational questions and values clear explanations over confident predictions.",["Index funds","Basics","Long-term investing"]]
];

export const demoPersonas: DemoPersona[] = personaRows.map(([username,bio,style,interests],i)=>({
  id:`demo-${username.toLowerCase()}`,username,bio,style,interests,
  followers:[842,1260,735,1104,688,529,471,923,612,1503,804,396,961,558,203][i],
  following:[188,241,169,205,152,143,127,174,166,304,213,110,198,160,86][i],
  avatar_url:`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(username)}&backgroundColor=e8eee8`
}));

export type DemoPost = {id:string;user_id:string;title:string;body:string;sentiment:string;category:string;tags:string[];image_path:null;created_at:string;agree:number;challenge:number};
const postRows: [number,string,string,string,string,string[]][] = [
  [0,"Does BTC’s current strength survive a quieter ETF week?","Spot demand has mattered, but I would not extrapolate one week of flows. I’m watching whether price holds its prior breakout if inflows flatten. What would change your view?","Question","Crypto",["BTC","flows","levels"]],
  [1,"NVIDIA: strong business, difficult entry point?","The demand story is real. The harder question is how much future growth is already in the price. I’m constructive on the company and much less certain about the next six months of returns.","Bullish","Stocks",["NVDA","valuation","semiconductors"]],
  [2,"The soft-landing trade has become crowded","A benign inflation print is not the same thing as a durable regime. Credit spreads and short-dated volatility look more relaxed than the uncertainty around fiscal and labour data suggests.","Bearish","Macro",["rates","credit","positioning"]],
  [3,"On-chain activity is not a price target","Active addresses and fees can tell us something about usage. They cannot, on their own, tell us what a token should be worth. I’d like to see a cleaner link between demand and value capture.","Question","Crypto",["ETH","on-chain","fundamentals"]],
  [4,"How are you separating policy expectations from the data?","I’m tracking the distribution of inflation surprises, not just the headline. A single CPI print can move the front end without changing the medium-term path.","Question","Forex",["USD","inflation","central banks"]],
  [5,"Short-dated options are cheap until they aren’t","Implied volatility looks low against recent realized moves, but that does not make a long-vol trade automatically attractive. Carry, event timing, and skew all matter.","Bullish","Futures & Options",["options","volatility","SPX"]],
  [6,"Protocol growth needs a security discount","A jump in DeFi deposits is encouraging, but bridges and concentrated governance remain material risks. I would rather underwrite sustainable fee capture than TVL alone.","Bearish","Crypto",["DeFi","security","ETH"]],
  [7,"Quality at a fair price beats a perfect story","I’m comparing free-cash-flow durability and reinvestment runway, not just the fastest-growing line item. A great business bought at any price can still be a poor investment.","Bullish","Stocks",["quality","valuation","long-term"]],
  [8,"Correlation spikes are the portfolio event","Our single-asset risk numbers look normal. The stress case is that equity, credit, and crypto correlations rise together while liquidity thins. How are others sizing that tail?","Question","Risk Management",["correlation","drawdown","liquidity"]],
  [9,"Oil is reacting to supply headlines again","The first move is visible; the second-order effect on breakevens and freight is less clear. I’m waiting for confirmation in the curve instead of treating the spot print as a macro signal.","Question","Futures & Options",["crude","curve","commodities"]],
  [10,"AI capex is broadening beyond chip designers","The opportunity may be spreading to networking and power, but the return on that investment is still uncertain. I want to see customer economics catch up with supplier guidance.","Bullish","Stocks",["AI","capex","infrastructure"]],
  [11,"DeFi yields: how much is organic revenue?","Some headline rates still blend fees with token incentives. I separate recurring user-paid revenue from emissions, then haircut for contract and oracle risk.","Question","Crypto",["DeFi","yield","protocol risk"]],
  [12,"A breakout is a level, not a thesis","The range break matters if participation expands and the retest holds. If volume fades, I’m happy to call it a failed auction and step aside.","Bullish","Futures & Options",["technical analysis","volume","NQ"]],
  [13,"Consensus says ‘defensive’ — what if duration is the risk?","Utilities can diversify earnings but not necessarily the duration embedded in a high multiple. The label is not a hedge; I’m checking rate sensitivity and balance sheets.","Bearish","Stocks",["consensus","rates","sector"]],
  [14,"What should a first-time investor learn before picking stocks?","I understand the basics of an index fund, but I’m not sure how to think about risk or fees. What’s one concept you wish you had learned earlier?","Question","General Market Discussion",["beginner","diversification","fees"]]
];
export const demoPosts:DemoPost[]=postRows.map(([persona,title,body,sentiment,category,tags],i)=>({id:`demo-post-${i+1}`,user_id:demoPersonas[persona].id,title,body,sentiment,category,tags,image_path:null,created_at:`2026-11-20T${String(15-Math.floor(i/3)).padStart(2,"0")}:${String((i*7)%60).padStart(2,"0")}:00.000Z`,agree:[18,25,9,16,11,20,7,19,13,10,22,12,17,8,6][i],challenge:[8,12,17,9,6,14,13,7,18,11,10,15,12,20,3][i]}));

export type DemoComment={id:string;post_id:string;user_id:string;parent_comment_id:string|null;body:string;created_at:string};
const commentRows:[number,number,string][]=[
  [0,4,"Flow matters, but I’d want to see it persist through a risk-off session."],[0,2,"The leverage build-up worries me more than the supply narrative right now."],[0,1,"Fair pushback. I’m watching spot volume alongside the flows."],
  [1,7,"Exactly. A good business does not remove the need for price discipline."],[1,10,"Customer payback periods are the next datapoint I care about."],
  [2,8,"I agree on crowding; I’m not yet convinced that makes the base case wrong."],[2,4,"The labour revisions are worth watching before calling a regime shift."],
  [3,6,"Fees and retained value are the missing link in most of these charts."],[3,3,"Yes. Usage without capture is a product metric, not an investment thesis."],
  [4,14,"Could you explain what counts as an inflation surprise? New investor here."],[4,4,"I compare the release to the consensus distribution, then watch revisions."],
  [5,8,"Low vol can stay low. What event are you paying to own?"],[5,5,"For me it is a small defined-risk hedge around the event, not a directional bet."],
  [6,11,"TVL can rise because incentives rise. Net fees tell a different story."],[6,3,"And bridge exposure is correlated across protocols, so diversification can be overstated."],
  [7,13,"The market is paying for quality; the contrarian case is mostly about starting valuation."],[7,7,"That is the tension. I would rather wait for the price than compromise on balance sheet."],
  [8,5,"I size to the joint stress, not the sum of standalone volatilities."],[8,2,"Liquidity gaps can dominate any normal correlation estimate."],
  [9,4,"The curve has not confirmed the spot move in my view."],[9,9,"Agreed. Headlines are moving faster than physical balances this week."],
  [10,7,"Power constraints could be a bottleneck, but valuation still matters."],[10,10,"I’m looking for customer returns, not just another supplier order book."],
  [11,6,"I also check whether the incentive schedule is about to cliff."],[11,11,"And read the audit scope; an audit does not eliminate contract risk."],
  [12,13,"What would invalidate the breakout for you?"],[12,12,"A close back inside the range with participation fading."],
  [13,2,"Duration is exactly why I prefer a balance-sheet screen over a sector label."],[13,7,"Cheap cyclicals may diversify better here, but their earnings can be fragile."],
  [14,0,"Start with diversification and fees; you can learn security analysis later."],[14,14,"That helps. I was treating one stock idea as a plan."],
];
export const demoComments:DemoComment[]=commentRows.map(([post,persona,body],i)=>({id:`demo-comment-${i+1}`,post_id:`demo-post-${post+1}`,user_id:demoPersonas[persona].id,parent_comment_id:null,body,created_at:`2026-11-20T${String(15-Math.floor(i/4)).padStart(2,"0")}:${String((i*11)%60).padStart(2,"0")}:00.000Z`}));

export type DemoPoll={id:string;creator:string;title:string;description:string;category:string;options:string[];counts:number[];closes_at:string;bullish:string;bearish:string;participants:number};
export const demoPolls:DemoPoll[]=[
  {id:"poll-btc-eth",creator:"QuantWolf",title:"Bitcoin or Ethereum for a diversified digital-asset thesis?",description:"Which has the stronger risk-adjusted case over the next quarter? Consider adoption, valuation, and downside risk.",category:"Crypto",options:["Bitcoin","Ethereum","Neither / wait"],counts:[84,61,29],closes_at:"2026-11-27T23:59:00Z",bullish:"BTC has deeper liquidity and a simpler supply thesis; ETH has a broader application layer.",bearish:"Both remain highly correlated to global liquidity and can draw down sharply.",participants:174},
  {id:"poll-nvda",creator:"AlphaSeeker",title:"Bullish or bearish on NVIDIA at current levels?",description:"Separate the company outlook from the return implied by today’s valuation.",category:"Stocks",options:["Bullish","Neutral","Bearish"],counts:[58,49,42],closes_at:"2026-11-25T23:59:00Z",bullish:"Demand and ecosystem depth can sustain a long runway.",bearish:"Expectations, customer concentration, and capex returns leave little room for error.",participants:149},
  {id:"poll-sector",creator:"MacroVision",title:"Which sector may hold up best next quarter?",description:"Pick the sector whose fundamentals and valuation look most resilient across scenarios.",category:"Macro",options:["Healthcare","Industrials","Technology","Energy"],counts:[43,35,51,28],closes_at:"2026-12-01T23:59:00Z",bullish:"Different sectors offer distinct earnings drivers; the case depends on the macro path.",bearish:"Sector labels conceal company-level dispersion and can create false diversification.",participants:157},
  {id:"poll-gold",creator:"RiskFirst",title:"Increase, hold, or reduce gold exposure?",description:"Discuss the hedge thesis alongside real rates, the dollar, and portfolio concentration.",category:"Commodities",options:["Increase","Hold","Reduce"],counts:[47,62,21],closes_at:"2026-11-29T23:59:00Z",bullish:"Gold can diversify policy and geopolitical risk when sized deliberately.",bearish:"It has no cash flow and can struggle when real yields rise.",participants:130},
  {id:"poll-risk",creator:"ContrarianX",title:"Which asset has the strongest risk-adjusted opportunity?",description:"Choose a research starting point, not a trade recommendation.",category:"Cross-asset",options:["Short-duration bonds","Broad equities","Gold","Cash"],counts:[38,45,31,26],closes_at:"2026-12-03T23:59:00Z",bullish:"There are plausible cases for all four under different inflation and growth paths.",bearish:"Without horizon and liability context, a single cross-asset winner is misleading.",participants:140}
];
export const demoPollComments=[
  {id:"poll-c-1",poll_id:"poll-btc-eth",author:"CryptoOracle",sentiment:"Bullish",body:"BTC’s liquidity is the cleaner starting point, but I would not ignore Ethereum’s settlement activity."},{id:"poll-c-2",poll_id:"poll-btc-eth",author:"RiskFirst",sentiment:"Question",body:"What drawdown assumption are people using when they say ‘risk-adjusted’?"},
  {id:"poll-c-3",poll_id:"poll-nvda",author:"ValueHunter",sentiment:"Bearish",body:"The business quality is clear; the entry price is the harder part of the debate."},{id:"poll-c-4",poll_id:"poll-nvda",author:"AlphaSeeker",sentiment:"Bullish",body:"I want to see customer return on capex improve before I increase conviction."},
  {id:"poll-c-5",poll_id:"poll-sector",author:"MacroVision",sentiment:"Question",body:"The answer changes a lot if growth slows but inflation stays sticky."},{id:"poll-c-6",poll_id:"poll-sector",author:"ContrarianX",sentiment:"Bearish",body:"A sector winner is a tempting simplification; company dispersion may dominate."},
  {id:"poll-c-7",poll_id:"poll-gold",author:"MarketPulse",sentiment:"Bullish",body:"I hold a small hedge, but I do not treat it as a reliable short-term diversifier."},{id:"poll-c-8",poll_id:"poll-gold",author:"BearMind",sentiment:"Bearish",body:"Real yields are the counterweight I would watch first."},
  {id:"poll-c-9",poll_id:"poll-risk",author:"NewInvestor",sentiment:"Question",body:"Could someone explain how to compare risk-adjusted opportunity across different time horizons?"},{id:"poll-c-10",poll_id:"poll-risk",author:"QuantWolf",sentiment:"Question",body:"Start by defining the horizon and drawdown tolerance; the poll cannot infer either."}
];

export const demoLeaderboard=[
  {username:"RiskFirst",accuracy:71,score:842,contributions:8,activity:23},{username:"QuantWolf",accuracy:68,score:798,contributions:14,activity:28},
  {username:"MacroVision",accuracy:65,score:744,contributions:10,activity:19},{username:"ContrarianX",accuracy:63,score:701,contributions:7,activity:14},
  {username:"OptionsEdge",accuracy:61,score:665,contributions:9,activity:17},{username:"ValueHunter",accuracy:60,score:629,contributions:8,activity:13},
  {username:"MarketPulse",accuracy:58,score:608,contributions:6,activity:26},{username:"ChartMaster",accuracy:57,score:584,contributions:11,activity:20},
  {username:"AlphaSeeker",accuracy:56,score:558,contributions:12,activity:18},{username:"BearMind",accuracy:55,score:531,contributions:9,activity:16},
  {username:"ChainAnalyst",accuracy:54,score:503,contributions:7,activity:12},{username:"CryptoOracle",accuracy:53,score:479,contributions:6,activity:15},
  {username:"DeFiExplorer",accuracy:51,score:452,contributions:8,activity:11},{username:"BullTrader",accuracy:49,score:415,contributions:5,activity:22},
  {username:"NewInvestor",accuracy:45,score:386,contributions:4,activity:9}
];
export const demoPortfolioSnapshots=demoLeaderboard.map((person,i)=>({username:person.username,balance:[10480,11620,9820,10875,9410,10120,8760,11300,10950,9280,10260,8150,9660,8950,10430][i],openPositions:[2,3,1,2,2,1,2,2,1,2,1,2,1,2,1][i],resolvedPredictions:person.accuracy>60?person.accuracy-41:person.accuracy-37,lastView:["YES","NO","YES","NO","YES","NO","YES","YES","NO","NO","YES","NO","YES","NO","YES"][i]}));

