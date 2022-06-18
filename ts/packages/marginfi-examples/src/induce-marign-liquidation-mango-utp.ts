require("dotenv").config();

import { BN } from "@project-serum/anchor";
import { Connection, Transaction } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  MarginfiClient,
  processTransaction,
  Wallet,
} from "@mrgnlabs/marginfi-client";

import {
  Config as MangoConfig,
  getMarketByBaseSymbolAndKind,
  I80F48,
  IDS,
  QUOTE_INDEX,
} from "@blockworks-foundation/mango-client";
import { makeConfigureMarginfiGroupIx } from "@mrgnlabs/marginfi-client/src/instruction";
import { PerpOrderType, Side } from "@mrgnlabs/marginfi-client/src/utp/mango/types";

// const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGIN_ACCOUNT!);
const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

async function configureMarginReq(client: MarginfiClient, initMReq: number, maintMReq: number) {
  const program = client.program;
  const args = {
    bank: {
      initMarginRatio: numberToQuote(initMReq),
      maintMarginRatio: numberToQuote(maintMReq),
    },
  };

  const ix = await makeConfigureMarginfiGroupIx(
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
  const client = await MarginfiClient.get(config, wallet, connection);

  await configureMarginReq(client, 0.075, 0.05);

  // Prepare user accounts
  const marginAccount = await client.createMarginAccount();
  await marginAccount.deposit(numberToQuote(depositAmount));

  await marginAccount.mango.activate();
  await marginAccount.mango.deposit(numberToQuote(depositAmount * 2));

  // Open counterpart BTC LONG on Mango
  const [mangoClient, mangoAccount] = await marginAccount.mango.getMangoClientAndAccount();
  const mangoConfig = new MangoConfig(IDS);
  const groupConfig = mangoConfig.getGroup("devnet", "devnet.2");
  if (!groupConfig) throw Error('`No group config found for "devnet" - "devnet.2"');
  const perpMarketConfig = getMarketByBaseSymbolAndKind(groupConfig, "BTC", "perp");

  const mangoGroup = await mangoClient.getMangoGroup(groupConfig.publicKey);

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

  await marginAccount.mango.placePerpOrder(mangoBtcMarket, Side.Ask, price.toNumber(), baseAssetAmount.toNumber(), {
    orderType: PerpOrderType.Market,
  }); // TODO: probably wrong parameters to open symmetrical LONG

  await configureMarginReq(client, 1, 0.5);
})();

function numberToQuote(num: number): BN {
  return new BN(num * 10 ** 6);
}
