require("dotenv").config();

import { Environment, getConfig, loadKeypair, MarginfiClient, uiToNative, Wallet } from "@mrgnlabs/marginfi-client";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection } from "@solana/web3.js";
import { airdropCollateral } from "./utils";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

(async function () {
  const depositAmount = uiToNative(1_000_000);
  const config = await getConfig(Environment.DEVNET, connection);

  // Setup the client
  const client = await MarginfiClient.get(config, wallet, connection);

  // Prepare user accounts
  const collateral = new Token(connection, config.collateralMintPk, TOKEN_PROGRAM_ID, wallet.payer);
  const ataAi = await collateral.getOrCreateAssociatedAccountInfo(wallet.publicKey);
  // Create marginfi account
  const marginfiAccount = await client.createMarginfiAccount();
  await airdropCollateral(client.program.provider, depositAmount.toNumber(), config.collateralMintPk, ataAi.address);

  console.log("Marginfi account created: %s", marginfiAccount.publicKey);

  // Fund marginfi account
  await marginfiAccount.deposit(depositAmount);

  // Activate Mango and 01 UTPs
  await marginfiAccount.mango.activate();
  await marginfiAccount.zo.activate();
})();
