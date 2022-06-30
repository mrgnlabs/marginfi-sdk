import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function createAccount(options: OptionValues) {
  const client = await getClientFromOptions(options);

  const account = await client.createMarginfiAccount();
  console.log("Marginfi account address %s", account.publicKey);
}
