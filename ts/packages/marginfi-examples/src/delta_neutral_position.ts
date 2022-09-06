require("dotenv").config();

import { Connection } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  MangoOrderSide,
  MangoPerpOrderType,
  MarginfiClient,
  Wallet,
  ZoPerpOrderType,
} from "@mrgnlabs/marginfi-client";

import { getMarketByBaseSymbolAndKind, I80F48, QUOTE_INDEX } from "@blockworks-foundation/mango-client";
// import { airdropCollateral } from "./utils";
// import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as ZoClient from "@zero_one/client";

const connection = new Connection(process.env.RPC_ENDPOINT!, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 120_000,
});
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

const depositAmountUi = 2;

(async function () {
  const config = await getConfig(Environment.MAINNET);

  // Setup the client
  const client = await MarginfiClient.fetch(config, wallet, connection);

  const mfiAccount = await client.createMarginfiAccount();

  // // Fund margin account
  await mfiAccount.deposit(depositAmountUi);

  // // Activate Drift and Mango UTPs
  await mfiAccount.zo.activate();
  await mfiAccount.mango.activate();
  // Deposit collateral to Mango and 01
  await mfiAccount.zo.deposit(depositAmountUi / 2);
  await mfiAccount.mango.deposit(depositAmountUi / 2);

  // ---------------------------------------------------------------------
  // Open BTC SHORT on 01
  const marketKey = "BTC-PERP";

  const zoState = await mfiAccount.zo.getZoState();
  const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

  const market = await zoState.getMarketBySymbol(marketKey);
  const bids = [...(await market.loadBids(connection)).items(false)];
  const zoPrice = bids[0].price;

  const zoSize = zoMargin.freeCollateralValue.div(zoPrice);

  const oo = await zoMargin.getOpenOrdersInfoBySymbol(marketKey, false);
  if (!oo) {
    await mfiAccount.zo.createPerpOpenOrders(marketKey);
  }
  await mfiAccount.zo.placePerpOrder({
    symbol: marketKey,
    orderType: ZoPerpOrderType.ImmediateOrCancel,
    isLong: false,
    price: zoPrice,
    size: zoSize.toNumber(),
  });

  // ---------------------------------------------------------------------
  // Open BTC LONG on Mango
  const mangoClient = mfiAccount.mango.getMangoClient();
  const mangoAccount = await mfiAccount.mango.getMangoAccount();

  const groupConfig = mfiAccount.mango.config.groupConfig;
  const perpMarketConfig = getMarketByBaseSymbolAndKind(groupConfig, "BTC", "perp");

  const mangoGroup = await mangoClient.getMangoGroup(groupConfig.publicKey);
  const mangoCache = await mangoGroup.loadCache(connection);
  const balance = mangoAccount.getAvailableBalance(mangoGroup, mangoCache, QUOTE_INDEX).div(I80F48.fromNumber(10 ** 6));

  const mangoBtcMarket = await mangoGroup.loadPerpMarket(
    connection,
    perpMarketConfig.marketIndex,
    perpMarketConfig.baseDecimals,
    perpMarketConfig.quoteDecimals
  );

  const mangoPrice = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const mangoSize = balance.div(mangoPrice);
  await mfiAccount.mango.placePerpOrder(
    mangoBtcMarket,
    MangoOrderSide.Bid,
    mangoPrice.toNumber(),
    mangoSize.toNumber(),
    {
      orderType: MangoPerpOrderType.Market,
    }
  );

  process.exit();
})();
