"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, X } from "lucide-react";
import styles from "./landing.module.css";

const smokeImage = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/03c58212-3a59-4c80-b19d-30d05a174563.webp";
const smokeVideo = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f6f4ec49-d5dd-4893-8eb4-fa0f932aceaf.mp4";
const interests = ["Platform User", "Investor Interest", "Research & Technology", "Quantitative Research & Technology", "Strategic Partnership", "General Interest"];

function BrandLogo() {
  return <Image className={styles.brandLogo} src="/images/valtiera-logo.png" alt="" width={48} height={48}/>;
}
function SmokeMedia({ className = "", lazy = false }: { className?: string; lazy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    if (!lazy) { setActive(true); return; }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActive(true); observer.disconnect(); }
    }, { rootMargin: "180px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);
  return <div ref={ref} className={`${styles.smokeMedia} ${className}`} aria-hidden="true">
    <img className={styles.smokeStill} src={smokeImage} alt="" loading={lazy ? "lazy" : "eager"}/>
    {active && <video className={`${styles.smokeVideo} ${ready ? styles.smokeReady : ""}`} src={smokeVideo} autoPlay muted loop playsInline preload="none" onLoadedData={() => setReady(true)}/>}
  </div>;
}
function ExploreLink({ href = "/app", children }: { href?: string; children: React.ReactNode }) {
  return <Link className={styles.exploreLink} href={href}>{children}<span><ArrowRight size={17}/></span></Link>;
}
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main className={styles.page}>
    <section id="top" className={styles.heroSection}>
      <SmokeMedia className={styles.heroSmoke}/><div className={styles.heroShade} aria-hidden="true"/>
      <header className={styles.navbar}>
        <Link className={styles.brand} href="#top" aria-label="VALTIERA home"><BrandLogo/><span>VALTIERA</span></Link>
        <nav className={styles.navLinks} aria-label="Main navigation">
          <Link href="#platform">Platform</Link><Link href="#community">Community</Link><Link href="#prediction-arena">Prediction Arena</Link><Link href="#research">Research</Link><Link href="#academy">Academy</Link>
        </nav>
        <div className={styles.navActions}><Link className={styles.loginLink} href="/login">Log in</Link><Link className={styles.navCta} href="#early-access">Join Waitlist</Link><button className={styles.menuButton} aria-label={menuOpen?"Close navigation":"Open navigation"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?<X size={19}/>:<Menu size={19}/>}</button></div>
      </header>
      {menuOpen&&<nav className={styles.mobileMenu} aria-label="Mobile navigation"><Link onClick={()=>setMenuOpen(false)} href="#platform">Platform</Link><Link onClick={()=>setMenuOpen(false)} href="#community">Community</Link><Link onClick={()=>setMenuOpen(false)} href="#prediction-arena">Prediction Arena</Link><Link onClick={()=>setMenuOpen(false)} href="#research">Research</Link><Link onClick={()=>setMenuOpen(false)} href="#academy">Academy</Link><Link onClick={()=>setMenuOpen(false)} href="/login">Log in</Link><Link onClick={()=>setMenuOpen(false)} href="#early-access">Join Waitlist</Link></nav>}
      <div className={styles.heroContent}>
        <div className={styles.heroEyebrow}><span/> FINANCIAL INTELLIGENCE PLATFORM</div>
        <h1>The intelligence behind<br/><em>financial markets.</em></h1>
        <p>VALTIERA brings together collective financial intelligence, prediction markets and quantitative research in one platform. Explore markets, debate investment ideas, evaluate possible outcomes and discover data-driven insights.</p>
        <div className={styles.heroActions}><Link className={styles.heroPrimary} href="/app">Explore the Platform <ArrowUpRight size={17}/></Link><Link className={styles.heroSecondary} href="#early-access">Join Early Access <ArrowRight size={16}/></Link></div>
        <div className={styles.capabilityRow}>
          <Link href="/app/community" className={styles.capability}><span>01</span><b>Collective Intelligence</b><small>Discuss markets, share theses and challenge financial opinions.</small></Link>
          <Link href="/app/predictions" className={styles.capability}><span>02</span><b>Prediction Arena</b><small>Explore outcomes and test predictions with simulated credits.</small></Link>
          <Link href="/app/quant" className={styles.capability}><span>03</span><b>Quantitative Research</b><small>Explore market data, statistical methods and risk.</small></Link>
        </div>
      </div>
      <div className={styles.heroFoot}><span>COLLECTIVE INTELLIGENCE <i/> PREDICTION MARKETS <i/> QUANTITATIVE RESEARCH</span><a href="#platform" aria-label="Scroll to explore the platform">SCROLL TO EXPLORE <ArrowDown size={14}/></a></div>
    </section>

    <section id="platform" className={styles.information}>
      <div className={styles.container}>
        <div className={styles.introRow}>
          <div><span className={styles.sectionIndex}>01 / THE PLATFORM</span><h2>One platform.<br/><em>Three layers.</em></h2><ExploreLink href="/app">Explore the Platform</ExploreLink></div>
          <p>VALTIERA connects community-driven market discussions, prediction-based analysis and quantitative research in a single environment.</p>
        </div>
        <div className={styles.featureGrid}>
          <Link className={`${styles.featureCard} ${styles.collectiveCard}`} href="/app/community"><span>01 / COLLECTIVE INTELLIGENCE</span><h3>Markets are better understood through debate.</h3><p>Discuss market movements, publish investment theses, challenge arguments and share research.</p><ul><li>Community posts and market discussions</li><li>Bullish and bearish arguments</li><li>Comments, replies and votes</li></ul><b>Explore Community <ArrowUpRight size={16}/></b></Link>
          <Link className={`${styles.featureCard} ${styles.secondaryCard}`} href="/app/predictions"><span>02 / PREDICTION ARENA</span><h3>Put possible outcomes in view.</h3><p>Explore simulated markets and track how expectations change over time.</p><ul><li>YES and NO positions</li><li>Probability and prediction history</li><li>Virtual-credit participation</li></ul><b>Explore Prediction Arena <ArrowUpRight size={16}/></b></Link>
          <Link className={`${styles.featureCard} ${styles.secondaryCard}`} href="/app/quant"><span>03 / QUANTITATIVE RESEARCH</span><h3>Bring evidence into the discussion.</h3><p>Explore market data, statistical analysis and quantitative methods to evaluate risk.</p><ul><li>Market intelligence and charts</li><li>Volatility and correlation analysis</li><li>Methods, assumptions and limitations</li></ul><b>Explore Quant Research <ArrowUpRight size={16}/></b></Link>
        </div>
      </div>
    </section>

    <section id="how-it-works" className={styles.processSection}>
      <div className={styles.container}><div className={styles.sectionHeading}><span className={styles.sectionIndex}>02 / HOW IT WORKS</span><h2>From discussion<br/>to <em>measurable analysis.</em></h2><p>Community sentiment and quantitative research remain separate inputs. Popularity is not a trading signal, and polls do not execute trades.</p></div>
        <div className={styles.flowLanes}>
          <div className={styles.flowLane}><span className={styles.flowLabel}>COLLECTIVE INTELLIGENCE</span>{[["01","Community Discussions"],["02","Bullish and Bearish Arguments"],["03","Decision Arena"],["04","Community Sentiment"]].map(([n,title],i)=><div className={styles.flowItem} key={n}><span>{n}</span><b>{title}</b>{i<3&&<ArrowDown size={15}/>}</div>)}</div>
          <div className={styles.flowLane}><span className={styles.flowLabel}>QUANTITATIVE INTELLIGENCE</span>{[["01","Market Data"],["02","Quantitative Research"],["03","Independent Analysis"],["04","Risk Evaluation"]].map(([n,title],i)=><div className={styles.flowItem} key={n}><span>{n}</span><b>{title}</b>{i<3&&<ArrowDown size={15}/>}</div>)}</div>
        </div><div className={styles.flowConverge}><span/><b>VALTIERA INTELLIGENCE PLATFORM</b><span/></div>
      </div>
    </section>

    <section id="markets" className={styles.marketSection}><div className={styles.container}><div className={styles.marketGrid}><div><span className={styles.sectionIndex}>03 / MARKET INTELLIGENCE</span><h2>See beyond<br/><em>the market price.</em></h2><p>Explore supported financial markets through data, historical movements, market context and analytical tools. Data availability and delay depend on the provider.</p><ul><li>Stocks and equities</li><li>Cryptocurrency</li><li>Futures and options where supported</li><li>Trends, volume, volatility and historical data</li><li>Watchlists and interactive charts</li></ul><ExploreLink href="/app/markets">Explore Market Intelligence</ExploreLink></div><div className={styles.marketVisual}><div className={styles.visualHeader}><span>VALTIERA / MARKET VIEW</span><span>Illustrative interface · no live quote shown</span></div><div className={styles.chartArea}><div className={styles.chartGrid}/><svg viewBox="0 0 680 260" role="img" aria-label="Illustrative market chart with no price values"><path d="M0 208 C40 196 55 217 91 179 S151 187 190 149 S245 162 278 126 S331 147 370 98 S425 125 463 87 S518 113 557 62 S619 92 680 28" fill="none" stroke="url(#line)" strokeWidth="3"/><defs><linearGradient id="line"><stop stopColor="#ff8a73"/><stop offset="1" stopColor="#f0605a"/></linearGradient></defs></svg></div><div className={styles.visualFooter}><span>Historical market context</span><span>Source and timestamp shown in app</span></div></div></div></div></section>

    <section id="community" className={styles.editorialSection}><div className={styles.container}><div className={styles.editorialGrid}><div><span className={styles.sectionIndex}>04 / COLLECTIVE INTELLIGENCE</span><h2>Markets are better<br/>understood through <em>debate.</em></h2><p>Join discussions, challenge assumptions and explore different perspectives on financial markets.</p><ul><li>Publish discussions and investment theses</li><li>Comment, reply, upvote and downvote</li><li>Explore trending discussions and categories</li></ul><ExploreLink href="/app/community">Explore the Community</ExploreLink></div><div className={styles.discussionPreview}><div className={styles.previewTop}><span>COMMUNITY / DISCUSSION</span><span>Illustrative preview</span></div><b>Market discussion</b><p>What could change your view on this market?</p><div className={styles.previewRule}/><div className={styles.previewLine}/><div className={styles.previewLine}/><div className={styles.previewLineShort}/><div className={styles.previewBottom}><span>THESIS</span><span>COUNTERARGUMENT</span><span>RESEARCH CONTEXT</span></div></div></div></div></section>

    <section id="decision-arena" className={styles.editorialSection}><div className={styles.container}><div className={`${styles.editorialGrid} ${styles.editorialReverse}`}><div><span className={styles.sectionIndex}>05 / DECISION ARENA</span><h2>Challenge<br/>the <em>consensus.</em></h2><p>Put financial opinions to the test through structured polls and community arguments. Community votes show expressed opinion, not a reliable forecast of future returns.</p><ul><li>Create financial polls and market scenarios</li><li>Compare bullish and bearish positions</li><li>Review participation and poll outcomes</li></ul><ExploreLink href="/app/polls">Enter the Decision Arena</ExploreLink></div><div className={styles.pollPreview}><div className={styles.previewTop}><span>DECISION ARENA / POLL</span><span>Illustrative</span></div><b>Which view best reflects your research?</b><div className={styles.pollOption}><span>Bullish case</span><i style={{width:"58%"}}/></div><div className={styles.pollOption}><span>Bearish case</span><i style={{width:"42%"}}/></div><small>Visual example only · no live votes represented</small></div></div></div></section>

    <section id="prediction-arena" className={styles.predictionSection}><div className={styles.container}><div className={styles.editorialGrid}><div><span className={styles.sectionIndex}>06 / PREDICTION ARENA</span><h2>Turn opinions into<br/><em>measurable predictions.</em></h2><p>Explore potential market outcomes through simulated prediction markets and evaluate how expectations evolve.</p><ul><li>YES and NO positions with probability changes</li><li>Virtual credits and participation history</li><li>Defined resolution conditions</li><li>Simulated activity only; credits have no cash value</li></ul><ExploreLink href="/app/predictions">Explore Prediction Arena</ExploreLink></div><div className={styles.predictionVisual}><SmokeMedia lazy className={styles.panelSmoke}/><div className={styles.predictionOverlay}><span>SIMULATED MARKET</span><b>Explore a possible outcome</b><div><i>YES</i><i>NO</i></div><small>Virtual credits · no real-money wagering</small></div></div></div></div></section>

    <section id="research" className={styles.editorialSection}><div className={styles.container}><div className={`${styles.editorialGrid} ${styles.editorialReverse}`}><div><span className={styles.sectionIndex}>07 / QUANTITATIVE RESEARCH</span><h2>Evidence<br/>over <em>instinct.</em></h2><p>Explore quantitative approaches to understanding markets, evaluating strategies and measuring financial risk. Current research tools cover statistical methods; backtesting execution is not currently available.</p><ul><li>Statistical analysis and market regimes</li><li>Volatility, correlation and risk metrics</li><li>Methodology, assumptions and limitations</li></ul><ExploreLink href="/app/quant">Explore Quant Research</ExploreLink></div><div className={styles.researchVisual}><div className={styles.previewTop}><span>RESEARCH / METHODS</span><span>Illustrative report layout</span></div><div className={styles.researchBars}><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className={styles.researchCaption}>Statistical methods · risk context · uncertainty</div></div></div></div></section>

    <section id="portfolio" className={styles.portfolioSection}><div className={styles.container}><div className={styles.portfolioRow}><div><span className={styles.sectionIndex}>08 / VIRTUAL PORTFOLIO</span><h2>Test your thinking<br/><em>before committing capital.</em></h2><p>Build hypothetical portfolios, track simulated positions and evaluate different allocations. Portfolio results are simulated and carry no monetary value.</p><ExploreLink href="/app/portfolio">View Virtual Portfolio</ExploreLink></div><div className={styles.portfolioTags}><span>Virtual portfolios</span><span>Simulated positions</span><span>Asset allocation</span><span>Transaction history</span><span>Performance and risk context</span></div></div></div></section>

    <section id="academy" className={styles.editorialSection}><div className={styles.container}><div className={styles.editorialGrid}><div><span className={styles.sectionIndex}>09 / VALTIERA ACADEMY</span><h2>Understand before<br/>you <em>participate.</em></h2><p>Build financial knowledge through educational videos, research material and structured learning.</p><ul><li>Course previews and lesson descriptions</li><li>Video learning and course categories</li><li>Bookmarks and learning progress</li></ul><ExploreLink href="/app/academy">Visit the Academy</ExploreLink></div><div className={styles.academyVisual}><div className={styles.lessonTile}><span>VALTIERA ACADEMY</span><b>Learn at your pace.</b><small>Video lessons · research material · progress tracking</small><ArrowRight size={18}/></div></div></div></div></section>

    <section id="product-overview" className={styles.overviewSection}><div className={styles.container}><span className={styles.sectionIndex}>10 / PRODUCT OVERVIEW</span><div className={styles.overviewRow}><div><h2>Understand what<br/>powers <em>VALTIERA.</em></h2><p>Explore the platform architecture, research framework, prediction mechanics and product design.</p></div><Link href="/overview" className={styles.overviewButton}>Read the Product Overview <ArrowUpRight size={17}/></Link></div><div className={styles.overviewTopics}><span>Protocol documentation</span><span>Architecture and data flow</span><span>Prediction mechanics</span><span>Research methodology</span><span>Risk framework and roadmap</span></div></div></section>

    <WaitlistSection />

    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerMain}`}><div className={styles.footerBrand}><Link className={styles.brand} href="#top"><BrandLogo/><span>VALTIERA</span></Link><p>VALTIERA is a financial intelligence platform bringing together collective discussions, prediction-based analysis and quantitative research to help users explore and understand financial markets.</p></div><div className={styles.footerColumn}><b>Platform</b><Link href="/app/community">Community</Link><Link href="/app/polls">Decision Arena</Link><Link href="/app/predictions">Prediction Arena</Link><Link href="/app/markets">Market Intelligence</Link><Link href="/app/quant">Quantitative Research</Link></div><div className={styles.footerColumn}><b>Resources</b><Link href="/app/academy">Academy</Link><Link href="/overview">Product Overview &amp; Documentation</Link><Link href="/register">Contact</Link></div></div>
      <div className={`${styles.container} ${styles.footerBottom}`}><span>© {new Date().getFullYear()} VALTIERA</span><div><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></div><span>For informational and educational purposes.</span></div>
    </footer>
  </main>;
}

function WaitlistSection(){

  const [count,setCount]=useState<number|null>(null),[email,setEmail]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");

  useEffect(()=>{let alive=true;const refresh=async()=>{try{const response=await fetch("/api/waitlist/count",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json();if(alive&&Number.isInteger(data.count))setCount(data.count)}catch{if(alive)setCount(null)}};void refresh();const timer=window.setInterval(refresh,20000);return()=>{alive=false;window.clearInterval(timer)}},[]);

  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError("");setMessage("");const normalized=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(normalized)){setError("Enter a valid email address.");return}setBusy(true);try{const response=await fetch("/api/waitlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:normalized})});const data=await response.json();if(response.status===409&&data.duplicate){setMessage("You're already on the VALTIERA waiting list.");return}if(!response.ok){const reference=typeof data.requestId==="string"?` (Reference: ${data.requestId})`:"";throw new Error(`${data.error||"We couldn’t join the list. Please try again."}${reference}`)};setMessage("You're on the list. Thank you for your interest in VALTIERA. We'll keep you updated as early access becomes available.");setEmail("");try{const countResponse=await fetch("/api/waitlist/count",{cache:"no-store"});if(countResponse.ok){const result=await countResponse.json();if(Number.isInteger(result.count))setCount(result.count)}}catch{/* The independent counter poll will retry; registration already succeeded. */}}catch(e){setError(e instanceof Error?e.message:"We couldn’t join the list. Please try again.")}finally{setBusy(false)}}

  return <section className={styles.waitlistSection} id="early-access" aria-labelledby="waitlist-title"><SmokeMedia lazy className={styles.ctaSmoke}/><div className={styles.waitlistCard}><div className={styles.waitlistCopy}><span className={styles.sectionIndex}>VALTIERA · EARLY ACCESS</span><h2 id="waitlist-title">Get early access to VALTIERA.</h2><p>Join the early-access community exploring collective financial intelligence, prediction markets and quantitative research.</p><div className={styles.waitlistCount} aria-live="polite"><strong key={count??"loading"}>{count===null?"—":count.toLocaleString()}</strong><span>{count===null?"Confirmed registrations unavailable":"confirmed people on the waiting list"}</span></div></div><form className={styles.waitlistForm} onSubmit={submit}><label className={styles.emailLabel} htmlFor="waitlist-email">Email address</label><div className={styles.emailJoin}><input id="waitlist-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} autoComplete="email" placeholder="Enter your email to join the VALTIERA waiting list"/><button type="submit" disabled={busy}>{busy?"Joining…":"Get Early Access"}<ArrowRight size={16}/></button></div>{error&&<p className={styles.waitlistError} role="alert">{error}</p>}{message&&<p className={styles.waitlistSuccess} role="status"><Check size={15}/>{message.includes("already")?"You're already on the list.":"You're on the list."}<span>{message.includes("already")?"Your email is already registered for VALTIERA updates.":"Thank you for your interest in VALTIERA. We'll keep you updated as early access becomes available."}</span></p>}<small>Your email stays private and is used only for VALTIERA updates.</small></form></div></section>

}
