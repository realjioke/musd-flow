import Link from "next/link";
import { NETWORKS, MUSD_ADDRESS, musdNetworks, type NetworkDescriptor } from "@/lib/chains";
import { ConnectButton } from "@/components/wallet/connect-button";
import { CopyButton } from "@/components/ui/primitives";
import { ChainLogo } from "@/components/ui/chain-logo";
import { InfrastructureStatus } from "@/components/marketing/infrastructure-status";

const tierLabel: Record<string, string> = {
  native: "Native MUSD",
  supported: "Bridged MUSD",
  monitoring: "Monitor only",
  unsupported: "Unsupported",
};

export default function Landing() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(11,11,9,0.85)] backdrop-blur">
        <div className="mf-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Mlogo />
            <span className="text-[15px] font-semibold tracking-tight">MUSD Flow</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2 sm:gap-6">
            <div className="hidden items-center gap-6 text-sm text-[var(--ink-soft)] md:flex">
              <a href="#networks" className="transition-colors hover:text-[var(--ink)]">
                Networks
              </a>
              <a href="#capabilities" className="transition-colors hover:text-[var(--ink)]">
                Capabilities
              </a>
              <a href="#principles" className="transition-colors hover:text-[var(--ink)]">
                Principles
              </a>
            </div>
            <ConnectButton />
          </nav>
        </div>
      </header>

      <main className="mf-container w-full flex-1">
        {/* ---------------------------------------------------------------- */}
        {/* Hero: positioning on the left, the routing system on the right   */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid gap-14 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-20 lg:pt-24">
          <div className="flex flex-col justify-center">
            <p className="mf-eyebrow mb-4">One stablecoin experience · Multiple chains</p>
            <h1 className="mf-h1 max-w-3xl">
              Stablecoin payments that behave like{" "}
              <span className="text-[var(--gold)]">real infrastructure</span>
            </h1>
            <p className="mf-lead mt-6 max-w-xl">
              MUSD Flow is a non-custodial multi-chain payments and group-savings app
              for MUSD — the Bitcoin-backed stablecoin of the Mezo ecosystem. Send and
              receive on-chain, share payment links, run savings circles, and always
              know exactly which networks support what.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ConnectButton full />
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[var(--line-strong)] px-7 text-[15px] font-medium transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]"
              >
                Explore the app
              </Link>
            </div>
            <p className="mt-6 max-w-md text-xs leading-relaxed text-[var(--ink-faint)]">
              Non-custodial. No seed-phrase collection. Balances and transactions are
              read directly from verified token contracts and block explorers.
            </p>
          </div>

          <div className="flex items-center">
            <FlowViz />
          </div>
        </section>

        <div className="mf-gold-rule" />

        {/* ---------------------------------------------------------------- */}
        {/* Infrastructure status strip — real health + real wallet state    */}
        {/* ---------------------------------------------------------------- */}
        <section className="pb-14 pt-0 sm:pb-16" aria-label="Infrastructure status">
          <InfrastructureStatus />
        </section>

        <div className="mf-gold-rule" />

        {/* ---------------------------------------------------------------- */}
        {/* Networks as infrastructure monitoring                            */}
        {/* ---------------------------------------------------------------- */}
        <section id="networks" aria-labelledby="networks-title" className="scroll-mt-24 py-16 sm:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="networks-title" className="mf-h2">
                Verified network support
              </h2>
              <p className="mf-lead mt-3 max-w-2xl">
                Every integration below is documented from official sources — chain
                IDs, token addresses and bridge routes are stated, not assumed. We
                never present unsupported functionality as operational. Full details
                in the{" "}
                <a
                  className="text-[var(--gold)] underline decoration-[rgba(217,180,91,0.4)]"
                  href="/docs/integration-matrix.md"
                >
                  integration matrix
                </a>
                .
              </p>
            </div>
            <p className="shrink-0 text-xs text-[var(--ink-faint)]">
              {musdNetworks().length} of {NETWORKS.length} networks carry a
              verified MUSD contract
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {NETWORKS.map((n) => (
              <NetworkMonitorCard key={n.key} net={n} />
            ))}
          </div>

          <div className="mf-card-tech mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="mf-mono text-[var(--ink-soft)]">
              MUSD contract: {shortHash(MUSD_ADDRESS)} · 18 decimals · ERC-20
            </p>
            <div className="flex items-center gap-1">
              <CopyButton value={MUSD_ADDRESS} label="Copy contract" />
              <a
                href={NETWORKS.find((n) => n.key === "mezo")?.explorer ?? "https://explorer.mezo.org"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[10px] border border-transparent px-3 py-1.5 text-[13px] text-[var(--ink-soft)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                Mezo explorer ↗
              </a>
            </div>
          </div>
        </section>

        <div className="mf-gold-rule" />

        {/* ---------------------------------------------------------------- */}
        {/* Capabilities: one coherent financial system                      */}
        {/* ---------------------------------------------------------------- */}
        <section id="capabilities" className="scroll-mt-24 py-16 sm:py-20" aria-labelledby="features-title">
          <h2 id="features-title" className="mf-h2">
            What it does for real people
          </h2>
          <p className="mf-lead mt-3 max-w-2xl">
            Every capability is a real route in the app — not an illustration. Each one
            states what it does, why it matters, and where you can use it now.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                t: "Send & receive",
                what: "Real MUSD transfers with preflight balance and gas checks, a review screen, and an honest receipt: hash, status, explorer link.",
                why: "You see exactly what will happen before you sign — and what happened after.",
                href: "/app/send",
                cta: "Open Send",
              },
              {
                t: "Shareable payment requests",
                what: "Create a request for an exact amount in MUSD, share the URL or QR, and let the payer's transaction be verified on-chain — not guessed.",
                why: "Payment confirmation comes from the chain itself, so neither side has to trust a screenshot.",
                href: "/app/receive",
                cta: "Open Receive",
              },
              {
                t: "MUSD Circles",
                what: "Group savings toward rent, school, travel or a business goal. Contributions are direct transfers between member wallets, verified on-chain. The app never holds your funds.",
                why: "Group money without a custodian, with every contribution auditable.",
                href: "/app/circles",
                cta: "Open Circles",
              },
              {
                t: "Smart Route",
                what: "Compare verified MUSD routes between networks — what is supported, how it moves, and the risks. No fake bridge quotes.",
                why: "Routing decisions are made on documented facts, not on invented quotes.",
                href: "/app/route",
                cta: "Open Smart Route",
              },
              {
                t: "Mezo, front and center",
                what: "Native MUSD and MEZO support, testnet access with the official faucet, and every major flow prefers the network MUSD was built on.",
                why: "The chain MUSD was designed for gets first-class treatment across every flow.",
                href: "/app/mezo",
                cta: "Open Mezo",
              },
              {
                t: "Activity you can audit",
                what: "Every send, request and contribution keeps its transaction hash. Anything the chain does not confirm stays marked pending — or fails.",
                why: "An activity log that behaves like a ledger, not like marketing.",
                href: "/app/activity",
                cta: "Open Activity",
              },
            ].map((f) => (
              <Link
                key={f.t}
                href={f.href}
                className="mf-card mf-card-hover group flex flex-col p-6 sm:p-7"
              >
                <h3 className="text-[17px] font-semibold">{f.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">{f.what}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                  <span className="text-[var(--ink-faint)]">Why it matters —</span>{" "}
                  {f.why}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 border-t border-[var(--line)] pt-4 text-[13px] font-medium text-[var(--gold)]">
                  {f.cta}
                  <span
                    aria-hidden
                    className="inline-block transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mf-gold-rule" />

        {/* ---------------------------------------------------------------- */}
        {/* Principles                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section id="principles" className="scroll-mt-24 pb-24 pt-16 sm:pb-28 sm:pt-20" aria-labelledby="how-title">
          <h2 id="how-title" className="mf-h2">
            Built the way a financial app should be
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                t: "Non-custodial by design",
                d: "Wallets stay yours. MUSD Flow holds no keys, never custody group funds, and collects no personal data beyond what you choose to put in a request.",
              },
              {
                t: "Honest aggregation",
                d: "If an RPC or explorer is slow or fails, you see the failure and a retry — not a smooth number we made up.",
              },
              {
                t: "Mezo-native story",
                d: "MUSD is Mezo's Bitcoin-backed stablecoin. Flows default to Mezo; cross-chain routes use the official Wormhole NTT bridge via Portal.",
              },
            ].map((x) => (
              <div key={x.t} className="mf-card p-6 sm:p-7">
                <h3 className="text-[17px] font-semibold">{x.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{x.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="mf-eyebrow">Ready when you are</p>
            <ConnectButton full />
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] py-10">
        <div className="mf-container flex flex-col items-center justify-between gap-4 text-[13px] text-[var(--ink-faint)] sm:flex-row">
          <span>MUSD Flow — community finance on Mezo. Not financial advice.</span>
          <span className="flex gap-4">
            <a href={MEZO_DOCS} className="transition-colors hover:text-[var(--gold)]">
              Mezo docs
            </a>
            <a href={BRIDGE_DOCS} className="transition-colors hover:text-[var(--gold)]">
              Bridge docs
            </a>
            <a href="/api/healthz" className="transition-colors hover:text-[var(--gold)]">
              Status
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Network monitoring card — every value comes from @/lib/chains        */
/* -------------------------------------------------------------------- */

function NetworkMonitorCard({ net }: { net: NetworkDescriptor }) {
  const served = net.musdAddress !== null;
  const statusTone =
    net.musd === "unsupported"
      ? { color: "var(--ink-faint)", label: "Not served" }
      : { color: "var(--success)", label: "Verified" };
  const tierTone =
    net.musd === "native"
      ? "var(--gold)"
      : net.musd === "supported"
        ? "var(--success)"
        : net.musd === "monitoring"
          ? "var(--warn)"
          : "var(--ink-faint)";

  return (
    <article className="mf-card-tech flex flex-col p-6 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ChainLogo chainId={net.id} size={30} muted={net.testnet} />
          <div>
            <p className="text-[15px] font-semibold">{net.label}</p>
            <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
              {net.musd === "unsupported"
                ? `${net.gasSymbol} gas · no MUSD operations offered`
                : `${net.gasSymbol} gas`}
            </p>
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: statusTone.color }}
        >
          <StatusDotIcon color={statusTone.color} />
          {statusTone.label}
        </span>
      </header>

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--line)] pt-4">
        <div className="mf-kv">
          <span>Chain ID</span>
          <span className="mf-mono">#{net.id}</span>
        </div>
        <div className="mf-kv">
          <span>MUSD</span>
          {served ? (
            <span className="font-medium" style={{ color: tierTone }}>
              {tierLabel[net.musd]}
            </span>
          ) : (
            <span className="text-[var(--ink-faint)]">Not available</span>
          )}
        </div>
        <div className="mf-kv">
          <span>Contract</span>
          {net.musdAddress ? (
            <span className="mf-kv-right mf-mono m-0 flex items-center gap-1">
              <span className="text-[var(--ink-soft)]">{shortHash(net.musdAddress)}</span>
              <CopyButton value={net.musdAddress} label="" />
            </span>
          ) : (
            <span className="text-[var(--ink-faint)]">Not deployed here</span>
          )}
        </div>
        <div className="mf-kv">
          <span>Route</span>
          <span className="text-[var(--ink-soft)]">
            {net.musdRoute ? "Wormhole NTT bridge" : net.musd === "native" ? "Native issuance" : "—"}
          </span>
        </div>
      </div>

      {net.testnet ? (
        <p className="mt-4 text-xs leading-relaxed text-[var(--warn)]">
          Testnet only — assets here carry no real-world value.
        </p>
      ) : null}

      <footer className="mt-auto flex items-center gap-4 mt-auto border-t border-[var(--line)] pt-4 text-xs">
        {net.explorer ? (
          <a
            href={net.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ink-soft)] transition-colors hover:text-[var(--gold)]"
          >
            View explorer ↗
          </a>
        ) : (
          <span className="text-[var(--ink-faint)]">Explorer unavailable</span>
        )}
        {net.faucet ? (
          <a
            href={net.faucet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ink-soft)] transition-colors hover:text-[var(--gold)]"
          >
            Faucet ↗
          </a>
        ) : null}
        {net.musdRoute ? (
          <span className="ml-auto truncate text-[var(--ink-faint)]" title={net.musdRoute}>
            Mezo ⇄ {net.shortLabel}
          </span>
        ) : null}
      </footer>
    </article>
  );
}

