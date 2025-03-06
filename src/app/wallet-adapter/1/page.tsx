"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletIcon } from "@solana/wallet-adapter-react-ui";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Adapter() {
  const { push } = useRouter();
  const { wallet } = useWallet();

  return (
    <div className="max-w-5xl m-auto flex flex-col items-center p-4">
      <Button className="rounded self-start" onClick={() => push("/")}>
        <ArrowLeftIcon className="w-4 h-4" />
      </Button>

      <div className="flex flex-col items-center gap-4">
        <h1 className='text-3xl font-bold'>Wallet Adapter 1</h1>
        <WalletIcon wallet={wallet} />
      </div>
    </div>
  )
}