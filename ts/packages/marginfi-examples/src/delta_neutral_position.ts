require("dotenv").config();

import { Connection } from "@solana/web3.js";

import {
  getConfig,
  MarginfiClient,
  Environment,
  Wallet,
  loadKeypair,
  uiToNative,
} from "@mrgnlabs/marginfi-client";

import {
  getMarketByBaseSymbolAndKind,
  I80F48,
  QUOTE_INDEX,
} from "@blockworks-foundation/mango-client";
import {
  PerpOrderType,
  Side,
} from "@mrgnlabs/marginfi-client/dist/utp/mango/types";
// import { airdropCollateral } from "./utils";
// import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as ZoClient from "@zero_one/client";
import { OrderType } from "@mrgnlabs/marginfi-client/dist/utp/zo/types";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

const depositAmountUi = 2;

(async function () {
  // const depositAmount = uiToNative(depositAmountUi);
  const config = await getConfig(Environment.MAINNET, connection);

  // Setup the client
  const client = await MarginfiClient.get(config, wallet, connection);

  // // Prepare user accounts
  // const collateral = new Token(
  //   connection,
  //   config.collateralMintPk,
  //   TOKEN_PROGRAM_ID,
  //   wallet.payer
  // );
  // const ataAi = await collateral.getOrCreateAssociatedAccountInfo(
  //   wallet.publicKey
  // );
  // Create margin account
  // const mfiAccount = await client.getMarginfiAccount(new PublicKey(process.env.MARGINFI_ACCOUNT!));  // await airdropCollateral(
  //   client.program.provider,
  //   depositAmount.toNumber(),
  //   config.collateralMintPk,
  //   ataAi.address
  // );


  const mfiAccount = await client.createMarginfiAccount();


  console.log("Margin account created: %s", mfiAccount.publicKey);

  // // Fund margin account
  await mfiAccount.deposit(uiToNative(depositAmountUi));

  // // Activate Drift and Mango UTPs
  await mfiAccount.zo.activate();
  await mfiAccount.mango.activate();
  // Deposit collateral to Mango and 01
  await mfiAccount.zo.deposit(uiToNative(depositAmountUi / 2));
  await mfiAccount.mango.deposit(uiToNative(depositAmountUi / 2));

  // ---------------------------------------------------------------------
  // Open BTC SHORT on 01
  const marketKey = "BTC-PERP";
  const [zoMargin, zoState] = await mfiAccount.zo.getZoMarginAndState();
  const market: ZoClient.ZoMarket = await zoState.getMarketBySymbol(marketKey);
  const bids = [...(await market.loadBids(connection)).items(false)];
  const zoPrice = bids[0].price;

  const zoSize = zoMargin.freeCollateralValue.div(zoPrice); 

  const oo = await zoMargin.getOpenOrdersInfoBySymbol(marketKey, false);
  if (!oo) {
    await mfiAccount.zo.createPerpOpenOrders(marketKey);
  }
  await mfiAccount.zo.placePerpOrder({
    symbol: marketKey,
    orderType: OrderType.ImmediateOrCancel,
    isLong: false,
    price: zoPrice,
    size: zoSize.toNumber(),
  });

  // ---------------------------------------------------------------------
  // Open BTC LONG on Mango
  const [mangoClient, mangoAccount] =
    await mfiAccount.mango.getMangoClientAndAccount();
  const groupConfig = mfiAccount.mango.config.groupConfig;
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

  const mangoPrice = mangoGroup.getPrice(
    perpMarketConfig.marketIndex,
    mangoCache
  );
  const mangoSize = balance.div(mangoPrice);
  await mfiAccount.mango.placePerpOrder(
    mangoBtcMarket,
    Side.Bid,
    mangoPrice.toNumber(),
    mangoSize.toNumber(),
    {
      orderType: PerpOrderType.Market,
    }
  );

  process.exit();
})();
