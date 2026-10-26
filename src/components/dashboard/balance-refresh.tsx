"use client";
import { Button } from "@/components/ui/primitives";

export function BalanceRefresh({
  invalidate,
  loading,
}: {
  invalidate: () => void;
  loading: boolean;
}) {
  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={() => invalidate()}>
      Refresh balances
    </Button>
  );
}
