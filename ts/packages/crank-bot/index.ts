require("dotenv").config();

import {
  getConfig,
  MarginAccount,
  MarginAccountData,
  Environment,
  Wallet,
  MarginfiClient
} from "@mrgnlabs/marginfi-client";
import { Connection, PublicKey } from "@solana/web3.js";

const marginFiPk = new PublicKey(process.env.MARGINFI_PROGRAM!);
const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = Wallet.local();
const marginGroupPk = new PublicKey(process.env.MARGIN_GROUP!);

(async function () {
  console.log('Running crank bot, use DEBUG=* to see logs');
  const debug = require('debug')('crank-bot')
  const config = await getConfig(Environment.DEVNET, connection, {
    groupPk: marginGroupPk,
    programId: marginFiPk,
  });
  debug('Running crank bot for group %s', marginGroupPk);
  const marginClient = await MarginfiClient.get(config, wallet, connection);
  const round = async function () {
    try {
      await loadAllMarginAccounts(marginClient);
    } catch (e) {
      debug('Bot crashed')
      debug(e);
    } finally {
      let n = Number.parseInt(process.env.TIMEOUT!);
      debug('Sleeping %d', n)
      setTimeout(round, n);
    }
  };
  round();
})();

async function loadAllMarginAccounts(mfiClient: MarginfiClient) {
  const debug = require('debug')('crank-bot:loader');
  debug("Loading margin accounts for group %s", marginGroupPk)

  const dis = { memcmp: { offset: 32 + 8, bytes: marginGroupPk.toBase58() } };
  const rawMarignAccounts = await mfiClient.program.account.marginAccount.all([dis]);

  const marginAccounts = rawMarignAccounts.map((a) => {
    let data: MarginAccountData = a.account as any;
    return MarginAccount.fromAccountData(
      a.publicKey,
      mfiClient,
      data,
      mfiClient.group
    );
  });

  debug("Loaded %d margin accounts", marginAccounts.length);

  for (let marginAccount of marginAccounts) {
    await marginAccount.checkRebalance();
    await marginAccount.checkBankruptcy();
  }
}
