require("dotenv").config();

import { ComputeBudgetProgram, Connection, PublicKey, Transaction } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  MangoOrderSide,
  MangoPerpOrderType,
  MarginfiClient,
  processTransaction,
  Wallet,
  ZoPerpOrderType,
} from "@mrgnlabs/marginfi-client";

import { getMarketByBaseSymbolAndKind, I80F48 } from "@blockworks-foundation/mango-client";
import { AnchorProvider } from "@project-serum/anchor";

const connection = new Connection(process.env.RPC_ENDPOINT!, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 120_000,
});
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

const posAmountUi = 10;
const zoMarketKey = "BTC-PERP";

(async function () {
  // const depositAmount = uiToNative(depositAmountUi);
  const config = await getConfig(Environment.MAINNET);

  // Setup the client
  const client = await MarginfiClient.fetch(config, wallet, connection);

  const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

  // Fund accounts
  await Promise.all([mfiAccount.zo.deposit(posAmountUi / 2), mfiAccount.mango.deposit(posAmountUi / 2)]);

  // ---------------------------------------------------------------------
  // Open BTC SHORT on 01
  const zoState = await mfiAccount.zo.getZoState();
  const zoMargin = await mfiAccount.zo.getZoMargin(zoState);
  const market = await zoState.getMarketBySymbol(zoMarketKey);
  const bids = [...(await market.loadBids(connection)).items(false)];
  const zoPrice = bids[0].price;

  const zoSize = posAmountUi / zoPrice;

  const oo = await zoMargin.getOpenOrdersInfoBySymbol(zoMarketKey, false);
  if (!oo) {
    await mfiAccount.zo.createPerpOpenOrders(zoMarketKey);
  }
  const zoIx = await mfiAccount.zo.makePlacePerpOrderIx({
    symbol: zoMarketKey,
    orderType: ZoPerpOrderType.ImmediateOrCancel,
    isLong: false,
    price: zoPrice,
    size: zoSize,
  });

  // ---------------------------------------------------------------------
  // Open BTC LONG on Mango
  const groupConfig = mfiAccount.mango.config.groupConfig;
  const perpMarketConfig = getMarketByBaseSymbolAndKind(groupConfig, "BTC", "perp");

  const mangoGroup = await mfiAccount.mango.getMangoGroup();
  const mangoCache = await mangoGroup.loadCache(connection);
  const balance = I80F48.fromNumber(posAmountUi);

  const mangoBtcMarket = await mangoGroup.loadPerpMarket(
    connection,
    perpMarketConfig.marketIndex,
    perpMarketConfig.baseDecimals,
    perpMarketConfig.quoteDecimals
  );

  const mangoPrice = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const mangoSize = balance.div(mangoPrice);
  const mangoIx = await mfiAccount.mango.makePlacePerpOrderIx(
    mangoBtcMarket,
    MangoOrderSide.Bid,
    mangoPrice.toNumber(),
    mangoSize.toNumber(),
    {
      orderType: MangoPerpOrderType.Market,
    }
  );

  const tx = new Transaction().add(
    ComputeBudgetProgram.requestUnits({
      units: 600000,
      additionalFee: 0,
    }),
    ...zoIx.instructions,
    ...mangoIx.instructions
  );

  const sig = await processTransaction(client.program.provider as AnchorProvider, tx);
  console.log("Sig %s", sig);

  process.exit();
})();
