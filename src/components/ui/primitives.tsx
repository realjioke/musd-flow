"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<string, string> = {
  primary:
    "bg-[var(--gold)] text-[#161405] hover:bg-[var(--gold-soft)] shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_14px_-4px_rgba(217,180,91,0.35)]",
  secondary:
    "border border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--ink)] hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]",
  danger:
    "border border-[rgba(212,112,95,0.4)] bg-[rgba(212,112,95,0.08)] text-[var(--danger)] hover:bg-[rgba(212,112,95,0.15)]",
};

const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`${buttonBase} ${variants[variant]} ${sizes[size]} ${className ?? ""}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? ""}`}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mf-card ${className ?? ""}`}>{children}</div>;
}

type BadgeTone = "neutral" | "gold" | "success" | "danger" | "warn" | "muted";
const tones: Record<BadgeTone, string> = {
  neutral: "border-[var(--line-strong)] text-[var(--ink-soft)]",
  muted: "border-[var(--line)] text-[var(--ink-faint)]",
  gold: "border-[rgba(217,180,91,0.5)] bg-[var(--gold-bg)] text-[var(--gold)]",
  success: "border-[rgba(88,185,139,0.4)] bg-[rgba(88,185,139,0.08)] text-[var(--success)]",
  danger: "border-[rgba(212,112,95,0.4)] text-[var(--danger)]",
  warn: "border-[rgba(217,160,91,0.4)] text-[var(--warn)]",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mf-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--ink-soft)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="mf-card w-full max-w-md p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
}: {
  value: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size={size}
      variant="ghost"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied ✓" : label}
    </Button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`mf-skeleton ${className ?? ""}`} aria-hidden />;
}

export function StatusDot({ tone }: { tone: "success" | "warn" | "danger" | "muted" }) {
  const colors = {
    success: "bg-[var(--success)]",
    warn: "bg-[var(--warn)]",
    danger: "bg-[var(--danger)]",
    muted: "bg-[var(--ink-faint)]",
  } as const;
  return <span className={`inline-block size-1.5 rounded-full ${colors[tone]}`} />;
}
