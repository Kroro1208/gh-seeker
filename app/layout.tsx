import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "./providers/query-provider";
import { NuqsProvider } from "./providers/nuqs-provider";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Repository Search",
  description: "Search and explore GitHub repositories",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <Suspense fallback={null}>
              <NuqsProvider>
                <QueryProvider>{children}</QueryProvider>
              </NuqsProvider>
            </Suspense>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
