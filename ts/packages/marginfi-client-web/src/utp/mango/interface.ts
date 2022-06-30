import {
  I64_MAX_BN,
  MangoAccount,
  MangoClient,
  MangoGroup,
  PerpMarket,
  ZERO_BN,
} from "@blockworks-foundation/mango-client";
import { observe_mango } from "@mrgnlabs/marginfi-wasm-tools-web";
import { BN } from "@project-serum/anchor";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { MarginfiClient } from "../..";
import { MarginfiAccount } from "../../marginfiAccount";
import { UtpObservation } from "../../state";
import { InstructionsWrapper, UtpAccount, UTPAccountConfig, UtpData } from "../../types";
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
  /** @internal */
  private _client: MarginfiClient;
  /** @internal */
  private _marginfiAccount: MarginfiAccount;
  /** @internal */
  private _isActive: boolean;
  /** @internal */
  private _utpConfig: UTPAccountConfig;

  /** @internal */
  constructor(client: MarginfiClient, mfAccount: MarginfiAccount, accountData: UtpData) {
    this._client = client;

    this._marginfiAccount = mfAccount;

    this._isActive = accountData.isActive;
    this._utpConfig = accountData.accountConfig;
  }
  /** @internal */
  public get _config() {
    return this._client.config;
  }
  /** @internal */
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
  async makeActivateIx(): Promise<InstructionsWrapper> {
    const authoritySeed = Keypair.generate();

    const [mangoAuthorityPk, mangAuthorityBump] = await getUtpAuthority(
      this._config.mango.programId,
      authoritySeed.publicKey,
      this._program.programId
    );
    const [mangoAccountPk] = await getMangoAccountPda(
      this._config.mango.groupConfig.publicKey,
      mangoAuthorityPk,
      new BN(0),
      this._config.mango.programId
    );

    return {
      instructions: [
        await makeActivateIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            mangoProgramId: this._config.mango.programId,
            mangoGroupPk: this._config.mango.groupConfig.publicKey,
            mangoAccountPk,
            mangoAuthorityPk,
            authorityPk: this._program.provider.wallet.publicKey,
          },
          {
            authoritySeed: authoritySeed.publicKey,
            authorityBump: mangAuthorityBump,
          }
        ),
      ],
      keys: [],
    };
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

    const tx = new Transaction().add(...activateIx.instructions);
    const sig = await processTransaction(this._program.provider, tx);

    await this._marginfiAccount.reload(); // Required to update the internal UTP address
    return sig;
  }

  /**
   * Create transaction instruction to deactivate Mango.
   *
   * @returns `DeactivateUtp` transaction instruction
   */
  async makeDeactivateIx(): Promise<InstructionsWrapper> {
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
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoDepositCollateral` transaction instruction
   */
  async makeDepositIx(amount: BN): Promise<InstructionsWrapper> {
    const proxyTokenAccountKey = Keypair.generate();
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const [marginBankAuthorityPk] = await getBankAuthority(this._config.groupPk, this._program.programId);
    const mangoGroup = await this.getMangoGroup();

    const collateralMintIndex = mangoGroup.getTokenIndex(this._config.collateralMintPk);
    await mangoGroup.loadRootBanks(this._program.provider.connection);
    const rootBankPk = mangoGroup.tokens[collateralMintIndex].rootBank;
    const nodeBankPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
    const vaultPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

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

    return {
      instructions: [
        createProxyTokenAccountIx,
        initProxyTokenAccountIx,
        await makeDepositIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            signerPk: this._program.provider.wallet.publicKey,
            bankVaultPk: this._marginfiAccount.group.bank.vault,
            bankAuthorityPk: marginBankAuthorityPk,
            proxyTokenAccountPk: proxyTokenAccountKey.publicKey,
            mangoRootBankPk: rootBankPk,
            mangoNodeBankPk: nodeBankPk,
            mangoVaultPk: vaultPk,
            mangoGroupPk: mangoGroup.publicKey,
            mangoCachePk: mangoGroup.mangoCache,
            mangoAccountPk: this._utpConfig.address,
            mangoAuthorityPk,
            mangoProgramId: this._config.mango.programId,
          },
          { amount },
          remainingAccounts
        ),
      ],
      keys: [proxyTokenAccountKey],
    };
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

    const depositIx = await this.makeDepositIx(amount);
    const tx = new Transaction().add(...depositIx.instructions);
    const sig = await processTransaction(this._program.provider, tx, [...depositIx.keys]);

    return sig;
  }

  /**
   * Create transaction instruction to withdraw from the Mango account to the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoWithdrawCollateral` transaction instruction
   */
  async makeWithdrawIx(amount: BN): Promise<InstructionsWrapper> {
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const mangoGroup = await this.getMangoGroup();
    const collateralMintIndex = mangoGroup.getTokenIndex(this._config.collateralMintPk);

    await mangoGroup.loadRootBanks(this._program.provider.connection);
    const rootBankPk = mangoGroup.tokens[collateralMintIndex].rootBank;
    const nodeBankPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
    const vaultPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;

    return {
      instructions: [
        await makeWithdrawIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            signerPk: this._program.provider.wallet.publicKey,
            bankVaultPk: this._marginfiAccount.group.bank.vault,
            mangoRootBankPk: rootBankPk,
            mangoNodeBankPk: nodeBankPk,
            mangoVaultPk: vaultPk,
            mangoVaultAuthorityPk: mangoGroup.signerKey,
            mangoGroupPk: mangoGroup.publicKey,
            mangoCachePk: mangoGroup.mangoCache,
            mangoAccountPk: this._utpConfig.address,
            mangoAuthorityPk,
            mangoProgramId: this._config.mango.programId,
          },
          { amount }
        ),
      ],
      keys: [],
    };
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
    const tx = new Transaction().add(...depositIx.instructions);
    const sig = await processTransaction(this._program.provider, tx);

    return sig;
  }

  /**
   * Create list of account metas required to observe a Mango account.
   *
   * @returns `AccountMeta[]` list of account metas
   */
  async getObservationAccounts(): Promise<AccountMeta[]> {
    const mangoGroup = await this.getMangoGroup();
    return [
      { pubkey: this._utpConfig.address, isSigner: false, isWritable: false },
      {
        pubkey: mangoGroup.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: mangoGroup.mangoCache,
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
  ): Promise<InstructionsWrapper> {
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

    const mangoGroup = await this.getMangoGroup();

    return {
      instructions: [
        await makePlacePerpOrderIx(
          this._program,
          {
            marginfiAccountPk: this._marginfiAccount.publicKey,
            marginfiGroupPk: this._marginfiAccount.group.publicKey,
            authorityPk: this._program.provider.wallet.publicKey,
            mangoAuthorityPk,
            mangoProgramId: this._config.mango.programId,
            mangoGroupPk: mangoGroup.publicKey,
            mangoAccountPk: this._utpConfig.address,
            mangoCachePk: mangoGroup.mangoCache,
            mangoPerpMarketPk: market.publicKey,
            mangoBidsPk: market.bids,
            mangoAsksPk: market.asks,
            mangoEventQueuePk: market.eventQueue,
          },
          // @ts-ignore
          { args },
          remainingAccounts
        ),
      ],
      keys: [],
    };
  }

  /** @internal */
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
    tx.add(...placePerpOrderIx.instructions);
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

    return {
      instructions: [
        await makeCancelPerpOrderIx(
          this._program,
          {
            marginfiAccountPk: this._marginfiAccount.publicKey,
            authorityPk: this._program.provider.wallet.publicKey,
            mangoAuthorityPk,
            mangoProgramId: this._config.mango.programId,
            mangoGroupPk: this._config.mango.groupConfig.publicKey,
            mangoAccountPk: this._utpConfig.address,
            mangoPerpMarketPk: market.publicKey,
            mangoBidsPk: market.bids,
            mangoAsksPk: market.asks,
          },
          { orderId, invalidIdOk }
        ),
      ],
      keys: [],
    };
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
    tx.add(...cancelPerpOrderIx.instructions);
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

  /** @internal */
  async getUtpAccountAddress(accountNumber: BN = new BN(0)) {
    const [utpAuthorityPk] = await this.getUtpAuthority();
    const [utpAccountPk] = await getMangoAccountPda(
      this._config.mango.groupConfig.publicKey,
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
    const mangoGroup = await this.getMangoGroup();
    const [mangoGroupAi, mangoAccountAi, mangoCacheAi] =
      await this._program.provider.connection.getMultipleAccountsInfo([
        this._config.mango.groupConfig.publicKey,
        this._utpConfig.address,
        mangoGroup.mangoCache,
      ]);

    if (!mangoGroupAi) throw Error(`Mango group account not found: ${this._config.mango.groupConfig.publicKey}`);
    if (!mangoAccountAi) throw Error(`Mango account not found: ${this._utpConfig.address}`);
    if (!mangoCacheAi) throw Error(`Mango cache not found: ${mangoGroup.mangoCache}`);

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

  /** @internal @deprecated */
  async getMangoClientAndAccount(): Promise<[MangoClient, MangoAccount]> {
    const mangoClient = this.getMangoClient();
    const mangoGroup = await this.getMangoGroup();
    const mangoAccount = await mangoClient.getMangoAccount(this._utpConfig.address, mangoGroup.dexProgramId);

    return [mangoClient, mangoAccount];
  }

  async getMangoAccount(mangoGroup?: MangoGroup): Promise<MangoAccount> {
    if (!mangoGroup) {
      mangoGroup = await this.getMangoGroup();
    }

    const mangoClient = this.getMangoClient();
    const mangoAccount = await mangoClient.getMangoAccount(this._utpConfig.address, mangoGroup.dexProgramId);

    return mangoAccount;
  }

  getMangoClient(): MangoClient {
    return new MangoClient(this._client.program.provider.connection, this._client.config.mango.programId);
  }

  async getMangoGroup(): Promise<MangoGroup> {
    const mangoClient = this.getMangoClient();
    return mangoClient.getMangoGroup(this._config.mango.groupConfig.publicKey);
  }
}

/**
 * Compute the Mango account PDA tied to the specified user.
 * @internal
 */
export async function getMangoAccountPda(
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
