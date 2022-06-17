require("dotenv").config();
import { loadKeypair, Wallet } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));

export async function airdrop01Usdc(publicKey: PublicKey, amount: number) {
  await fetch(
    `https://devnet-faucet.01.xyz?owner=${publicKey.toBase58()}&mint=7UT1javY6X1M9R2UrPGrwcZ78SX3huaXyETff5hm5YdX&amount=${amount}`,
    {
      method: "post",
      headers: { "Content-Type": "application/json" },
    }
  );
}

(async () => {
  await airdrop01Usdc(wallet.publicKey, 1_000_000 * 1_000_000);
})();
