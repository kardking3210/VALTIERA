"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  BookOpenText,
  ChartNoAxesCombined,
  CircleUserRound,
  Compass,
  FlaskConical,
  House,
  Medal,
  MessageCircle,
  MessageSquareText,
  Menu,
  Trophy,
  Vote,
  LogOut,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { StorageCleanup } from "./StorageCleanup";
import "./terminal.css";
import "./app-theme.css";

const sections = [
  {
    title: "Discover",
    items: [
      { href: "/app", label: "Home", icon: House },
      { href: "/app/community", label: "Community", icon: MessageSquareText },
      { href: "/app/polls", label: "Decision Arena", icon: Vote },
      { href: "/app/predictions", label: "Prediction Markets", icon: Trophy },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/app/markets", label: "Market Intelligence", icon: ChartNoAxesCombined },
      { href: "/app/quant", label: "Quant Research", icon: FlaskConical },
      { href: "/app/research", label: "Research & News", icon: Compass },
      { href: "/app/portfolio", label: "Virtual Portfolio", icon: Activity },
    ],
  },
  {
    title: "Learn",
    items: [
      { href: "/app/academy", label: "Academy", icon: BookOpenText },
      { href: "/overview", label: "Product Overview", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/app/profile", label: "Profile", icon: CircleUserRound },
      { href: "/app/messages", label: "Messages", icon: MessageCircle },
      { href: "/app/leaderboard", label: "Leaderboard", icon: Medal },
    ],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="terminal">
      <StorageCleanup />
      <aside className="terminal-sidebar">
        <div className="terminal-mobile-header">
          <Link className="terminal-brand" href="/" aria-label="VALTIERA home">
            <Image src="/images/valtiera-logo.png" alt="" width={40} height={40} className="terminal-brand-logo" />
            <span>VALTIERA</span>
          </Link>
          <button className="terminal-mobile-toggle liquid-glass" type="button" aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>{mobileNavOpen ? <X size={18}/> : <Menu size={18}/>}</button>
        </div>
        <div className="terminal-mode"><i /> FINANCIAL INTELLIGENCE · DEMO</div>
        <nav className={mobileNavOpen ? "is-open" : ""} aria-label="Application navigation">
          {sections.map((section) => (
            <div className="terminal-nav-section" key={section.title}>
              <span className="terminal-nav-label">{section.title}</span>
              {section.items.map((item) => {
                const active = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined} onClick={() => setMobileNavOpen(false)}>
                    <item.icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span><Activity size={14} /> MARKET INTELLIGENCE</span>
          <p>Explore market data, community research and simulated prediction markets.</p>
          <Link href="/">← Back to VALTIERA</Link>
        </div>
      </aside>
      <main className="terminal-main">
        <header className="terminal-topbar">
          <div className="terminal-breadcrumb"><Compass size={15} /> VALTIERA <span>/</span> FINANCIAL INTELLIGENCE</div>
          <TerminalAccountControls />
        </header>
        <div className="terminal-content">{children}</div>
      </main>
    </div>
  );
}

type UserNotification = { id: string; title: string; body: string; read_at: string | null; created_at: string };

function TerminalAccountControls() {
  const [client, setClient] = useState<ReturnType<typeof supabaseBrowser> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const supabase = supabaseBrowser();
      setClient(supabase);
      void supabase.auth.getUser().then(({ data }) => {
        setUserId(data.user?.id ?? null);
        setEmail(data.user?.email ?? "");
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user.id ?? null);
        setEmail(session?.user.email ?? "");
      });
      return () => data.subscription.unsubscribe();
    } catch {
      setClient(null);
    }
  }, []);

  useEffect(() => {
    if (!client || !userId) { setNotifications([]); return; }
    void client.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => setNotifications((data ?? []) as UserNotification[]));
  }, [client, userId]);

  async function markRead(item: UserNotification) {
    if (!client || !userId || item.read_at) return;
    const readAt = new Date().toISOString();
    await client.from("notifications").update({ read_at: readAt }).eq("id", item.id).eq("user_id", userId);
    setNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, read_at: readAt } : entry));
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    window.location.assign("/login");
  }

  const unread = notifications.filter((item) => !item.read_at).length;
  return <div className="terminal-user-controls">
    <span className="terminal-demo-label">DEMO EXPERIENCE</span>
    {userId && <div className="terminal-notifications">
      <button className="terminal-icon-button" type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><Bell size={16}/>{unread > 0 && <i>{unread}</i>}</button>
      {open && <section className="notification-popover liquid-glass" aria-label="Notifications"><div className="notification-popover-title"><b>Notifications</b><small>{unread ? `${unread} unread` : "Up to date"}</small></div>{notifications.length ? notifications.map((item) => <button type="button" key={item.id} className={`notification-row${item.read_at ? " is-read" : ""}`} onClick={() => void markRead(item)}><b>{item.title}</b>{item.body&&<span>{item.body}</span>}<time>{new Date(item.created_at).toLocaleString()}</time></button>) : <p className="notification-empty">No notifications yet.</p>}</section>}
    </div>}
    <Link className="terminal-profile-link" href={userId ? "/app/profile" : "/login"}><CircleUserRound size={16}/><span>{userId ? (email || "Account") : "Sign in"}</span></Link>
    {userId ? <button className="terminal-signout" type="button" onClick={() => void signOut()}><LogOut size={14}/><span>Sign out</span></button> : <Link className="terminal-register-link" href="/register">Create account</Link>}
  </div>;
}
