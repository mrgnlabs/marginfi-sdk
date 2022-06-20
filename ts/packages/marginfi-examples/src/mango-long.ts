require("dotenv").config();

import { Connection, PublicKey } from "@solana/web3.js";

import { Environment, getConfig, loadKeypair, MarginfiClient, uiToNative, Wallet } from "@mrgnlabs/marginfi-client";

import { PerpOrderType, Side } from "@mrgnlabs/marginfi-client/dist/utp/mango/types";

import { getMarketByBaseSymbolAndKind, I80F48, QUOTE_INDEX } from "@blockworks-foundation/mango-client";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

const depositAmount = 100;

(async function () {
  const config = await getConfig(Environment.DEVNET, connection);

  // Setup the client
  const client = await MarginfiClient.get(config, wallet, connection);

  // Prepare user accounts
  const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

  console.log("n active utps", mfiAccount.activeUtps().length);

  await mfiAccount.mango.deposit(uiToNative(depositAmount));

  // Open counterpart BTC LONG on Mango
  const [mangoClient, mangoAccount] = await mfiAccount.mango.getMangoClientAndAccount();
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

  const price = mangoGroup.getPrice(perpMarketConfig.marketIndex, mangoCache);
  const baseAssetAmount = balance.div(price);

  console.log("Balance %s, base asset amount %s, price %s", balance, baseAssetAmount, price);

  await mfiAccount.mango.placePerpOrder(mangoBtcMarket, Side.Bid, price.toNumber(), baseAssetAmount.toNumber(), {
    orderType: PerpOrderType.Market,
  });
})();
