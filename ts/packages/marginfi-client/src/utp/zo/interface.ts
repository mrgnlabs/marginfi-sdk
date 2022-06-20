import { observe_zo } from "@mrgnlabs/marginfi-wasm-tools";
import {
  AccountMeta,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { MarginfiClient } from "../../client";
import { MarginfiAccount } from "../../marginfiAccount";
import { UtpObservation } from "../../state";
import { UtpAccount, UTPAccountConfig, UtpData } from "../../types";
import {
  BankVaultType,
  createTempTransferAccounts as createTempTransferAccountIxs,
  getBankAuthority,
  getUtpAuthority,
  processTransaction,
} from "../../utils";
import {
  makeActivateIx,
  makeCancelPerpOrderIx,
  makeCreatePerpOpenOrdersIx,
  makeDepositIx,
  makePlacePerpOrderIx,
  makeSettleFundsIx,
  makeWithdrawIx,
} from "./instruction";

import { BN } from "@project-serum/anchor";
import * as ZoClient from "@zero_one/client";
import { CONTROL_ACCOUNT_SIZE, OrderType } from "@zero_one/client";

export class UtpZoAccount implements UtpAccount {
  private _client: MarginfiClient;
  private _marginfiAccount: MarginfiAccount;

  private _isActive: boolean;
  private _utpConfig: UTPAccountConfig;

  /** @internal */
  constructor(client: MarginfiClient, mfAccount: MarginfiAccount, accountData: UtpData) {
    this._client = client;
    this._marginfiAccount = mfAccount;
    this._isActive = accountData.isActive;
    this._utpConfig = accountData.accountConfig;
  }

  // --- Getters and setters

  public get _config() {
    return this._client.config;
  }
  public get utpConfig() {
    return this._utpConfig;
  }
  public get _program() {
    return this._client.program;
  }
  public get address(): PublicKey {
    return this._utpConfig.address;
  }
  public get index() {
    return this._config.zo.utpIndex;
  }

  /**
   * Flag indicating if UTP is active or not
   */
  public get isActive() {
    return this._isActive;
  }

  /**
   * UTP-specific config
   */
  public get config() {
    return this._config.zo;
  }

  /**
   * Update instance data from provided data struct.
   *
   * @internal
   */
  update(data: UtpData) {
    this._isActive = data.isActive;
    this._utpConfig = data.accountConfig;
  }

  async makeActivateIx(zoControlPk: PublicKey): Promise<TransactionInstruction> {
    const utpAuthoritySeed = Keypair.generate().publicKey;

    const zoProgramId = this._config.zo.programId;
    const [utpAuthorityPk, utpAuthorityBump] = await getUtpAuthority(
      zoProgramId,
      utpAuthoritySeed,
      this._program.programId
    );

    const zoProgram = ZoClient.createProgram(this._client.program.provider, this._config.zo.cluster);
    const state = await ZoClient.State.load(zoProgram, this._config.zo.statePk);
    const [zoMarginPubkey, zoMarginNonce] = await ZoClient.Margin.getMarginKey(state, utpAuthorityPk, zoProgram);

    const activateZoIx = await makeActivateIx(
      this._program,
      {
        marginfiGroup: this._config.groupPk,
        marginfiAccount: this._marginfiAccount.publicKey,
        authority: this._program.provider.wallet.publicKey,
        utpAuthority: utpAuthorityPk,
        zoProgram: zoProgramId,
        zoState: state.pubkey,
        zoMargin: zoMarginPubkey,
        zoControl: zoControlPk,
      },
      {
        authoritySeed: utpAuthoritySeed,
        authorityBump: utpAuthorityBump,
        zoMarginNonce,
      }
    );

    return activateZoIx;
  }

  async activate(): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:activate`);
    debug("Activate 01 UTP");

    const provider = this._program.provider;

    const zoControlKey = Keypair.generate();
    const activateIx = await this.makeActivateIx(zoControlKey.publicKey);

    const controlAccountRent = await this._program.provider.connection.getMinimumBalanceForRentExemption(
      CONTROL_ACCOUNT_SIZE
    );

    const createZoControlAccount = SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: zoControlKey.publicKey,
      lamports: controlAccountRent,
      space: CONTROL_ACCOUNT_SIZE,
      programId: this.config.programId,
    });

    const tx = new Transaction().add(createZoControlAccount, activateIx);
    const sig = await processTransaction(provider, tx, [zoControlKey]);

    debug("Sig %s", sig);

    await this._marginfiAccount.reload(); // Required to update the internal UTP address
    return sig;
  }

  /**
   * Create transaction instruction to deactivate Mango.
   *
   * @returns `DeactivateUtp` transaction instruction
   */
  async makeDeactivateIx() {
    return this._marginfiAccount.makeDeactivateUtpIx(new BN(this.index));
  }

  /**
   * Deactivate UTP.
   *
   * @returns Transaction signature
   */
  async deactivate() {
    const debug = require("debug")(`mfi:utp:${this.address}:zo:deactivate`);
    this.verifyActive();
    debug("Deactivating 01 UTP");

    const sig = await this._marginfiAccount.deactivateUtp(new BN(this.index));

    await this._marginfiAccount.reload();
    return sig;
  }

  async makeDepositIx(tempTokenAccountPk: PublicKey, amount: BN): Promise<TransactionInstruction> {
    const zoProgramId = this._config.zo.programId;
    const [utpAuthorityPk] = await getUtpAuthority(zoProgramId, this._utpConfig.authoritySeed, this._program.programId);

    const [bankAuthority] = await getBankAuthority(
      this._config.groupPk,
      this._program.programId,
      BankVaultType.LiquidityVault
    );

    const [zoStateSigner] = await ZoClient.State.getSigner(this.config.statePk, zoProgramId);
    const zoState = await ZoClient.State.load(
      await ZoClient.createProgram(this._program.provider, this.config.cluster),
      this.config.statePk
    );
    const [zoVaultPk] = await zoState.getVaultCollateralByMint(this._client.group.bank.mint);
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    return makeDepositIx(
      this._program,
      {
        marginfiGroup: this._config.groupPk,
        marginfiAccount: this._marginfiAccount.publicKey,
        signer: this._program.provider.wallet.publicKey,
        marginCollateralVault: this._client.group.bank.vault,
        bankAuthority: bankAuthority,
        tempCollateralAccount: tempTokenAccountPk,
        utpAuthority: utpAuthorityPk,
        zoProgram: zoProgramId,
        zoState: this.config.statePk,
        zoStateSigner: zoStateSigner,
        zoCache: zoState.cache.pubkey,
        zoMargin: this._utpConfig.address,
        zoVault: zoVaultPk,
      },
      { amount },
      remainingAccounts
    );
  }

  async deposit(amount: BN): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:deposit`);
    debug("Depositing %s into 01", amount);

    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const [tempTokenAccountKey, createTokenAccountIx, initTokenAccountIx] = await createTempTransferAccountIxs(
      this._client.program.provider,
      this._client.group.bank.mint,
      utpAuthority
    );

    const depositIx = await this.makeDepositIx(tempTokenAccountKey.publicKey, amount);

    const tx = new Transaction().add(createTokenAccountIx, initTokenAccountIx, depositIx);
    const sig = await processTransaction(this._program.provider, tx, [tempTokenAccountKey]);
    debug("Sig %s", sig);
    return sig;
  }

  async makeWithdrawIx(amount: BN): Promise<TransactionInstruction> {
    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
    const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
    const [zoVaultPk] = await zoState.getVaultCollateralByMint(this._client.group.bank.mint);
    const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    return makeWithdrawIx(
      this._program,
      {
        marginfiAccount: this._marginfiAccount.publicKey,
        marginfiGroup: this._client.group.publicKey,
        signer: this._program.provider.wallet.publicKey,
        marginCollateralVault: this._client.group.bank.vault,
        utpAuthority: utpAuthority,
        zoMargin: this.address,
        zoProgram: this.config.programId,
        zoState: this.config.statePk,
        zoStateSigner: zoState.signer,
        zoCache: zoState.cache.pubkey,
        zoControl: zoMargin.control.pubkey,
        zoVault: zoVaultPk,
      },
      { amount },
      remainingAccounts
    );
  }

  async withdraw(amount: BN): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:withdraw`);
    debug("Withdrawing %s from 01", amount);

    const withdrawIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(withdrawIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Sig %s", sig);
    return sig;
  }

  private verifyActive() {
    const debug = require("debug")(`mfi:utp:${this.address}:zo:verify-active`);
    if (!this.isActive) {
      debug("Utp isn't active");
      throw new Error("Utp isn't active");
    }
  }

  async makeCreatePerpOpenOrdersIx(marketSymbol: string): Promise<TransactionInstruction> {
    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
    const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
    const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);
    const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(marketSymbol, this.config.cluster);

    return makeCreatePerpOpenOrdersIx(this._program, {
      marginfiAccount: this._marginfiAccount.publicKey,
      marginfiGroup: this._client.group.publicKey,
      utpAuthority,
      signer: this._client.program.provider.wallet.publicKey,
      zoProgram: this.config.programId,
      zoState: this.config.statePk,
      zoStateSigner: zoState.signer,
      zoMargin: this.address,
      zoControl: zoMargin.control.pubkey,
      zoOpenOrders: openOrdersPk,
      zoDexMarket: zoState.getMarketKeyBySymbol(marketSymbol),
      zoDexProgram: this.config.dexProgram,
    });
  }

  async createPerpOpenOrders(symbol: string): Promise<string> {
    const debug = require("debug")(
      `mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:create-perp-open-orders`
    );
    debug("Creating perp open orders account on 01");

    const createPerpOpenOrdersIx = await this.makeCreatePerpOpenOrdersIx(symbol);
    const tx = new Transaction().add(createPerpOpenOrdersIx);
    const sig = await processTransaction(this._client.program.provider, tx);
    debug("Sig %s", sig);
    return sig;
  }

  async makePlacePerpOrderIx({
    symbol,
    orderType,
    isLong,
    price,
    size,
    limit,
    clientId,
  }: Readonly<{
    symbol: string;
    orderType: OrderType;
    isLong: boolean;
    price: number;
    size: number;
    limit?: number;
    clientId?: BN;
  }>): Promise<TransactionInstruction> {
    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
    const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);

    const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);

    const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(symbol, this.config.cluster);

    const market = await zoState.getMarketBySymbol(symbol);
    const limitPriceBn = market.priceNumberToLots(price);
    const maxBaseQtyBn = market.baseSizeNumberToLots(size);
    const takerFee =
      market.decoded.perpType.toNumber() === 1
        ? ZoClient.ZO_FUTURE_TAKER_FEE
        : market.decoded.perpType.toNumber() === 2
        ? ZoClient.ZO_OPTION_TAKER_FEE
        : ZoClient.ZO_SQUARE_TAKER_FEE;
    const feeMultiplier = isLong ? 1 + takerFee : 1 - takerFee;
    const maxQuoteQtyBn = new BN(
      Math.round(limitPriceBn.mul(maxBaseQtyBn).mul(market.decoded["quoteLotSize"]).toNumber() * feeMultiplier)
    );
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    const args = {
      isLong,
      limitPrice: limitPriceBn,
      maxBaseQuantity: maxBaseQtyBn,
      maxQuoteQuantity: maxQuoteQtyBn,
      orderType,
      limit: limit ?? 10,
      clientId: clientId ?? new BN(0),
    };

    return makePlacePerpOrderIx(
      this._client.program,
      {
        marginfiAccount: this._marginfiAccount.publicKey,
        marginfiGroup: this._client.group.publicKey,
        utpAuthority: utpAuthority,
        signer: this._program.provider.wallet.publicKey,
        zoProgram: zoProgram.programId,
        state: zoState.pubkey,
        stateSigner: zoState.signer,
        cache: zoState.cache.pubkey,
        margin: zoMargin.pubkey,
        control: zoMargin.control.pubkey,
        openOrders: openOrdersPk,
        dexMarket: market.publicKey,
        reqQ: market.requestQueueAddress,
        eventQ: market.eventQueueAddress,
        marketBids: market.bidsAddress,
        marketAsks: market.asksAddress,
        dexProgram: this.config.dexProgram,
      },
      { args },
      remainingAccounts
    );
  }

  async placePerpOrder(
    args: Readonly<{
      symbol: string;
      orderType: OrderType;
      isLong: boolean;
      price: number;
      size: number;
      limit?: number;
      clientId?: BN;
    }>
  ): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:place-perp-order`);
    debug("Placing perp order on 01");
    debug("%s", args);

    const requestCUIx = ComputeBudgetProgram.requestUnits({
      units: 400000,
      additionalFee: 0,
    });
    const placeOrderIx = await this.makePlacePerpOrderIx(args);
    const tx = new Transaction().add(requestCUIx, placeOrderIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Sig %s", sig);
    return sig;
  }

  async makeCancelPerpOrderIx(args: {
    symbol: string;
    isLong?: boolean;
    orderId?: BN;
    clientId?: BN;
  }): Promise<TransactionInstruction> {
    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
    const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);

    const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);

    const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(args.symbol, this.config.cluster);
    const market = await zoState.getMarketBySymbol(args.symbol);

    return makeCancelPerpOrderIx(
      this._client.program,
      {
        marginfiAccount: this._marginfiAccount.publicKey,
        marginfiGroup: this._client.group.publicKey,
        utpAuthority: utpAuthority,
        signer: this._program.provider.wallet.publicKey,
        zoProgram: zoProgram.programId,
        state: zoState.pubkey,
        cache: zoState.cache.pubkey,
        margin: zoMargin.pubkey,
        control: zoMargin.control.pubkey,
        openOrders: openOrdersPk,
        dexMarket: market.publicKey,
        eventQ: market.eventQueueAddress,
        marketBids: market.bidsAddress,
        marketAsks: market.asksAddress,
        dexProgram: this.config.dexProgram,
      },
      {
        clientId: args.clientId,
        isLong: args.isLong,
        orderId: args.orderId,
      }
    );
  }

  async cancelPerpOrder(args: { symbol: string; isLong?: boolean; orderId?: BN; clientId?: BN }): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:cancel-perp-order`);
    debug("Cancelling perp order on 01");

    const ix = await this.makeCancelPerpOrderIx(args);
    const tx = new Transaction().add(ix);
    const sig = await processTransaction(this._client.program.provider, tx);
    debug("Sig %s", sig);
    return sig;
  }

  async makeSettleFundsIx(symbol: string): Promise<TransactionInstruction> {
    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
    const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);

    const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);

    const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(symbol, this.config.cluster);

    return makeSettleFundsIx(this._client.program, {
      marginfiAccount: this._marginfiAccount.publicKey,
      marginfiGroup: this._client.group.publicKey,
      utpAuthority: utpAuthority,
      signer: this._program.provider.wallet.publicKey,
      zoProgram: zoProgram.programId,
      state: zoState.pubkey,
      stateSigner: zoState.signer,
      cache: zoState.cache.pubkey,
      margin: zoMargin.pubkey,
      control: zoMargin.control.pubkey,
      openOrders: openOrdersPk,
      dexMarket: zoState.getMarketKeyBySymbol(symbol),
      dexProgram: this.config.dexProgram,
    });
  }

  async settleFunds(symbol: string): Promise<string> {
    const ix = await this.makeSettleFundsIx(symbol);
    const tx = new Transaction().add(ix);
    return processTransaction(this._client.program.provider, tx);
  }

  async getZoMarginAndState(): Promise<[ZoClient.Margin, ZoClient.State]> {
    const [utpAuthority] = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
    const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
    const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);

    return [zoMargin, zoState];
  }

  async getObservationAccounts(): Promise<AccountMeta[]> {
    const [zoMargin, zoState] = await this.getZoMarginAndState();

    return [
      { pubkey: zoMargin.pubkey, isWritable: false, isSigner: false },
      { pubkey: zoMargin.control.pubkey, isWritable: false, isSigner: false },
      { pubkey: zoState.pubkey, isWritable: false, isSigner: false },
      { pubkey: zoState.cache.pubkey, isWritable: false, isSigner: false },
    ];
  }

  async observe(): Promise<UtpObservation> {
    const [zoMargin, zoState] = await this.getZoMarginAndState();
    const [zoMarginAi, zoControlAi, zoStateAi, zoCacheAi] =
      await this._program.provider.connection.getMultipleAccountsInfo([
        zoMargin.pubkey,
        zoMargin.control.pubkey,
        zoState.pubkey,
        zoState.cache.pubkey,
      ]);

    return UtpObservation.fromWasm(observe_zo(zoMarginAi!.data, zoControlAi!.data, zoStateAi!.data, zoCacheAi!.data));
  }
}
