import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
const categories=["Platform User","Early Access / Platform User","Investor Interest","Research & Technology","Strategic Partnership","Quantitative Research & Technology","General Interest"];
const clean=(v:unknown,max=1000)=>typeof v==="string"?v.trim().slice(0,max):"";
export async function POST(req:NextRequest){
  try{
    const ip=(req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"unknown").split(",")[0].trim();
    const body=await req.json();
    // Quietly accept bot form fills without persisting or notifying.
    if(clean(body.honeypot,200))return NextResponse.json({ok:true});
    const full_name=clean(body.full_name,150),email=clean(body.email,254).toLowerCase(),country=clean(body.country,120),interest_category=clean(body.interest_category,100);
    if(full_name.length<2||!/^\S+@\S+\.\S+$/.test(email)||country.length<2||!categories.includes(interest_category))return NextResponse.json({error:"Check the required fields and try again."},{status:400});
    if(body.consent_privacy!==true)return NextResponse.json({error:"Privacy consent is required to submit."},{status:400});
    const linkedin_url=clean(body.linkedin_url,500);
    if(linkedin_url&&!/^https:\/\//i.test(linkedin_url))return NextResponse.json({error:"Enter a valid LinkedIn URL."},{status:400});
    const supabase=supabaseAdmin();
    const {data:allowed,error:rateError}=await supabase.rpc("allow_registration",{request_ip:ip});
    if(rateError)throw new Error("Registration protection is not configured. Apply the database migration.");
    if(!allowed)return NextResponse.json({error:"Too many attempts. Please wait a little and try again."},{status:429});
    const {data:existing,error:lookupError}=await supabase.from("registrations").select("id").eq("email",email).maybeSingle();
    if(lookupError)throw new Error("We couldn’t check your registration. Please try again.");
    if(existing)return NextResponse.json({error:"This email address has already registered interest. If you need to update your details, contact our team."},{status:409});
    const payload={full_name,email,country,interest_category,organisation:clean(body.organisation,200)||null,professional_role:clean(body.professional_role,200)||null,linkedin_url:linkedin_url||null,message:[clean(body.message,3000),clean(body.investor_type,100)?`Organisation type: ${clean(body.investor_type,100)}`:""].filter(Boolean).join("\n\n")||null,consent_privacy:true,consent_marketing:body.consent_marketing===true,status:"New"};
    const {data:record,error}=await supabase.from("registrations").insert(payload).select("id,created_at").single();
    if(error?.code==="23505")return NextResponse.json({error:"This email address has already registered interest."},{status:409});
    if(error||!record)throw new Error("We couldn’t save your registration. Please try again.");
    // Email delivery is best effort after persistence; it must not turn a saved registration into a false failure.
    if(process.env.RESEND_API_KEY){
      const resend=new Resend(process.env.RESEND_API_KEY),from=process.env.RESEND_FROM_EMAIL||"VALTIERA <onboarding@resend.dev>";
      const emails=[resend.emails.send({from,to:email,subject:"Thank you for your interest in VALTIERA",text:`Hello ${full_name},\n\nThank you for registering your interest in VALTIERA.\n\nWe have successfully received your information. Our team will review your enquiry and contact you if there is an appropriate next step.\n\nWe appreciate your interest in what we're building.\n\nVALTIERA\nIntelligence Behind Capital.`}),
        process.env.ADMIN_EMAIL?resend.emails.send({from,to:process.env.ADMIN_EMAIL,subject:`New VALTIERA registration: ${full_name}`,text:`Name: ${full_name}\nEmail: ${email}\nCountry: ${country}\nInterest category: ${interest_category}\nOrganisation: ${payload.organisation||"—"}\nProfessional role: ${payload.professional_role||"—"}\nMessage: ${payload.message||"—"}\nRegistration timestamp: ${record.created_at}`}):Promise.resolve({error:new Error("ADMIN_EMAIL is not configured")})];
      const results=await Promise.allSettled(emails);results.forEach(r=>{if(r.status==="rejected"||("value" in r&&r.value.error))console.error("VALTIERA email delivery issue",r.status==="rejected"?r.reason:r.value.error)});
    }
    return NextResponse.json({ok:true},{status:201});
  }catch(error){console.error("Registration error",error);return NextResponse.json({error:"Registration is temporarily unavailable. Please try again later."},{status:503})}
}

