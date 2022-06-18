require("dotenv").config();

import { Connection } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  mango,
  MarginfiClient,
  uiToNative,
  Wallet,
} from "@mrgnlabs/marginfi-client";

import {
  Config as MangoConfig,
  getMarketByBaseSymbolAndKind,
  I80F48,
  IDS,
  QUOTE_INDEX,
} from "@blockworks-foundation/mango-client";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { airdropCollateral } from "./utils";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

(async function () {
  const depositAmount = uiToNative(200);
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

  // Activate Drift and Mango UTPs
  await marginfiAccount.mango.activate();
  await marginfiAccount.zo.activate();
  // Deposit collateral to Mango and Drift
  await marginfiAccount.mango.deposit(uiToNative(50));
  await marginfiAccount.zo.deposit(uiToNative(100));

  // ---------------------------------------------------------------------
  // Open BTC SHORT on Drift

  // TODO: Update example w/ 01

  // const driftBtcmarketInfo = Markets.find((market) => market.baseAssetSymbol === "BTC")!;
  // const [_, driftUser] = await marginfiAccount.drift.getClearingHouseAndUser();
  // const driftQuoteAmount = driftUser.getBuyingPower(driftBtcmarketInfo.marketIndex);
  // await marginfiAccount.drift.openPosition({
  //   direction: { short: {} },
  //   quoteAssetAmount: driftQuoteAmount,
  //   marketIndex: new BN(driftBtcmarketInfo.marketIndex),
  //   limitPrice: new BN(0),
  //   optionalAccounts: {
  //     discountToken: false,
  //     referrer: false,
  //   },
  // });

  // ---------------------------------------------------------------------
  // Open BTC LONG on Mango

  const [mangoClient, mangoAccount] = await marginfiAccount.mango.getMangoClientAndAccount();
  const mangoConfig = new MangoConfig(IDS);
  const groupConfig = mangoConfig.getGroup("devnet", "devnet.2")!;
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

  const price = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const baseAssetAmount = balance.div(price);
  await marginfiAccount.mango.placePerpOrder(
    mangoBtcMarket,
    mango.Side.Bid,
    price.toNumber(),
    baseAssetAmount.toNumber(),
    {
      orderType: mango.PerpOrderType.Market,
    }
  );

  process.exit();
})();
