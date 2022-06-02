import { Connection, PublicKey } from "@solana/web3.js";
import {
  getConfig,
  getMfiProgram,
  loadKeypair,
  MarginfiClient,
  Environment,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { OptionValues } from "commander";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  wallet
);

export async function createAccount(options: OptionValues) {
  const connection = program.provider.connection;
  const config = await getConfig(Environment.DEVNET, connection, {
    groupPk: new PublicKey(options.group),
    programId: program.programId,
  });
  const client = await MarginfiClient.get(config, wallet, connection);

  const account = await client.createMarginAccount();
  console.log("Margin account address %s", account.publicKey);
}
