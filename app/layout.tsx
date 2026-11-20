import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VALTIERA — Intelligence Behind Capital",
  description: "A developing investment intelligence ecosystem connecting collective perspectives, quantitative research and digital financial infrastructure.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://valtiera.com"),
  openGraph: { title: "VALTIERA — Intelligence Behind Capital", description: "Collective intelligence. Quantitative research. A connected financial future.", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

