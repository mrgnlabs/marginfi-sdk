require("dotenv").config();

import { Connection, PublicKey } from "@solana/web3.js";

import {
  getConfig,
  MarginfiClient,
  Environment,
  Wallet,
  loadKeypair,
  uiToNative,
} from "@mrgnlabs/marginfi-client";

import {
  Config as MangoConfig,
  getMarketByBaseSymbolAndKind,
  I80F48,
  IDS,
  QUOTE_INDEX,
} from "@blockworks-foundation/mango-client";
import { PerpOrderType, Side } from "@mrgnlabs/marginfi-client/src/utp/mango";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGIN_ACCOUNT!);

(async function () {
  const config = await getConfig(Environment.DEVNET, connection);

  // Setup the client
  const client = await MarginfiClient.get(config, wallet, connection);

  // Prepare user accounts
  const marginAccount = await client.getMarginAccount(MARGIN_ACCOUNT_PK);

  marginAccount.mango.deposit(uiToNative(500));

  // Open counterpart BTC LONG on Mango
  const [mangoClient, mangoAccount] =
    await marginAccount.mango.getMangoClientAndAccount();
  const mangoConfig = new MangoConfig(IDS);
  const groupConfig = mangoConfig.getGroup("devnet", "devnet.2")!;
  const perpMarketConfig = getMarketByBaseSymbolAndKind(
    groupConfig,
    "BTC",
    "perp"
  );

  const mangoGroup = await mangoClient.getMangoGroup(groupConfig.publicKey);
  const mangoCache = await mangoGroup.loadCache(connection);
  const balance = mangoAccount
    .getAvailableBalance(mangoGroup, mangoCache, QUOTE_INDEX)
    .div(I80F48.fromNumber(10 ** 6));

  const mangoBtcMarket = await mangoGroup.loadPerpMarket(
    connection,
    perpMarketConfig.marketIndex,
    perpMarketConfig.baseDecimals,
    perpMarketConfig.quoteDecimals
  );

  const price = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const baseAssetAmount = balance.div(price);

  console.log(
    "Balance %s, base asset amount %s, price %s",
    balance,
    baseAssetAmount,
    price
  );

  await marginAccount.mango.placePerpOrder(
    mangoBtcMarket,
    Side.Bid,
    price.toNumber(),
    baseAssetAmount.toNumber(),
    {
      orderType: PerpOrderType.Market,
    }
  );
})();
