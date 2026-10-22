import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { ClipboardList, LayoutDashboard, Settings2, ShieldCheck } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReturnDesk — E-Commerce Returns Management Desk",
  description:
    "A centralized, rule-enforced returns desk for small online store support agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased min-h-screen`}>
        <ToastProvider>
          <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
            <aside className="hidden lg:flex lg:flex-col bg-[#17211d] text-white px-5 py-6">
              <Link href="/" className="flex items-center gap-3 px-2 mb-12">
                <span className="brand-mark"><ShieldCheck className="w-5 h-5" /></span>
                <span className="font-display text-lg tracking-tight">return<span className="text-[#e7b86b]">desk</span></span>
              </Link>
              <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#82948b]">Workspace</p>
              <nav className="space-y-1">
                <Link href="/" className="side-link side-link-active"><LayoutDashboard className="w-4 h-4" /> Overview</Link>
                <Link href="/returns/new" className="side-link"><ClipboardList className="w-4 h-4" /> New request</Link>
              </nav>
              <div className="mt-auto border-t border-white/10 pt-5">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="avatar">AR</div>
                  <div className="min-w-0"><p className="text-sm font-semibold truncate">Alex Rivera</p><p className="text-[11px] text-[#82948b]">Support lead</p></div>
                  <Settings2 className="w-4 h-4 ml-auto text-[#82948b]" />
                </div>
              </div>
            </aside>
            <div className="min-w-0 flex flex-col">
              <header className="mobile-header lg:hidden">
                <Link href="/" className="flex items-center gap-2"><span className="brand-mark"><ShieldCheck className="w-4 h-4" /></span><span className="font-display text-lg">return<span className="text-[#b17832]">desk</span></span></Link>
                <Link href="/returns/new" className="mobile-new">New request</Link>
              </header>
              <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-7 sm:py-10">
                {children}
              </main>
              <footer className="px-4 sm:px-8 lg:px-12 py-5 text-[11px] text-[#8b938e] flex flex-col sm:flex-row justify-between gap-2">
                <p>ReturnDesk / Operations console</p>
                <p>Protected workflow · PostgreSQL + Prisma</p>
              </footer>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}