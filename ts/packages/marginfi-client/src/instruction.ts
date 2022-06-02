import { BN, Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
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
    insuranceVault: PublicKey;
    insuranceVaultAuthority: PublicKey;
    feeVault: PublicKey;
    feeVaultAuthority: PublicKey;
  },
  args: {
    bankAuthorityPdaBump: number;
    insuranceVaultAuthorityPdaBump: number;
    feeVaultAuthorityPdaBump: number;
  }
) {
  return mfProgram.methods
    .initMarginGroup(
      args.bankAuthorityPdaBump,
      args.insuranceVaultAuthorityPdaBump,
      args.feeVaultAuthorityPdaBump
    )
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      admin: accounts.adminPk,
      collateralMint: accounts.mintPk,
      bankVault: accounts.bankVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      insuranceVault: accounts.insuranceVault,
      insuranceVaultAuthority: accounts.insuranceVaultAuthority,
      feeVault: accounts.feeVault,
      feeVaultAuthority: accounts.feeVaultAuthority,
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
  },
  remainingAccounts: AccountMeta[] = []
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
    .remainingAccounts(remainingAccounts)
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
  },
  remainingAccounts: AccountMeta[] = []
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
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeUpdateInterestAccumulatorIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    bankVault: PublicKey;
    bankAuthority: PublicKey;
    bankFeeVault: PublicKey;
  }
) {
  return mfProgram.methods
    .updateInterestAccumulator()
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      bankVault: accounts.bankVault,
      bankAuthority: accounts.bankAuthority,
      bankFeeVault: accounts.bankFeeVault,
      tokenProgram: TOKEN_PROGRAM_ID,
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
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .deactivateUtp(args.utpIndex)
    .accounts({
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeLiquidateIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccountPk: PublicKey;
    marginAccountLiquidateePk: PublicKey;
    marginGroupPk: PublicKey;
    bankVault: PublicKey;
    bankAuthority: PublicKey;
    bankInsuranceVault: PublicKey;
    signerPk: PublicKey;
  },
  args: {
    utpIndex: BN;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .liquidate(args.utpIndex)
    .accounts({
      marginAccount: accounts.marginAccountPk,
      marginAccountLiquidatee: accounts.marginAccountLiquidateePk,
      marginGroup: accounts.marginGroupPk,
      bankVault: accounts.bankVault,
      bankAuthority: accounts.bankAuthority,
      bankInsuranceVault: accounts.bankInsuranceVault,
      signer: accounts.signerPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeHandleBankruptcyIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccountPk: PublicKey;
    marginGroupPk: PublicKey;
    insuranceVaultPk: PublicKey;
    insuranceVaultAuthorityPk: PublicKey;
    liquidityVaultPk: PublicKey;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .handleBankruptcy()
    .accounts({
      marginAccount: accounts.marginAccountPk,
      marginGroup: accounts.marginGroupPk,
      insuranceVault: accounts.insuranceVaultPk,
      insuranceVaultAuthority: accounts.insuranceVaultAuthorityPk,
      liquidityVault: accounts.liquidityVaultPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}
