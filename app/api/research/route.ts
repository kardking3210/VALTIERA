import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({ customFields: { item: [["dc:creator", "creator"], ["author", "author"], ["category", "category", { keepArray: true }]] } });
const sources = [
  { key: "fed", name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml", type: "news", category: "Macroeconomic Research" },
  { key: "sec", name: "U.S. SEC", url: "https://www.sec.gov/news/pressreleases.rss", type: "news", category: "Institutional Market Research" },
  { key: "arxiv", name: "arXiv Quantitative Finance", url: "https://export.arxiv.org/api/query?search_query=cat:q-fin.*&sortBy=submittedDate&sortOrder=descending&max_results=30", type: "paper", category: "Quantitative Finance Research" },
] as const;

export async function GET(){
 const results=await Promise.all(sources.map(async source=>{
  try{
   const response=await fetch(source.url,{headers:{"User-Agent":process.env.SEC_USER_AGENT||"VALTIERA Research Reader/1.0",Accept:"application/rss+xml, application/atom+xml, application/xml, text/xml"},next:{revalidate:900},signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw new Error(`Source returned ${response.status}`);
   const feed=await parser.parseString(await response.text());
   const items=feed.items.map(item=>({id:item.guid||item.link||`${source.key}-${item.title}`,title:item.title||"Untitled",link:item.link||"",summary:(item.contentSnippet||item.summary||item.content||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,650),authors:typeof item.creator==="string"?[item.creator]:typeof item.author==="string"?[item.author]:[],publisher:source.name,category:source.category,type:source.type,publishedAt:item.isoDate||item.pubDate||null})).filter(item=>item.link&&item.title);
   return {source:source.key,name:source.name,status:"ok",items};
  }catch(error){return {source:source.key,name:source.name,status:"error",items:[],error:error instanceof Error?error.message:"Feed unavailable"};}
 }));
 const items=results.flatMap(r=>r.items).sort((a,b)=>Date.parse(b.publishedAt||"")-Date.parse(a.publishedAt||""));
 return NextResponse.json({items,sources:results,updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"s-maxage=900, stale-while-revalidate=1800"}});
}

