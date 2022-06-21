require("dotenv").config();

import { ComputeBudgetProgram, Connection, PublicKey, Transaction } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  MarginfiClient,
  processTransaction,
  uiToNative,
  Wallet,
} from "@mrgnlabs/marginfi-client";

import { getMarketByBaseSymbolAndKind, I80F48, QUOTE_INDEX } from "@blockworks-foundation/mango-client";
import { PerpOrderType, Side } from "@mrgnlabs/marginfi-client/dist/utp/mango/types";
// import { airdropCollateral } from "./utils";
// import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { OrderType } from "@mrgnlabs/marginfi-client/dist/utp/zo/types";
import * as ZoClient from "@zero_one/client";

const connection = new Connection(process.env.RPC_ENDPOINT!, { commitment: "confirmed" });
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

const posAmountUi = 10;

(async function () {
  // const depositAmount = uiToNative(depositAmountUi);
  const config = await getConfig(Environment.MAINNET, connection);

  // Setup the client
  const client = await MarginfiClient.get(config, wallet, connection);

  const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

//   await Promise.all([
//     mfiAccount.zo.deposit(uiToNative(posAmountUi / 2)),
//     mfiAccount.mango.deposit(uiToNative(posAmountUi / 2)),
//   ]);

  // ---------------------------------------------------------------------
  // Open BTC SHORT on 01
  const marketKey = "BTC-PERP";
  const [zoMargin, zoState] = await mfiAccount.zo.getZoMarginAndState();
  const market: ZoClient.ZoMarket = await zoState.getMarketBySymbol(marketKey);
  const bids = [...(await market.loadBids(connection)).items(false)];
  const zoPrice = bids[0].price;

  const zoBalance = zoMargin.freeCollateralValue;

  const zoSize = posAmountUi / zoPrice;
  //   console.log(zoMargin.freeCollateralValue, zoPrice, zoSize);

  const oo = await zoMargin.getOpenOrdersInfoBySymbol(marketKey, false);
  if (!oo) {
    await mfiAccount.zo.createPerpOpenOrders(marketKey);
  }
  const zoIx = await mfiAccount.zo.makePlacePerpOrderIx({
    symbol: marketKey,
    orderType: OrderType.ImmediateOrCancel,
    isLong: false,
    price: zoPrice,
    size: zoSize,
  });

  // ---------------------------------------------------------------------
  // Open BTC LONG on Mango
  const [mangoClient, mangoAccount] = await mfiAccount.mango.getMangoClientAndAccount();
  const groupConfig = mfiAccount.mango.config.groupConfig;
  const perpMarketConfig = getMarketByBaseSymbolAndKind(groupConfig, "BTC", "perp");

  const mangoGroup = await mangoClient.getMangoGroup(groupConfig.publicKey);
  const mangoCache = await mangoGroup.loadCache(connection);
//   const balance = mangoAccount.getMaxWithBorrowForToken(mangoGroup, mangoCache, QUOTE_INDEX).div(I80F48.fromNumber(10 ** 6));
  const balance = I80F48.fromNumber(posAmountUi);

  console.log("Mango Equity: %s", mangoAccount.getEquityUi(mangoGroup, mangoCache) * 10 ** 6);

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
    Side.Bid,
    mangoPrice.toNumber(),
    mangoSize.toNumber(),
    {
      orderType: PerpOrderType.Market,
    }
  );

  const tx = new Transaction().add(
    ComputeBudgetProgram.requestUnits({
      units: 600000,
      additionalFee: 0,
    }),
    zoIx,
    mangoIx
  );

  const sig = await processTransaction(client.program.provider, tx, [], { commitment: "confirmed" });
  console.log("Sig %s", sig);

  process.exit();
})();
