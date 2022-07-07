import { BN, BorshAccountsCoder, Program, Provider } from "@project-serum/anchor";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Environment, getConfig, MarginfiClient, Wallet } from "..";
import {
  COLLATERAL_DECIMALS,
  INSURANCE_VAULT_LIQUIDATION_FEE,
  LIQUIDATOR_LIQUIDATION_FEE,
  PDA_BANK_FEE_VAULT_SEED,
  PDA_BANK_INSURANCE_VAULT_SEED,
  PDA_BANK_VAULT_SEED,
  PDA_UTP_AUTH_SEED,
  VERY_VERBOSE_ERROR,
} from "../constants";
import { MarginfiIdl, MARGINFI_IDL } from "../idl";
import { NodeWallet } from "../nodeWallet";
import { AccountType, LiquidationPrices, DecimalData } from "../types";
import { Decimal } from "./decimal";

/**
 * Marginfi bank vault type
 */
export enum BankVaultType {
  LiquidityVault,
  InsuranceVault,
  FeeVault,
}

function getVaultSeeds(type: BankVaultType): Buffer {
  switch (type) {
    case BankVaultType.LiquidityVault:
      return PDA_BANK_VAULT_SEED;
    case BankVaultType.InsuranceVault:
      return PDA_BANK_INSURANCE_VAULT_SEED;
    case BankVaultType.FeeVault:
      return PDA_BANK_FEE_VAULT_SEED;
    default:
      throw Error(VERY_VERBOSE_ERROR);
  }
}

/**
 * Compute bank authority PDA for a specific marginfi group
 */
export async function getBankAuthority(
  marginfiGroupPk: PublicKey,
  programId: PublicKey,
  bankVaultType: BankVaultType = BankVaultType.LiquidityVault
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress([getVaultSeeds(bankVaultType), marginfiGroupPk.toBytes()], programId);
}

/**
 * Compute UTP account authority PDA
 */
export async function getUtpAuthority(
  utpProgramId: PublicKey,
  authoritySeed: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [PDA_UTP_AUTH_SEED, utpProgramId.toBuffer(), authoritySeed.toBuffer()],
    programId
  );
}

/**
 * Transaction processing and error-handling helper.
 */
export async function processTransaction(
  provider: Provider,
  tx: Transaction,
  signers?: Array<Signer>,
  opts?: ConfirmOptions
): Promise<TransactionSignature> {
  const blockhash = await provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash.blockhash;
  tx.feePayer = provider.wallet.publicKey;
  tx = await provider.wallet.signTransaction(tx);

  if (signers === undefined) {
    signers = [];
  }
  signers
    .filter((s) => s !== undefined)
    .forEach((kp) => {
      tx.partialSign(kp);
    });

  try {
    return await sendAndConfirmRawTransaction(
      provider.connection,
      tx.serialize(),
      opts || {
        skipPreflight: false,
        preflightCommitment: provider.connection.commitment,
        commitment: provider.connection.commitment,
      }
    );
  } catch (e: any) {
    console.log(e);
    throw e;
  }
}

/**
 * Converts a token amount stored as `Decimal` into its native value as `BN`, given the specified mint decimal amount (default to 6 for USDC).
 */
export function decimalToNative(amount: Decimal, decimals: number = COLLATERAL_DECIMALS): BN {
  return new BN(Math.round((amount.toBN().toString() as any) / 10 ** (amount.scale - decimals)));
}

/**
 * Converts a token amount stored as `MDecimal` into its native value as `BN`, given the specified mint decimal amount (default to 6 for USDC).
 */
export function decimalDataToNative(amount: DecimalData, decimals: number = COLLATERAL_DECIMALS): BN {
  return decimalToNative(Decimal.fromAccountData(amount), decimals);
}

/**
 * Converts a token amount stored as `MDecimal` into its native value as `BN`, given the specified mint decimal amount (default to 6 for USDC).
 */
export function decimalDataToBigNumber(amount: DecimalData): BigNumber {
  return new BigNumber(Decimal.fromAccountData(amount).toString());
}

/**
 * Converts a ui representation of a token amount into its native value as `BN`, given the specified mint decimal amount (default to 6 for USDC).
 */
export function uiToNative(amount: BigNumber | number | string, decimals: number = COLLATERAL_DECIMALS): BN {
  let amt: BigNumber;
  if (typeof amount === 'number' || typeof amount === 'string') {
    amt = new BigNumber(amount)
  } else {
    amt = amount
  }
  return new BN(amt.times(decimals).toFixed(0, BigNumber.ROUND_FLOOR));
}

