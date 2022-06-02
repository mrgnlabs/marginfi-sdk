require("dotenv").config();

import { BN } from "@project-serum/anchor";
import { Connection, Transaction } from "@solana/web3.js";

import {
  getConfig,
  MarginfiClient,
  Environment,
  Wallet,
  loadKeypair,
  processTransaction,
} from "@mrgnlabs/marginfi-client";

import { makeConfigureMarginGroupIx } from "@mrgnlabs/marginfi-client/src/instruction";
import { Markets } from "@drift-labs/sdk";

// const MARGIN_ACCOUNT_PK = new PublicKey(process.env.MARGIN_ACCOUNT!);
const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));

async function configureMarginReq(
  client: MarginfiClient,
  initMReq: number,
  maintMReq: number
) {
  console.log('Setting margin req, init: %s, maint: %s', initMReq, maintMReq);
  const program = client.program;
  const args = {
    bank: {
      initMarginRatio: numberToQuote(initMReq),
      maintMarginRatio: numberToQuote(maintMReq),
    },
  };

  const ix = await makeConfigureMarginGroupIx(
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

  await marginAccount.drift.activate();
  await marginAccount.drift.deposit(numberToQuote(depositAmount * 4));


  const btcMarket = Markets.find(
    (market) => market.baseAssetSymbol === "BTC"
  );
  if (!btcMarket) throw Error("BTC market not found")

  const [_, driftUser] = await marginAccount.drift.getClearingHouseAndUser();

  const btcBuyingPower = driftUser.getFreeCollateral()

  console.log(
    "Buying power: %s",
    btcBuyingPower.toNumber()
  );

  await marginAccount.drift.openPosition({
    direction: { short: {} },
    quoteAssetAmount: btcBuyingPower,
    marketIndex: new BN(btcMarket.marketIndex),
    limitPrice: new BN(0),
    optionalAccounts: {
      discountToken: false,
      referrer: false,
    },
  });



  await configureMarginReq(client, 1, 0.85);

  process.exit();
})();

function numberToQuote(num: number): BN {
  return new BN(num * 10 ** 6);
}
