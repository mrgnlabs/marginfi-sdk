import { BN, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { MarginfiIdl } from "../../idl";
import { DriftClosePositionArgs, DriftOpenPositionArgs } from "./types";

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
  args: {
    authoritySeed: PublicKey;
    authorityBump: number;
  }
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
    signerPk: PublicKey;
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
  args: { amount: BN },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpDriftDeposit(args.amount)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
      marginAccount: accounts.marginAccountPk,
      signer: accounts.signerPk,
      marginCollateralVault: accounts.marginCollateralVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      tempCollateralAccount: accounts.proxyTokenAccountPk,
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
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeWithdrawIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginAccountPk: PublicKey;
    signerPk: PublicKey;
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
      signer: accounts.signerPk,
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

export async function makeOpenPositionIx(
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
    args: DriftOpenPositionArgs;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpDriftUseOpenPosition(args.args as any)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
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
    })
    .remainingAccounts(remainingAccounts)
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
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpDriftUseClosePosition(args.args as any)
    .accounts({
      marginGroup: accounts.marginfiGroupPk,
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
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}
