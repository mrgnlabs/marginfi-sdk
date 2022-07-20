import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../../common";

export async function withdrawMango(amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const account = await MarginfiAccount.fetch(new PublicKey(process.env.MARGINFI_ACCOUNT!), client);

  const sig = await account.mango.withdraw(amount);
  console.log("Mango withdraw %s", sig);
}
