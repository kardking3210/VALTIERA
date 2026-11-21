"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Download, Menu, X } from "lucide-react";
import "./overview.css";

type Item = { label: string; detail?: string };
const sections = [
  { id: "protocol", no: "01", title: "Protocol Overview" },
  { id: "components", no: "02", title: "Platform Components" },
  { id: "data", no: "03", title: "Market Data & Intelligence" },
  { id: "predictions", no: "04", title: "Prediction Mechanics" },
  { id: "quant", no: "05", title: "Quantitative Research" },
  { id: "portfolio", no: "06", title: "Portfolio & Allocation" },
  { id: "risk", no: "07", title: "Risk Management" },
  { id: "governance", no: "08", title: "Governance & Integrity" },
  { id: "architecture", no: "09", title: "Technology Architecture" },
  { id: "economics", no: "10", title: "Product Economics" },
  { id: "regulatory", no: "11", title: "Regulatory Boundaries" },
  { id: "roadmap", no: "12", title: "Implementation Roadmap" },
];

const diagramSets: Record<string, Item[]> = {
  layers: [
    { label: "Human intelligence", detail: "Theses · discussions · polls" },
    { label: "Market intelligence", detail: "Prices · history · context" },
    { label: "Quantitative intelligence", detail: "Statistics · risk · validation" },
    { label: "Research view", detail: "Evidence shown with limits" },
  ],
  ecosystem: [
    { label: "Financial community", detail: "Ideas & discussion" }, { label: "Decision Arena", detail: "Polls & sentiment" },
    { label: "Prediction markets", detail: "Simulated outcomes" }, { label: "Market intelligence", detail: "TradingView embed" },
    { label: "Quant research", detail: "Methods & risk" }, { label: "Virtual portfolio", detail: "Practice ledger" }, { label: "Academy", detail: "Learning content" },
  ],
  pipeline: [
    { label: "Supported sources", detail: "Coverage varies by provider" }, { label: "Ingestion", detail: "Provider-delivered data" },
    { label: "Normalize", detail: "Symbols · units · timestamps" }, { label: "Historical store", detail: "Only where configured" },
    { label: "Analysis", detail: "Available methods & inputs" }, { label: "Research outputs", detail: "Provenance & limitations" }, { label: "User dashboard", detail: "Source and delay labels" },
  ],
  lifecycle: [
    { label: "Create market", detail: "Question & rules" }, { label: "Open", detail: "Virtual participation" },
    { label: "Close", detail: "At stated deadline" }, { label: "Verify", detail: "Resolution evidence" },
    { label: "Resolve", detail: "Settlement rules" }, { label: "Record", detail: "Accuracy history" }, { label: "Leaderboard", detail: "Sample / member context" },
  ],
  research: [
    { label: "Question", detail: "Define a testable claim" }, { label: "Collect", detail: "Document source & scope" },
    { label: "Validate data", detail: "Quality gate" }, { label: "Engineer", detail: "Predeclared features" },
    { label: "Develop model", detail: "Avoid look-ahead" }, { label: "Backtest", detail: "Currently unavailable" },
    { label: "Risk & validate", detail: "Out-of-sample checks" }, { label: "Publish limits", detail: "Only when supported" },
  ],
  portfolio: [
    { label: "Virtual cash", detail: "Non-monetary credits" }, { label: "Allocation", detail: "Hypothetical weights" },
    { label: "Simulated positions", detail: "Practice ledger" }, { label: "Price reference", detail: "Provider dependent" },
    { label: "Portfolio value", detail: "Simplified valuation" }, { label: "Risk view", detail: "Exposure · drawdown" },
  ],
  governance: [
    { label: "User contribution", detail: "Profile & disclosure" }, { label: "Discussion", detail: "Arguments & replies" },
    { label: "Integrity checks", detail: "Moderation & spam" }, { label: "Sentiment", detail: "Aggregate opinion" },
    { label: "Independent review", detail: "Quantitative evidence" }, { label: "Presentation", detail: "Popularity ≠ correctness" },
  ],
  architecture: [
    { label: "Presentation", detail: "Web · dashboard · Academy" }, { label: "Application", detail: "Auth · community · polls" },
    { label: "Application", detail: "Predictions · portfolio · research" }, { label: "Data", detail: "Supabase records & policies" },
    { label: "External providers", detail: "TradingView · email service" },
  ],
  boundaries: [
    { label: "Community & education", detail: "Discussion · Academy" }, { label: "Research & simulation", detail: "Information · virtual credits" },
    { label: "Regulated services", detail: "Separate review & authorization" },
  ],
};

