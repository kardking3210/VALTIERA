import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs",dynamic="force-dynamic";
type Entry={id:string;full_name:string|null;email:string;country:string|null;interest:string|null;status:string;created_at:string};
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const db=supabaseAdmin();const [{data,error},totalRes,confirmedRes,statsRes]=await Promise.all([db.from("waitlist").select("id,full_name,email,country,interest,status,created_at").order("created_at",{ascending:false}).limit(1000),db.from("waitlist").select("id",{count:"exact",head:true}),db.from("waitlist").select("id",{count:"exact",head:true}).eq("status","confirmed"),db.from("waitlist").select("country,interest,created_at,status").eq("status","confirmed").limit(10000)]);if(error||totalRes.error||confirmedRes.error||statsRes.error)throw error||totalRes.error||confirmedRes.error||statsRes.error;const rows=(data||[]) as Entry[];const byInterest:Record<string,number>={},byCountry:Record<string,number>={},byDay:Record<string,number>={};for(const row of (statsRes.data||[])){const interest=row.interest||"Not specified",country=row.country||"Not specified",day=row.created_at.slice(0,10);byInterest[interest]=(byInterest[interest]||0)+1;byCountry[country]=(byCountry[country]||0)+1;byDay[day]=(byDay[day]||0)+1}return NextResponse.json({entries:rows,total:totalRes.count||0,confirmed:confirmedRes.count||0,byInterest,byCountry,byDay},{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("Admin waitlist query error",error);return NextResponse.json({error:"Could not load the waiting list."},{status:503})}
}
