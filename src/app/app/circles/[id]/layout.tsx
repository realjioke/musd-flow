import { Suspense, type ReactNode } from "react";

// The circle-detail page is a Client Component that reads wallet state
// during render. That triggers a "Render in Browser" bailout during
// prerender, which must be caught by a Suspense boundary.
export default function CircleDetailLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
