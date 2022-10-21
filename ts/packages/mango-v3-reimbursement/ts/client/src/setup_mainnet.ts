import {
  Cluster,
  Config,
  MangoClient,
} from "@blockworks-foundation/mango-client";
import { AnchorProvider, Provider, Wallet } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { MangoV3ReimbursementClient } from "./client";
import BN from "bn.js";
import fs from "fs";

/// Env
const CLUSTER_URL = process.env.MB_CLUSTER_URL;
const PAYER_KEYPAIR = process.env.MB_PAYER_KEYPAIR;
const GROUP_NUM = Number(process.env.GROUP_NUM || 1);
const CLUSTER: any = "mainnet-beta";
const MANGO_V3_CLUSTER: Cluster = "mainnet";
const MANGO_V3_GROUP_NAME: any = "mainnet.1";

const options = AnchorProvider.defaultOptions();
const connection = new Connection(CLUSTER_URL!, options);

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

  // Create group if not already
  if (
    !(await mangoV3ReimbursementClient.program.account.group.all()).find(
      (group) => group.account.groupNum === GROUP_NUM
    )
  ) {
    const sig = await mangoV3ReimbursementClient.program.methods
      .createGroup(
        GROUP_NUM,
        new PublicKey("E3ZucWEddfWaDYUXVQbJYRYD9oNHUsWNkFVW73Y2by52"),
        0
      )
      .accounts({
        table: new PublicKey("45F9oyj2Jr5pfz1bLoupLGujXkamZEy3RXeKBZudKmJw"),
        payer: (mangoV3ReimbursementClient.program.provider as AnchorProvider)
          .wallet.publicKey,
        authority: (
          mangoV3ReimbursementClient.program.provider as AnchorProvider
        ).wallet.publicKey,
      })
      .rpc();
    console.log(
      `created group, sig https://explorer.solana.com/tx/${
        sig + (CLUSTER === "devnet" ? "?cluster=devnet" : "")
      }`
    );
  }

  let group = (
    await mangoV3ReimbursementClient.program.account.group.all()
  ).find((group) => group.account.groupNum === GROUP_NUM);

  // Reload group
  group = (await mangoV3ReimbursementClient.program.account.group.all()).find(
    (group) => group.account.groupNum === GROUP_NUM
  );

  // Create vaults
  for (const [index, tokenInfo] of (
    await mangoV3Client.getMangoGroup(mangoGroupKey)
  ).tokens.entries()!) {
    // If token for index is set in v3
    if (tokenInfo.mint.equals(PublicKey.default)) {
      continue;
    }

    // If token is still active in v3
    if (tokenInfo.oracleInactive === true) {
      continue;
    }

    // If vault has not already been created
    if (!group?.account.vaults[index].equals(PublicKey.default)) {
      continue;
    }

    let bU64 = Buffer.alloc(8);
    bU64.writeBigUInt64LE(BigInt(index));
    const claimMint = (
      await PublicKey.findProgramAddress(
        [Buffer.from("Mint"), group?.publicKey.toBuffer()!, bU64],
        mangoV3ReimbursementClient.program.programId
      )
    )[0];
    const claimTransferTokenAccount = await getAssociatedTokenAddress(
      claimMint,
      group.account.claimTransferDestination
    );
    sig = await mangoV3ReimbursementClient.program.methods
      .createVault(new BN(index))
      .accounts({
        vault: await getAssociatedTokenAddress(
          tokenInfo.mint,
          group.publicKey,
          true
        ),
        group: (group as any).publicKey,
        mint: tokenInfo.mint,
        claimTransferTokenAccount,
        claimTransferDestination: group.account.claimTransferDestination,
        payer: (mangoV3ReimbursementClient.program.provider as AnchorProvider)
          .wallet.publicKey,
      })
      .rpc();
    console.log(
      `setup vault for ${
        groupIds?.tokens.filter((token) =>
          token.mintKey.equals(tokenInfo.mint)
        )[0].symbol
      } at index ${index} , sig https://explorer.solana.com/tx/${
        sig + (CLUSTER === "devnet" ? "?cluster=devnet" : "")
      }`
    );
  }

  // Reload group
  group = (await mangoV3ReimbursementClient.program.account.group.all()).find(
    (group) => group.account.groupNum === GROUP_NUM
  );

  for (const [i, tokenInfo] of (
    await mangoV3Client.getMangoGroup(mangoGroupKey)
  ).tokens.entries()!) {
    const token = groupIds?.tokens.find((token) =>
      token.mintKey.equals(tokenInfo.mint)
    );
    if (!token) {
      continue;
    }
    const symbol = token.symbol;
    console.log(
      `index - ${i}, symbol - ${symbol} mint - ${group.account.mints[i]}, vault - ${group.account.vaults[i]}, claimMint - ${group.account.claimMints[i]}`
    );
  }

  // Reload group
  group = (await mangoV3ReimbursementClient.program.account.group.all()).find(
    (group) => group.account.groupNum === GROUP_NUM
  );

  if (group?.account.reimbursementStarted === 0) {
    sig = await mangoV3ReimbursementClient.program.methods
      .startReimbursement()
      .accounts({
        group: (group as any).publicKey,
        authority: (
          mangoV3ReimbursementClient.program.provider as AnchorProvider
        ).wallet.publicKey,
      })
      .rpc();
    console.log(
      `start reimbursement, sig https://explorer.solana.com/tx/${
        sig + (CLUSTER === "devnet" ? "?cluster=devnet" : "")
      }`
    );
  }
}

main();
