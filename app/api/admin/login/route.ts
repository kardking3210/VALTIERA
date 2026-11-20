import { NextRequest, NextResponse } from "next/server";
import { isAdmin, setAdminCookie, validAdminSecret } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(){return NextResponse.json({authenticated:await isAdmin()})}
export async function POST(req:NextRequest){
  try{
    const ip=(req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
    const db=supabaseAdmin(),{data:allowed,error}=await db.rpc("allow_admin_login",{request_ip:ip});
    if(error||!allowed)return NextResponse.json({error:"Unable to sign in. Please try again later."},{status:429});
    const {secret}=await req.json();if(!validAdminSecret(secret))return NextResponse.json({error:"Invalid credentials."},{status:401});
    await setAdminCookie();return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"Admin authentication is not configured."},{status:503})}
}
export async function DELETE(){const {clearAdminCookie}=await import("@/lib/admin-auth");await clearAdminCookie();return NextResponse.json({ok:true})}

