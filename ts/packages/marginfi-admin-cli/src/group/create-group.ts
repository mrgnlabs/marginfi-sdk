import {
  BankVaultType,
  getBankAuthority,
  instruction,
  loadKeypair,
  MARGINFI_IDL,
  processTransaction,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { Program, Provider } from "@project-serum/anchor";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Command } from "commander";

export async function createGroup(_string: string, command: Command) {
  const connection = new Connection(process.env.RPC_ENDPOINT!);
  const programId = new PublicKey(process.env.MARGINFI_PROGRAM!);
  const groupPk = process.env.MARGINFI_GROUP ? new PublicKey(process.env.MARGINFI_GROUP) : PublicKey.default;
  const wallet = new Wallet(loadKeypair(process.env.WALLET!));
  const program = new Program(MARGINFI_IDL, programId, new Provider(connection, wallet, {}));

  console.log("Loading from env vars");
  console.log("Program: %s\nGroup: %s\nSigner: %s", programId, groupPk, wallet.publicKey);

  const options = command.opts();
  const mintPk = new PublicKey(options.collateral);

  const mfiGroupKey = Keypair.generate();

  const [bankVaultAuthority, bankAuthorityPdaBump] = await getBankAuthority(mfiGroupKey.publicKey, program.programId);

  const createMarginfiGroupAccountIx = await program.account.marginfiGroup.createInstruction(mfiGroupKey);

  const [bankVaultKey, bankVaultInstructions] = await createVaultAccountInstructions(
    mintPk,
    bankVaultAuthority,
    wallet.publicKey,
    connection
  );

  const [insuranceVaultAuthority, insuranceVaultAuthorityPdaBump] = await getBankAuthority(
    mfiGroupKey.publicKey,
    program.programId,
    BankVaultType.InsuranceVault
  );

  const [insuranceVaultKey, insuranceVaultInstructions] = await createVaultAccountInstructions(
    mintPk,
    insuranceVaultAuthority,
    wallet.publicKey,
    connection
  );

  const [feeVaultAuthority, feeVaultAuthorityPdaBump] = await getBankAuthority(
    mfiGroupKey.publicKey,
    program.programId,
    BankVaultType.FeeVault
  );

  const [feeVaultKey, feeVaultInstructions] = await createVaultAccountInstructions(
    mintPk,
    feeVaultAuthority,
    wallet.publicKey,
    connection
  );

  const createMarginfiGroupIx = await instruction.makeInitMarginfiGroupIx(
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
    createMarginfiGroupAccountIx,
    ...bankVaultInstructions,
    ...insuranceVaultInstructions,
    ...feeVaultInstructions,
    createMarginfiGroupIx,
  ];

  const tx = new Transaction().add(...ixs);
  const sig = await processTransaction(program.provider, tx, [
    mfiGroupKey,
    bankVaultKey,
    insuranceVaultKey,
    feeVaultKey,
  ]);

  console.log("Marginfi group %s", mfiGroupKey.publicKey);
  console.log(`Transaction signature ${sig}`);
}

async function createVaultAccountInstructions(
  mintPk: PublicKey,
  owner: PublicKey,
  payerPk: PublicKey,
  connection: Connection
): Promise<[Keypair, TransactionInstruction[]]> {
  const vaultKeypair = Keypair.generate();
  const createVaultAccount = SystemProgram.createAccount({
    fromPubkey: payerPk,
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
