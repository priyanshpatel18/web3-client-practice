"use client";

import { Button } from "@/components/ui/button";
import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { ArrowLeft, CopyIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import nacl from "tweetnacl";

interface Account {
  name: string;
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
  blockchain: "solana";
  balance: number;
}

export default function Wallet() {
  const { push } = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(" "));

  useEffect(() => {
    const mnemonics = localStorage.getItem("mnemonics")
    if (mnemonics) {
      setMnemonicWords(JSON.parse(mnemonics))
    }

    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]")
    setAccounts(accounts);
  }, [])

  function handleCreateAccount() {
    // Generate Mnemonics
    let mnemonic: string;
    if (mnemonicWords && validateMnemonic(mnemonicWords.join(" "))) {
      mnemonic = mnemonicWords.join(" ");
    } else {
      mnemonic = generateMnemonic();
      localStorage.setItem("mnemonics", JSON.stringify(mnemonic.split(" ")));
    }

    // Obtain Derived_Seed
    const seedBuffer = mnemonicToSeedSync(mnemonic)
    const path = `m/44'/501'/0'/${accounts.length}'`
    const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

    // Generate Public-Private Keypair
    const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
    const keypair = Keypair.fromSecretKey(secretKey);
    const newAccount: Account = {
      name: `Account ${accounts.length + 1}`,
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey),
      blockchain: "solana",
      balance: 0,
      path,
      mnemonic
    }
    setAccounts((prevAccounts) => {
      const updatedAccounts = [...prevAccounts, newAccount];
      localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
      return updatedAccounts;
    });
  }

  return (
    <div className="p-4 max-w-5xl m-auto flex flex-col items-center">
      <Button className="rounded self-start" onClick={() => push("/")}>
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <div className="flex flex-col items-center gap-4">
        <h1 className='text-3xl font-bold'>Web Based Wallet 3</h1>

        <Button className="text-lg rounded" onClick={handleCreateAccount}>
          {accounts.length > 0 ? "Add Account" : "Generate Wallet"}
        </Button>

        {mnemonicWords.join("").trim() && (
          <div className="p-4 border flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">
              Secret Recovery Phrase
            </h2>
            <div
              className="grid grid-cols-3 gap-4 text-center cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(mnemonicWords.join(" "))
                toast.success("Secret Recovery Phrase copied to clipboard.");
              }}
            >
              {mnemonicWords.map((word, index) => (
                <p
                  key={index}
                  className="text-lg flex items-center justify-center gap-4 text-accent-foreground border p-2 px-12 rounded"
                >
                  {word.replace(word, "*".repeat(word.length))}
                </p>
              ))}
            </div>
          </div>
        )}

        {accounts.length > 0 && (
          accounts.map((account, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border border-neutral-800 rounded-lg p-4 sm:p-6 backdrop-blur-sm"
            >
              <div className='flex w-full items-center justify-between'>
                <h2 className="text-lg sm:text-xl font-semibold text-neutral-200">{account.name}</h2>
                <Trash2Icon
                  className="w-8 h-8 p-2 rounded bg-red-600 hover:bg-red-700 cursor-pointer"
                  onClick={() => {
                    setAccounts((prevAccounts) => {
                      const newAccounts = prevAccounts.filter((acc) => acc.path !== account.path);
                      localStorage.setItem("accounts", JSON.stringify(newAccounts));
                      return newAccounts;
                    })
                    toast.info(`${ account.name } Removed`)
                  }}
                />
              </div>
              <div className="space-y-2 font-mono text-xs sm:text-sm text-neutral-400">
                <div className='flex items-start sm:items-center gap-2 break-all'>
                  <span>Public Key:</span>
                  <div className="flex gap-2 items-center">
                    <span className="flex-1">{account.publicKey}</span>
                    <CopyIcon
                      className="w-3 h-3 cursor-pointer flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(account.publicKey)
                        toast.success("Public key copied to clipboard")
                      }}
                    />
                  </div>
                </div>
                <div className='flex items-start sm:items-center gap-2 break-all'>
                  <span>Private Key:</span>
                  <div className="flex gap-2 items-center">
                    <span className="flex-1">{account.privateKey}</span>
                    <CopyIcon
                      className="w-3 h-3 cursor-pointer flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(account.privateKey)
                        toast.success("Private key copied to clipboard")
                      }}
                    />
                  </div>
                </div>
                <p>Path: {account.path}</p>
                <p>Balance: {account.balance ? account.balance.toFixed(4) : "0.0000"} SOL</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
