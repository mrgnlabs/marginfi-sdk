import { Connection, PublicKey } from "@solana/web3.js";
import {
  getConfig,
  getMfiProgram,
  loadKeypair,
  MarginfiClient,
  Environment,
  Wallet,
  MarginAccount,
} from "@mrgnlabs/marginfi-client";
import { OptionValues } from "commander";
import { BN } from "@project-serum/anchor";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  wallet
);

export async function depositMango(accountPk: string, amount: number, options: OptionValues) {
  const connection = program.provider.connection;
  const config = await getConfig(Environment.DEVNET, connection, {
    groupPk: new PublicKey(options.group),
    programId: program.programId,
  });
  const client = await MarginfiClient.get(config, wallet, connection);
  const account = await MarginAccount.get(new PublicKey(accountPk), client);

  const sig = await account.mango.deposit(new BN(amount * 10 ** 6));
  console.log('Mango deposit %s', sig)
}
