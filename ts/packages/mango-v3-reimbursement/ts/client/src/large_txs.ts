import { AnchorProvider, Wallet } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { MangoV3ReimbursementClient } from "./client";
import fs from "fs";
import {
  Cluster,
  Config,
  MangoClient,
  sleep,
} from "@blockworks-foundation/mango-client";
import axios from "axios";

/// Env
const CLUSTER_URL = process.env.MB_CLUSTER_URL;
const PAYER_KEYPAIR = process.env.MB_PAYER_KEYPAIR;
const GROUP_NUM = Number(process.env.GROUP_NUM || 1);
const CLUSTER: any = "mainnet-beta";
const MANGO_V3_CLUSTER: Cluster = "mainnet";
const MANGO_V3_GROUP_NAME: any = "mainnet.1";

const options = AnchorProvider.defaultOptions();
const connection = new Connection(CLUSTER_URL!, { commitment: "confirmed" });

// Mango v3 client setup
const config = Config.ids();
const groupIds = config.getGroup(MANGO_V3_CLUSTER, MANGO_V3_GROUP_NAME);
if (!groupIds) {
  throw new Error(`Group ${MANGO_V3_GROUP_NAME} not found`);
}
const mangoProgramId = groupIds.mangoProgramId;
const mangoGroupKey = groupIds.publicKey;
const mangoV3Client = new MangoClient(connection, mangoProgramId);

async function main() {
  // Client setup
  let sig;
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(PAYER_KEYPAIR!, "utf-8")))
  );
  const adminWallet = new Wallet(admin);
  const provider = new AnchorProvider(connection, adminWallet, options);
  const mangoV3ReimbursementClient = new MangoV3ReimbursementClient(provider);

  // v3 tokens and cache
  const mangoGroup = await mangoV3Client.getMangoGroup(mangoGroupKey);
  const tokens = mangoGroup.tokens;
  const mangoCache = await mangoGroup.loadCache(connection);

  // load group
  let group = (
    await mangoV3ReimbursementClient.program.account.group.all()
  ).find((group) => group.account.groupNum === GROUP_NUM);

  let signatures;
  let lastSeenSignature = process.env.LAST_SIGNATURE;
  while (true) {
    signatures = await connection.getConfirmedSignaturesForAddress2(
      group.publicKey,
      lastSeenSignature ? { until: lastSeenSignature } : {}
    );

    lastSeenSignature = signatures[0].signature;

    for (const sig of signatures.reverse()) {
      const meta = await connection.getParsedTransaction(
        sig.signature,
        "confirmed"
      );

      for (const innerIx of meta.meta.innerInstructions) {
        for (const ix of innerIx.instructions) {
          if (
            ix["parsed"] &&
            ix["parsed"]["type"] &&
            ix["parsed"]["type"] === "transfer"
          ) {
            const tokenIndex = group.account.vaults.findIndex(
              (vault) => vault.toBase58() === (ix as any).parsed.info.source
            );

            if (tokenIndex == -1) {
              continue;
            }

            const price = mangoCache.getPrice(tokenIndex).toNumber();

            const symbol = groupIds?.tokens.find((token) =>
              token.mintKey.equals(group.account.mints[tokenIndex])
            ).symbol;

            const amount =
              parseInt((ix as any).parsed.info.amount) /
              Math.pow(10, tokens[tokenIndex].decimals);
            const amountString = parseFloat(amount.toFixed(2))
              .toLocaleString()
              .padStart(12);
            const value = amount * price;
            const valueString = parseFloat(value.toFixed(2))
              .toLocaleString()
              .padStart(12);

            if (value > 50_000) {
              let combinedNotification =
                "```\n" +
                `reimbursed, slot - ${meta.slot}, ${symbol.padStart(
                  5
                )} amount - ${amountString}, value - ${valueString} sig https://explorer.solana.com/tx/${
                  sig.signature
                }` +
                "\n```";
              console.log(combinedNotification);

              if (process.env.WEBHOOK_URL) {
                axios.post(process.env.WEBHOOK_URL, {
                  content: combinedNotification,
                });
              }
            }
          }
        }
      }
    }

    await sleep(60000);
  }
}

main();
