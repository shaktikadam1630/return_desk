import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { RotateCcw, PlusCircle, ArrowLeftRight, Layers } from "lucide-react";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReturnDesk — E-Commerce Returns Management Desk",
  description: "A centralized, rule-enforced returns desk for small online store support agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        <ToastProvider>
          {/* Header Navigation */}
          <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo / Brand */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                      ReturnDesk
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-3xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Live
                    </span>
                  </div>
                  <p className="text-3xs text-zinc-500 hidden sm:block">
                    E-Commerce Support Portal
                  </p>
                </div>
              </Link>

              {/* Navigation Links & Action */}
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Returns Desk</span>
                </Link>

                <Link
                  href="/returns/new"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-600/25 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Raise Return</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 ReturnDesk — Support Returns Management System</p>
              <p className="text-2xs text-zinc-400">
                PostgreSQL + Prisma ORM + Next.js App Router + Zod Validation
              </p>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
