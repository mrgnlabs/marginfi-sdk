import { I64_MAX_BN, MangoAccount, MangoClient, PerpMarket, ZERO_BN } from "@blockworks-foundation/mango-client";
import { observe_mango } from "@mrgnlabs/marginfi-wasm-tools";
import { BN } from "@project-serum/anchor";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { MarginfiClient } from "../..";
import { MarginfiAccount } from "../../marginfiAccount";
import { UtpObservation } from "../../state";
import { UtpAccount, UTPAccountConfig, UtpData } from "../../types";
import { getBankAuthority, getUtpAuthority, processTransaction } from "../../utils";
import {
  makeActivateIx,
  makeCancelPerpOrderIx,
  makeDepositIx,
  makePlacePerpOrderIx,
  makeWithdrawIx,
} from "./instruction";
import { ExpiryType, PerpOrderType, Side, UtpMangoPlacePerpOrderOptions } from "./types";

/**
 * Class encapsulating Mango-specific interactions (internal)
 */
export class UtpMangoAccount implements UtpAccount {
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

  public get _config() {
    return this._client.config;
  }

  public get _program() {
    return this._client.program;
  }

  public get address(): PublicKey {
    return this._utpConfig.address;
  }

  // --- Getters and setters

  /**
   * UTP index
   */
  public get index() {
    return this._config.mango.utpIndex;
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
    return this._config.mango;
  }

  // --- Others

  /**
   * Update instance data from provided data struct.
   */
  update(data: UtpData) {
    this._isActive = data.isActive;
    this._utpConfig = data.accountConfig;
  }

