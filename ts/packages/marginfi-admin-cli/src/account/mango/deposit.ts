import { getClientFromEnv, MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export async function depositMango(accountPk: string, amount: number) {
  const client = await getClientFromEnv();
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.mango.deposit(new BN(amount * 10 ** 6));
  console.log("Mango deposit %s", sig);
}
