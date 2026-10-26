"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount, useWriteContract, useWalletClient } from "wagmi";
import { ERC20_ABI } from "@/lib/erc20";
import { parseTokenAmount } from "@/lib/format";
import { publicClientFor } from "@/lib/rpc-client";
import { networkFor, type NetworkDescriptor } from "@/lib/chains";
import { addTx, updateTxStatus, type ActivityRecord } from "@/lib/local-activity";
export type SendStage =
  | "form"
  | "review"
  | "signing"
  | "broadcasting"
  | "tracking"
  | "confirmed"
  | "reverted"
  | "failed";

export interface Preflight {
  tokenWei: bigint;
  estimatedGas: bigint | null;
  gasPrice: bigint | null;
  gasCostWei: bigint | null;
  musdBalance: bigint | null;
  gasBalance: bigint | null;
  errors: string[];
  warnings: string[];
}

export interface SendFormState {
  chainId: number | null;
  recipient: string;
  amount: string;
}

export function useSendFlow() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient();

  const [stage, setStage] = useState<SendStage>("form");
  const [form, setForm] = useState<SendFormState>({ chainId: null, recipient: "", amount: "" });
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    status: "confirmed" | "reverted";
    gasUsed: bigint | null;
  } | null>(null);

  const setChain = useCallback((id: number | null) => {
    setForm((f) => ({ ...f, chainId: id }));
  }, []);

  const net: NetworkDescriptor | null = useMemo(
    () => (form.chainId ? networkFor(form.chainId) : null),
    [form.chainId]
  );

  const runPreflight = useCallback(async () => {
    if (!net || !net.musdAddress || !address) throw new Error("Form incomplete");
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!/^0x[a-fA-F0-9]{40}$/.test(form.recipient.trim())) {
      errors.push("Recipient must be a full 0x… EVM address");
    }
    let tokenWei: bigint;
    try {
      tokenWei = parseTokenAmount(form.amount);
      if (tokenWei <= 0n) errors.push("Amount must be greater than zero");
    } catch {
      throw new Error("Amount must be a decimal number");
    }
    if (errors.length) {
      setPreflight(null);
      throw new Error(errors[0]);
    }

    const client = publicClientFor(net.id);
    if (!client) throw new Error("No RPC configured for this network");

    const musdWei = await client.readContract({
      address: net.musdAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
    const gasBalance = await client.getBalance({ address: address as `0x${string}` });

    let estimatedGas: bigint | null = null;
    let gasPrice: bigint | null = null;
    let gasCostWei: bigint | null = null;
    try {
      estimatedGas = await client.estimateContractGas({
        address: net.musdAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [form.recipient.trim() as `0x${string}`, tokenWei],
        account: address as `0x${string}`,
      });
      gasPrice = await client.getGasPrice();
      gasCostWei = estimatedGas * gasPrice;
    } catch (e) {
      warnings.push(
        "Gas estimation was refused by the RPC. This often means the transfer would revert. Gas cost cannot be shown."
      );
      // Gas estimation failure is itself a useful signal but is not conclusive.
      console.error("gas estimation failed", e);
    }

    if (tokenWei > musdWei) {
      errors.push(`Insufficient MUSD balance: you hold less than ${form.amount}`);
    }
    if (gasCostWei && gasCostWei > gasBalance) {
      errors.push(
        `Insufficient ${net.gasSymbol} gas balance to cover the estimated transfer cost`
      );
    } else if (gasCostWei === null) {
      warnings.push(
        `Gas cannot be estimated — your wallet will surface the exact ${net.gasSymbol} cost before signing.`
      );
    }

    const pf = {
      tokenWei,
      estimatedGas,
      gasPrice,
      gasCostWei,
      musdBalance: musdWei,
      gasBalance,
      errors,
      warnings,
    };
    setPreflight(pf);
    if (errors.length) throw new Error(errors[0]);
    setStage("review");
  }, [form, net, address]);

  const execute = useCallback(async () => {
    if (!net || !net.musdAddress || !address || !preflight) throw new Error("Not ready");
    setStage("signing");
    setFailure(null);
    try {
      const hash = await writeContractAsync({
        address: net.musdAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [form.recipient.trim() as `0x${string}`, preflight.tokenWei],
        chainId: net.id,
      });
      setTxHash(hash);
      setStage("tracking");
      const record: ActivityRecord = {
        id: `${hash}:send:${Date.now()}`,
        kind: "send",
        txHash: hash,
        chainId: net.id,
        from: address,
        to: form.recipient.trim(),
        amountWei: preflight.tokenWei.toString(),
        createdAt: Date.now(),
        status: "pending",
        recordKind: "real",
      };
      addTx(record);
      let receipt = await waitForReceiptSafe(net.id, hash);
      if (receipt === null) {
        // Do not ever claim success without the actual receipt.
        setFailure("Receipt could not be fetched; reopen this page and check the explorer");
        setStage("failed");
        return;
      }
      if (receipt.status === "reverted") {
        updateTxStatus(record.id, "reverted");
        setReceipt(receipt);
        setStage("reverted");
        return;
      }
      updateTxStatus(record.id, "confirmed");
      setReceipt(receipt);
      setStage("confirmed");
    } catch (e) {
      const rejected = e && typeof e === "object" && (e as { code?: number }).code === 4001;
      setFailure(
        rejected
          ? "You rejected the transaction in your wallet. Nothing was sent."
          : e instanceof Error
            ? e.message
            : "Transaction failed before broadcast"
      );
      setStage("failed");
    }
  }, [net, address, preflight, form.recipient, writeContractAsync]);

  const reset = useCallback(() => {
    setStage("form");
    setPreflight(null);
    setTxHash(null);
    setReceipt(null);
    setFailure(null);
  }, []);

  return {
    stage,
    form,
    setForm,
    setChain,
    net,
    preflight,
    txHash,
    receipt,
    failure,
    runPreflight,
    execute,
    reset,
    address: address ?? null,
    walletConnected: Boolean(walletClient),
  };
}

async function waitForReceiptSafe(chainId: number, hash: string) {
  const client = publicClientFor(chainId);
  if (!client) return null;
  try {
    const receipt = await client.waitForTransactionReceipt({ hash: hash as `0x${string}`, timeout: 120_000 });
    return receipt.status === "success"
      ? ({ status: "confirmed" as const, gasUsed: receipt.gasUsed })
      : ({ status: "reverted" as const, gasUsed: receipt.gasUsed });
  } catch (e) {
    console.error("waitForTransactionReceipt failed", e);
    return null;
  }
}
