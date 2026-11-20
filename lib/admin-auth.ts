import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "valtiera_admin";
function signature(value: string) { return createHmac("sha256", process.env.ADMIN_AUTH_SECRET || "").update(value).digest("hex"); }
export function validAdminSecret(value: string) {
  const expected = process.env.ADMIN_AUTH_SECRET;
  if (!expected || !value) return false;
  const a=Buffer.from(value), b=Buffer.from(expected);
  return a.length===b.length && timingSafeEqual(a,b);
}
export async function setAdminCookie() {
  const expires=String(Date.now()+8*60*60*1000), token=`${expires}.${signature(expires)}`;
  (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:8*60*60});
}
export async function clearAdminCookie(){(await cookies()).delete(cookieName)}
export async function isAdmin(){
  if(!process.env.ADMIN_AUTH_SECRET)return false;
  const token=(await cookies()).get(cookieName)?.value;
  if(!token)return false;
  const [expires,sig]=token.split(".");
  if(!expires||!sig||Number(expires)<Date.now())return false;
  const expected=signature(expires),a=Buffer.from(sig),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}

