import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function deposit(amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);

  const account = await MarginfiAccount.fetch(new PublicKey(process.env.MARGINFI_ACCOUNT!), client);

  let sig = await account.deposit(amount);
  console.log("Sig %s", sig);
}
