import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../../common";

export async function activateMango(accountPk: string, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.mango.activate();
  console.log("Mango account activated %s", sig);
}
