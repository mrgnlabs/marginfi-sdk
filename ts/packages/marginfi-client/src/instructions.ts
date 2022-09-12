import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { GroupConfig, MarginfiAccountType, MarginfiProgram, toProgramMarginAccountType, UtpIndex } from "./types";

async function makeInitMarginfiGroupIx(
  mfProgram: MarginfiProgram,
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
    .initMarginfiGroup(args.bankAuthorityPdaBump, args.insuranceVaultAuthorityPdaBump, args.feeVaultAuthorityPdaBump)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
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

async function makeConfigureMarginfiGroupIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    adminPk: PublicKey;
  },
  args: {
    args: GroupConfig;
  }
) {
  return mfProgram.methods
    .configureMarginfiGroup({
      admin: args.args.admin || null,
      bank: {
        scalingFactorC: args.args.bank?.scalingFactorC || null,
        fixedFee: args.args.bank?.fixedFee || null,
        interestFee: args.args.bank?.interestFee || null,
        maintMarginRatio: args.args.bank?.maintMarginRatio || null,
        initMarginRatio: args.args.bank?.initMarginRatio || null,
        accountDepositLimit: args.args.bank?.accountDepositLimit || null,
        lpDepositLimit: args.args.bank?.lpDepositLimit || null,
      } as never,
      paused: args.args.paused !== undefined ? args.args.paused : null,
    })
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      admin: accounts.adminPk,
    })
    .instruction();
}

async function makeInitMarginfiAccountIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
  }
) {
  return mfProgram.methods
    .initMarginfiAccount()
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      authority: accounts.authorityPk,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function makeInitMarginfiAccountWithTypeIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
  },
  args: {
    accountType: MarginfiAccountType;
  }
) {
  return mfProgram.methods
    .initMarginfiAccountWithType(toProgramMarginAccountType(args.accountType))
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      authority: accounts.authorityPk,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function makeDepositIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
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
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      fundingAccount: accounts.userTokenAtaPk,
      tokenVault: accounts.bankVaultPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeWithdrawIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
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
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      marginCollateralVault: accounts.bankVaultPk,
      marginBankAuthority: accounts.bankVaultAuthorityPk,
      receivingTokenAccount: accounts.receivingTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeUpdateInterestAccumulatorIx(
  mfProgram: MarginfiProgram,
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
      marginfiGroup: accounts.marginfiGroupPk,
      bankVault: accounts.bankVault,
      bankAuthority: accounts.bankAuthority,
      bankFeeVault: accounts.bankFeeVault,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}

async function makeDeactivateUtpIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
  },
  args: {
    utpIndex: UtpIndex;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .deactivateUtp(new BN(args.utpIndex))
    .accounts({
      marginfiAccount: accounts.marginfiAccountPk,
      authority: accounts.authorityPk,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeLiquidateIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiAccountPk: PublicKey;
    marginfiAccountLiquidateePk: PublicKey;
    marginfiGroupPk: PublicKey;
    bankVault: PublicKey;
    bankAuthority: PublicKey;
    bankInsuranceVault: PublicKey;
    signerPk: PublicKey;
  },
  args: {
    utpIndex: UtpIndex;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .liquidate(new BN(args.utpIndex))
    .accounts({
      marginfiAccount: accounts.marginfiAccountPk,
      marginfiAccountLiquidatee: accounts.marginfiAccountLiquidateePk,
      marginfiGroup: accounts.marginfiGroupPk,
      bankVault: accounts.bankVault,
      bankAuthority: accounts.bankAuthority,
      bankInsuranceVault: accounts.bankInsuranceVault,
      signer: accounts.signerPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeHandleBankruptcyIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiAccountPk: PublicKey;
    marginfiGroupPk: PublicKey;
    insuranceVaultPk: PublicKey;
    insuranceVaultAuthorityPk: PublicKey;
    liquidityVaultPk: PublicKey;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .handleBankruptcy()
    .accounts({
      marginfiAccount: accounts.marginfiAccountPk,
      marginfiGroup: accounts.marginfiGroupPk,
      insuranceVault: accounts.insuranceVaultPk,
      insuranceVaultAuthority: accounts.insuranceVaultAuthorityPk,
      liquidityVault: accounts.liquidityVaultPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export default {
  makeInitMarginfiGroupIx,
  makeConfigureMarginfiGroupIx,
  makeDeactivateUtpIx,
  makeDepositIx,
  makeHandleBankruptcyIx,
  makeInitMarginfiAccountIx,
  makeInitMarginfiAccountWithTypeIx,
  makeWithdrawIx,
  makeUpdateInterestAccumulatorIx,
  makeLiquidateIx,
};
