import { ZERO_BN } from "@blockworks-foundation/mango-client";
import { BN, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import { MarginfiIdl } from "../../idl";
import { ExpiryType, PerpOrderType, Side, toProgramExpiryType, toProgramPerpOrderType, toProgramSide } from "./types";

export async function makeActivateIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    mangoProgramId: PublicKey;
    mangoGroupPk: PublicKey;
    mangoAccountPk: PublicKey;
    mangoAuthorityPk: PublicKey;
    authorityPk: PublicKey;
  },
  args: {
    authoritySeed: PublicKey;
    authorityBump: number;
  }
) {
  return mfProgram.methods
    .utpMangoActivate(args.authoritySeed, args.authorityBump)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      mangoProgram: accounts.mangoProgramId,
      mangoGroup: accounts.mangoGroupPk,
      mangoAccount: accounts.mangoAccountPk,
      mangoAuthority: accounts.mangoAuthorityPk,
      systemProgram: SystemProgram.programId,
      authority: accounts.authorityPk,
    })
    .instruction();
}

export async function makeDepositIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    signerPk: PublicKey;
    bankVaultPk: PublicKey;
    bankAuthorityPk: PublicKey;
    mangoProgramId: PublicKey;
    mangoGroupPk: PublicKey;
    mangoAccountPk: PublicKey;
    mangoVaultPk: PublicKey;
    proxyTokenAccountPk: PublicKey;
    mangoCachePk: PublicKey;
    mangoRootBankPk: PublicKey;
    mangoNodeBankPk: PublicKey;
    mangoAuthorityPk: PublicKey;
  },
  args: { amount: BN },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpMangoDeposit(args.amount)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.signerPk,
      marginCollateralVault: accounts.bankVaultPk,
      bankAuthority: accounts.bankAuthorityPk,
      mangoProgram: accounts.mangoProgramId,
      mangoGroup: accounts.mangoGroupPk,
      mangoAccount: accounts.mangoAccountPk,
      mangoVault: accounts.mangoVaultPk,
      tempCollateralAccount: accounts.proxyTokenAccountPk,
      mangoAuthority: accounts.mangoAuthorityPk,
      mangoCache: accounts.mangoCachePk,
      mangoRootBank: accounts.mangoRootBankPk,
      mangoNodeBank: accounts.mangoNodeBankPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeWithdrawIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiGroupPk: PublicKey;
    marginfiAccountPk: PublicKey;
    signerPk: PublicKey;
    bankVaultPk: PublicKey;
    mangoProgramId: PublicKey;
    mangoGroupPk: PublicKey;
    mangoAccountPk: PublicKey;
    mangoVaultPk: PublicKey;
    mangoVaultAuthorityPk: PublicKey;
    mangoCachePk: PublicKey;
    mangoRootBankPk: PublicKey;
    mangoNodeBankPk: PublicKey;
    mangoAuthorityPk: PublicKey;
  },
  args: { amount: BN }
) {
  return mfProgram.methods
    .utpMangoWithdraw(args.amount)
    .accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      signer: accounts.signerPk,
      marginCollateralVault: accounts.bankVaultPk,
      mangoProgram: accounts.mangoProgramId,
      mangoGroup: accounts.mangoGroupPk,
      mangoAccount: accounts.mangoAccountPk,
      mangoVault: accounts.mangoVaultPk,
      mangoVaultAuthority: accounts.mangoVaultAuthorityPk,
      mangoAuthority: accounts.mangoAuthorityPk,
      mangoCache: accounts.mangoCachePk,
      mangoRootBank: accounts.mangoRootBankPk,
      mangoNodeBank: accounts.mangoNodeBankPk,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}

export async function makePlacePerpOrderIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccountPk: PublicKey;
    marginfiGroupPk: PublicKey;
    authorityPk: PublicKey;
    mangoAuthorityPk: PublicKey;
    mangoProgramId: PublicKey;
    mangoGroupPk: PublicKey;
    mangoAccountPk: PublicKey;
    mangoCachePk: PublicKey;
    mangoPerpMarketPk: PublicKey;
    mangoBidsPk: PublicKey;
    mangoAsksPk: PublicKey;
    mangoEventQueuePk: PublicKey;
  },
  args: {
    args: {
      side: Side;
      price: BN;
      maxBaseQuantity: BN;
      maxQuoteQuantity: BN;
      clientOrderId: BN;
      orderType: PerpOrderType;
      reduceOnly?: boolean;
      expiryTimestamp?: BN;
      limit: BN; // one byte; max 255
      expiryType: ExpiryType;
    };
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpMangoUsePlacePerpOrder({
      side: toProgramSide(args.args.side),
      price: args.args.price,
      maxBaseQuantity: args.args.maxBaseQuantity,
      maxQuoteQuantity: args.args.maxQuoteQuantity,
      clientOrderId: args.args.clientOrderId,
      orderType: toProgramPerpOrderType(args.args.orderType),
      reduceOnly: args.args.reduceOnly || false,
      expiryTimestamp: args.args.expiryTimestamp || ZERO_BN,
      limit: args.args.limit,
      expiryType: toProgramExpiryType(args.args.expiryType),
    } as any)
    .accounts({
      marginfiAccount: accounts.marginfiAccountPk,
      marginfiGroup: accounts.marginfiGroupPk,
      authority: accounts.authorityPk,
      mangoAuthority: accounts.mangoAuthorityPk,
      mangoProgram: accounts.mangoProgramId,
      mangoGroup: accounts.mangoGroupPk,
      mangoAccount: accounts.mangoAccountPk,
      mangoCache: accounts.mangoCachePk,
      mangoPerpMarket: accounts.mangoPerpMarketPk,
      mangoBids: accounts.mangoBidsPk,
      mangoAsks: accounts.mangoAsksPk,
      mangoEventQueue: accounts.mangoEventQueuePk,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeCancelPerpOrderIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccountPk: PublicKey;
    authorityPk: PublicKey;
    mangoAuthorityPk: PublicKey;
    mangoProgramId: PublicKey;
    mangoGroupPk: PublicKey;
    mangoAccountPk: PublicKey;
    mangoPerpMarketPk: PublicKey;
    mangoBidsPk: PublicKey;
    mangoAsksPk: PublicKey;
  },
  args: {
    orderId: BN;
    invalidIdOk: boolean;
  },
  remainingAccounts: AccountMeta[] = []
) {
  return mfProgram.methods
    .utpMangoUseCancelPerpOrder(args.orderId, args.invalidIdOk)
    .accounts({
      marginfiAccount: accounts.marginfiAccountPk,
      authority: accounts.authorityPk,
      mangoAuthority: accounts.mangoAuthorityPk,
      mangoProgram: accounts.mangoProgramId,
      mangoGroup: accounts.mangoGroupPk,
      mangoAccount: accounts.mangoAccountPk,
      mangoPerpMarket: accounts.mangoPerpMarketPk,
      mangoBids: accounts.mangoBidsPk,
      mangoAsks: accounts.mangoAsksPk,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}
