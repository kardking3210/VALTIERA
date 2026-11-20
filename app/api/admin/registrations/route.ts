import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(req:NextRequest){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const q=req.nextUrl.searchParams.get("q")?.trim(),category=req.nextUrl.searchParams.get("category"),id=req.nextUrl.searchParams.get("id");
    const db=supabaseAdmin();let query=db.from("registrations").select("*").order("created_at",{ascending:false}).limit(500);
    if(id)query=query.eq("id",id);if(category)query=query.eq("interest_category",category);
    if(q)query=query.or(`full_name.ilike.%${q.replace(/[(),]/g,"")}%,email.ilike.%${q.replace(/[(),]/g,"")}%`);
    const [{data,error},totalResult,allResult]=await Promise.all([query,db.from("registrations").select("id",{count:"exact",head:true}),db.from("registrations").select("interest_category").limit(10000)]);
    if(error||totalResult.error||allResult.error)throw error||totalResult.error||allResult.error;
    const counts=(allResult.data||[]).reduce((out,r)=>{out[r.interest_category]=(out[r.interest_category]||0)+1;return out},{} as Record<string,number>);
    return NextResponse.json({registrations:data||[],total:totalResult.count||0,byCategory:counts});
  }catch{return NextResponse.json({error:"Could not load registrations."},{status:503})}
}
export async function PATCH(req:NextRequest){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{const {id,status}=await req.json();if(!id||!["New","Contacted","In Discussion","Qualified","Archived"].includes(status))return NextResponse.json({error:"Invalid update."},{status:400});const {error}=await supabaseAdmin().from("registrations").update({status}).eq("id",id);if(error)throw error;return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"Could not update registration."},{status:503})}
}

