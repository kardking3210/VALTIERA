"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpenText,
  ChartNoAxesCombined,
  CircleUserRound,
  Compass,
  FlaskConical,
  House,
  Medal,
  MessageCircle,
  MessageSquareText,
  Trophy,
  Vote,
} from "lucide-react";
import type { ReactNode } from "react";
import { StorageCleanup } from "./StorageCleanup";
import "./terminal.css";
import "./app-theme.css";

const sections = [
  {
    title: "Discover",
    items: [
      { href: "/app", label: "Dashboard", icon: House },
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
    ],
  },
  {
    title: "Manage",
    items: [
      { href: "/app/portfolio", label: "Virtual Portfolio", icon: Activity },
      { href: "/app/leaderboard", label: "Leaderboard", icon: Medal },
      { href: "/app/academy", label: "Academy", icon: BookOpenText },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/app/profile", label: "Profile", icon: CircleUserRound },
      { href: "/app/messages", label: "Messages", icon: MessageCircle },
    ],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="terminal">
      <StorageCleanup />
      <aside className="terminal-sidebar">
        <Link className="terminal-brand" href="/" aria-label="VALTIERA home">
          <Image src="/images/valtiera-logo.png" alt="" width={40} height={40} className="terminal-brand-logo" />
          <span>VALTIERA</span>
        </Link>
        <div className="terminal-mode"><i /> FINANCIAL INTELLIGENCE · DEMO</div>
        <nav aria-label="Application navigation">
          {sections.map((section) => (
            <div className="terminal-nav-section" key={section.title}>
              <span className="terminal-nav-label">{section.title}</span>
              {section.items.map((item) => {
                const active = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
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
          <div className="terminal-user"><span>DEMO EXPERIENCE</span><b>Demo sample</b><Link href="/login">Sign in</Link></div>
        </header>
        <div className="terminal-content">{children}</div>
      </main>
    </div>
  );
}
