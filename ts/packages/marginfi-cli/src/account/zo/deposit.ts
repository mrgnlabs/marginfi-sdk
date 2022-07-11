import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../../common";

export async function depositZo(accountPk: string, amount: number, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const account = await MarginfiAccount.fetch(new PublicKey(accountPk), client);

  const sig = await account.zo.deposit(amount);
  console.log("01 deposit %s", sig);
}
