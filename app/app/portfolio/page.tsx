"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpenText, Coins, History, Medal, ShieldAlert, TrendingUp } from "lucide-react";
import { demoMarkets } from "@/lib/demo-markets";
import { demoPortfolioSnapshots } from "@/lib/demo-platform";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Position = { id: string; market_id: string; side: "YES" | "NO"; virtual_credits: number; probability_at_entry: number; potential_payout: number; payout: number; created_at: string; settled_at: string | null };
type Tx = { id: string; transaction_type: string; amount: number; market_id: string | null; note: string; created_at: string };
function localData<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

export default function Portfolio() {
  const client = useMemo(() => { try { return supabaseBrowser(); } catch { return null; } }, []);
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let savedBalance = Number(localStorage.getItem("valtiera_demo_balance"));
    if (!Number.isFinite(savedBalance) || savedBalance < 0) {
      savedBalance = 10000;
      localStorage.setItem("valtiera_demo_balance", "10000");
      localStorage.setItem("valtiera_demo_transactions", JSON.stringify([{ id: "demo-initial-grant", transaction_type: "initial_grant", amount: 10000, note: "Demo welcome credits · no cash value", created_at: new Date().toISOString() }]));
    }
    setBalance(savedBalance);
    setPositions(localData<Position[]>("valtiera_demo_positions", []));
    setTransactions(localData<Tx[]>("valtiera_demo_transactions", []));
    if (client) void (async () => {
      const auth = await client.auth.getUser();
      const user = auth.data.user;
      if (user) {
        setUid(user.id);
        const [portfolio, ownPositions, ledger] = await Promise.all([
          client.from("virtual_portfolios").select("balance").eq("user_id", user.id).maybeSingle(),
          client.from("prediction_positions").select("id,market_id,side,virtual_credits,probability_at_entry,potential_payout,payout,created_at,settled_at").eq("user_id", user.id).order("created_at", { ascending: false }),
          client.from("virtual_transactions").select("id,transaction_type,amount,market_id,note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
        ]);
        if (portfolio.error || ownPositions.error || ledger.error) setError("Apply the demo market ledger migration to sync this account. Browser demo data is shown until then.");
        else {
          if (portfolio.data) setBalance(portfolio.data.balance);
          setPositions(ownPositions.data as Position[]);
          setTransactions(ledger.data as Tx[]);
        }
      }
    })();
  }, [client]);

  const openPositions = positions.filter(position => !position.settled_at);
  const settledPositions = positions.filter(position => position.settled_at);
  const wins = settledPositions.filter(position => position.payout > position.virtual_credits).length;
  const accuracy = settledPositions.length ? Math.round(wins / settledPositions.length * 100) : null;

  return (
    <>
      <div className="terminal-heading compact">
        <div><div className="terminal-kicker">PRACTICE LEDGER · {uid ? "MEMBER ACCOUNT" : "LOCAL DEMO"}</div><h1>Virtual portfolio.</h1><p>Practice prediction sizing and settlement with credits that have no cash value.</p></div>
        <div className="virtual-credit-chip"><Coins size={16}/><span>AVAILABLE</span><b>{balance.toLocaleString()}</b><small>DEMO CREDITS</small></div>
      </div>
      {error && <div className="community-alert">{error}</div>}
      <div className="portfolio-terms"><ShieldAlert size={16}/><span>Credits are non-purchasable, non-transferable, non-redeemable, and for educational simulation only. No deposits or cash payouts.</span></div>
      <div className="portfolio-stats"><div><span>OPEN POSITIONS</span><b>{openPositions.length}</b></div><div><span>SETTLED PREDICTIONS</span><b>{settledPositions.length}</b></div><div><span>HISTORICAL ACCURACY</span><b>{accuracy === null ? "—" : `${accuracy}%`}</b></div></div>
      <div className="portfolio-action-row"><Link className="button dark" href="/app/predictions">Explore demo markets <ArrowUpRight size={15}/></Link><Link className="button outline" href="/app/leaderboard"><Medal size={14}/> Demo leaderboard</Link></div>

      <div className="dashboard-section-title"><div><span className="terminal-kicker">YOUR OPEN SIMULATIONS</span><h2>Current positions</h2></div><span>{openPositions.reduce((sum, position) => sum + position.virtual_credits, 0).toLocaleString()} credits at risk in simulation</span></div>
      {openPositions.length ? <div className="position-list">{openPositions.map(position => {
        const market = demoMarkets.find(item => item.id === position.market_id);
        return <div className="position-row portfolio-position" key={position.id}><span className={position.side === "YES" ? "side-mark yes-mark" : "side-mark no-mark"}>{position.side}</span><div><Link href={`/app/predictions/${position.market_id}`}>{market?.question || position.market_id}</Link><small>{new Date(position.created_at).toLocaleString()} · {position.virtual_credits.toLocaleString()} demo credits · entry probability {position.probability_at_entry}%</small></div><b>Up to {position.potential_payout.toLocaleString()}<small> demo credits</small></b></div>;
      })}</div> : <div className="empty-panel"><p>No open positions yet.</p><Link href="/app/predictions">Choose a demo market <ArrowUpRight size={14}/></Link></div>}

      <div className="dashboard-section-title"><div><span className="terminal-kicker">LEDGER</span><h2>Transaction history</h2></div><span><History size={14}/> {transactions.length} entries</span></div>
      {transactions.length ? <div className="position-list transaction-list">{transactions.slice(0, 50).map(transaction => <div className="position-row" key={transaction.id}><span className="side-mark tx-mark">{transaction.transaction_type === "initial_grant" ? "+" : "•"}</span><div><b>{transaction.transaction_type.replaceAll("_", " ")}</b><small>{transaction.note}{transaction.market_id && ` · ${demoMarkets.find(market => market.id === transaction.market_id)?.question || transaction.market_id}`} · {new Date(transaction.created_at).toLocaleString()}</small></div><b>{transaction.transaction_type === "prediction_allocation" ? "−" : "+"}{transaction.amount.toLocaleString()} credits</b></div>)}</div> : <div className="empty-panel">Your demo grant and later practice allocations will appear here.</div>}

      <div className="dashboard-section-title demo-roster-title"><div><span className="terminal-kicker">SEPARATE SAMPLE DATA</span><h2>Demo persona portfolios</h2></div><span>Never included in actual member account totals</span></div>
      <div className="demo-persona-portfolio-grid">{demoPortfolioSnapshots.map(person => <article key={person.username}><div><b>{person.username}</b><span>DEMO PERSONA</span></div><strong>{person.balance.toLocaleString()} <small>sample credits</small></strong><p>{person.openPositions} open · {person.resolvedPredictions} resolved · {person.lastView} last sample view</p></article>)}</div>
      <p className="sim-disclaimer"><TrendingUp size={14}/> Unsettled positions are not valued as profit or loss. Accuracy is shown only after a sourced moderator resolution.</p>
      <div className="portfolio-connection-card"><BookOpenText size={18}/><div><b>Not a brokerage account</b><p>No live assets, real-money trades, deposits, withdrawals, or cash settlement are connected.</p></div></div>
    </>
  );
}

