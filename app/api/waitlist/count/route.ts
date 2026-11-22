import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs",dynamic="force-dynamic";
export async function GET(){
  try{const {count,error}=await supabaseAdmin().from("waitlist").select("id",{count:"exact",head:true}).eq("status","confirmed");if(error)throw error;return NextResponse.json({count:count??0},{headers:{"Cache-Control":"no-store, max-age=0"}})}
  catch(error){console.error("Waitlist count error",error);return NextResponse.json({error:"Confirmed registration count is unavailable."},{status:503,headers:{"Cache-Control":"no-store, max-age=0"}})}
}
