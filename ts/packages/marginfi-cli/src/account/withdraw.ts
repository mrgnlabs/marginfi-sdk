import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function withdraw(address: string, amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const account = await MarginfiAccount.get(new PublicKey(address), client);

  let sig = await account.withdraw(new BN(amount * 10 ** 6));
  console.log("Sig %s", sig);
}
