import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../../common";

export async function depositMango(accountPk: string, amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const account = await MarginfiAccount.fetch(new PublicKey(accountPk), client);

  const sig = await account.mango.deposit(amount);
  console.log("Mango deposit %s", sig);
}
