import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAXimize | RE/MAX West Realty Inc.",
  description:
    "Your real estate companion from the MAXimize Team — Your Decision & Our Commitment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-body text-[16px] leading-relaxed antialiased bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
