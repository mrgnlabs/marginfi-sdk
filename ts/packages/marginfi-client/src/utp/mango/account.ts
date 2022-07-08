import {
  I64_MAX_BN,
  MangoAccount,
  MangoAccountLayout,
  MangoCache,
  MangoCacheLayout,
  MangoClient,
  MangoGroup,
  PerpMarket,
  ZERO_BN,
} from "@blockworks-foundation/mango-client";
import { BN } from "@project-serum/anchor";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { MarginfiClient } from "../..";
import MarginfiAccount from "../../account";
import { DUST_THRESHOLD } from "../../constants";
import { InstructionsWrapper, UiAmount, UtpData } from "../../types";
import { getBankAuthority, getUtpAuthority, processTransaction, toNumber, uiToNative } from "../../utils";
import UtpAccount from "../account";
import { UtpObservation } from "../observation";
import instructions from "./instructions";
import {
  ExpiryType,
  MangoOrderSide,
  MangoPerpOrderType,
  UtpMangoPlacePerpOrderArgs,
  UtpMangoPlacePerpOrderOptions,
} from "./types";

/**
 * Class encapsulating Mango-specific interactions (internal)
 */
export class UtpMangoAccount extends UtpAccount {
  /** @internal */
  constructor(client: MarginfiClient, marginfiAccount: MarginfiAccount, accountData: UtpData) {
    super(client, marginfiAccount, accountData.isActive, accountData.accountConfig);
  }

  // --- Getters / Setters

  /**
   * UTP-specific config
   */
  public get config() {
    return this._config.mango;
  }

