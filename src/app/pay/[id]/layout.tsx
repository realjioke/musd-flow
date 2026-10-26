import type { ReactNode } from "react";

// Route segment config must live in a Server Component module.
// `instant = false` opts this page into blocking prerender, which the
// Next 16 cache-components build requires for pages that call client
// hooks during the first paint.
export const instant = false;

export default function PayRequestLayout({ children }: { children: ReactNode }) {
  return children;
}
