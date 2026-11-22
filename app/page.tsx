"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, X } from "lucide-react";
import styles from "./landing.module.css";

const heroVideo = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4";
const practiceVideo = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4";
const collectiveImage = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85";
const heroPoster = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260430_115327_3f256636-9e63-4885-8d0b-09317dc2b0a5.png&w=1280&q=85";
const interests = ["Platform User", "Investor Interest", "Research & Technology", "Quantitative Research & Technology", "Strategic Partnership", "General Interest"];

function BrandLogo() {
  return <Image className={styles.brandLogo} src="/images/valtiera-logo.png" alt="" width={48} height={48}/>;
}
function ExploreLink({ href = "/app", children }: { href?: string; children: React.ReactNode }) {
  return <Link className={styles.exploreLink} href={href}>{children}<span><ArrowRight size={17}/></span></Link>;
}
function DeferredVideo({ src, poster, className, onError, ariaHidden = false }: { src: string; poster: string; className: string; onError?: () => void; ariaHidden?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      video.src = src;
      video.load();
      void video.play().catch(() => undefined);
      observer.disconnect();
    };
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) start(); }, { rootMargin: "180px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);
  return <video ref={ref} className={className} autoPlay muted loop playsInline preload="none" poster={poster} aria-hidden={ariaHidden} onError={onError}/>;
}

