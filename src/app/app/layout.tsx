import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

// The app shell is a Client Component that reads wallet/router state during
// render. During build-time prerender that raises a "Render in Browser"
// bailout, which must be caught by a Suspense boundary.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