function Diagram({ title, items, note, vertical = false }: { title: string; items: Item[]; note: string; vertical?: boolean }) {
  const arrowId = `ov-arrow-${useId().replace(/:/g, "")}`;
  const width = 960, gap = 16, columns = vertical ? 1 : Math.min(4, items.length);
  const nodeW = (width - 36 - gap * (columns - 1)) / columns, nodeH = 90, rowGap = 38;
  const rowCount = Math.ceil(items.length / columns);
  const height = 31 + rowCount * (nodeH + rowGap);
  return <figure className="ov-diagram">
    <div className="ov-diagram-head"><span>PROCESS MAP</span><b>{title}</b></div>
    <div className={`ov-svg-wrap${vertical ? " is-vertical" : ""}`} role="img" aria-label={`${title}: ${items.map(x => x.label).join(" followed by ")}`}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca39d"/></marker></defs>
        {items.map((item, i) => {
          const row = Math.floor(i / columns), within = i % columns;
          const col = row % 2 === 0 ? within : columns - 1 - within;
          const x = vertical ? (width - nodeW) / 2 : 18 + col * (nodeW + gap), y = 14 + row * (nodeH + rowGap);
          const nextRow = Math.floor((i + 1) / columns);
          const nextWithin = (i + 1) % columns;
          const nextCol = nextRow % 2 === 0 ? nextWithin : columns - 1 - nextWithin;
          const nextNodeX = vertical ? x : 18 + nextCol * (nodeW + gap);
          const nextNodeY = 14 + nextRow * (nodeH + rowGap);
          const sameRow = nextRow === row;
          const startX = vertical ? x + nodeW / 2 : sameRow ? (nextNodeX > x ? x + nodeW : x) : x + nodeW / 2;
          const startY = sameRow ? y + nodeH / 2 : y + nodeH;
          const endX = vertical ? nextNodeX + nodeW / 2 : sameRow ? (nextNodeX > x ? nextNodeX : nextNodeX + nodeW) : nextNodeX + nodeW / 2;
          const endY = sameRow ? nextNodeY + nodeH / 2 : nextNodeY;
          return <g key={`${item.label}-${i}`}>
            {i < items.length - 1 && <path d={sameRow ? `M ${startX} ${startY} L ${endX} ${endY}` : `M ${startX} ${startY} L ${startX} ${startY + rowGap / 2} L ${endX} ${startY + rowGap / 2} L ${endX} ${endY}`} stroke="#9ca39d" strokeWidth="1.5" fill="none" markerEnd={`url(#${arrowId})`}/>}
            <rect x={x} y={y} width={nodeW} height={nodeH} rx="8" fill={i === items.length - 1 ? "#e5eddb" : i === 0 ? "#202923" : "#fff"} stroke={i === 0 ? "#202923" : "#d9ded8"}/>
            <text x={x + 14} y={y + 35} fill={i === 0 ? "#fff" : "#1b211d"} fontSize="13" fontWeight="600">{item.label}</text>
            <text x={x + 14} y={y + 59} fill={i === 0 ? "#d5ddd5" : "#707972"} fontSize="10">{item.detail}</text>
          </g>;
        })}
      </svg>
    </div>
    <figcaption>{note}</figcaption>
    <details className="ov-diagram-details"><summary>Read the components</summary><ul>{items.map((item, i) => <li key={`${item.label}-${i}`}><b>{item.label}</b><span>{item.detail}</span></li>)}</ul></details>
  </figure>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="ov-table-scroll"><table className="ov-table"><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;
}

