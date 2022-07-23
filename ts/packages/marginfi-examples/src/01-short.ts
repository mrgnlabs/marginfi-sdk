require("dotenv").config();

import { loadKeypair, MarginfiClient, Wallet, ZoPerpOrderType } from "@mrgnlabs/marginfi-client";
import { Connection, PublicKey } from "@solana/web3.js";
import * as ZoClient from "@zero_one/client";

const connection = new Connection(process.env.RPC_ENDPOINT!, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 120_000,
});
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

const marketKey = "BTC-PERP";
const depositAmount = 5;

(async function () {
  // Setup the client
  const client = await MarginfiClient.fromEnv();

  const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

  await mfiAccount.zo.deposit(depositAmount);

  const zoState = await mfiAccount.zo.getZoState();
  const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

  const market: ZoClient.ZoMarket = await zoState.getMarketBySymbol(marketKey);

  const price = (await market.loadBids(connection)).getL2(1)[0][0];
  const size = 5 / price;

  const oo = await zoMargin.getOpenOrdersInfoBySymbol(marketKey, false);
  if (!oo) {
    await mfiAccount.zo.createPerpOpenOrders(marketKey);
  }
  await mfiAccount.zo.placePerpOrder({
    symbol: marketKey,
    orderType: ZoPerpOrderType.FillOrKill,
    isLong: false,
    price,
    size: size,
  });
})();
