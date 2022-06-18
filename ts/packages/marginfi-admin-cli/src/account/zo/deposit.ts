import {
  Environment,
  getConfig,
  getMfiProgram,
  loadKeypair,
  MarginfiAccount,
  MarginfiClient,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  wallet
);

export async function depositZo(accountPk: string, amount: number, options: OptionValues) {
  const connection = program.provider.connection;
  const config = await getConfig(Environment.DEVNET, connection, {
    groupPk: new PublicKey(options.group),
    programId: program.programId,
  });
  const client = await MarginfiClient.get(config, wallet, connection);
  const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

  const sig = await account.zo.deposit(new BN(amount * 10 ** 6));
  console.log("01 deposit %s", sig);
}
