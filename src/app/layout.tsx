import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Display: Newsreader Light (same type system as the Launchpad demo).
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

// Interface: DM Sans.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ClassPano Sync — Phase 1 proof of concept",
    template: "%s · ClassPano Sync",
  },
  description:
    "A working proof of concept for ClassPano: a Manifest V3 extension that captures assignments from Blackbaud, syncs repeatedly without duplicates, and stores everything in one platform-neutral format. Demo with fictional data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${dmSans.variable} antialiased`}>
      <body className="min-h-dvh bg-paper text-void">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-jade focus:px-4 focus:py-2 focus:text-void"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
