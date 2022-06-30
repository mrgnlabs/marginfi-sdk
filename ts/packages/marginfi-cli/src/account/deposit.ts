import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function deposit(address: string, amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);

  amount = amount * 10 ** 6;
  const account = await MarginfiAccount.get(new PublicKey(address), client);

  let sig = await account.deposit(new BN(amount));
  console.log("Sig %s", sig);
}
