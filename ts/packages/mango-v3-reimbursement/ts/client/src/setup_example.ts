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
const CLUSTER_URL =
  process.env.CLUSTER_URL_OVERRIDE || process.env.MB_CLUSTER_URL;
const PAYER_KEYPAIR =
  process.env.PAYER_KEYPAIR_OVERRIDE || process.env.MB_PAYER_KEYPAIR;
const GROUP_NUM = Number(process.env.GROUP_NUM || 5);
const CLUSTER: any =
  (process.env.CLUSTER_OVERRIDE as Cluster) || "mainnet-beta";
const MANGO_V3_CLUSTER: Cluster =
  (process.env.MANGO_V3_CLUSTER_OVERRIDE as Cluster) || "mainnet";
const MANGO_V3_GROUP_NAME: any =
  (process.env.MANGO_V3_GROUP_NAME_OVERRIDE as Cluster) || "mainnet.1";

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
        new PublicKey("mdcXrm2NkzXYvHNcKXzCLXT58R4UN8Rzd1uzD4h8338"),
        0
      )
      .accounts({
        table: new PublicKey("tab2GSQhmstsCiPmPABk1F8QnffSaFEXnqbef7AkEnB"),
        payer: (mangoV3ReimbursementClient.program.provider as AnchorProvider)
          .wallet.publicKey,
        authority: (
          mangoV3ReimbursementClient.program.provider as AnchorProvider
        ).wallet.publicKey,
      })
      .rpc({ skipPreflight: true });
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
    const sig = await mangoV3ReimbursementClient.program.methods
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

  // Top up vaults
  groupIds?.tokens
    .filter(
      (token) =>
        token.symbol.includes("BTC") ||
        token.symbol.includes("ETH") ||
        token.symbol.includes("SOL") ||
        token.symbol.includes("USDC")
    )
    .forEach(async (token) => {
      const i = group?.account.mints.findIndex((mint) =>
        mint.equals(token.mintKey)
      );
      if (!i) {
        throw new Error("Token not found!");
      }
      const latestBlockhash = await connection.getLatestBlockhash();
      const tx = new Transaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
      tx.add(
        createTransferCheckedInstruction(
          await getAssociatedTokenAddress(
            group?.account.mints[i]!,
            admin.publicKey
          ),
          group?.account.mints[i]!,
          group?.account.vaults[i]!,
          admin.publicKey,
          100,
          token.decimals
        )
      );
      tx.recentBlockhash = await (
        await connection.getLatestBlockhash()
      ).blockhash;
      tx.sign(admin);
      let sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: true,
      });
      console.log(
        `topped up ${token.symbol} vault ${group?.account.vaults[
          i
        ]!}, sig https://explorer.solana.com/tx/${
          sig + (CLUSTER === "devnet" ? "?cluster=devnet" : "")
        }`
      );
    });

  // Reload group
  group = (await mangoV3ReimbursementClient.program.account.group.all()).find(
    (group) => group.account.groupNum === GROUP_NUM
  );

  // Set start reimbursement flag to true
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

  // Create reimbursement account if not already created
  const reimbursementAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("ReimbursementAccount"),
        group?.publicKey.toBuffer()!,
        admin.publicKey.toBuffer(),
      ],
      mangoV3ReimbursementClient.program.programId
    )
  )[0];
  if (!(await connection.getAccountInfo(reimbursementAccount))) {
    sig = await mangoV3ReimbursementClient.program.methods
      .createReimbursementAccount()
      .accounts({
        group: (group as any).publicKey,
        mangoAccountOwner: admin.publicKey,
        payer: (mangoV3ReimbursementClient.program.provider as AnchorProvider)
          .wallet.publicKey,
      })
      .rpc({ skipPreflight: true });
    console.log(
      `created reimbursement account for ${
        admin.publicKey
      }, sig https://explorer.solana.com/tx/${
        sig + (CLUSTER === "devnet" ? "?cluster=devnet" : "")
      }`
    );
  }

  // Table decoding example
  const rows = await mangoV3ReimbursementClient.decodeTable(group?.account);
  rows.find((row) => row.owner.equals(admin.publicKey)).balances;

  // Reimbursement decoding example
  const ra =
    await mangoV3ReimbursementClient.program.account.reimbursementAccount.fetch(
      reimbursementAccount
    );
  mangoV3ReimbursementClient.reimbursed(ra, 0);

  // Reimburse
  groupIds?.tokens
    .filter(
      (token) =>
        token.symbol.includes("BTC") ||
        token.symbol.includes("ETH") ||
        token.symbol.includes("SOL") ||
        token.symbol.includes("USDC")
    )
    .forEach(async (token) => {
      const i = group?.account.mints.findIndex((mint) =>
        mint.equals(token.mintKey)
      );
      if (!i) {
        throw new Error("Token not found!");
      }
      sig = await mangoV3ReimbursementClient.program.methods
        .reimburse(new BN(i), new BN(0), true)
        .accounts({
          group: (group as any).publicKey,
          vault: group?.account.vaults[i],
          tokenAccount: await getAssociatedTokenAddress(
            group?.account.mints[i]!,
            admin.publicKey
          ),
          reimbursementAccount,
          claimMint: group?.account.claimMints[i],
          claimMintTokenAccount: await getAssociatedTokenAddress(
            group?.account.claimMints[i]!,
            group?.account.claimTransferDestination!
          ),
          mangoAccountOwner: admin.publicKey,
          table: group?.account.table,
        })
        .rpc({ skipPreflight: true });
      console.log(
        `reimbursing ${admin.publicKey}, sig https://explorer.solana.com/tx/${
          sig + (CLUSTER === "devnet" ? "?cluster=devnet" : "")
        }`
      );
    });
}

main();
