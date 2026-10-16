import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NativeSplashHide } from "@/components/NativeSplashHide";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "MAXimize | RE/MAX West Realty Inc.",
  description:
    "Your real estate companion from the MAXimize Team — Your Decision & Our Commitment.",
};

// `viewportFit: "cover"` lets the native app (Capacitor's WKWebView, which
// renders edge-to-edge behind the iPhone's notch/Dynamic Island) draw under
// the status bar — without it, `env(safe-area-inset-*)` below resolves to 0
// and nothing pushes content clear of the notch. Combined with the
// safe-area padding on BrandHeader and the page body, this keeps content
// inside the visible screen on every iPhone instead of tucking behind the
// notch or spilling past the rounded corners.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-body text-[16px] leading-relaxed antialiased bg-paper text-ink">
        <NativeSplashHide />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
