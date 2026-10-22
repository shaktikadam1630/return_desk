import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
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
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950`}
      >
        <ToastProvider>
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