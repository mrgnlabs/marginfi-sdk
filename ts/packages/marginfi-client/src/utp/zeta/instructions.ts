import { BN } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { types as zetaTypes } from "@zetamarkets/sdk";
import { MarginfiProgram } from "../../types";

async function makeActivateIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
    zetaAccountPk: PublicKey;
    zetaAuthorityPk: PublicKey;
    zetaGroupPk: PublicKey;
    zetaProgramId: PublicKey;
  },
  args: { authoritySeed: PublicKey; authorityBump: number }
) {
  return mfProgram.methods
    .utpZetaActivate(args.authoritySeed, args.authorityBump)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      zetaAccount: accounts.zetaAccountPk,
      zetaAuthority: accounts.zetaAuthorityPk,
      zetaGroup: accounts.zetaGroupPk,
      zetaProgram: accounts.zetaProgramId,
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
    bankVaultPk: PublicKey;
    bankAuthorityPk: PublicKey;
    zetaGroupPk: PublicKey;
    zetaAccountPk: PublicKey;
    zetaVaultPk: PublicKey;
    tempCollateralAccount: PublicKey;
    zetaSocializedLossAccount: PublicKey;
    zetaAuthorityPk: PublicKey;
    zetaStatePk: PublicKey;
    zetaGreeksPk: PublicKey;
    zetaProgramId: PublicKey;
  },
  args: { amount: BN }
) {
  return mfProgram.methods
    .utpZetaDeposit(args.amount)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      marginfiCollateralVault: accounts.bankVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      tempCollateralAccount: accounts.tempCollateralAccount,
      zetaGroup: accounts.zetaGroupPk,
      zetaAccount: accounts.zetaAccountPk,
      zetaVault: accounts.zetaVaultPk,
      zetaSocializedLossAccount: accounts.zetaSocializedLossAccount,
      zetaAuthority: accounts.zetaAuthorityPk,
      zetaState: accounts.zetaStatePk,
      zetaGreeks: accounts.zetaGreeksPk,
      tokenProgram: TOKEN_PROGRAM_ID,
      zetaProgram: accounts.zetaProgramId,
    })
    .instruction();
}

async function makeWithdrawIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
    bankVaultPk: PublicKey;
    zetaAuthorityPk: PublicKey;
    zetaAccountPk: PublicKey;
    zetaVaultPk: PublicKey;
    zetaGreeksPk: PublicKey;
    zetaOraclePk: PublicKey;
    zetaGroupPk: PublicKey;
    zetaSocializedLossAccount: PublicKey;
    zetaStatePk: PublicKey;
    zetaProgramId: PublicKey;
  },
  args: { amount: BN }
) {
  return mfProgram.methods
    .utpZetaWithdraw(args.amount)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      marginCollateralVault: accounts.bankVaultPk,
      zetaAuthority: accounts.zetaAuthorityPk,
      zetaAccount: accounts.zetaAccountPk,
      zetaVault: accounts.zetaVaultPk,
      zetaGreeks: accounts.zetaGreeksPk,
      zetaOracle: accounts.zetaOraclePk,
      zetaGroup: accounts.zetaGroupPk,
      zetaSocializedLossAccount: accounts.zetaSocializedLossAccount,
      zetaState: accounts.zetaStatePk,
      zetaProgram: accounts.zetaProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}

async function makeInitOpenOrdersAccountIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
    zetaGroupPk: PublicKey;
    zetaStatePk: PublicKey;
    zetaOpenOrdersPk: PublicKey;
    zetaAccountPk: PublicKey;
    zetaAuthorityPk: PublicKey;
    zetaMarketPk: PublicKey;
    zetaSerumAuthorityPk: PublicKey;
    zetaOpenOrdersMapPk: PublicKey;
    zetaProgramId: PublicKey;
    dexProgramId: PublicKey;
  }
) {
  return mfProgram.methods
    .utpZetaInitializeOpenOrders()
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      zetaGroup: accounts.zetaGroupPk,
      zetaState: accounts.zetaStatePk,
      zetaOpenOrders: accounts.zetaOpenOrdersPk,
      zetaAccount: accounts.zetaAccountPk,
      zetaAuthority: accounts.zetaAuthorityPk,
      zetaMarket: accounts.zetaMarketPk,
      zetaSerumAuthority: accounts.zetaSerumAuthorityPk,
      zetaOpenOrdersMap: accounts.zetaOpenOrdersMapPk,
      rent: SYSVAR_RENT_PUBKEY,
      zetaProgram: accounts.zetaProgramId,
      dexProgram: accounts.dexProgramId,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function makePlaceOrderIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
    zetaAccountPk: PublicKey;
    zetaStatePk: PublicKey;
    zetaGroupPk: PublicKey;
    zetaSerumAuthorityPk: PublicKey;
    zetaGreeksPk: PublicKey;
    zetaOpenOrdersPk: PublicKey;
    zetaMarketPk: PublicKey;
    zetaRequestQueuePk: PublicKey;
    zetaEventQueuePk: PublicKey;
    zetaBidsPk: PublicKey;
    zetaAsksPk: PublicKey;
    zetaCoinVaultPk: PublicKey;
    zetaPcVaultPk: PublicKey;
    zetaOrderPayerTokenAccountPk: PublicKey;
    zetaCoinWalletPk: PublicKey;
    zetaPcWalletPk: PublicKey;
    zetaAuthorityPk: PublicKey;
    zetaOraclePk: PublicKey;
    zetaMarketNodePk: PublicKey;
    zetaMarketMintPk: PublicKey;
    zetaMintAuthorityPk: PublicKey;
    zetaProgramId: PublicKey;
    dexProgramId: PublicKey;
  },
  args: { price: BN; size: BN; side: zetaTypes.Side },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpZetaPlaceOrder({
      price: args.price,
      size: args.size,
      side: zetaTypes.toProgramSide(args.side) as never,
      clientOrderId: null,
    })
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      zetaAccount: accounts.zetaAccountPk,
      zetaState: accounts.zetaStatePk,
      zetaGroup: accounts.zetaGroupPk,
      zetaAuthority: accounts.zetaAuthorityPk,
      zetaSerumAuthority: accounts.zetaSerumAuthorityPk,
      zetaGreeks: accounts.zetaGreeksPk,
      zetaOpenOrders: accounts.zetaOpenOrdersPk,
      zetaMarket: accounts.zetaMarketPk,
      zetaRequestQueue: accounts.zetaRequestQueuePk,
      zetaEventQueue: accounts.zetaEventQueuePk,
      zetaBids: accounts.zetaBidsPk,
      zetaAsks: accounts.zetaAsksPk,
      zetaCoinVault: accounts.zetaCoinVaultPk,
      zetaPcVault: accounts.zetaPcVaultPk,
      zetaOrderPayerTokenAccount: accounts.zetaOrderPayerTokenAccountPk,
      zetaCoinWallet: accounts.zetaCoinWalletPk,
      zetaPcWallet: accounts.zetaPcWalletPk,
      zetaOracle: accounts.zetaOraclePk,
      zetaMarketNode: accounts.zetaMarketNodePk,
      zetaMarketMint: accounts.zetaMarketMintPk,
      zetaMintAuthority: accounts.zetaMintAuthorityPk,
      rent: SYSVAR_RENT_PUBKEY,
      zetaProgram: accounts.zetaProgramId,
      dexProgram: accounts.dexProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeCancelOrderIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
    zetaAccountPk: PublicKey;
    zetaStatePk: PublicKey;
    zetaGroupPk: PublicKey;
    zetaSerumAuthorityPk: PublicKey;
    zetaOpenOrdersPk: PublicKey;
    zetaMarketAccountsMarketPk: PublicKey;
    zetaMarketAccountsEventQueuePk: PublicKey;
    zetaMarketAccountsBidsPk: PublicKey;
    zetaMarketAccountsAsksPk: PublicKey;
    zetaAuthorityPk: PublicKey;
    zetaProgramId: PublicKey;
    dexProgramId: PublicKey;
  },
  args: { side: zetaTypes.Side; orderId: BN },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpZetaCancelOrder({
      side: zetaTypes.toProgramSide(args.side) as never,
      orderId: args.orderId,
    } as any)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.authorityPk,
      zetaAuthority: accounts.zetaAuthorityPk,
      zetaGroup: accounts.zetaGroupPk,
      zetaState: accounts.zetaStatePk,
      zetaAccount: accounts.zetaAccountPk,
      zetaSerumAuthority: accounts.zetaSerumAuthorityPk,
      zetaOpenOrders: accounts.zetaOpenOrdersPk,
      zetaMarket: accounts.zetaMarketAccountsMarketPk,
      zetaBids: accounts.zetaMarketAccountsBidsPk,
      zetaAsks: accounts.zetaMarketAccountsAsksPk,
      zetaEventQueue: accounts.zetaMarketAccountsEventQueuePk,
      zetaProgram: accounts.zetaProgramId,
      dexProgram: accounts.dexProgramId,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export default {
  makeActivateIx,
  makeInitOpenOrdersAccountIx,
  makeDepositIx,
  makeWithdrawIx,
  makePlaceOrderIx,
  makeCancelOrderIx,
};
