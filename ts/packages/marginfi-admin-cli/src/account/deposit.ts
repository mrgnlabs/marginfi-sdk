import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { getEnvClient } from "../common";

export async function deposit(address: string, amount: number) {
  const client = await getEnvClient();

  amount = amount * 10 ** 6;
  const account = await MarginfiAccount.get(new PublicKey(address), client);

  let sig = await account.deposit(new BN(amount));
  console.log("Sig %s", sig);
}
