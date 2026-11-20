"use client";
import { useEffect } from "react";

/** Convert any old browser-stored direction to a research note and discard virtual balances/allocations. */
export function StorageCleanup() {
  useEffect(() => {
    try {
      const legacy = JSON.parse(localStorage.getItem("valtiera_positions") || "[]");
      const current = JSON.parse(localStorage.getItem("valtiera_views") || "[]");
      if (Array.isArray(legacy)) {
        const migrated = legacy.filter((p): p is { marketId: string; side: "YES" | "NO"; createdAt: string } => p && typeof p.marketId === "string" && (p.side === "YES" || p.side === "NO"))
          .map(p => ({ marketId: p.marketId, side: p.side, createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(), note: "Imported from your previous research view." }));
        if (migrated.length) localStorage.setItem("valtiera_views", JSON.stringify([...migrated, ...(Array.isArray(current) ? current : [])]));
      }
      localStorage.removeItem("valtiera_positions");
      localStorage.removeItem("valtiera_vc");
      window.dispatchEvent(new Event("valtiera:portfolio"));
    } catch {
      localStorage.removeItem("valtiera_positions");
      localStorage.removeItem("valtiera_vc");
    }
  }, []);
  return null;
}

