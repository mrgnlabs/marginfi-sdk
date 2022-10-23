require("dotenv").config();

import { Connection, PublicKey } from "@solana/web3.js";

import { QUOTE_INDEX } from "@blockworks-foundation/mango-client";
import {
  Environment,
  getConfig,
  loadKeypair,
  MarginfiAccount,
  MarginfiClient,
  UTPAccountConfig,
} from "@mrgnlabs/marginfi-client";
import { NodeWallet } from "@mrgnlabs/marginfi-client/dist/nodeWallet";
import { associatedAddress } from "@project-serum/anchor/dist/cjs/utils/token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { RENT_PROGRAM_ID, SYSTEM_PROGRAM_ID } from "@zero_one/client";
import { BN } from "bn.js";
import { ID, MangoV3ReimbursementClient } from "../../mango-v3-reimbursement/dist";

const connection = new Connection(process.env.RPC_ENDPOINT!, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 120_000,
});
const wallet = new NodeWallet(loadKeypair(process.env.WALLET!));
// const MARGIN_ACCOUNT_PK = new PublicKey("81azzBQ2X17CXUzCGgQHVUGajwTCEvyMsfaiZmzxsYqy");

async function reimburse(client: MarginfiClient, mfiAccountAddress: PublicKey) {
  const config = client.config;
  const mfiAccount = await client.getMarginfiAccount(mfiAccountAddress);
  const mangoV3ReimbursementClient = new MangoV3ReimbursementClient(client.provider);

  console.log("Loaded marginfi account: %s", mfiAccount.publicKey);

  const GROUP = 1;

  const groups = await mangoV3ReimbursementClient.program.account.group.all();

  console.log("Found %s groups", groups.length);

  const group = groups.find((group) => group.account.groupNum === GROUP);

  console.log("Loaded group: %s", group?.publicKey.toString());

  const [mangoAccountOwner, _mangoAccountOwnerBump] = await mfiAccount.mango.authority();

  console.log("mango account owner: %s", mangoAccountOwner.toString());

  const [reimbursementAccount, _reimbursementAccountBump] = await PublicKey.findProgramAddress(
    [Buffer.from("ReimbursementAccount"), group?.publicKey.toBuffer()!, mangoAccountOwner.toBuffer()],
    mangoV3ReimbursementClient.program.programId
  );

  const vault = group?.account.vaults[QUOTE_INDEX];

  const table = await mangoV3ReimbursementClient.decodeTable(group?.account);
  const tableIndex = table.findIndex((row) => row.owner.equals(mangoAccountOwner));

  if (tableIndex === -1) {
    console.log("No table entry found for mango account owner %s", mangoAccountOwner);
    return;
  }

  console.log("tableIndex: %s", tableIndex);

  const [tokenAccount, _tokenAccountBump] = await PublicKey.findProgramAddress(
    [Buffer.from("mrta"), mfiAccount.publicKey.toBuffer()],
    config.programId
  );

  let bU64 = Buffer.alloc(8);
  bU64.writeBigUInt64LE(BigInt(QUOTE_INDEX));
  const claimMint = (
    await PublicKey.findProgramAddress(
      [Buffer.from("Mint"), group?.publicKey.toBuffer()!, bU64],
      mangoV3ReimbursementClient.program.programId
    )
  )[0];
  const claimTransferTokenAccount = await associatedAddress({
    mint: claimMint,
    owner: group!.account.claimTransferDestination,
  });

  const sig = await client.program.methods
    .reimburse(new BN(tableIndex))
    .accounts(
      logAccounts({
        marginfiGroup: config.groupPk,
        marginfiAccount: mfiAccount.publicKey,
        admin: wallet.publicKey,
        collateralMint: client.group.bank.mint,
        liquidityVault: client.group.bank.vault,
        mangoReimbursementProgram: ID,
        group: group!.publicKey,
        reimbursementAccount,
        mangoAccountOwner,
        vault,
        tokenAccount,
        claimMintTokenAccount: claimTransferTokenAccount,
        claimMint,
        table: new PublicKey("45F9oyj2Jr5pfz1bLoupLGujXkamZEy3RXeKBZudKmJw"),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
        rent: RENT_PROGRAM_ID,
      })
    )
    .rpc({ skipPreflight: true });

  console.log("Reimbursement tx: %s", sig);
}

(async () => {
  const config = await getConfig(Environment.MAINNET);
  // Setup the client
  const client = await MarginfiClient.fetch(config, wallet, connection);
  // Prepare user accounts

  const countMap: { [key: string]: number } = {};

  const marginfiAccountsWithMango = await Promise.all(
    (
      await client.program.account.marginfiAccount.all()
    )
      .filter((account) => {
        return account.account.activeUtps[client.config.mango.utpIndex];
      })
      .map(async (account) => {
        // @ts-ignore
        const mfiAccount = MarginfiAccount.fromAccountData(account.publicKey, client, account.account, client.group);

        console.log(
          "Marginfi account: %s, mango owner: %s, utp seed: %s, bump %s",
          account.publicKey.toString(),
          (await mfiAccount.mango.authority())[0],
          // @ts-ignore
          (account.account.utpAccountConfig[client.config.mango.utpIndex] as UTPAccountConfig).authoritySeed,
          // @ts-ignore
          (account.account.utpAccountConfig[client.config.mango.utpIndex] as UTPAccountConfig).authorityBump
        );

        return mfiAccount;
      })
  );

  console.log("Found %s marginfi accounts with mango", marginfiAccountsWithMango.length);

  for (let account of marginfiAccountsWithMango) {
    const [auth, _] = await account.mango.authority();
    const pkString = auth.toString();
    if (countMap[pkString] === undefined) {
      countMap[pkString] = 0;
    }

    countMap[pkString] += 1;
  }

  console.log(countMap);
  // Check no key is larger than 1
  let allOwnersUnique = true;
  for (const [key, value] of Object.entries(countMap)) {
    if (value > 1) {
      console.warn("WARN: %s is share by %s marginfi accounts", key, value);
      allOwnersUnique = false;
    }
  }

  if (!allOwnersUnique) {
    console.error("ERROR: Some mango accounts owners are shared by multiple marginfi accounts");
  }

  // const mfiAccountAddress = new PublicKey("EzgAAcUZ4oL42PcHeUsPBidWjRSv6hDmqGSedCo1HEfE");
  // await reimburse(client, mfiAccountAddress);

  for (let account of marginfiAccountsWithMango) {
    await reimburse(client, account.publicKey);
  }
})();

function logAccounts<T>(accounts: T): T {
  console.log("Accounts: %s", JSON.stringify(accounts, null, 2));
  return accounts;
}
