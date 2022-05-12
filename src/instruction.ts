import { BN, Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import { MarginfiIdl } from './idl';
import { GroupConfig } from './types';

export async function makeInitMarginGroupIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    adminPk: PublicKey;
    mintPk: PublicKey;
    bankVaultPk: PublicKey;
    bankAuthorityPk: PublicKey;
  },
  args: { bankAuthorityPdaBump: number }
) {
  return mfProgram.methods
    .initMarginGroup(args.bankAuthorityPdaBump)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      admin: accounts.adminPk,
      collateralMint: accounts.mintPk,
      bankVault: accounts.bankVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      clock: SYSVAR_CLOCK_PUBKEY,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function makeConfigureMarginGroupIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    adminPk: PublicKey;
  },
  args: {
    args: GroupConfig;
  }
) {
  return mfProgram.methods
    .configureMarginGroup({
      admin: args.args.admin || null,
      bank: {
        scalingFactorC: args.args.bank?.scalingFactorC || null,
        fixedFee: args.args.bank?.fixedFee || null,
        interestFee: args.args.bank?.interestFee || null,
        maintMarginRatio: args.args.bank?.maintMarginRatio || null,
        initMarginRatio: args.args.bank?.initMarginRatio || null,
        accountDepositLimit: args.args.bank?.accountDepositLimit || null,
      } as never,
      paused: args.args.paused || null,
    })
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      admin: accounts.adminPk,
    })
    .instruction();
}

export async function makeInitMarginAccountIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
  }
) {
  return mfProgram.methods
    .initMarginAccount()
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function makeDepositIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    userTokenAtaPk: PublicKey;
    bankVaultPk: PublicKey;
  },
  args: {
    amount: BN;
  }
) {
  return mfProgram.methods
    .marginDepositCollateral(args.amount)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      signer: accounts.authorityPk,
      fundingAccount: accounts.userTokenAtaPk,
      tokenVault: accounts.bankVaultPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}

export async function makeWithdrawIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    bankVaultPk: PublicKey;
    bankVaultAuthorityPk: PublicKey;
    receivingTokenAccount: PublicKey;
  },
  args: {
    amount: BN;
  }
) {
  return mfProgram.methods
    .marginWithdrawCollateral(args.amount)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      signer: accounts.authorityPk,
      marginCollateralVault: accounts.bankVaultPk,
      marginBankAuthority: accounts.bankVaultAuthorityPk,
      receivingTokenAccount: accounts.receivingTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
}

export async function makeUpdateInterestAccumulatorIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
  }
) {
  return mfProgram.methods
    .updateInterestAccumulator()
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      clock: SYSVAR_CLOCK_PUBKEY,
    })
    .instruction();
}

export async function makeVerifyMarginRequirementsIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
  }
) {
  return mfProgram.methods
    .verifyMarginRequirements()
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
    })
    .instruction();
}

export async function makeDeactivateUtpIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
  },
  args: {
    utpIndex: BN;
  }
) {
  return mfProgram.methods
    .deactivateUtp(args.utpIndex)
    .accounts({
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
}
