require("dotenv").config();

import { BN } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import {
  Environment,
  getConfig,
  loadKeypair,
  MarginfiClient,
  processTransaction,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { makeConfigureMarginfiGroupIx } from "@mrgnlabs/marginfi-client/src/instruction";
import * as zoClient from "@zero_one/client";

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
const MARKET_SYMBOL = "SOL-PERP";

(async function () {
  const config = await getConfig(Environment.DEVNET, connection, {
    programId: new PublicKey(process.env.MARGINFI_PROGRAM!),
    groupPk: new PublicKey(process.env.MARGINFI_GROUP!),
    collateralMintPk: zoClient.USDC_DEVNET_MINT_ADDRESS,
  });

  // Setup the client
  const client = await MarginfiClient.get(config, wallet, connection);

  await configureMarginReq(client, 0.075, 0.05);

  // Prepare user accounts
  const marginfiAccount = await client.createMarginfiAccount();
  await marginfiAccount.deposit(numberToQuote(depositAmount));

  await marginfiAccount.zo.activate();
  await marginfiAccount.zo.deposit(numberToQuote(depositAmount * 2));

  const state = await marginfiAccount.zo.getZoState();
  const margin = await marginfiAccount.zo.getZoMargin(state);

  await marginfiAccount.zo.createPerpOpenOrders(MARKET_SYMBOL);

  let quoteAmount = margin.freeCollateralValue.toNumber();
  let market = await state.getMarketBySymbol(MARKET_SYMBOL);
  let asks = await market.loadAsks(connection);
  let highestAsk = [...asks.items(true)][0];

  let price = highestAsk.price;
  let positionSize = quoteAmount / highestAsk.price;

  await marginfiAccount.zo.placePerpOrder({
    symbol: MARKET_SYMBOL,
    orderType: {
      limit: {},
    },
    isLong: true,
    price: price,
    size: positionSize,
    clientId: new BN(888),
  });

  await margin.refresh(true, true);
  console.log(
    "fc %s, mf %s, im %s, mm %s, tied c %s, equity %s",
    margin.freeCollateralValue,
    margin.marginFraction,
    margin.initialMarginFraction(),
    margin.maintenanceMarginFraction,
    margin.tiedCollateral,
    margin.unweightedAccountValue
  );

  await configureMarginReq(client, 1, 0.5);
})();

function numberToQuote(num: number): BN {
  return new BN(num * 10 ** 6);
}
