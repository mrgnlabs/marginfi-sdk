import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../../common";

export async function depositMango(accountPk: string, amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.mango.deposit(new BN(amount * 10 ** 6));
  console.log("Mango deposit %s", sig);
}
