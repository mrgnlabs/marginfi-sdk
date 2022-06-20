import { getClientFromEnv, MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";

export async function activateZo(accountPk: string) {
  const client = await getClientFromEnv();
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.zo.activate();
  console.log("01 account activated %s", sig);
}
