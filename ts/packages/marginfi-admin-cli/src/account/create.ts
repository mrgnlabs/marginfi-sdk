import { getEnvClient } from "../common";

export async function createAccount() {
  const client = await getEnvClient();

  const account = await client.createMarginfiAccount();
  console.log("Marginfi account address %s", account.publicKey);
}