  // --- Others

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
        await instructions.makeActivateIx(
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
  async activate() {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:mango:activate`);
    debug("Activate Mango UTP");
    const activateIx = await this.makeActivateIx();

    const tx = new Transaction().add(...activateIx.instructions);
    const sig = await processTransaction(this._program.provider, tx);
    await this._marginfiAccount.reload(); // Required to update the internal UTP address
    debug("Sig %s", sig);
    return sig;
  }

  /**
   * Create transaction instruction to deactivate Mango.
   *
   * @returns `DeactivateUtp` transaction instruction
   */
  async makeDeactivateIx(): Promise<InstructionsWrapper> {
    return this._marginfiAccount.makeDeactivateUtpIx(this.index);
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

    const sig = await this._marginfiAccount.deactivateUtp(this.index);
    debug("Sig %s", sig);
    await this._marginfiAccount.reload();
    return sig;
  }

  /**
   * Create transaction instruction to deposit collateral into the Mango account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoDepositCollateral` transaction instruction
   */
  async makeDepositIx(amount: UiAmount): Promise<InstructionsWrapper> {
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
        await instructions.makeDepositIx(
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
          { amount: uiToNative(amount) },
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
  async deposit(amount: UiAmount) {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:deposit`);
    this.verifyActive();

    debug("Deposit %s into Mango", amount);

    const depositIx = await this.makeDepositIx(amount);
    const tx = new Transaction().add(...depositIx.instructions);
    const sig = await processTransaction(this._program.provider, tx, [...depositIx.keys]);
    debug("Sig %s", sig);
    await this._marginfiAccount.reload();
    return sig;
  }

  /**
   * Create transaction instruction to withdraw from the Mango account to the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `MangoWithdrawCollateral` transaction instruction
   */
  async makeWithdrawIx(amount: UiAmount): Promise<InstructionsWrapper> {
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
        await instructions.makeWithdrawIx(
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
          { amount: uiToNative(amount) }
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
  async withdraw(amount: UiAmount) {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:withdraw`);
    debug("Withdrawing %s from Mango", amount);
    this.verifyActive();

    const depositIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(...depositIx.instructions);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Sig %s", sig);
    await this._marginfiAccount.reload();
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
    side: MangoOrderSide,
    price: UiAmount,
    quantity: UiAmount,
    options?: UtpMangoPlacePerpOrderOptions
  ): Promise<InstructionsWrapper> {
    let priceNb = toNumber(price);
    let quantityNb = toNumber(quantity);

    options = options ? options : {};
    let { maxQuoteQuantity, limit, orderType, clientOrderId, reduceOnly, expiryTimestamp, expiryType } = options;
    limit = limit || 20;
    maxQuoteQuantity = maxQuoteQuantity ? toNumber(maxQuoteQuantity) : undefined;
    clientOrderId = clientOrderId === undefined ? 0 : clientOrderId;
    orderType = orderType || MangoPerpOrderType.ImmediateOrCancel;
    expiryType = expiryType || ExpiryType.Absolute;

    const [nativePrice, nativeQuantity] = market.uiToNativePriceQuantity(priceNb, quantityNb);
    const maxQuoteQuantityLots = maxQuoteQuantity ? market.uiQuoteToLots(maxQuoteQuantity) : I64_MAX_BN;

    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    const args: UtpMangoPlacePerpOrderArgs = {
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
        await instructions.makePlacePerpOrderIx(
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
          { args },
          remainingAccounts
        ),
      ],
      keys: [],
    };
  }

  /**
   * Place a perp order.
   *
   * @returns Transaction signature
   */
  async placePerpOrder(
    perpMarket: PerpMarket,
    side: any,
    price: UiAmount,
    quantity: UiAmount,
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
        await instructions.makeCancelPerpOrderIx(
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

  /** @internal */
  private verifyActive() {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:verify-active`);
    if (!this.isActive) {
      debug("Utp isn't active");
      throw new Error("Utp isn't active");
    }
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
    const [mangoAccountAi, mangoCacheAi] = await this._program.provider.connection.getMultipleAccountsInfo([
      this._utpConfig.address,
      mangoGroup.mangoCache,
    ]);

    if (!mangoAccountAi) throw Error(`Mango account not found: ${this._utpConfig.address}`);
    if (!mangoCacheAi) throw Error(`Mango cache not found: ${mangoGroup.mangoCache}`);

    const mangoCacheDecoded = MangoCacheLayout.decode(mangoCacheAi.data);
    const mangoCache = new MangoCache(mangoGroup.mangoCache, mangoCacheDecoded);

    const mangoAccountDecoded = MangoAccountLayout.decode(mangoAccountAi.data);
    const mangoAccount = new MangoAccount(this._utpConfig.address, mangoAccountDecoded);

    const totalCollateralInit = new BigNumber(mangoAccount.getAssetsVal(mangoGroup, mangoCache, "Init").toString());
    const marginRequirementInit = new BigNumber(mangoAccount.getLiabsVal(mangoGroup, mangoCache, "Init").toString());
    const freeCollateral = totalCollateralInit.minus(marginRequirementInit);

    const totalCollateralEquity = new BigNumber(mangoAccount.getAssetsVal(mangoGroup, mangoCache).toString());
    const marginRequirementEquity = new BigNumber(mangoAccount.getLiabsVal(mangoGroup, mangoCache).toString());
    const equity = totalCollateralEquity.minus(marginRequirementEquity);

    const isRebalanceDepositNeeded = totalCollateralInit.lt(marginRequirementInit);
    const maxRebalanceDepositAmount = BigNumber.max(0, marginRequirementInit.minus(totalCollateralInit));
    const isEmpty = totalCollateralEquity.lt(DUST_THRESHOLD);

    const observation = new UtpObservation({
      timestamp: new Date(),
      equity,
      freeCollateral,
      liquidationValue: equity,
      isRebalanceDepositNeeded,
      maxRebalanceDepositAmount,
      isEmpty,
    });
    this._cachedObservation = observation;
    return observation;
  }

  getMangoClient(): MangoClient {
    return new MangoClient(this._client.program.provider.connection, this._client.config.mango.programId);
  }

  async getMangoAccount(mangoGroup?: MangoGroup): Promise<MangoAccount> {
    if (!mangoGroup) {
      mangoGroup = await this.getMangoGroup();
    }

    const mangoClient = this.getMangoClient();
    const mangoAccount = await mangoClient.getMangoAccount(this._utpConfig.address, mangoGroup.dexProgramId);

    return mangoAccount;
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
