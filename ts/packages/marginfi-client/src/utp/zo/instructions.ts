import { BN, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { MarginfiIdl } from "../../idl";
import { UtpZoPlacePerpOrderArgs } from "./types";

async function makeActivateIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    authority: PublicKey;
    utpAuthority: PublicKey;
    zoProgram: PublicKey;
    zoState: PublicKey;
    zoMargin: PublicKey;
    zoControl: PublicKey;
  },
  args: {
    authoritySeed: PublicKey;
    authorityBump: number;
    zoMarginNonce: number;
  }
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoActivate(args.authoritySeed, args.authorityBump, args.zoMarginNonce)
    .accounts({
      marginfiAccount: accounts.marginfiAccount,
      marginfiGroup: accounts.marginfiGroup,
      authority: accounts.authority,
      utpAuthority: accounts.utpAuthority,
      zoProgram: accounts.zoProgram,
      zoState: accounts.zoState,
      zoMargin: accounts.zoMargin,
      zoControl: accounts.zoControl,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function makeDepositIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    signer: PublicKey;
    marginCollateralVault: PublicKey;
    bankAuthority: PublicKey;
    tempCollateralAccount: PublicKey;
    utpAuthority: PublicKey;
    zoProgram: PublicKey;
    zoState: PublicKey;
    zoStateSigner: PublicKey;
    zoCache: PublicKey;
    zoMargin: PublicKey;
    zoVault: PublicKey;
  },
  args: {
    amount: BN;
  },
  remainingAccounts: AccountMeta[] = []
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoDeposit(args.amount)
    .accounts({
      marginfiAccount: accounts.marginfiAccount,
      marginfiGroup: accounts.marginfiGroup,
      signer: accounts.signer,
      marginCollateralVault: accounts.marginCollateralVault,
      bankAuthority: accounts.bankAuthority,
      tempCollateralAccount: accounts.tempCollateralAccount,
      utpAuthority: accounts.utpAuthority,
      zoProgram: accounts.zoProgram,
      zoState: accounts.zoState,
      zoStateSigner: accounts.zoStateSigner,
      zoCache: accounts.zoCache,
      zoMargin: accounts.zoMargin,
      zoVault: accounts.zoVault,
      rent: SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeWithdrawIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    signer: PublicKey;
    marginCollateralVault: PublicKey;
    utpAuthority: PublicKey;
    zoMargin: PublicKey;
    zoProgram: PublicKey;
    zoState: PublicKey;
    zoStateSigner: PublicKey;
    zoCache: PublicKey;
    zoControl: PublicKey;
    zoVault: PublicKey;
    heimdall: PublicKey;
  },
  args: {
    amount: BN;
  },
  remainingAccounts: AccountMeta[] = []
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoWithdraw(args.amount)
    .accounts({
      marginfiAccount: accounts.marginfiAccount,
      marginfiGroup: accounts.marginfiGroup,
      signer: accounts.signer,
      marginCollateralVault: accounts.marginCollateralVault,
      utpAuthority: accounts.utpAuthority,
      zoMargin: accounts.zoMargin,
      zoProgram: accounts.zoProgram,
      zoState: accounts.zoState,
      zoStateSigner: accounts.zoStateSigner,
      zoCache: accounts.zoCache,
      zoControl: accounts.zoControl,
      zoVault: accounts.zoVault,
      heimdall: accounts.heimdall,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeCreatePerpOpenOrdersIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    utpAuthority: PublicKey;
    signer: PublicKey;
    zoProgram: PublicKey;
    zoState: PublicKey;
    zoStateSigner: PublicKey;
    zoMargin: PublicKey;
    zoControl: PublicKey;
    zoOpenOrders: PublicKey;
    zoDexMarket: PublicKey;
    zoDexProgram: PublicKey;
  }
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoCreatePerpOpenOrders()
    .accounts({
      header: {
        marginfiAccount: accounts.marginfiAccount,
        marginfiGroup: accounts.marginfiGroup,
        utpAuthority: accounts.utpAuthority,
        signer: accounts.signer,
      },
      zoProgram: accounts.zoProgram,
      state: accounts.zoState,
      stateSigner: accounts.zoStateSigner,
      margin: accounts.zoMargin,
      control: accounts.zoControl,
      openOrders: accounts.zoOpenOrders,
      dexMarket: accounts.zoDexMarket,
      dexProgram: accounts.zoDexProgram,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

async function makePlacePerpOrderIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    utpAuthority: PublicKey;
    signer: PublicKey;
    zoProgram: PublicKey;
    state: PublicKey;
    stateSigner: PublicKey;
    cache: PublicKey;
    margin: PublicKey;
    control: PublicKey;
    openOrders: PublicKey;
    dexMarket: PublicKey;
    reqQ: PublicKey;
    eventQ: PublicKey;
    marketBids: PublicKey;
    marketAsks: PublicKey;
    dexProgram: PublicKey;
  },
  args: {
    args: UtpZoPlacePerpOrderArgs;
  },
  remainingAccounts: AccountMeta[] = []
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoPlacePerpOrder(args.args as any)
    .accounts({
      header: {
        marginfiAccount: accounts.marginfiAccount,
        marginfiGroup: accounts.marginfiGroup,
        utpAuthority: accounts.utpAuthority,
        signer: accounts.signer,
      },
      zoProgram: accounts.zoProgram,
      state: accounts.state,
      stateSigner: accounts.stateSigner,
      cache: accounts.cache,
      margin: accounts.margin,
      control: accounts.control,
      openOrders: accounts.openOrders,
      dexMarket: accounts.dexMarket,
      reqQ: accounts.reqQ,
      eventQ: accounts.eventQ,
      marketBids: accounts.marketBids,
      marketAsks: accounts.marketAsks,
      dexProgram: accounts.dexProgram,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeCancelPerpOrderIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    utpAuthority: PublicKey;
    signer: PublicKey;
    zoProgram: PublicKey;
    state: PublicKey;
    cache: PublicKey;
    margin: PublicKey;
    control: PublicKey;
    openOrders: PublicKey;
    dexMarket: PublicKey;
    marketBids: PublicKey;
    marketAsks: PublicKey;
    eventQ: PublicKey;
    dexProgram: PublicKey;
  },
  args: {
    isLong?: boolean;
    orderId?: BN;
    clientId?: BN;
  }
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoCancelPerpOrder(args.orderId ?? null, args.isLong ?? null, args.clientId ?? null)
    .accounts({
      header: {
        marginfiAccount: accounts.marginfiAccount,
        marginfiGroup: accounts.marginfiGroup,
        utpAuthority: accounts.utpAuthority,
        signer: accounts.signer,
      },
      zoProgram: accounts.zoProgram,
      state: accounts.state,
      cache: accounts.cache,
      margin: accounts.margin,
      control: accounts.control,
      openOrders: accounts.openOrders,
      dexMarket: accounts.dexMarket,
      marketBids: accounts.marketBids,
      marketAsks: accounts.marketAsks,
      eventQ: accounts.eventQ,
      dexProgram: accounts.dexProgram,
    })
    .instruction();
}

async function makeSettleFundsIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginfiAccount: PublicKey;
    marginfiGroup: PublicKey;
    utpAuthority: PublicKey;
    signer: PublicKey;
    zoProgram: PublicKey;
    state: PublicKey;
    stateSigner: PublicKey;
    cache: PublicKey;
    margin: PublicKey;
    control: PublicKey;
    openOrders: PublicKey;
    dexMarket: PublicKey;
    dexProgram: PublicKey;
  }
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoSettleFunds()
    .accounts({
      header: {
        marginfiAccount: accounts.marginfiAccount,
        marginfiGroup: accounts.marginfiGroup,
        utpAuthority: accounts.utpAuthority,
        signer: accounts.signer,
      },
      zoProgram: accounts.zoProgram,
      state: accounts.state,
      stateSigner: accounts.stateSigner,
      cache: accounts.cache,
      margin: accounts.margin,
      control: accounts.control,
      openOrders: accounts.openOrders,
      dexMarket: accounts.dexMarket,
      dexProgram: accounts.dexProgram,
    })
    .instruction();
}

export default {
  makeActivateIx,
  makeDepositIx,
  makeWithdrawIx,
  makePlacePerpOrderIx,
  makeCancelPerpOrderIx,
  makeCreatePerpOpenOrdersIx,
  makeSettleFundsIx,
};
