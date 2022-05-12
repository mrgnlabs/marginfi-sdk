import { BN, Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { MarginfiIdl } from '../../idl';
import { DriftClosePositionArgs, DriftOpenPositionArgs } from './types';

export async function makeActivateIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    driftAuthorityPk: PublicKey;
    driftProgramId: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftUserPositionsPk: PublicKey;
  },
  args: { authoritySeed: PublicKey; authorityBump: number }
) {
  return mfProgram.methods
    .utpDriftActivate(args.authoritySeed, args.authorityBump)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      driftAuthority: accounts.driftAuthorityPk,
      driftProgram: accounts.driftProgramId,
      driftState: accounts.driftStatePk,
      driftUser: accounts.driftUserPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      rent: SYSVAR_RENT_PUBKEY,
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
    marginCollateralVaultPk: PublicKey;
    bankAuthorityPk: PublicKey;
    proxyTokenAccountPk: PublicKey;
    driftAuthorityPk: PublicKey;
    driftProgramId: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftUserPositionsPk: PublicKey;
    driftCollateralVaultPk: PublicKey;
    driftMarketsPk: PublicKey;
    driftDepositHistoryPk: PublicKey;
    driftFundingPaymentHistoryPk: PublicKey;
  },
  args: { amount: BN }
) {
  return mfProgram.methods
    .utpDriftDeposit(args.amount)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      marginCollateralVault: accounts.marginCollateralVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      tempCollateralAccount: accounts.proxyTokenAccountPk,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      driftAuthority: accounts.driftAuthorityPk,
      driftProgram: accounts.driftProgramId,
      driftState: accounts.driftStatePk,
      driftUser: accounts.driftUserPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      driftCollateralVault: accounts.driftCollateralVaultPk,
      driftMarkets: accounts.driftMarketsPk,
      driftDepositHistory: accounts.driftDepositHistoryPk,
      driftFundingPaymentHistory: accounts.driftFundingPaymentHistoryPk,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function makeDepositCrankIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    marginCollateralVaultPk: PublicKey;
    bankAuthorityPk: PublicKey;
    proxyTokenAccountPk: PublicKey;
    driftAuthorityPk: PublicKey;
    driftProgramId: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftUserPositionsPk: PublicKey;
    driftCollateralVaultPk: PublicKey;
    driftMarketsPk: PublicKey;
    driftDepositHistoryPk: PublicKey;
    driftFundingPaymentHistoryPk: PublicKey;
  },
  args: { amount: BN }
) {
  return mfProgram.methods
    .utpDriftDepositCrank(args.amount)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      marginCollateralVault: accounts.marginCollateralVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      tempCollateralAccount: accounts.proxyTokenAccountPk,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      driftAuthority: accounts.driftAuthorityPk,
      driftProgram: accounts.driftProgramId,
      driftState: accounts.driftStatePk,
      driftUser: accounts.driftUserPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      driftCollateralVault: accounts.driftCollateralVaultPk,
      driftMarkets: accounts.driftMarketsPk,
      driftDepositHistory: accounts.driftDepositHistoryPk,
      driftFundingPaymentHistory: accounts.driftFundingPaymentHistoryPk,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function makeWithdrawIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    marginCollateralVaultPk: PublicKey;
    driftProgramId: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftUserPositionsPk: PublicKey;
    driftAuthorityPk: PublicKey;
    driftCollateralVaultPk: PublicKey;
    driftCollateralVaultAuthorityPk: PublicKey;
    driftInsuranceVaultPk: PublicKey;
    driftInsuranceVaultAuthorityPk: PublicKey;
    driftMarketsPk: PublicKey;
    driftDepositHistoryPk: PublicKey;
    driftFundingPaymentHistoryPk: PublicKey;
  },
  args: { amount: BN }
) {
  return mfProgram.methods
    .utpDriftWithdraw(args.amount)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      marginCollateralVault: accounts.marginCollateralVaultPk,
      driftProgram: accounts.driftProgramId,
      driftState: accounts.driftStatePk,
      driftUser: accounts.driftUserPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      driftAuthority: accounts.driftAuthorityPk,
      driftCollateralVault: accounts.driftCollateralVaultPk,
      driftCollateralVaultAuthority: accounts.driftCollateralVaultAuthorityPk,
      driftInsuranceVault: accounts.driftInsuranceVaultPk,
      driftInsuranceVaultAuthority: accounts.driftInsuranceVaultAuthorityPk,
      driftMarkets: accounts.driftMarketsPk,
      driftDepositHistory: accounts.driftDepositHistoryPk,
      driftFundingPaymentHistory: accounts.driftFundingPaymentHistoryPk,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemsProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function makeObserveIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccountPk: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftUserPositionsPk: PublicKey;
    driftMarketsPk: PublicKey;
  }
) {
  return await mfProgram.methods
    .utpDriftObserve()
    .accounts({
      marginAccount: accounts.marginAccountPk,
      driftUser: accounts.driftUserPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      driftMarkets: accounts.driftMarketsPk,
    })
    .instruction();
}

export async function makeOpenPositionIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    driftProgramId: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftAuthorityPk: PublicKey;
    driftMarketsPk: PublicKey;
    driftUserPositionsPk: PublicKey;
    driftTradeHistoryPk: PublicKey;
    driftFundingPaymentHistoryPk: PublicKey;
    driftFundingRateHistoryPk: PublicKey;
    driftOraclePk: PublicKey;
  },
  args: {
    args: DriftOpenPositionArgs;
  }
) {
  return mfProgram.methods
    .utpDriftUseOpenPosition(args.args as any)
    .accounts({
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      driftProgram: accounts.driftProgramId,
      driftState: accounts.driftStatePk,
      driftUser: accounts.driftUserPk,
      driftAuthority: accounts.driftAuthorityPk,
      driftMarkets: accounts.driftMarketsPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      driftTradeHistory: accounts.driftTradeHistoryPk,
      driftFundingPaymentHistory: accounts.driftFundingPaymentHistoryPk,
      driftFundingRateHistory: accounts.driftFundingRateHistoryPk,
      driftOracle: accounts.driftOraclePk,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
}

export async function makeClosePositionIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    authorityPk: PublicKey;
    driftProgramId: PublicKey;
    driftStatePk: PublicKey;
    driftUserPk: PublicKey;
    driftAuthorityPk: PublicKey;
    driftMarketsPk: PublicKey;
    driftUserPositionsPk: PublicKey;
    driftTradeHistoryPk: PublicKey;
    driftFundingPaymentHistoryPk: PublicKey;
    driftFundingRateHistoryPk: PublicKey;
    driftOraclePk: PublicKey;
  },
  args: {
    args: DriftClosePositionArgs;
  }
) {
  return mfProgram.methods
    .utpDriftUseClosePosition(args.args as any)
    .accounts({
      marginAccount: accounts.marginAccountPk,
      authority: accounts.authorityPk,
      driftProgram: accounts.driftProgramId,
      driftState: accounts.driftStatePk,
      driftUser: accounts.driftUserPk,
      driftAuthority: accounts.driftAuthorityPk,
      driftMarkets: accounts.driftMarketsPk,
      driftUserPositions: accounts.driftUserPositionsPk,
      driftTradeHistory: accounts.driftTradeHistoryPk,
      driftFundingPaymentHistory: accounts.driftFundingPaymentHistoryPk,
      driftFundingRateHistory: accounts.driftFundingRateHistoryPk,
      driftOracle: accounts.driftOraclePk,
      instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
}
