import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
const interests = ["Cryptocurrency", "Stocks and equities", "Futures and options", "Quantitative research", "Prediction markets", "DeFi", "Institutional research", "Other"];
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
type ErrorRecord = Record<string, unknown>;
const asRecord = (value: unknown): ErrorRecord => value !== null && typeof value === "object" ? value as ErrorRecord : {};
const safeText = (value: unknown, max = 1200) => typeof value === "string"
  ? value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/(\b(?:service[_-]?role|api[_-]?key|access[_-]?token|refresh[_-]?token|password)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .slice(0, max)
  : undefined;
function withDatabaseContext(operation: string, error: unknown) {
  return Object.assign(new Error(`Supabase ${operation} request failed`), { operation, supabaseError: error });
}
export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const respond = (body: unknown, status: number) => NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId, "Cache-Control": "no-store" },
  });
  try {
    let body: unknown;
    try { body = await req.json(); }
    catch { return respond({ error: "Request body must be valid JSON." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return respond({ error: "Request body must be a JSON object." }, 400);
    const payload = body as Record<string, unknown>;
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
    const email = clean(payload.email, 254).toLowerCase();
    const full_name = clean(payload.full_name, 150), country = clean(payload.country, 120), interest = clean(payload.interest, 80);
    if (!/^\S+@\S+\.\S+$/.test(email)) return respond({ error: "Enter a valid email address." }, 400);
    if (interest && !interests.includes(interest)) return respond({ error: "Choose a valid area of interest." }, 400);

    const db = supabaseAdmin();
    const { data: allowed, error: rateError } = await db.rpc("allow_registration", { request_ip: ip });
    if (rateError) throw withDatabaseContext("allow_registration", rateError);
    if (!allowed) return respond({ error: "Too many attempts. Please wait and try again." }, 429);

    const { error: insertError } = await db.from("waitlist").insert({
      email, full_name: full_name || null, country: country || null, interest: interest || null, status: "confirmed",
    });
    if (insertError?.code === "23505") return respond({ duplicate: true, error: "You're already on the VALTIERA waiting list." }, 409);
    if (insertError) throw withDatabaseContext("waitlist insert", insertError);
    return respond({ ok: true }, 201);
  } catch (error) {
    const record = asRecord(error), cause = asRecord(record.supabaseError ?? record.cause);
    const isError = error instanceof Error;
    const fields = {
      requestId,
      timestamp: new Date().toISOString(),
      operation: safeText(record.operation, 100),
      name: safeText(isError ? error.name : record.name, 100),
      message: safeText(isError ? error.message : record.message),
      stack: safeText(isError ? error.stack : record.stack, 5000),
      code: safeText(cause.code, 100),
      details: safeText(cause.details)?.replace(/Failing row contains[\s\S]*/i, "Failing row contains [redacted]"),
      hint: safeText(cause.hint),
      supabaseMessage: safeText(cause.message),
      httpStatus: cause.status ?? cause.statusCode ?? record.status ?? null,
    };
    console.error("[WAITLIST_REGISTRATION_ERROR]", fields);
    return respond({ error: "The waiting list is temporarily unavailable. Please try again later.", requestId }, 500);
  }
}
