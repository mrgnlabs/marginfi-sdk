import {
  Environment,
  getConfig,
  getMfiProgram,
  loadKeypair,
  MarginAccount,
  MarginfiClient,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  wallet
);

export async function deposit(address: string, amount: number) {
  amount = amount * 10 ** 6;
  const accountPk = new PublicKey(address);

  const connection = program.provider.connection;

  const accountData = await program.account.marginAccount.fetch(accountPk);
  const groupPk = accountData.marginGroup;
  const config = await getConfig(Environment.DEVNET, connection, {
    groupPk,
    programId: program.programId,
  });
  const client = await MarginfiClient.get(config, wallet, connection);
  const account = await MarginAccount.get(accountPk, client);

  let sig = await account.deposit(new BN(amount));
  console.log("Sig %s", sig);
}