export default function Home() {
  const [modal, setModal] = useState(false);
  const [practiceVideoFailed, setPracticeVideoFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return <main className={styles.page}>
    <section id="top" className={styles.heroSection}>
      <video className={styles.heroVideo} autoPlay muted loop playsInline preload="auto" poster={heroPoster} aria-hidden="true"><source src={heroVideo} type="video/mp4"/></video>
      <div className={styles.heroOverlay} aria-hidden="true"/>
      <header className={styles.navbar}>
        <Link className={styles.brand} href="#top" aria-label="VALTIERA home"><BrandLogo/><span>VALTIERA</span></Link>
        <nav className={`${styles.navLinks} liquid-glass`} aria-label="Main navigation">
          <Link href="#information">Platform</Link><Link href="/overview">Overview</Link><Link href="/app/quant">Research</Link><Link href="/app/community">Community</Link><Link href="/app/academy">Academy</Link>
        </nav>
        <div className={styles.navActions}><Link className={`${styles.navCta} liquid-glass`} href="/app">Explore platform <ArrowUpRight size={15}/></Link><button className={`${styles.menuButton} liquid-glass`} aria-label={menuOpen?"Close navigation":"Open navigation"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?<X size={19}/>:<Menu size={19}/>}</button></div>
      </header>
      {menuOpen&&<nav className={`${styles.mobileMenu} liquid-glass`} aria-label="Mobile navigation"><Link onClick={()=>setMenuOpen(false)} href="#information">Platform</Link><Link onClick={()=>setMenuOpen(false)} href="/overview">Overview</Link><Link onClick={()=>setMenuOpen(false)} href="/app/quant">Research</Link><Link onClick={()=>setMenuOpen(false)} href="/app/community">Community</Link><Link onClick={()=>setMenuOpen(false)} href="/app/academy">Academy</Link></nav>}
      <div className={styles.heroContent}>
        <div className={styles.eyebrow}><i/> FINANCIAL INTELLIGENCE · VALTIERA</div>
        <h1>Intelligence<br/><span>Behind Capital.</span></h1>
        <p>Where collective intelligence meets quantitative research. Explore financial markets, challenge assumptions and see the forces shaping capital.</p>
        <div className={styles.heroActions}><Link className={`${styles.heroPrimary} liquid-glass`} href="/app">Explore the platform <ArrowUpRight size={17}/></Link><Link className={styles.heroSecondary} href="/app/quant">Discover our research <ArrowRight size={16}/></Link></div>
      </div>
      <div className={styles.heroFoot}><span>COLLECTIVE INTELLIGENCE <i/> QUANTITATIVE RESEARCH <i/> MARKET CONTEXT</span><a href="#information" aria-label="Scroll to explore the platform">SCROLL TO EXPLORE <ArrowDown size={14}/></a></div>
    </section>

    <section id="information" className={styles.information}>
      <div className={styles.container}>
        <div className={styles.introRow}>
          <div><span className={styles.sectionIndex}>01 / THE PLATFORM</span><h2>Meet<br/><em>VALTIERA.</em></h2><ExploreLink>Discover the Platform</ExploreLink></div>
          <p>VALTIERA brings together financial communities, market intelligence and quantitative research in one platform. Explore ideas, challenge assumptions and understand market opportunities through collective and independent analysis.</p>
        </div>
        <div className={styles.featureGrid}>
          <Link className={`${styles.featureCard} ${styles.collectiveCard}`} href="/app/community">
            <img src={collectiveImage} alt="" loading="lazy"/><div className={styles.cardShade}/><div className={styles.featureText}><span>01 / COMMUNITY</span><h3>Collective Intelligence</h3><p>Explore financial discussions, challenge investment theses and understand how the community views market opportunities.</p><b>Explore the community <ArrowUpRight size={16}/></b></div>
          </Link>
          <Link className={`${styles.featureCard} ${styles.purpleCard}`} href="/app/markets"><span>02 / DATA &amp; RESEARCH</span><h3>Market Intelligence</h3><p>Understand market movements through financial data, market analysis and quantitative research.</p><b>Explore markets <ArrowUpRight size={16}/></b><div className={styles.cardOrb} aria-hidden="true"/></Link>
          <Link className={`${styles.featureCard} ${styles.purpleCard}`} href="/app/predictions"><span>03 / SCENARIO RESEARCH</span><h3>Prediction Arena</h3><p>Challenge market assumptions, explore possible outcomes and evaluate predictions through simulated markets.</p><b>Explore scenarios <ArrowUpRight size={16}/></b><div className={`${styles.cardOrb} ${styles.cardOrbAlt}`} aria-hidden="true"/></Link>
        </div>
        <section className={styles.insideSection} aria-labelledby="inside-valtiera-title">
          <div className={styles.insideIntro}>
            <span className={styles.sectionIndex}>02 / HOW THE PLATFORM WORKS</span>
            <h2 id="inside-valtiera-title">Inside <em>VALTIERA.</em></h2>
            <div><h3>One platform. Multiple layers of financial intelligence.</h3><p>VALTIERA brings together financial communities, prediction-based analysis and quantitative research to create a structured environment for understanding financial markets.</p></div>
          </div>
          <div className={styles.overviewCards}>
            {[
              { n:"01", title:"Collective Intelligence", text:"Discuss markets, publish investment theses, challenge opinions, participate in polls and share research.", href:"/app/community", label:"Explore the community", dark:false },
              { n:"02", title:"Decision Arena", text:"Create financial polls, compare bullish and bearish arguments, vote on opportunities and observe changes in community sentiment.", href:"/app/polls", label:"Enter the Decision Arena", dark:true },
              { n:"03", title:"Prediction Arena", text:"Explore possible market outcomes through simulated prediction markets and virtual credits with no cash value.", href:"/app/predictions", label:"Explore simulated markets", dark:true },
              { n:"04", title:"Market Intelligence", text:"Explore supported financial markets, provider charts, market movements and research context.", href:"/app/markets", label:"Explore market charts", dark:false },
              { n:"05", title:"Quantitative Research", text:"Study independent methods for volatility, momentum, correlations, market conditions and risk. Backtest execution is not currently available.", href:"/app/quant", label:"Explore research", dark:true },
              { n:"06", title:"Virtual Portfolio", text:"Test hypothetical allocations, monitor simulated prediction positions and understand practice ledger outcomes.", href:"/app/portfolio", label:"View the virtual ledger", dark:false },
            ].map((card) => <Link key={card.n} href={card.href} className={`${styles.overviewCard} ${card.dark ? styles.overviewCardDark : ""}`}>
              <span className={styles.overviewNumber}>{card.n} <i>PLATFORM LAYER</i></span>
              <span className={styles.overviewGraphic} aria-hidden="true"><i/><i/><i/></span>
              <span className={styles.overviewCardCopy}><b>{card.title}</b><span>{card.text}</span></span>
              <span className={styles.overviewCardLink}>{card.label}<ArrowUpRight size={15}/></span>
            </Link>)}
          </div>
          <div className={styles.intelligenceFlow}>
            <div className={styles.flowHeading}><span>INDEPENDENT INPUTS · SHARED CONTEXT</span><p>Community opinion and quantitative analysis remain separate inputs. Poll popularity does not trigger automatic trading.</p></div>
            <div className={styles.flowLanes}>
              <div className={styles.flowLane}>
                <span className={styles.flowLaneLabel}>COLLECTIVE INTELLIGENCE</span>
                <div className={styles.flowStep}><i>01</i><b>Community Discussions</b><small>Theses, questions and debate</small></div><ArrowDown className={styles.flowArrow} size={17}/>
                <div className={styles.flowStep}><i>02</i><b>Decision Arena</b><small>Votes and opposing arguments</small></div><ArrowDown className={styles.flowArrow} size={17}/>
                <div className={styles.flowStep}><i>03</i><b>Community Sentiment</b><small>An aggregate of expressed views</small></div>
              </div>
              <div className={styles.flowLane}>
                <span className={styles.flowLaneLabel}>QUANTITATIVE INTELLIGENCE</span>
                <div className={styles.flowStep}><i>01</i><b>Market Data</b><small>Provider-supplied context</small></div><ArrowDown className={styles.flowArrow} size={17}/>
                <div className={styles.flowStep}><i>02</i><b>Quantitative Research</b><small>Methods, assumptions and risk</small></div><ArrowDown className={styles.flowArrow} size={17}/>
                <div className={styles.flowStep}><i>03</i><b>Independent Analysis</b><small>Evaluated apart from the crowd</small></div>
              </div>
            </div>
            <div className={styles.flowMerge} aria-hidden="true"><span/><ArrowDown size={18}/><span/></div>
            <div className={styles.flowDashboard}><span>SHARED RESEARCH VIEW</span><b>VALTIERA Intelligence Dashboard</b><small>Evidence, provenance and uncertainty presented together · no automatic execution</small></div>
          </div>
          <Link className={styles.overviewCta} href="/overview">Explore the Complete Overview <ArrowRight size={17}/></Link>
        </section>
      </div>
    </section>

    <section id="ecosystem" className={styles.ecosystem} aria-label="VALTIERA research disciplines">
      <div className={`${styles.container} ${styles.ecosystemGrid}`}>
        <div><span className={styles.sectionIndex}>A CONNECTED PERSPECTIVE</span><h2>Markets,<br/><em>in context.</em></h2><p>One workspace for the ideas, evidence and analysis behind financial decisions.</p></div>
        <div className={styles.disciplineGrid}><div><span>01</span><b>Community insight</b><small>Debate and compare independent perspectives.</small></div><div><span>02</span><b>Quantitative research</b><small>Evaluate data, methods, uncertainty and risk.</small></div><div><span>03</span><b>Market intelligence</b><small>Explore supported assets with market charts.</small></div></div>
      </div>
    </section>

    <section id="use-cases" className={styles.useCases}>
      <div className={`${styles.container} ${styles.useCasesGrid}`}>
        <div className={styles.useCasesCopy}><span className={styles.sectionIndex}>03 / VALTIERA IN PRACTICE</span><h2>Explore the<br/><em>possibilities.</em></h2><p>From financial discussions and collective market predictions to independent quantitative research, VALTIERA connects the different perspectives shaping financial markets.</p><ExploreLink href="/app/community">Know more</ExploreLink></div>
        <div className={styles.practiceCard} style={{ backgroundImage: `url("${collectiveImage}")` }}>
          {!practiceVideoFailed && <DeferredVideo className={styles.practiceVideo} src={practiceVideo} poster={collectiveImage} onError={() => setPracticeVideoFailed(true)}/> }
          <div className={styles.practiceShade}/><div className={styles.practiceText}><span>COMMUNITY · RESEARCH · PERSPECTIVE</span><h3>Collective Intelligence</h3><p>Discuss financial markets, create investment polls, challenge ideas and explore quantitative insights.</p><ExploreLink href="/app/community">Know more</ExploreLink></div>
        </div>
      </div>
    </section>

    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerMain}`}><Link className={styles.brand} href="#top"><BrandLogo/><span>VALTIERA</span></Link><p>Intelligence behind capital.</p><div className={styles.footerLinks}><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><button onClick={() => setModal(true)}>Register your interest</button></div></div>
      <div className={`${styles.container} ${styles.footerBottom}`}><span>© {new Date().getFullYear()} VALTIERA</span><span>Illustrative information · not investment advice.</span></div>
    </footer>
    {modal && <RegistrationModal close={() => setModal(false)}/>}
  </main>;
}

function RegistrationModal({close}:{close:()=>void}) {
  const [step,setStep]=useState(1),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState("");
  const [form,setForm]=useState({full_name:"",email:"",country:"",interest_category:"",organisation:"",professional_role:"",linkedin_url:"",message:"",investor_type:"",consent_privacy:false,consent_marketing:false,website:""});
  const set=(key:string,value:string|boolean)=>setForm(f=>({...f,[key]:value}));
  const next=()=>{setError("");if(step===1){if(!form.full_name.trim()||!form.email.trim()||!/^\S+@\S+\.\S+$/.test(form.email)||!form.country.trim()){setError("Enter your name, a valid email address and country to continue.");return}}if(step===2){if(!form.interest_category){setError("Choose an area of interest to continue.");return}if(form.linkedin_url&&!/^https?:\/\//i.test(form.linkedin_url)){setError("Enter a full LinkedIn URL beginning with https://");return}}setStep(s=>s+1)};
  const submit=async()=>{setError("");if(!form.consent_privacy){setError("Please agree to the Privacy Policy to submit your registration.");return}setBusy(true);try{const {website,...payload}=form;const response=await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,honeypot:website})});const data=await response.json();if(!response.ok)throw new Error(data.error||"We couldn’t submit your registration. Please try again.");setSuccess(true)}catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try again.")}finally{setBusy(false)}};
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="reg-title"><button className="modal-close" onClick={close} aria-label="Close"><X/></button>{success?<div className="success"><div className="success-icon"><Check/></div><div className="eyebrow">REGISTRATION RECEIVED</div><h2>You're on our radar.</h2><p>Thank you for your interest in VALTIERA. We've received your registration and look forward to connecting with you.</p><button className="button dark" onClick={close}>Return to VALTIERA <ArrowRight size={16}/></button></div>:<><div className="modal-heading"><div className="eyebrow">VALTIERA · EXPRESSION OF INTEREST</div><h2 id="reg-title">Be part of what's next.</h2><p>Discover a new approach to collective intelligence, quantitative research and digital investment infrastructure. Register your interest in VALTIERA.</p></div><div className="stepper"><span className={step>=1?"current":""}>01 <i>Personal</i></span><b/><span className={step>=2?"current":""}>02 <i>Interest</i></span><b/><span className={step>=3?"current":""}>03 <i>Review</i></span></div>
  {step===1&&<div className="form-grid"><label>Full name <em>*</em><input value={form.full_name} onChange={e=>set("full_name",e.target.value)} autoComplete="name" placeholder="Your name"/></label><label>Email address <em>*</em><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} autoComplete="email" placeholder="you@example.com"/></label><label className="wide">Country <em>*</em><input value={form.country} onChange={e=>set("country",e.target.value)} autoComplete="country-name" placeholder="Country of residence"/></label></div>}
  {step===2&&<div className="form-grid"><label className="wide">Area of interest <em>*</em><select value={form.interest_category} onChange={e=>set("interest_category",e.target.value)}><option value="">Select an area</option><optgroup label="Platform and research">{interests.filter(x=>x!=="Investor Interest"&&x!=="Strategic Partnership").map(x=><option key={x}>{x}</option>)}</optgroup><optgroup label="Investor and partnership enquiries">{interests.filter(x=>x==="Investor Interest"||x==="Strategic Partnership").map(x=><option key={x}>{x}</option>)}</optgroup></select></label>{form.interest_category==="Investor Interest"&&<label className="wide">What best describes your organisation?<select value={form.investor_type} onChange={e=>set("investor_type",e.target.value)}><option value="">Choose one (optional)</option>{["Angel Investor","Venture Capital","Family Office","Institutional Investor","Other"].map(x=><option key={x}>{x}</option>)}</select></label>}<label>Company / Organisation<input value={form.organisation} onChange={e=>set("organisation",e.target.value)} placeholder="Optional"/></label><label>Professional role<input value={form.professional_role} onChange={e=>set("professional_role",e.target.value)} placeholder="Optional"/></label><label className="wide">LinkedIn profile<input type="url" value={form.linkedin_url} onChange={e=>set("linkedin_url",e.target.value)} placeholder="https://linkedin.com/in/…"/></label><label className="wide">A brief introduction or message<textarea value={form.message} onChange={e=>set("message",e.target.value)} rows={3} placeholder="What interests you about VALTIERA? (optional)"/></label><label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>set("website",e.target.value)}/></label></div>}
  {step===3&&<div className="review"><div><span>NAME</span><b>{form.full_name}</b></div><div><span>EMAIL</span><b>{form.email}</b></div><div><span>COUNTRY</span><b>{form.country}</b></div><div><span>AREA OF INTEREST</span><b>{form.interest_category}</b></div><div className="review-note">This is an expression of interest only, not an offer of securities, invitation to deposit funds or commitment to provide investment services.</div><label className="check-label"><input type="checkbox" checked={form.consent_privacy} onChange={e=>set("consent_privacy",e.target.checked)}/><span>I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> and consent to VALTIERA processing my information to respond to my enquiry. <em>*</em></span></label><label className="check-label optional"><input type="checkbox" checked={form.consent_marketing} onChange={e=>set("consent_marketing",e.target.checked)}/><span>I’d like to receive occasional updates about VALTIERA. (Optional)</span></label></div>}
  {error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions">{step>1?<button className="back" onClick={()=>{setError("");setStep(s=>s-1)}}>Back</button>:<span/>}{step<3?<button className="button dark" onClick={next}>Continue <ArrowRight size={15}/></button>:<button className="button dark" disabled={busy} onClick={submit}>{busy?"Submitting…":"Submit registration"} <ArrowRight size={15}/></button>}</div></>}</div></div>
}
