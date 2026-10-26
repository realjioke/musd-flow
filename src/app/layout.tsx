import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MUSD Flow — Multi-chain stablecoin payments",
  description:
    "Send, receive, and save together with MUSD across Mezo, Ethereum and Base. Non-custodial payments, shareable payment links, and group savings circles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg)] font-sans text-[var(--ink)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