function LayerDiagram({ title, layers, note }: { title: string; layers: { name: string; status: string; nodes: string[] }[]; note: string }) {
  return <figure className="ov-diagram"><div className="ov-diagram-head"><span>ARCHITECTURE MAP</span><b>{title}</b></div><div className="ov-layers" role="img" aria-label={`${title}: ${layers.map(layer => `${layer.name}: ${layer.nodes.join(", ")}`).join("; ")}`}>
    {layers.map((layer, i) => <div className="ov-layer-row" key={layer.name}><div className="ov-layer-label"><b>{layer.name}</b><small>{layer.status}</small></div><div className="ov-layer-nodes">{layer.nodes.map(node => <span key={node}>{node}</span>)}</div>{i < layers.length - 1 && <i className="ov-layer-link" aria-hidden="true"/>}</div>)}
  </div><figcaption>{note}</figcaption></figure>;
}

function MappingDiagram({ title, pairs, note }: { title: string; pairs: [string, string][]; note: string }) {
  return <figure className="ov-diagram"><div className="ov-diagram-head"><span>CONCEPT MAP</span><b>{title}</b></div><div className="ov-map-head"><span>PROPOSED REVENUE STREAM</span><span>POTENTIAL CUSTOMER</span></div><div className="ov-mapping" role="img" aria-label={`${title}: ${pairs.map(pair => `${pair[0]} to ${pair[1]}`).join("; ")}`}>
    {pairs.map(([a,b]) => <div className="ov-map-row" key={a}><b>{a}</b><i aria-hidden="true"><ArrowRight size={16}/></i><span>{b}</span></div>)}
  </div><figcaption>{note}</figcaption></figure>;
}

function Section({ id, no, title, children }: { id: string; no: string; title: string; children: React.ReactNode }) {
  return <section className="ov-section" id={id}><div className="ov-section-kicker">{no} / VALTIERA PRODUCT DOCUMENTATION</div><h2>{title}</h2>{children}</section>;
}

