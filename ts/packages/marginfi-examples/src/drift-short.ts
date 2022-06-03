require("dotenv").config();

import { Markets } from "@drift-labs/sdk";
import { Environment, getConfig, loadKeypair, MarginfiClient, uiToNative, Wallet } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGIN_ACCOUNT!);

(async function () {
  // Setup the client
  const config = await getConfig(Environment.DEVNET, connection);
  const client = await MarginfiClient.get(config, wallet, connection);

  const marginAccount = await client.getMarginAccount(MARGIN_ACCOUNT_PK);

  // Deposit collateral to Mango and Drift
  await marginAccount.drift.deposit(uiToNative(500));

  // ---------------------------------------------------------------------
  // Open BTC SHORT on Drift
  const driftBtcmarketInfo = Markets.find((market) => market.baseAssetSymbol === "BTC");
  await marginAccount.drift.openPosition({
    direction: { short: {} },
    quoteAssetAmount: new BN(uiToNative(500)),
    marketIndex: new BN(driftBtcmarketInfo!.marketIndex),
    limitPrice: new BN(0),
    optionalAccounts: {
      discountToken: false,
      referrer: false,
    },
  }); // TODO: probably wrong parameters to open symmetrical LONG
})();