  /**
   * Create transaction instruction to activate Mango.
   *
   * @returns `ActivateUtp` transaction instruction
   */
  async makeActivateIx(/* accountNumber: BN = new BN(0) */) {
    const authoritySeed = Keypair.generate();

    const [mangoAuthorityPk, mangAuthorityBump] = await getUtpAuthority(
      this._config.mango.programId,
      authoritySeed.publicKey,
      this._program.programId
    );
    const [mangoAccountPk] = await getMangoAccount(
      this._config.mango.group.publicKey,
      mangoAuthorityPk,
      new BN(0),
      this._config.mango.programId
    );

    return makeActivateIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginfiAccountPk: this._marginfiAccount.publicKey,
        mangoProgramId: this._config.mango.programId,
        mangoGroupPk: this._config.mango.group.publicKey,
        mangoAccountPk,
        mangoAuthorityPk,
        authorityPk: this._program.provider.wallet.publicKey,
      },
      {
        authoritySeed: authoritySeed.publicKey,
        authorityBump: mangAuthorityBump,
      }
    );
  }

  /**
   * Activate Mango.
   *
   * @returns Transaction signature
   */
  async activate(/* accountNumber: BN = new BN(0) */) {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:mango:activate`);
    debug("Activate Mango UTP");
    const activateIx = await this.makeActivateIx();

    const tx = new Transaction().add(activateIx);
    const sig = await processTransaction(this._program.provider, tx);

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
    const debug = require("debug")(`mfi:utp:${this.address}:mango:deactivate`);
    this.verifyActive();
    debug("Deactivating Mango UTP");

    const sig = await this._marginfiAccount.deactivateUtp(new BN(this.index));

    await this._marginfiAccount.reload();
    return sig;
  }

  /**
   * Create transaction instruction to deposit collateral into the Mango account.
   *
   * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoDepositCollateral` transaction instruction
   */
  async makeDepositIx(proxyTokenAccountPk: PublicKey, amount: BN) {
    const [marginBankAuthorityPk] = await getBankAuthority(this._config.groupPk, this._program.programId);
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const collateralMintIndex = this._config.mango.group.getTokenIndex(this._config.collateralMintPk);

    await this._config.mango.group.loadRootBanks(this._program.provider.connection);
    const rootBankPk = this._config.mango.group.tokens[collateralMintIndex].rootBank;
    const nodeBankPk = this._config.mango.group.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
    const vaultPk = this._config.mango.group.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginfiAccountPk: this._marginfiAccount.publicKey,
        signerPk: this._program.provider.wallet.publicKey,
        bankVaultPk: this._marginfiAccount.group.bank.vault,
        bankAuthorityPk: marginBankAuthorityPk,
        proxyTokenAccountPk,
        mangoRootBankPk: rootBankPk,
        mangoNodeBankPk: nodeBankPk,
        mangoVaultPk: vaultPk,
        mangoGroupPk: this._config.mango.group.publicKey,
        mangoCachePk: this._config.mango.group.mangoCache,
        mangoAccountPk: this._utpConfig.address,
        mangoAuthorityPk,
        mangoProgramId: this._config.mango.programId,
      },
      { amount },
      remainingAccounts
    );
  }

  /**
   * Deposit collateral into the Mango account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async deposit(amount: BN) {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:deposit`);
    this.verifyActive();
    debug("Deposit %s into Mango", amount);

    const proxyTokenAccountKey = Keypair.generate();

    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const createProxyTokenAccountIx = SystemProgram.createAccount({
      fromPubkey: this._program.provider.wallet.publicKey,
      lamports: await this._program.provider.connection.getMinimumBalanceForRentExemption(AccountLayout.span),
      newAccountPubkey: proxyTokenAccountKey.publicKey,
      programId: TOKEN_PROGRAM_ID,
      space: AccountLayout.span,
    });
    const initProxyTokenAccountIx = Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      this._marginfiAccount.group.bank.mint,
      proxyTokenAccountKey.publicKey,
      mangoAuthorityPk
    );
    const depositIx = await this.makeDepositIx(proxyTokenAccountKey.publicKey, amount);

    const ixs = [createProxyTokenAccountIx, initProxyTokenAccountIx, depositIx];
    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this._program.provider, tx, [proxyTokenAccountKey]);
    return sig;
  }

  /**
   * Create transaction instruction to perform a crank deposit into the Mango account (if margin requirements allow).
   *
   * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoDepositCollateralCrank` transaction instruction
   */
  async makeDepositCrankIx(proxyTokenAccountPk: PublicKey, amount: BN) {
    const [marginBankAuthorityPk] = await getBankAuthority(this._config.groupPk, this._program.programId);
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const collateralMintIndex = this._config.mango.group.getTokenIndex(this._config.collateralMintPk);

    await this._config.mango.group.loadRootBanks(this._program.provider.connection);
    const rootBankPk = this._config.mango.group.tokens[collateralMintIndex].rootBank;
    const nodeBankPk = this._config.mango.group.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
    const vaultPk = this._config.mango.group.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginfiAccountPk: this._marginfiAccount.publicKey,
        signerPk: this._program.provider.wallet.publicKey,
        bankVaultPk: this._marginfiAccount.group.bank.vault,
        bankAuthorityPk: marginBankAuthorityPk,
        proxyTokenAccountPk,
        mangoRootBankPk: rootBankPk,
        mangoNodeBankPk: nodeBankPk,
        mangoVaultPk: vaultPk,
        mangoGroupPk: this._config.mango.group.publicKey,
        mangoCachePk: this._config.mango.group.mangoCache,
        mangoAccountPk: this._utpConfig.address,
        mangoAuthorityPk,
        mangoProgramId: this._config.mango.programId,
      },
      { amount },
      remainingAccounts
    );
  }

  /**
   * Create transaction instruction to withdraw from the Mango account to the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoWithdrawCollateral` transaction instruction
   */
  async makeWithdrawIx(amount: BN) {
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const collateralMintIndex = this._config.mango.group.getTokenIndex(this._config.collateralMintPk);

    await this._config.mango.group.loadRootBanks(this._program.provider.connection);
    const rootBankPk = this._config.mango.group.tokens[collateralMintIndex].rootBank;
    const nodeBankPk = this._config.mango.group.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
    const vaultPk = this._config.mango.group.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;

    return makeWithdrawIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginfiAccountPk: this._marginfiAccount.publicKey,
        signerPk: this._program.provider.wallet.publicKey,
        bankVaultPk: this._marginfiAccount.group.bank.vault,
        mangoRootBankPk: rootBankPk,
        mangoNodeBankPk: nodeBankPk,
        mangoVaultPk: vaultPk,
        mangoVaultAuthorityPk: this._config.mango.group.signerKey,
        mangoGroupPk: this._config.mango.group.publicKey,
        mangoCachePk: this._config.mango.group.mangoCache,
        mangoAccountPk: this._utpConfig.address,
        mangoAuthorityPk,
        mangoProgramId: this._config.mango.programId,
      },
      { amount }
    );
  }

  /**
   * Withdraw from the Mango account to the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async withdraw(amount: BN) {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:withdraw`);
    debug("Withdrawing %s from Mango", amount);
    this.verifyActive();

    const depositIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(depositIx);
    const sig = await processTransaction(this._program.provider, tx);

    return sig;
  }

  /**
   * Create list of account metas required to observe a Mango account.
   *
   * @returns `AccountMeta[]` list of account metas
   */
  async getObservationAccounts(): Promise<AccountMeta[]> {
    return [
      { pubkey: this._utpConfig.address, isSigner: false, isWritable: false },
      {
        pubkey: this._config.mango.group.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this._config.mango.group.mangoCache,
        isSigner: false,
        isWritable: false,
      },
    ];
  }

  /**
   * Create transaction instruction to place a perp order.
   *
   * @returns `MangoPlacePerpOrder` transaction instruction
   */
  async makePlacePerpOrderIx(
    market: PerpMarket,
    side: Side,
    price: number,
    quantity: number,
    options?: UtpMangoPlacePerpOrderOptions
  ) {
    options = options ? options : {};
    let { maxQuoteQuantity, limit, orderType, clientOrderId, reduceOnly, expiryTimestamp, expiryType } = options;
    limit = limit || 20;
    clientOrderId = clientOrderId === undefined ? 0 : clientOrderId;
    orderType = orderType || PerpOrderType.ImmediateOrCancel;
    expiryType = expiryType || ExpiryType.Absolute;

    const [nativePrice, nativeQuantity] = market.uiToNativePriceQuantity(price, quantity);
    const maxQuoteQuantityLots = maxQuoteQuantity ? market.uiQuoteToLots(maxQuoteQuantity) : I64_MAX_BN;

    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    const args = {
      side,
      price: nativePrice,
      maxBaseQuantity: nativeQuantity,
      maxQuoteQuantity: maxQuoteQuantityLots,
      clientOrderId: new BN(clientOrderId),
      orderType,
      reduceOnly,
      expiryTimestamp: expiryTimestamp ? new BN(Math.floor(expiryTimestamp)) : ZERO_BN,
      limit: new BN(limit), // one byte; max 255
      expiryType,
    };

    return makePlacePerpOrderIx(
      this._program,
      {
        marginfiAccountPk: this._marginfiAccount.publicKey,
        marginfiGroupPk: this._marginfiAccount.group.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        mangoAuthorityPk,
        mangoProgramId: this._config.mango.programId,
        mangoGroupPk: this._config.mango.group.publicKey,
        mangoAccountPk: this._utpConfig.address,
        mangoCachePk: this._config.mango.group.mangoCache,
        mangoPerpMarketPk: market.publicKey,
        mangoBidsPk: market.bids,
        mangoAsksPk: market.asks,
        mangoEventQueuePk: market.eventQueue,
      },
      // @ts-ignore
      { args },
      remainingAccounts
    );
  }

  private verifyActive() {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:verify-active`);
    if (!this.isActive) {
      debug("Utp isn't active");
      throw new Error("Utp isn't active");
    }
  }

  /**
   * Place a perp order.
   *
   * @returns Transaction signature
   */
  async placePerpOrder(
    perpMarket: PerpMarket,
    side: any,
    price: number,
    quantity: number,
    options?: UtpMangoPlacePerpOrderOptions
  ) {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:place-perp-order2`);
    debug("Placing a %s perp order for %s @ %s of %s, opt: %o", side, quantity, price, perpMarket.publicKey, options);
    this.verifyActive();

    const placePerpOrderIx = await this.makePlacePerpOrderIx(perpMarket, side, price, quantity, options);
    const tx = new Transaction();
    tx.add(placePerpOrderIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Signature %s", sig);
    return sig;
  }

  /**
   * Create transaction instruction to cancel a perp order.
   *
   * @returns `MangoCancelPerpOrder` transaction instruction
   */
  async makeCancelPerpOrderIx(market: PerpMarket, orderId: BN, invalidIdOk: boolean) {
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    return makeCancelPerpOrderIx(
      this._program,
      {
        marginfiAccountPk: this._marginfiAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        mangoAuthorityPk,
        mangoProgramId: this._config.mango.programId,
        mangoGroupPk: this._config.mango.group.publicKey,
        mangoAccountPk: this._utpConfig.address,
        mangoPerpMarketPk: market.publicKey,
        mangoBidsPk: market.bids,
        mangoAsksPk: market.asks,
      },
      { orderId, invalidIdOk }
    );
  }

  /**
   * Cancel a perp order.
   *
   * @returns Transaction signature
   */
  async cancelPerpOrder(perpMarket: PerpMarket, orderId: BN, invalidIdOk: boolean) {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:cancel-perp-order`);
    debug("Cancelling perp order %s", orderId);
    this.verifyActive();

    const cancelPerpOrderIx = await this.makeCancelPerpOrderIx(perpMarket, orderId, invalidIdOk);
    const tx = new Transaction();
    tx.add(cancelPerpOrderIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Signature %s", sig);
    return sig;
  }
  async getUtpAuthority() {
    const utpAuthority = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    return utpAuthority;
  }
  async getUtpAccount(accountNumber: BN = new BN(0)) {
    const [utpAuthorityPk] = await this.getUtpAuthority();
    const [utpAccountPk] = await getMangoAccount(
      this._config.mango.group.publicKey,
      utpAuthorityPk,
      accountNumber,
      this._config.mango.programId
    );
    return utpAccountPk;
  }

  /**
   * Refresh and retrieve the health cache for the Mango account, directly from the mango account.
   *
   * @returns Health cache for the Mango UTP
   */
  async observe(): Promise<UtpObservation> {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:local-observe`);
    debug("Observing Locally");
    const [mangoGroupAi, mangoAccountAi, mangoCacheAi] =
      await this._program.provider.connection.getMultipleAccountsInfo([
        this._config.mango.group.publicKey,
        this._utpConfig.address,
        this._config.mango.group.mangoCache,
      ]);

    if (!mangoGroupAi) throw Error(`Mango group account not found: ${this._config.mango.group.publicKey}`);
    if (!mangoAccountAi) throw Error(`Mango account not found: ${this._utpConfig.address}`);
    if (!mangoCacheAi) throw Error(`Mango cache not found: ${this._config.mango.group.mangoCache}`);

    const timestamp = Math.round(new Date().getTime() / 1000);
    return UtpObservation.fromWasm(
      observe_mango(
        mangoGroupAi.data as Buffer,
        mangoAccountAi.data as Buffer,
        mangoCacheAi.data as Buffer,
        BigInt(timestamp)
      )
    );
  }

  async getMangoClientAndAccount(): Promise<[MangoClient, MangoAccount]> {
    const mangoClient = new MangoClient(this._client.program.provider.connection, this._client.config.mango.programId);
    const mangoAccount = await mangoClient.getMangoAccount(
      this._utpConfig.address,
      this._config.mango.group.dexProgramId
    );

    return [mangoClient, mangoAccount];
  }
}

/**
 * Compute the Mango account PDA tied to the specified user.
 */
export async function getMangoAccount(
  mangoGroupPk: PublicKey,
  authority: PublicKey,
  accountNumber: BN,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [mangoGroupPk.toBytes(), authority.toBytes(), new BN(accountNumber).toBuffer("le", 8)],
    programId
  );
}
