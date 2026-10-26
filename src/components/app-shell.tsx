"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/connect-button";
import { useChainUi } from "@/components/wallet/chain-ui";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/send", label: "Send" },
  { href: "/app/receive", label: "Receive" },
  { href: "/app/circles", label: "Circles" },
  { href: "/app/route", label: "Smart Route" },
  { href: "/app/activity", label: "Activity" },
  { href: "/app/mezo", label: "Mezo" },
] as const;

export function AppShell({ children }: { children: import("react").ReactNode }) {
  const pathname = usePathname();
  const { wrongNetwork, net, show } = useChainUi();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(11,11,9,0.85)] backdrop-blur">
        <div className="mf-container flex h-16 items-center justify-between gap-3">
          <Link href="/app" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg border border-[rgba(217,180,91,0.45)] bg-[var(--gold-bg)] font-mono text-sm font-bold text-[var(--gold)]"
            >
              ₥
            </span>
            <span className="hidden text-[15px] font-semibold tracking-tight sm:block">
              MUSD Flow
            </span>
          </Link>
          <ConnectButton />
        </div>
        <nav aria-label="App" className="mf-container overflow-x-auto">
          <ul className="flex gap-1 pb-2 text-sm">
            {NAV.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${
                      active
                        ? "bg-[var(--gold-bg)] text-[var(--gold)]"
                        : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {wrongNetwork && (
        <div
          role="alert"
          className="border-b border-[rgba(217,160,91,0.35)] bg-[rgba(217,160,91,0.08)] px-4 py-2.5 text-sm sm:px-6"
        >
          <div className="mf-container flex items-center justify-between gap-3">
            <span className="min-w-0">
              Your wallet is connected to an <strong>unrecognized network</strong>.
              Balances and sends are disabled until you switch to a supported one.
            </span>
            <button
              onClick={show}
              className="shrink-0 rounded-lg border border-[var(--line-strong)] px-3 py-1 text-xs hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]"
            >
              Switch network
            </button>
          </div>
        </div>
      )}

      {net?.testnet && (
        <div
          role="status"
          className="border-b border-[rgba(88,185,139,0.35)] bg-[rgba(88,185,139,0.06)] px-4 py-2 text-xs text-[var(--ink-soft)] sm:px-6"
        >
          <div className="mf-container">
            You are on <strong>{net.label}</strong> — testnet only. Assets here have no
            real-world value.
          </div>
        </div>
      )}

      <main className="mf-container w-full flex-1 py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
