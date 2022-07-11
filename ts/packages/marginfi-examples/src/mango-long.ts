require("dotenv").config();

import { Connection, PublicKey } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  MangoOrderSide,
  MangoPerpOrderType,
  MarginfiClient,
  Wallet,
} from "@mrgnlabs/marginfi-client";

import { getMarketByBaseSymbolAndKind, I80F48, QUOTE_INDEX } from "@blockworks-foundation/mango-client";

const connection = new Connection(process.env.RPC_ENDPOINT!, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 120_000,
});
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

const depositAmount = 5;

(async function () {
  const config = await getConfig(Environment.MAINNET, connection);
  // Setup the client
  const client = await MarginfiClient.fetch(config, wallet, connection);

  // Prepare user accounts
  const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

  await mfiAccount.mango.deposit(depositAmount);

  // Open counterpart BTC LONG on Mango

  const mangoGroup = await mfiAccount.mango.getMangoGroup();
  const mangoAccount = await mfiAccount.mango.getMangoAccount(mangoGroup);

  const groupConfig = mfiAccount.mango.config.groupConfig;
  const perpMarketConfig = getMarketByBaseSymbolAndKind(groupConfig, "BTC", "perp");

  const mangoCache = await mangoGroup.loadCache(connection);
  const balance = mangoAccount.getAvailableBalance(mangoGroup, mangoCache, QUOTE_INDEX).div(I80F48.fromNumber(10 ** 6));

  const mangoBtcMarket = await mangoGroup.loadPerpMarket(
    connection,
    perpMarketConfig.marketIndex,
    perpMarketConfig.baseDecimals,
    perpMarketConfig.quoteDecimals
  );

  const price = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const baseAssetAmount = balance.div(price);

  console.log("Balance %s, base asset amount %s, price %s", balance, baseAssetAmount, price);

  await mfiAccount.mango.placePerpOrder(mangoBtcMarket, MangoOrderSide.Bid, price, baseAssetAmount, {
    orderType: MangoPerpOrderType.Market,
  });
})();
