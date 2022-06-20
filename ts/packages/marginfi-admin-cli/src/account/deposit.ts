import { getClientFromEnv, MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export async function deposit(address: string, amount: number) {
  const client = await getClientFromEnv();

  amount = amount * 10 ** 6;
  const account = await MarginfiAccount.get(new PublicKey(address), client);

  let sig = await account.deposit(new BN(amount));
  console.log("Sig %s", sig);
}
