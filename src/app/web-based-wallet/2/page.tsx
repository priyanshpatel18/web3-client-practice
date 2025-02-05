"use client";

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Keypair } from '@solana/web3.js';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import bs58 from "bs58";
import { derivePath } from 'ed25519-hd-key';
import { ChevronsLeft, CopyIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from "sonner";
import nacl from 'tweetnacl';

interface Account {
  publicKey: string;
  privateKey: string;
  path: string;
  mnemonic: string;
  blockchain: "solana";
  balance: number;
}

const rpc = {
  devnet: `https://solana-devnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  mainnet: `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
}

export default function Wallet() {
  const { push } = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(" "));
  const [network, setNetwork] = useState<"devnet" | "mainnet">("mainnet");

  function handleCreateAccount() {
    // Handle Mnmomic Logic
    let mnemonic;
    if (mnemonicWords && validateMnemonic(mnemonicWords.join(" "))) {
      mnemonic = mnemonicWords.join(" ")
    } else {
      mnemonic = generateMnemonic();
      setMnemonicWords(mnemonic.split(" "));
    }

    // Obtain the derived seed
    const seedBuffer = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/0'/${accounts.length}'`;
    const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

    // Generate keypair
    const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
    const keypair = Keypair.fromSecretKey(secretKey);

    const newAccount: Account = {
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(secretKey),
      path,
      blockchain: "solana",
      balance: 0,
      mnemonic
    }

    setAccounts((prevAccounts) => {
      const updatedAccounts = [...prevAccounts, newAccount];
      localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
      return updatedAccounts;
    });

    // Save to Local Storage
    localStorage.setItem("mnemonics", JSON.stringify(mnemonic.split(" ")));
  }

  async function fetchBalance(account: Account) {
    let rpc_url;
    if (network === "devnet") {
      rpc_url = rpc.devnet;
    } else {
      rpc_url = rpc.mainnet
    }

    const res = await fetch(rpc_url, {
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [account.publicKey]
      }),
      method: "POST"
    })


    const data = await res.json();
    let balance: 0.0000;
    if (data && data.result && data.result.value) {
      balance = data.result.value / 10 ** 9;
    }
    setAccounts(accounts.map((a) => {
      if (a.publicKey === account.publicKey) {
        a.balance = balance;
      }
      return a;
    }))
  }

  useEffect(() => {
    accounts.forEach((account) => {
      fetchBalance(account);
    });

    const intervalIds: NodeJS.Timeout[] = accounts.map((account) => {
      return setInterval(() => {
        fetchBalance(account);
      }, 5000);
    });

    return () => {
      intervalIds.forEach((id) => clearInterval(id));
    };
  }, [accounts, network])

  useEffect(() => {
    const recoveryPhrase = localStorage.getItem("mnemonics");
    if (recoveryPhrase) {
      setMnemonicWords(JSON.parse(recoveryPhrase));
    }

    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    setAccounts(accounts);
  }, []);

  return (
    <div className='max-w-5xl m-auto p-4 flex flex-col items-center'>
      <Button className='rounded self-start' onClick={() => push("/")}>
        <ChevronsLeft className='w-4 h-4' />
      </Button>

      <div className='flex flex-col gap-4 items-center'>
        <h1 className='text-3xl font-bold'>Web Based Wallet 2</h1>

        <div className='flex gap-4 items-center'>
          <p>Devnet</p>
          <Switch
            checked={network === "mainnet"}
            onCheckedChange={(checked) => {
              setNetwork(checked ? "mainnet" : "devnet");
            }}
          />
          <p>Mainnet</p>
        </div>

        <Button onClick={handleCreateAccount}>
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
                  {word}
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
                <h2 className="text-lg sm:text-xl font-semibold text-neutral-200">Account {index + 1}</h2>
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