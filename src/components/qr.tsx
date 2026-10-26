"use client";

import { useEffect, useState } from "react";

export function QrCode({
  value,
  size = 160,
  caption,
}: {
  value: string;
  size?: number;
  caption?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    import("qrcode")
      .then((QR) =>
        QR.toDataURL(value, { width: size * 2, margin: 1, color: { dark: "#0b0b09", light: "#f2efe4" } })
      )
      .then((data) => {
        if (live) setSrc(data);
      })
      .catch(() => setErr(true));
    return () => {
      live = false;
    };
  }, [value, size]);

  if (err) return <span className="text-xs text-[var(--danger)]">QR generation failed</span>;
  if (!src) return <div className="mf-skeleton" style={{ width: size, height: size }} />;
  return (
    <figure className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={size} height={size} alt={`QR code for ${caption ?? value}`} className="rounded-lg" />
      {caption ? <figcaption className="text-xs text-[var(--ink-faint)]">{caption}</figcaption> : null}
    </figure>
  );
}
