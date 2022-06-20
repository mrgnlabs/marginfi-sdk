import { getClientFromEnv, MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";

export async function activateMango(accountPk: string) {
  const client = await getClientFromEnv();
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.mango.activate();
  console.log("Mango account activated %s", sig);
}
