import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime="nodejs";
const interests=["Cryptocurrency","Stocks and equities","Futures and options","Quantitative research","Prediction markets","DeFi","Institutional research","Other"];
const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const ip=(req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"unknown").split(",")[0].trim();
    const email=clean(body.email,254).toLowerCase(),full_name=clean(body.full_name,150),country=clean(body.country,120),interest=clean(body.interest,80);
    if(!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:"Enter a valid email address."},{status:400});
    if(interest&&!interests.includes(interest))return NextResponse.json({error:"Choose a valid area of interest."},{status:400});
    const db=supabaseAdmin();
    const {data:allowed,error:rateError}=await db.rpc("allow_registration",{request_ip:ip});
    if(rateError)throw new Error("Registration protection is not configured.");
    if(!allowed)return NextResponse.json({error:"Too many attempts. Please wait and try again."},{status:429});
    const {error}=await db.from("waitlist").insert({email,full_name:full_name||null,country:country||null,interest:interest||null,status:"confirmed"});
    if(error?.code==="23505")return NextResponse.json({duplicate:true,error:"You're already on the VALTIERA waiting list."},{status:409});
    if(error)throw error;
    return NextResponse.json({ok:true},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("Waitlist registration error",error);return NextResponse.json({error:"The waiting list is temporarily unavailable. Please try again later."},{status:503});}
}

