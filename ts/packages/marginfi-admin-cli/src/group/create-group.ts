import {
  BankVaultType,
  getBankAuthority,
  getMfiProgram,
  loadKeypair,
  processTransaction,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { makeInitMarginGroupIx } from "@mrgnlabs/marginfi-client/src/instruction";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Command } from "commander";

const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  new Wallet(loadKeypair(process.env.WALLET!))
);

const wallet = program.provider.wallet;
const connection = program.provider.connection;

export async function createGroup(_string: string, command: Command) {
  const options = command.opts();
  const mintPk = new PublicKey(options.collateral);

  const mfiGroupKey = Keypair.generate();

  const [bankVaultAuthority, bankAuthorityPdaBump] = await getBankAuthority(mfiGroupKey.publicKey, program.programId);

  const createMarginGroupAccountIx = await program.account.marginGroup.createInstruction(mfiGroupKey);

  const [bankVaultKey, bankVaultInstructions] = await createVaultAccountInstructions(mintPk, bankVaultAuthority);

  const [insuranceVaultAuthority, insuranceVaultAuthorityPdaBump] = await getBankAuthority(
    mfiGroupKey.publicKey,
    program.programId,
    BankVaultType.InsuranceVault
  );

  const [insuranceVaultKey, insuranceVaultInstructions] = await createVaultAccountInstructions(
    mintPk,
    insuranceVaultAuthority
  );

  const [feeVaultAuthority, feeVaultAuthorityPdaBump] = await getBankAuthority(
    mfiGroupKey.publicKey,
    program.programId,
    BankVaultType.FeeVault
  );

  const [feeVaultKey, feeVaultInstructions] = await createVaultAccountInstructions(mintPk, feeVaultAuthority);

  const createMarginGroupIx = await makeInitMarginGroupIx(
    program,
    {
      marginfiGroupPk: mfiGroupKey.publicKey,
      adminPk: wallet.publicKey,
      mintPk,
      bankVaultPk: bankVaultKey.publicKey,
      bankAuthorityPk: bankVaultAuthority,
      insuranceVault: insuranceVaultKey.publicKey,
      insuranceVaultAuthority,
      feeVault: feeVaultKey.publicKey,
      feeVaultAuthority,
    },
    {
      bankAuthorityPdaBump,
      insuranceVaultAuthorityPdaBump,
      feeVaultAuthorityPdaBump,
    }
  );

  const ixs = [
    createMarginGroupAccountIx,
    ...bankVaultInstructions,
    ...insuranceVaultInstructions,
    ...feeVaultInstructions,
    createMarginGroupIx,
  ];

  const tx = new Transaction().add(...ixs);
  const sig = await processTransaction(program.provider, tx, [
    mfiGroupKey,
    bankVaultKey,
    insuranceVaultKey,
    feeVaultKey,
  ]);

  console.log("Margin group %s", mfiGroupKey.publicKey);
  console.log(`Transaction signature ${sig}`);
}

async function createVaultAccountInstructions(
  mintPk: PublicKey,
  owner: PublicKey
): Promise<[Keypair, TransactionInstruction[]]> {
  const vaultKeypair = Keypair.generate();
  const createVaultAccount = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    newAccountPubkey: vaultKeypair.publicKey,
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
  });
  const initVaultTokenAccount = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    mintPk,
    vaultKeypair.publicKey,
    owner
  );

  return [vaultKeypair, [createVaultAccount, initVaultTokenAccount]];
}
