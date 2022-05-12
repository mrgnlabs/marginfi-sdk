import { WasmDecimal } from '@mrgnlabs/utp-utils';
import {
  BN,
  BorshAccountsCoder,
  Program,
  Provider,
} from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Signer,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import {
  COLLATERAL_DECIMALS,
  PDA_BANK_VAULT_SEED,
  PDA_UTP_AUTH_SEED,
} from '../constants';
import { AccountType, MDecimalRaw } from '../types';
import { MARGINFI_IDL, MarginfiIdl } from '../idl';
import { Decimal } from './decimal';
import path from 'path';
import * as fs from 'fs';
import { Wallet } from '..';

/**
 * Compute bank authority PDA for a specific marginfi group
 */
export async function getBankAuthority(
  marginfiGroupPk: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [PDA_BANK_VAULT_SEED, marginfiGroupPk.toBytes()],
    programId
  );
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
 * Compute Zeta's open order account PDA tied to the specified user.
 * Workaround the utils function from Zeta which makes use of a loaded Exchange.
 */
export async function getZetaOpenOrders(
  programId: PublicKey,
  market: PublicKey,
  userKey: PublicKey,
  dexPid: PublicKey
) {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(utf8.encode('open-orders')),
      dexPid.toBuffer(),
      market.toBuffer(),
      userKey.toBuffer(),
    ],
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
  const blockhash = await provider.connection.getRecentBlockhash();
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
export function decimalToNative(
  amount: Decimal,
  decimals: number = COLLATERAL_DECIMALS
): BN {
  return new BN(
    Math.round(
      (amount.toBN().toString() as any) / 10 ** (amount.scale - decimals)
    )
  );
}

/**
 * Converts a token amount stored as `MDecimal` into its native value as `BN`, given the specified mint decimal amount (default to 6 for USDC).
 */
export function mDecimalToNative(
  amount: MDecimalRaw,
  decimals: number = COLLATERAL_DECIMALS
): BN {
  return decimalToNative(Decimal.fromMDecimal(amount), decimals);
}

/**
 * Converts a token amount stored as `WasmDecimal` into its native value as `BN`, given the specified mint decimal amount (default to 6 for USDC).
 */
export function wasmDecimalToNative(
  amount: WasmDecimal,
  decimals: number = COLLATERAL_DECIMALS
): BN {
  return decimalToNative(Decimal.fromWasm(amount), decimals);
}

/**
 * Boolean check that the provided data buffer contains a specific account type (using Anchor discriminant).
 */
export function isAccountType(data: Buffer, type: AccountType): boolean {
  return BorshAccountsCoder.accountDiscriminator(type).equals(data.slice(0, 8));
}

/**
 * Returns true if being run inside a web browser,
 * false if in a Node process or electron app.
 */
export const IS_BROWSER =
  process.env.BROWSER ||
  // @ts-ignore
  (typeof window !== 'undefined' && !window.process?.hasOwnProperty('type'));

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Load Keypair from the provided file.
 */
export function loadKeypair(keypairPath: string): Keypair {
  if (!keypairPath || keypairPath == '') {
    throw new Error('Keypair is required!');
  }
  const keyPath = path.normalize(keypairPath);
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keyPath).toString()))
  );
  return loaded;
}

export function getMfiProgram(
  programAddress: PublicKey,
  connection: Connection,
  wallet: Wallet
): Program<MarginfiIdl> {
  const provider = new Provider(connection, wallet, {});
  const program: Program<MarginfiIdl> = new Program(
    MARGINFI_IDL,
    programAddress,
    provider
  ) as any;

  return program;
}
