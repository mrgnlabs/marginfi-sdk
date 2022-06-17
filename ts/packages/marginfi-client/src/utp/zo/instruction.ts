import { BN, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { OrderType } from "@zero_one/client";
import { MarginfiIdl } from "../../idl";

export async function makeActivateIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
      marginAccount: accounts.marginAccount,
      marginGroup: accounts.marginGroup,
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

export async function makeDepositIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
      marginAccount: accounts.marginAccount,
      marginGroup: accounts.marginGroup,
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

export async function makeWithdrawIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
  },
  args: {
    amount: BN;
  },
  remainingAccounts: AccountMeta[] = []
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoWithdraw(args.amount)
    .accounts({
      marginAccount: accounts.marginAccount,
      marginGroup: accounts.marginGroup,
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
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

export async function makeCreatePerpOpenOrdersIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
        marginAccount: accounts.marginAccount,
        marginGroup: accounts.marginGroup,
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

export async function makePlacePerpOrderIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
    args: Readonly<{
      isLong: boolean;
      limitPrice: BN;
      maxBaseQuantity: BN;
      maxQuoteQuantity: BN;
      orderType: OrderType;
      limit: number;
      clientId: BN;
    }>;
  },
  remainingAccounts: AccountMeta[] = []
): Promise<TransactionInstruction> {
  return mfProgram.methods
    .utpZoPlacePerpOrder(args.args as any)
    .accounts({
      header: {
        marginAccount: accounts.marginAccount,
        marginGroup: accounts.marginGroup,
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

export async function makeCancelPerpOrderIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
    .utpZoCancelPerpOrder(args.orderId || null, args.isLong || null, args.clientId || null)
    .accounts({
      header: {
        marginAccount: accounts.marginAccount,
        marginGroup: accounts.marginGroup,
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

export async function makeSettleFundsIx(
  mfProgram: Program<MarginfiIdl>,
  accounts: {
    marginAccount: PublicKey;
    marginGroup: PublicKey;
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
        marginAccount: accounts.marginAccount,
        marginGroup: accounts.marginGroup,
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
