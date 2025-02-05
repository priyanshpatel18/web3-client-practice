"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function page() {
  const { push } = useRouter();

  return (
    <div className="flex p-4">
      <div className="flex flex-col gap-4 p-4 px-8 border rounded">
        <h1 className="text-2xl">Web based Wallets</h1>
        <Button onClick={() => push("/web-based-wallet/1")} className="rounded text-lg">
          Wallet 1
        </Button>
        <Button onClick={() => push("/web-based-wallet/2")} className="rounded text-lg">
          Wallet 2
        </Button>
        <Button onClick={() => push("/web-based-wallet/3")} className="rounded text-lg">
          Wallet 3
        </Button>
      </div>
    </div>
  )
}
