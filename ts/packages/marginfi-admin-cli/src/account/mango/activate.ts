import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { getEnvClient } from "../../common";

export async function activateMango(accountPk: string) {
  const client = await getEnvClient();
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.mango.activate();
  console.log("Mango account activated %s", sig);
}