function StatusDotIcon({ color }: { color: string }) {
  return <span aria-hidden className="inline-block size-1.5 rounded-full" style={{ background: color }} />;
}

/* -------------------------------------------------------------------- */
/* Hero flow visualization — built from the real network registry       */
/* -------------------------------------------------------------------- */

function FlowViz() {  const routes = NETWORKS.map((n) => n);

  return (
    <aside
      aria-label="How a MUSD payment routes through MUSD Flow"
      className="mf-card mf-enter mx-auto w-full max-w-[352px] p-5 lg:max-w-[400px] lg:p-6"
    >
      <p className="mf-flow-label mb-4">How a payment moves</p>

      <FlowNode
        label="Sender"
        title="User or business"
        sub="wallet you control"
      />
      <FlowLine />
      <FlowNode
        label="Intent"
        title="MUSD payment"
        sub="exact amount · target recipient"
      />
      <FlowLine />
      <FlowNode
        label="Router"
        title="MUSD Flow"
        sub="non-custodial · verifies on-chain"
        gold
      />
      <FlowLine />
      <div role="list" aria-label="Verified destination networks" className="flex flex-col gap-1.5 pl-4">
        {routes.map((net) => (
          <div
            key={net.key}
            role="listitem"
            className={`flex items-center justify-between gap-3 rounded-lg border bg-[var(--surface-2)] px-3 py-1.5 ${
              net.musd === "unsupported" ? "border-dashed border-[var(--line)]" : "border-[var(--line)]"
            }`}
          >
            <span className="flex items-center gap-2 text-[13px] font-medium">
              <ChainLogo chainId={net.id} size={20} muted={net.musd === "unsupported" || net.testnet} />
              {net.label}
            </span>
            <span className="mf-mono text-[11px] text-[var(--ink-faint)]">
              {net.musd === "unsupported"
                ? "no verified MUSD"
                : net.testnet
                  ? `testnet · #${net.id}`
                  : `#${net.id}`}
            </span>
          </div>
        ))}
      </div>
      <FlowLine slow />
      <FlowNode
        label="Settlement"
        title="Recipient"
        sub="direct wallet-to-wallet · app never holds funds"
      />
      <p className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
        <span aria-hidden className="text-[var(--success)]">✓</span>
        Every leg is confirmed by the chain — nothing is assumed.
      </p>
    </aside>
  );
}

function FlowNode({
  label,
  title,
  sub,
  gold = false,
}: {
  label: string;
  title: string;
  sub: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`mf-flow-node ${gold ? "border-[rgba(217,180,91,0.4)]" : ""}`}
    >
      <p className="mf-flow-label" style={gold ? { color: "var(--gold)" } : undefined}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-[var(--ink-faint)]">{sub}</p>
    </div>
  );
}

function FlowLine({ slow = false }: { slow?: boolean }) {
  return <span aria-hidden className={`mf-flow-line mx-auto my-2 block h-7 ${slow ? "mf-flow-line-slow" : ""}`} />;
}

function shortHash(a: string) {
  return `${a.slice(0, 10)}…${a.slice(-8)}`;
}

function Mlogo() {
  return (
    <span
      aria-hidden
      className="flex size-7 items-center justify-center rounded-lg border border-[rgba(217,180,91,0.45)] bg-[var(--gold-bg)] font-mono text-sm font-bold text-[var(--gold)]"
    >
      ₥
    </span>
  );
}

const MEZO_DOCS = "https://mezo.org/docs/";
const BRIDGE_DOCS = "https://mezo.org/docs/users/mainnet/bridges/";