export default function ProductOverview() {
  const [active, setActive] = useState("protocol");
  const [contentsOpen, setContentsOpen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-12% 0px -72% 0px", threshold: [0, .2, .5, .8] });
    sections.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  const jump = (id: string) => { setContentsOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return <main className="overview-page">
    <header className="ov-topbar"><Link className="ov-brand" href="/"><Image src="/images/valtiera-logo.png" alt="" width={38} height={38}/><span>VALTIERA</span><i>PRODUCT OVERVIEW</i></Link><nav><Link href="/">Back to VALTIERA <ArrowLeft size={14}/></Link><a className="ov-download" href="/documents/valtiera-product-overview.pdf" download><Download size={14}/> Download Overview PDF</a></nav><button className="ov-mobile-menu" aria-label={contentsOpen ? "Close contents" : "Open contents"} aria-expanded={contentsOpen} onClick={() => setContentsOpen(v => !v)}>{contentsOpen ? <X size={19}/> : <Menu size={19}/>} Contents</button></header>
    <div className="ov-layout">
      <aside className={`ov-sidebar${contentsOpen ? " open" : ""}`}><div className="ov-sidebar-label">CONTENTS <span>12 SECTIONS</span></div><nav aria-label="Product overview sections">{sections.map(s => <button key={s.id} className={active === s.id ? "active" : ""} aria-current={active === s.id ? "location" : undefined} onClick={() => jump(s.id)}><span>{s.no}</span>{s.title}</button>)}</nav><div className="ov-sidebar-note"><span>DOCUMENT STATUS</span><b>Product and protocol overview</b><small>Implemented items reflect the current prototype. Proposed architecture is labelled.</small></div></aside>
      <article className="ov-article">
        <div className="ov-cover"><span className="ov-overline"><i/> PRODUCT · PROTOCOL · ARCHITECTURE</span><h1>VALTIERA<br/><em>Product Overview</em></h1><p>A working map of the platform’s community, market context and quantitative research layers—what exists today, how information is treated, and what remains proposed.</p><div className="ov-cover-meta"><span>DOCUMENTATION SERIES <b>01 / 01</b></span><span>PROTOTYPE STATUS <b>Clearly labelled throughout</b></span></div><ArrowDown className="ov-cover-arrow" size={18}/></div>

        <Section id="protocol" no="01" title="VALTIERA Product Overview"><p className="ov-lead">VALTIERA is a financial intelligence and community-driven market research platform designed to bring collective market discussion, prediction-based analysis and quantitative research into one environment.</p><p>Users can explore financial markets, discuss investment opportunities, challenge competing viewpoints and examine research methods. The central design principle is that community reasoning and algorithmic analysis remain distinct sources of information. Community activity can suggest a question; it does not establish an answer.</p><h3>Core philosophy</h3><p>The community generates hypotheses. Market information provides context. Quantitative analysis evaluates evidence and uncertainty. The platform presents sources and limitations so users can form their own views. It does not turn majority opinion into an automatic trading instruction.</p><Diagram title="Three intelligence layers" items={diagramSets.layers} note="Human discussion, market context and quantitative methods are complementary inputs. The final research view should preserve their provenance and limits." vertical/></Section>

        <Section id="components" no="02" title="One platform, multiple intelligence layers"><p className="ov-lead">Seven connected product areas support discovery, analysis and learning. In the current prototype, several work as demo experiences; data providers and available account features determine the live scope.</p><div className="ov-component-grid">{[
          ["A · Financial Community", "A Reddit-inspired environment for investment theses, asset discussions, bullish and bearish arguments, replies, reactions, analyst follows and discovery. Demo personas are fictional sample activity; registered-user features depend on Supabase configuration."],
          ["B · Decision Arena", "Polls aggregate options, participation, arguments and opinion distributions. Browser demo voting and member poll workflows are separate. Sentiment is an input for research, not a recommendation."],
          ["C · Prediction Markets", "Scenario questions represent possible outcomes and closing rules. The prototype uses simulated positions and non-monetary credits; resolution depends on defined criteria and moderator workflows."],
          ["D · Market Intelligence", "The current markets experience embeds TradingView Advanced Charts. Search, intervals, indicators and drawing tools are provider controlled; data coverage and delay depend on instrument and exchange."],
          ["E · Quantitative Research", "The prototype presents strategy definitions, research caveats and a backtest request form. Backtest execution is unavailable because no licensed historical OHLC feed or validated engine is connected."],
          ["F · Virtual Portfolio", "A practice ledger tracks hypothetical prediction allocations and virtual credits. It is not a brokerage account, pooled fund, or record of real securities positions."],
          ["G · Academy", "The Academy route hosts educational material, including the founder-selected trading lesson. Course management and progress can depend on the configured account and database."],
        ].map(([h,b]) => <article key={h}><span>{h.slice(0,1)}</span><div><h3>{h}</h3><p>{b}</p></div></article>)}</div><Diagram title="Platform ecosystem and information links" items={diagramSets.ecosystem} note="The overview links discussion and polls to research as context; charts and portfolio simulation display their own inputs. Connections are conceptual product relationships, not claims that all services share one live data stream."/></Section>

        <Section id="data" no="03" title="Understanding the intelligence pipeline"><p className="ov-lead">Data is only useful when its source, timestamp, coverage and transformation are understood. Actual market coverage depends on data-provider access, exchange licensing and update frequency.</p><p>In the current prototype, market charts are delivered by TradingView. The overview does not claim a separate first-party ingestion or normalized historical store is already operating. The pipeline below describes a responsible target flow for supported data sources, with provider-dependent stages clearly marked.</p><Diagram title="Market data pipeline · conceptual target flow" items={diagramSets.pipeline} note="Real-time, delayed, historical and simulated labels should travel with the data. If a provider does not supply a timestamp or source label, the interface should not invent one."/><div className="ov-note"><b>Source discipline</b><span>Provider-supplied chart data is distinct from seeded demo votes, sample prediction probabilities and simulated portfolio ledgers. Demo values are illustrative and must not be read as live prices or measured performance.</span></div></Section>

        <Section id="predictions" no="04" title="How predictions are evaluated"><p className="ov-lead">A prediction market is a structured question with an explicit close time and resolution rule. In this prototype, participation uses virtual demo credits only.</p><p>A YES/NO percentage is a probability representation within a market mechanic, not an objectively calibrated forecast. Sample market odds and participation shown in demo content are illustrative scenarios. Market accuracy should only be recorded after an outcome is verified against its stated criteria.</p><Diagram title="Prediction lifecycle" items={diagramSets.lifecycle} note="Market creation should define the question, deadline, eligible evidence and tie or cancellation handling before users participate."/><h3>Probability and settlement</h3><p>When a simulated position is taken, the interface records the selected side, credits committed and the probability at entry. A potential payout is a simulated settlement value under the market’s displayed rules; it is not cash, a prize or a redeemable claim. Resolution updates the practice ledger and any applicable prediction history.</p><div className="ov-callout"><b>Simulation boundary</b><p>No real-money deposits, withdrawals, betting or cash settlement are part of this prototype. Virtual credits are non-purchasable and have no cash value.</p></div></Section>

        <Section id="quant" no="05" title="Independent analysis beyond community opinion"><p className="ov-lead">Quantitative research asks whether evidence supports a defined claim under explicit assumptions. It does not turn a plausible strategy description into a proven edge.</p><p>Methods that may be studied include time-series and statistical analysis, momentum, volatility, correlation, market regimes, liquidity and risk-adjusted performance. The current research workspace describes strategy logic but does not execute a validated backtest or publish strategy returns.</p><Diagram title="Quantitative research workflow" items={diagramSets.research} note="A production workflow should return to data validation when quality fails, revise a model when out-of-sample evidence is inadequate, and publish limitations alongside any supported result."/><h3>Human and algorithmic research</h3><p>Community discussion can identify an asset, catalyst or disagreement worth investigating. An independent analysis then needs sourced data, predeclared assumptions, appropriate validation and a risk review. Popularity alone is not evidence of financial correctness.</p></Section>

        <Section id="portfolio" no="06" title="From market intelligence to portfolio simulation"><p className="ov-lead">A simulator helps users reason about hypothetical sizing and exposures. It does not custody, pool or invest user funds.</p><p>Position sizing, diversification, concentration, volatility, drawdown and rebalancing are useful concepts to explore. The current virtual ledger is designed around simulated prediction credits and positions rather than real securities execution.</p><Diagram title="Portfolio simulation architecture" items={diagramSets.portfolio} note="A simulated transaction updates only the practice ledger: allocated virtual cash, open simulated position and displayed allocation. Market valuation requires a clearly sourced price reference."/><div className="ov-formula"><span>SIMPLIFIED PORTFOLIO VALUE</span><code>Vₜ = Σ qᵢ Pᵢ,ₜ + Cₜ</code><p><b>qᵢ</b> = simulated units of asset i · <b>Pᵢ,ₜ</b> = reference price at time t · <b>Cₜ</b> = virtual cash. This simplified equation omits fees, cash flows and other implementation details.</p></div><div className="ov-formula"><span>SIMPLIFIED RETURN</span><code>R = (Vₜ − V₀) / V₀</code><p>Interpretation depends on the portfolio definition, time interval, fees and external cash flows. A simulator result is not a real investment return.</p></div></Section>

        <Section id="risk" no="07" title="Transparency before performance"><p className="ov-lead">Risk labels are part of the result. Historical fit, attractive charts and consensus do not remove uncertainty.</p><div className="ov-risk-grid">{[["01 · Market risk","Price gaps, volatility, correlation shifts, liquidity and concentration can change outcomes."],["02 · Model risk","Assumptions, overfitting, look-ahead bias, parameter instability and implementation gaps can invalidate analysis."],["03 · Operational risk","Provider outages, software defects, access controls, resolution mistakes and moderation failures can affect the experience."],["04 · Data risk","Missing, delayed, adjusted or misidentified observations can distort results and comparisons."]].map(([h,p])=><article key={h}><span>{h.slice(0,2)}</span><h3>{h}</h3><p>{p}</p></article>)}</div><Table headers={["Risk", "Possible impact", "Potential mitigation"]} rows={[["Market", "Loss, gap exposure, correlation or liquidity changes", "Scenario analysis, sizing limits and exposure disclosure"],["Model", "False confidence or unstable out-of-sample results", "Predeclared tests, independent validation, versioned assumptions"],["Operational", "Unavailable or incorrect workflows and records", "Access controls, monitoring, audit trails and recovery procedures"],["Data", "Misleading signals from incomplete or delayed inputs", "Source and timestamp labels, quality checks and explicit gaps"],["Prediction", "Ambiguous rules or noisy probability changes", "Precise resolution criteria and separate probability from certainty"]]}/><div className="ov-callout"><b>Historical performance does not guarantee future results.</b><p>Backtests and simulations can differ materially from live conditions, execution costs and future market behavior.</p></div></Section>

        <Section id="governance" no="08" title="A transparent financial community"><p className="ov-lead">Community integrity depends on visible context: who is speaking, what they have argued, and whether a post may be promotional or conflicted.</p><p>Profiles and discussion histories support accountability. Moderation and spam controls help protect the conversation. Where sponsorship or promotional content applies, it should be clearly labelled. Sentiment aggregation should remain separate from quantitative research output.</p><Diagram title="Community research governance" items={diagramSets.governance} note="Popularity can describe attention or participation. It does not establish that an argument is accurate, suitable or independently validated."/></Section>

        <Section id="architecture" no="09" title="A modular financial intelligence platform"><p className="ov-lead">The existing product uses a Next.js application, Supabase authentication and database features, TradingView chart embeds, and server-side Resend email integration for registration workflows.</p><p>The diagram shows a conceptual map of current product areas and data domains. It does not imply that every data provider or quantitative service is connected. Supabase policies and application routes govern member records; public demo personas and sample content are separate from private member records.</p><LayerDiagram title="Technical architecture · implemented and conceptual components" layers={[
          { name: "Presentation", status: "Implemented prototype", nodes: ["Public website", "User dashboard", "Community", "Markets", "Academy"] },
          { name: "Application", status: "Implemented / partial", nodes: ["Authentication", "User profiles", "Polls", "Prediction simulation", "Portfolio ledger", "Research interface"] },
          { name: "Data", status: "Supabase; migrations and environment required", nodes: ["Profiles", "Posts & polls", "Prediction records", "Market references", "Portfolio ledger"] },
          { name: "External integrations", status: "Provider configuration applies", nodes: ["TradingView charts", "Resend email", "Future licensed feeds · planned"] },
        ]} note="The arrows show the application’s conceptual request and display path. Licensed historical-data ingestion, a validated backtest engine and institutional integrations are not implemented."/><Table headers={["Layer", "Current / planned scope", "Status"]} rows={[["Presentation", "Public site, user dashboard, community, markets and Academy routes", "Implemented prototype"],["Application", "Authentication, community, polls and simulated prediction workflows", "Implemented; account functions require Supabase setup"],["Application", "Quant backtest execution and first-party market-data research", "Unavailable / planned"],["Data", "Supabase profiles, member records, polls and prediction ledger", "Schema and policies in project; deployment must apply migrations"],["External", "TradingView charts and Resend registration email", "Integrated; provider/account configuration applies"],["External", "Licensed historical feeds, chain sources and institutional APIs", "Proposed; not connected"]]}/></Section>

        <Section id="economics" no="10" title="Potential platform business model"><p className="ov-lead">The following options are proposals for future product development. They are not current revenue claims, offers or commitments.</p><MappingDiagram title="Potential revenue streams and audiences" pairs={[["Premium research subscriptions","Individual users"],["Advanced analytics","Professional analysts"],["Institutional research access","Research teams and institutions"],["Licensed data and analytics","Professional teams"]]} note="These are proposed pairings only; no existing customer or revenue is implied. Data products depend on licensing and data rights."/><Table headers={["Revenue model", "Potential customer", "Value provided", "Status"]} rows={[["Premium research subscription", "Individual users", "Expanded research tools and saved workflows", "Proposed"],["Advanced analytics subscription", "Professional analysts", "Deeper exploration, filters and export tools", "Proposed"],["Institutional research access", "Research teams and institutions", "Structured research access and collaboration", "Proposed"],["Data and analytics products", "Professional teams", "Licensed and documented analytical outputs", "Proposed; depends on data rights"]]}/><p>No prices, revenue, customers, investors or financial projections are asserted in this overview.</p></Section>

        <Section id="regulatory" no="11" title="Regulatory and operational boundaries"><p className="ov-lead">Financial information, investment research, advice, brokerage, pooled investment management and real-money prediction markets may trigger different requirements across jurisdictions.</p><p>VALTIERA should not imply that it is a licensed investment manager, broker, exchange or gambling operator unless that status is verified. The current prototype is informational and educational with virtual credits only. Future investment-management or real-money functionality would require jurisdiction-specific legal, regulatory, operational and provider review before launch.</p><Diagram title="Product boundary map" items={diagramSets.boundaries} note="Community and education are informational; simulated research features remain non-monetary. Any regulated financial service requires separate assessment, approvals and operating controls before it is offered."/></Section>

        <Section id="roadmap" no="12" title="Building VALTIERA in stages"><p className="ov-lead">Stages distinguish visible prototype work from dependencies that remain unconnected or proposed. The roadmap is a product plan, not a claim that a delivery date or regulatory approval has been secured.</p><div className="ov-roadmap">{[["01","Core platform & authentication","Public site, app shell, Supabase authentication","Prototype implemented; deployment configuration required","done"],["02","Community & discussions","Sample feed, profiles, member workflows","Prototype implemented; production moderation is ongoing work","done"],["03","Decision Arena & polls","Demo polls and member poll workflows","Prototype implemented; Supabase setup required","done"],["04","Prediction simulation","Virtual positions, resolution workflow, practice ledger","Simulation prototype implemented; no monetary functionality","done"],["05","Market-data integrations","Provider charts and data provenance","TradingView charts integrated; broader feeds planned","active"],["06","Quantitative research","Validated historical data and reproducible analysis","Research descriptions exist; backtest execution unavailable","planned"],["07","Portfolio simulation","Exposure and valuation tools beyond prediction ledger","Expanded asset-allocation simulator planned","planned"],["08","Academy & learning","Lessons and learning progress","Academy route and founder lesson present; expansion planned","active"],["09","Advanced & institutional tools","Professional analytics and licensed access","Proposed; requires validation, data rights and review","planned"]].map(([n,h,d,s,status])=><article className={`ov-roadmap-item ${status}`} key={n}><span className="ov-roadmap-no">{n}</span><div><h3>{h}</h3><p>{d}</p><small>{s}</small></div><b>{status === "done" ? "PROTOTYPE" : status === "active" ? "IN PROGRESS" : "PLANNED"}</b></article>)}</div></Section>

        <section className="ov-section ov-reference" id="references"><div className="ov-section-kicker">REFERENCE / COMPARISONS & TERMINOLOGY</div><h2>How to read the evidence.</h2><Table headers={["Comparison", "First concept", "Second concept"]} rows={[["Community vs quantitative intelligence", "Human claims, questions and sentiment; participation describes opinion", "Independent methods, assumptions and validation; cannot inherit correctness from popularity"],["Prediction market vs traditional research", "A defined outcome, probability representation and resolution date", "Broader investigation of fundamentals, price behavior, risk and uncertainty"],["Virtual vs real portfolio", "Practice records with credits that have no cash value", "Real assets and capital with custody, fees, execution and legal obligations"],["Backtest vs live performance", "Historical simulation under assumptions; vulnerable to bias and data limits", "Observed outcomes with actual execution, costs and market conditions"],["Implemented vs planned", "Routes and prototype interactions present in this repository", "Capabilities requiring providers, validation, operations or future development"]]}/><h3>Glossary</h3><dl className="ov-glossary">{[["Market sentiment","An aggregate description of expressed views; not a measure of truth."],["Prediction probability","A probability representation associated with a specific scenario and mechanism."],["Quantitative research","Systematic analysis using explicit data, methods, assumptions and evaluation."],["Backtesting","Applying a strategy rule to historical observations under a defined simulation."],["Volatility","A measure of variation in price or return over a stated period."],["Drawdown","A decline from a previous portfolio peak to a later low."],["Asset allocation","Distribution of portfolio value across asset classes or instruments."],["Risk-adjusted performance","Return interpreted alongside a stated measure of risk and its assumptions."],["Market resolution","The process of determining an outcome under predeclared criteria."]].map(([term,def])=><div key={term}><dt>{term}</dt><dd>{def}</dd></div>)}</dl><div className="ov-note"><b>Prototype status</b><span>This document describes the repository’s visible implementation and its stated dependencies. It is product documentation, not investment advice, a performance report or a commitment to provide regulated financial services.</span></div></section>
        <footer className="ov-footer"><span>VALTIERA · PRODUCT OVERVIEW</span><button onClick={() => jump("protocol")}>Back to top <ArrowRight size={13}/></button></footer>
      </article>
    </div>
  </main>;
}