/**
 * Boolean check that the provided data buffer contains a specific account type (using Anchor discriminant).
 * @internal
 */
export function isAccountType(data: Buffer, type: AccountType): boolean {
  return BorshAccountsCoder.accountDiscriminator(type).equals(data.slice(0, 8));
}

/**
 * Calculates liquidation parameters given an account value.
 * @internal
 */
export function calculateLiquidationPrices(accountValue: BigNumber): LiquidationPrices {
  let liquidatorFee = accountValue.times(LIQUIDATOR_LIQUIDATION_FEE);
  let insuranceVaultFee = accountValue.times(INSURANCE_VAULT_LIQUIDATION_FEE);

  let discountedLiquidatorPrice = accountValue.minus(liquidatorFee);
  let finalPrice = discountedLiquidatorPrice.minus(insuranceVaultFee);

  return {
    finalPrice,
    discountedLiquidatorPrice,
    insuranceVaultFee
  }
}

/**
 * Returns true if being run inside a web browser,
 * false if in a Node process or electron app.
 * @internal
 */
export const IS_BROWSER =
  process.env.BROWSER ||
  // @ts-ignore
  (typeof window !== "undefined" && !window.process?.hasOwnProperty("type"));

/**
 * @internal
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Load Keypair from the provided file.
 */
export function loadKeypair(keypairPath: string): Keypair {
  const path = require('path')
  if (!keypairPath || keypairPath == "") {
    throw new Error("Keypair is required!");
  }
  if (keypairPath[0] === "~") {
    keypairPath = path.join(require("os").homedir(), keypairPath.slice(1));
  }
  const keyPath = path.normalize(keypairPath);
  const loaded = Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync(keyPath).toString())));
  return loaded;
}

/**
 * Returns the marginfi program.
 * @param programAddress
 * @param connection
 * @param wallet
 * @returns
 */
export function getMfiProgram(programAddress: PublicKey, connection: Connection, wallet: Wallet): Program<MarginfiIdl> {
  const provider = new Provider(connection, wallet, {});
  const program: Program<MarginfiIdl> = new Program(MARGINFI_IDL, programAddress, provider) as any;

  return program;
}

/**
 * @internal
 */
export async function createTempTransferAccounts(
  provider: Provider,
  mint: PublicKey,
  authority: PublicKey
): Promise<[Keypair, TransactionInstruction, TransactionInstruction]> {
  const key = Keypair.generate();
  const createTokenAccountIx = SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    lamports: await provider.connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    newAccountPubkey: key.publicKey,
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
  });
  const initTokenAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, key.publicKey, authority);

  return [key, createTokenAccountIx, initTokenAccountIx];
}

/**
 * @internal
 */
export function getEnvFromStr(envString: string = "devnet"): Environment {
  switch (envString.toUpperCase()) {
    case "MAINNET":
      return Environment.MAINNET;
    case "MAINNET-BETA":
      return Environment.MAINNET;
    default:
      return Environment.DEVNET;
  }
}

export async function getClientFromEnv(
  overrides?: Partial<{
    env: Environment;
    connection: Connection;
    program_id: PublicKey;
    marginfi_group: PublicKey;
    wallet: Wallet;
  }>
): Promise<MarginfiClient> {
  const debug = require("debug")("mfi:utils");
  const env = overrides?.env ?? getEnvFromStr(process.env.ENV!);
  const connection = overrides?.connection ?? new Connection(process.env.RPC_ENDPOINT!, { commitment: "confirmed" });
  const programId = overrides?.program_id ?? new PublicKey(process.env.MARGINFI_PROGRAM!);
  const groupPk =
    overrides?.marginfi_group ??
    (process.env.MARGINFI_GROUP ? new PublicKey(process.env.MARGINFI_GROUP) : PublicKey.default);
  const wallet =
    overrides?.wallet ??
    new NodeWallet(
      process.env.WALLET_KEY
        ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.WALLET_KEY)))
        : loadKeypair(process.env.WALLET!)
    );

  debug("Loading the marginfi client from env vars");
  debug("Env: %s\nProgram: %s\nGroup: %s\nSigner: %s", env, programId, groupPk, wallet.publicKey);

  const config = await getConfig(env, connection, {
    groupPk,
    programId,
  });

  return MarginfiClient.get(config, wallet, connection, { commitment: connection.commitment });
}
