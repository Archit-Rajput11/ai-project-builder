import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI College Project Builder",
  description: "A production-ready platform to brainstorm, structure, and build college projects powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground relative selection:bg-cyan-500/25 selection:text-cyan-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Subtle Atmospheric Radial Background Glows */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-sky-500/5 to-transparent blur-[120px] rounded-full dark:opacity-100 opacity-20" />
            <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/8 via-cyan-500/4 to-transparent blur-[140px] rounded-full dark:opacity-100 opacity-20" />
            <div className="absolute bottom-10 -right-48 w-[600px] h-[600px] bg-gradient-to-tl from-cyan-500/8 via-blue-500/4 to-transparent blur-[160px] rounded-full dark:opacity-100 opacity-20" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
