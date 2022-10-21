// require("dotenv").config();

// import {
//   Environment,
//   getConfig,
//   loadKeypair,
//   MarginfiClient,
//   Wallet,
//   ZoPerpOrderType,
// } from "@mrgnlabs/marginfi-client";
// import { Connection, PublicKey } from "@solana/web3.js";
// import * as ZoClient from "@zero_one/client";

// const connection = new Connection(process.env.RPC_ENDPOINT!, {
//   commitment: "confirmed",
//   confirmTransactionInitialTimeout: 120_000,
// });
// const wallet = new Wallet(loadKeypair(process.env.WALLET!));
// const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGINFI_ACCOUNT!);

// const marketKey = "BTC-PERP";
// const depositAmount = 5;

// (async function () {
//   // Setup the client
//   const config = await getConfig(Environment.MAINNET, connection);
//   const client = await MarginfiClient.fetch(config, wallet, connection);

//   const mfiAccount = await client.getMarginfiAccount(MARGIN_ACCOUNT_PK);

//   await mfiAccount.zo.deposit(depositAmount);

//   const zoState = await mfiAccount.zo.getZoState();
//   const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

//   const market: ZoClient.ZoMarket = await zoState.getMarketBySymbol(marketKey);

//   const bids = [...(await market.loadBids(connection)).items(false)];
//   const price = bids[0].price;

//   const size = zoMargin.freeCollateralValue.div(price);

//   const oo = await zoMargin.getOpenOrdersInfoBySymbol(marketKey, false);
//   if (!oo) {
//     await mfiAccount.zo.createPerpOpenOrders(marketKey);
//   }
//   await mfiAccount.zo.placePerpOrder({
//     symbol: marketKey,
//     orderType: ZoPerpOrderType.ImmediateOrCancel,
//     isLong: false,
//     price,
//     size: size.toNumber(),
//   });
// })();
