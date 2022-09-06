require("dotenv").config();

import { AnchorProvider, BN } from "@project-serum/anchor";
import { Connection, Transaction } from "@solana/web3.js";

import {
  instructions,
  loadKeypair,
  MarginfiClient,
  processTransaction,
  Wallet,
  ZoPerpOrderType,
} from "@mrgnlabs/marginfi-client";

const connection = new Connection(process.env.RPC_ENDPOINT!, "confirmed");
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

async function configureMarginReq(client: MarginfiClient, initMReq: number, maintMReq: number) {
  const program = client.program;
  const args = {
    bank: {
      initMarginRatio: numberToQuote(initMReq),
      maintMarginRatio: numberToQuote(maintMReq),
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
  await processTransaction(program.provider as AnchorProvider, tx, undefined, {
    skipPreflight: false,
  });
}

const depositAmount = 200;
const MARKET_SYMBOL = "BTC-PERP";

(async function () {
  // Setup the client
  const client = await MarginfiClient.fromEnv({ wallet, connection });

  await configureMarginReq(client, 0.075, 0.05);

  // Prepare user accounts
  const marginfiAccount = await client.createMarginfiAccount();
  await marginfiAccount.deposit(depositAmount);

  await marginfiAccount.zo.activate();
  await marginfiAccount.zo.deposit(depositAmount * 2);

  const state = await marginfiAccount.zo.getZoState();
  const margin = await marginfiAccount.zo.getZoMargin(state);

  await marginfiAccount.zo.createPerpOpenOrders(MARKET_SYMBOL);

  let quoteAmount = margin.freeCollateralValue.toNumber();
  const price = state.markets[MARKET_SYMBOL].markPrice;

  let positionSize = (quoteAmount / price.number) * 4;
  const long = false;

  await marginfiAccount.zo.placePerpOrder({
    symbol: MARKET_SYMBOL,
    orderType: ZoPerpOrderType.FillOrKill,
    isLong: long,
    price: long ? 1_000_000 : 1,
    size: positionSize,
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
