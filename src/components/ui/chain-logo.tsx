/**
 * Chain identity marks — simple geometric representations per network,
 * used alongside (never instead of) the network's text name. Mezo is
 * rendered as the MUSD '₥' ring mark the app already uses for its native
 * chain; public chains get their widely-recognized geometric silhouettes.
 */
export function ChainLogo({
  chainId,
  size = 28,
  muted = false,
}: {
  chainId: number;
  size?: number;
  muted?: boolean;
}) {
  const dim = muted ? 0.55 : 1;
  const g = (color: string) => ({ opacity: dim, color });

  let inner: React.ReactNode;
  switch (chainId) {
    case 31612: // Mezo — Bitcoin-backed; the ₥ mark
      inner = (
        <text
          x="12"
          y="16.6"
          textAnchor="middle"
          fontSize="13"
          fontWeight={700}
          fill="var(--gold)"
          fontFamily="var(--font-mono)"
          style={{ opacity: dim }}
        >
          ₥
        </text>
      );
      break;
    case 31611: // Mezo Testnet — same mark, muted
      inner = (
        <text
          x="12"
          y="16.6"
          textAnchor="middle"
          fontSize="13"
          fontWeight={700}
          fill="var(--gold)"
          fontFamily="var(--font-mono)"
          style={{ opacity: 0.45 }}
        >
          ₥
        </text>
      );
      break;
    case 1: // Ethereum — the octahedron diamond
      inner = (
        <g fill="none" {...g("#8f92a8")}>
          <path d="M12 2.5 5.6 12.1 12 16.3 18.4 12.1 12 2.5Z" fill="currentColor" opacity={dim * 0.85} />
          <path d="M12 17.9 5.6 13.6 12 21.6 18.4 13.6 12 17.9Z" fill="currentColor" opacity={dim * 0.55} />
          <path d="M12 2.5V16.3L18.4 12.1 12 2.5Z" fill="currentColor" opacity={dim} />
        </g>
      );
      break;
    case 8453: // Base — solid circle with the flat notch
      inner = (
        <g>
          <path
            d="M12 3.2a8.8 8.8 0 1 0 8.8 8.8h-8.8V3.2Z"
            fill="#2151F5"
            style={{ opacity: dim }}
          />
          <circle cx="16.4" cy="14.6" r="1.7" fill="#0b0b09" style={{ opacity: dim * 0.85 }} />
        </g>
      );
      break;
    case 56: // BNB — the diamond cluster
      inner = (
        <g fill="#F0B90B" style={{ opacity: dim }}>
          <path d="M12 2.6 14.6 5.2 12 7.8 9.4 5.2 12 2.6Z" />
          <path d="M7.1 7.5 9.7 10.1 7.1 12.7 4.5 10.1 7.1 7.5Z" />
          <path d="M16.9 7.5 19.5 10.1 16.9 12.7 14.3 10.1 16.9 7.5Z" />
          <path d="M12 12.4 14.6 15 12 17.6 9.4 15 12 12.4Z" />
        </g>
      );
      break;
    default:
      inner = (
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" style={{ color: "var(--ink-faint)", opacity: dim }} />
      );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)]"
      style={{ width: size, height: size }}
    >
      <svg width={size - 4} height={size - 4} viewBox="0 0 24 24" fill="none">
        {inner}
      </svg>
    </span>
  );
}
