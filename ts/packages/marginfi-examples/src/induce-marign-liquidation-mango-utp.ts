require("dotenv").config();

import { Connection, Transaction } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  instructions,
  loadKeypair,
  MangoOrderSide,
  MangoPerpOrderType,
  MarginfiClient,
  processTransaction,
  uiToNative,
  Wallet,
} from "@mrgnlabs/marginfi-client";

import { getMarketByBaseSymbolAndKind, I80F48, QUOTE_INDEX } from "@blockworks-foundation/mango-client";

// const MARGINFI_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);
const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

async function configureMarginReq(client: MarginfiClient, initMReq: number, maintMReq: number) {
  const program = client.program;
  const args = {
    bank: {
      initMarginRatio: uiToNative(initMReq),
      maintMarginRatio: uiToNative(maintMReq),
    },
  };

  const ix = await instructions.makeConfigureMarginfiGroupIx(
    client.program,
    {
      adminPk: wallet.publicKey,
      marginfiGroupPk: client.group.publicKey,
    },
    { args }
  );

  const tx = new Transaction().add(ix);
  await processTransaction(program.provider, tx, undefined, {
    skipPreflight: false,
  });
}

const depositAmount = 100;

(async function () {
  const config = await getConfig(Environment.DEVNET, connection);

  // Setup the client
  const client = await MarginfiClient.fetch(config, wallet, connection);

  await configureMarginReq(client, 0.075, 0.05);

  // Prepare user accounts
  const marginfiAccount = await client.createMarginfiAccount();
  await marginfiAccount.deposit(depositAmount);

  await marginfiAccount.mango.activate();
  await marginfiAccount.mango.deposit(depositAmount * 2);

  // Open counterpart BTC LONG on Mango
  const mangoGroup = await marginfiAccount.mango.getMangoGroup();
  const mangoAccount = await marginfiAccount.mango.getMangoAccount();

  const perpMarketConfig = getMarketByBaseSymbolAndKind(marginfiAccount.mango.config.groupConfig, "SOL", "perp");

  const mangoBtcMarket = await mangoGroup.loadPerpMarket(
    connection,
    perpMarketConfig.marketIndex,
    perpMarketConfig.baseDecimals,
    perpMarketConfig.quoteDecimals
  );

  const mangoCache = await mangoGroup.loadCache(connection);
  const balance = await mangoAccount.getAvailableBalance(mangoGroup, mangoCache, QUOTE_INDEX);

  const price = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const baseAssetAmount = balance
    .div(I80F48.fromNumber(10 ** 6))
    .div(price)
    .mul(I80F48.fromNumber(5));

  console.log("Balance: %s, price: %s, amount %s", balance.toNumber(), price.toNumber(), baseAssetAmount.toNumber());

  await marginfiAccount.mango.placePerpOrder(
    mangoBtcMarket,
    MangoOrderSide.Ask,
    price.toNumber(),
    baseAssetAmount.toNumber(),
    {
      orderType: MangoPerpOrderType.Market,
    }
  ); // TODO: probably wrong parameters to open symmetrical LONG

  await configureMarginReq(client, 1, 0.5);
})();
