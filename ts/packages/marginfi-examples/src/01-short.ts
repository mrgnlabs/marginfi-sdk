require("dotenv").config();

import { Connection, PublicKey } from "@solana/web3.js";
import {
  getConfig,
  MarginfiClient,
  Environment,
  Wallet,
  loadKeypair,
  uiToNative,
} from "@mrgnlabs/marginfi-client";
import * as ZoClient from "@zero_one/client";

import { OrderType } from "@mrgnlabs/marginfi-client/dist/utp/zo/types";

const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

const marketKey = "BTC-PERP";
const depositAmount = 5;

(async function () {
  // Setup the client
  const config = await getConfig(Environment.MAINNET, connection);
  const client = await MarginfiClient.get(config, wallet, connection);

  const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

  await mfiAccount.zo.deposit(uiToNative(depositAmount));

  const [zoMargin, zoState] = await mfiAccount.zo.getZoMarginAndState();
  const market: ZoClient.ZoMarket = await zoState.getMarketBySymbol(marketKey);

  const bids = [...(await market.loadBids(connection)).items(false)];
  const price = bids[0].price;

  const size = zoMargin.freeCollateralValue.div(price);

  const oo = await zoMargin.getOpenOrdersInfoBySymbol(marketKey, false);
  if (!oo) {
    await mfiAccount.zo.createPerpOpenOrders(marketKey);
  }
  await mfiAccount.zo.placePerpOrder({
    symbol: marketKey,
    orderType: OrderType.ImmediateOrCancel,
    isLong: false,
    price,
    size: size.toNumber(),
  });
})();
