import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocab Trainer ES-PT",
  description: "Treino diário de vocabulário espanhol-português",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <nav className="flex items-center gap-6 border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
          <a
            href="/"
            className="font-semibold text-black dark:text-zinc-50"
          >
            Vocab Trainer
          </a>
          <a
            href="/palavras"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Palavras
          </a>
          <a
            href="/sessao"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sessão
          </a>
        </nav>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
