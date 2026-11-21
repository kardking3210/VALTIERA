import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (missing.length) throw new Error(`Registration service is not configured. Missing environment variables: ${missing.join(", ")}.`);
  try {
    const parsed = new URL(url!);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
  } catch {
    throw new Error("Registration service is not configured. NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }
  return createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
}

