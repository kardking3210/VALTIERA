import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs";
const csv=(v:unknown)=>`"${String(v??"").replace(/"/g,'""')}"`;
export async function GET(){if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});try{const {data,error}=await supabaseAdmin().from("waitlist").select("id,full_name,email,country,interest,status,created_at").order("created_at",{ascending:false}).limit(10000);if(error)throw error;const cols=["id","full_name","email","country","interest","status","created_at"];const body=[cols.join(","),...(data||[]).map(row=>cols.map(k=>csv(row[k as keyof typeof row])).join(","))].join("\r\n");return new NextResponse(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=valtiera-waitlist.csv","Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Could not export the waiting list."},{status:503})}}

