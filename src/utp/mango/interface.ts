import {
  I64_MAX_BN,
  PerpMarket,
  ZERO_BN,
} from '@blockworks-foundation/mango-client';
import { observe_mango } from '@mrgnlabs/utp-utils';
import { BN, Program } from '@project-serum/anchor';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { MarginfiConfig } from '../../config';
import { MarginfiIdl } from '../../idl';
import { MarginAccount } from '../../marginAccount';
import { UtpCache } from '../../state';
import {
  InstructionLayout,
  UtpAccount,
  UTPAccountConfig,
  UtpData,
} from '../../types';
import {
  getBankAuthority,
  getUtpAuthority,
  processTransaction,
} from '../../utils';
import {
  makeActivateIx,
  makeCancelPerpOrderIx,
  makeDepositIx,
  makeDepositCrankIx,
  makeObserveIx,
  makePlacePerpOrderIx,
  makeWithdrawIx,
} from './instruction';
import { PerpOrderType, UtpMangoPlacePerpOrderOptions } from './types';

/**
 * Class encapsulating Mango-specific interactions (internal)
 */
export class MangoAccount implements UtpAccount {
  private _program: Program<MarginfiIdl>;
  private _config: MarginfiConfig;
  private _marginAccount: MarginAccount;

  private _isActive: boolean;
  private _utpConfig: UTPAccountConfig;
  private _utpCache: UtpCache;

  /** @internal */
  constructor(
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    mfAccount: MarginAccount,
    accountData: UtpData
  ) {
    this._config = config;
    this._program = program;
    this._marginAccount = mfAccount;

    this._isActive = accountData.isActive;
    this._utpConfig = accountData.accountConfig;
    this._utpCache = UtpCache.fromAccountData(accountData.accountCache);
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
    return this._utpConfig;
  }

  /**
   * UTP-specific state
   */
  public get state() {
    return this._utpCache;
  }

  // --- Others

  /**
   * Update instance data from provided data struct.
   *
   * @internal
   */
  update(data: UtpData) {
    this._isActive = data.isActive;
    this._utpConfig = data.accountConfig;
    this._utpCache = UtpCache.fromAccountData(data.accountCache);
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
        marginAccountPk: this._marginAccount.publicKey,
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
    const activateIx = await this.makeActivateIx();

    const tx = new Transaction().add(activateIx);
    const sig = await processTransaction(this._program.provider, tx);

    await this._marginAccount.fetch(); // Required to update the internal UTP address
    await this.observe();
    return sig;
  }

  /**
   * Create transaction instruction to deactivate Mango.
   *
   * @returns `DeactivateUtp` transaction instruction
   */
  async makeDeactivateIx() {
    return this._marginAccount.makeDeactivateUtpIx(new BN(this.index));
  }

  /**
   * Deactivate UTP.
   *
   * @returns Transaction signature
   */
  async deactivate() {
    const sig = await this._marginAccount.deactivateUtp(new BN(this.index));

    await this._marginAccount.fetch();
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
    const [marginBankAuthorityPk] = await getBankAuthority(
      this._config.groupPk,
      this._program.programId
    );
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const collateralMintIndex = this._config.mango.group.getTokenIndex(
      this._config.collateralMintPk
    );

    await this._config.mango.group.loadRootBanks(
      this._program.provider.connection
    );
    const rootBankPk =
      this._config.mango.group.tokens[collateralMintIndex].rootBank;
    const nodeBankPk =
      this._config.mango.group.rootBankAccounts[collateralMintIndex]!
        .nodeBankAccounts[0].publicKey;
    const vaultPk =
      this._config.mango.group.rootBankAccounts[collateralMintIndex]!
        .nodeBankAccounts[0].vault;

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        bankVaultPk: this._marginAccount.group.bank.vault,
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
      { amount }
    );
  }

  /**
   * Deposit collateral into the Mango account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async deposit(amount: BN) {
    const proxyTokenAccountKey = Keypair.generate();

    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const createProxyTokenAccountIx = SystemProgram.createAccount({
      fromPubkey: this._program.provider.wallet.publicKey,
      lamports:
        await this._program.provider.connection.getMinimumBalanceForRentExemption(
          AccountLayout.span
        ),
      newAccountPubkey: proxyTokenAccountKey.publicKey,
      programId: TOKEN_PROGRAM_ID,
      space: AccountLayout.span,
    });
    const initProxyTokenAccountIx = Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      this._marginAccount.group.bank.mint,
      proxyTokenAccountKey.publicKey,
      mangoAuthorityPk
    );
    const depositIx = await this.makeDepositIx(
      proxyTokenAccountKey.publicKey,
      amount
    );

    const ixs = [
      createProxyTokenAccountIx,
      initProxyTokenAccountIx,
      ...(await this._marginAccount.createChainedIxs(
        depositIx,
        InstructionLayout.ObserveAndCheckAfter
      )),
    ];

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this._program.provider, tx, [
      proxyTokenAccountKey,
    ]);

    await this.observe();
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
    const [marginBankAuthorityPk] = await getBankAuthority(
      this._config.groupPk,
      this._program.programId
    );
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const collateralMintIndex = this._config.mango.group.getTokenIndex(
      this._config.collateralMintPk
    );

    await this._config.mango.group.loadRootBanks(
      this._program.provider.connection
    );
    const rootBankPk =
      this._config.mango.group.tokens[collateralMintIndex].rootBank;
    const nodeBankPk =
      this._config.mango.group.rootBankAccounts[collateralMintIndex]!
        .nodeBankAccounts[0].publicKey;
    const vaultPk =
      this._config.mango.group.rootBankAccounts[collateralMintIndex]!
        .nodeBankAccounts[0].vault;

    return makeDepositCrankIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        bankVaultPk: this._marginAccount.group.bank.vault,
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
      { amount }
    );
  }

  /**
   * Perform a crank deposit into the Mango account (if margin requirements allow).
   *
   * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async depositCrank(amount: BN) {
    const proxyTokenAccountKey = Keypair.generate();

    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const createProxyTokenAccountIx = SystemProgram.createAccount({
      fromPubkey: this._program.provider.wallet.publicKey,
      lamports:
        await this._program.provider.connection.getMinimumBalanceForRentExemption(
          AccountLayout.span
        ),
      newAccountPubkey: proxyTokenAccountKey.publicKey,
      programId: TOKEN_PROGRAM_ID,
      space: AccountLayout.span,
    });
    const initProxyTokenAccountIx = Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      this._marginAccount.group.bank.mint,
      proxyTokenAccountKey.publicKey,
      mangoAuthorityPk
    );
    const depositIx = await this.makeDepositCrankIx(
      proxyTokenAccountKey.publicKey,
      amount
    );

    const ixs = [
      createProxyTokenAccountIx,
      initProxyTokenAccountIx,
      ...(await this._marginAccount.createChainedIxs(
        depositIx,
        InstructionLayout.HalfSandwichObserveCheck,
        this.index
      )),
    ];

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this._program.provider, tx, [
      proxyTokenAccountKey,
    ]);

    await this.observe();
    return sig;
  }

  /**
   * Create transaction instruction to withdraw from the Mango account to the margin account.
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
    const collateralMintIndex = this._config.mango.group.getTokenIndex(
      this._config.collateralMintPk
    );

    await this._config.mango.group.loadRootBanks(
      this._program.provider.connection
    );
    const rootBankPk =
      this._config.mango.group.tokens[collateralMintIndex].rootBank;
    const nodeBankPk =
      this._config.mango.group.rootBankAccounts[collateralMintIndex]!
        .nodeBankAccounts[0].publicKey;
    const vaultPk =
      this._config.mango.group.rootBankAccounts[collateralMintIndex]!
        .nodeBankAccounts[0].vault;

    return makeWithdrawIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        bankVaultPk: this._marginAccount.group.bank.vault,
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
   * Withdraw from the Mango account to the margin account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async withdraw(amount: BN) {
    const depositIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(depositIx);
    const sig = await processTransaction(this._program.provider, tx);

    await this.observe();
    return sig;
  }

  /**
   * Create transaction instruction to observe and cache the health of the Mango account.
   *
   * @returns `MangoObserve` transaction instruction
   */
  async makeObserveIx() {
    return makeObserveIx(this._program, {
      marginAccountPk: this._marginAccount.publicKey,
      mangoProgramId: this._config.mango.programId,
      mangoGroupPk: this._config.mango.group.publicKey,
      mangoCachePk: this._config.mango.group.mangoCache,
      mangoAccountPk: this._utpConfig.address,
    });
  }

  /**
   * Observe and cache the health of the Mango account.
   *
   * @returns Transaction signature
   */
  async observe() {
    const observeIx = await this.makeObserveIx();
    const tx = new Transaction().add(observeIx);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create transaction instruction to place a perp order.
   *
   * @returns `MangoPlacePerpOrder` transaction instruction
   */
  async makePlacePerpOrderIx(
    market: PerpMarket,
    side: any,
    price: number,
    quantity: number,
    options?: UtpMangoPlacePerpOrderOptions
  ) {
    options = options ? options : {};
    let {
      maxQuoteQuantity,
      limit,
      orderType,
      clientOrderId,
      reduceOnly,
      expiryTimestamp,
    } = options;
    limit = limit || 20;
    clientOrderId = clientOrderId === undefined ? 0 : clientOrderId;
    orderType = orderType || PerpOrderType.ImmediateOrCancel;

    const [nativePrice, nativeQuantity] = market.uiToNativePriceQuantity(
      price,
      quantity
    );
    const maxQuoteQuantityLots = maxQuoteQuantity
      ? market.uiQuoteToLots(maxQuoteQuantity)
      : I64_MAX_BN;

    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const args = {
      side,
      price: nativePrice,
      maxBaseQuantity: nativeQuantity,
      maxQuoteQuantity: maxQuoteQuantityLots,
      clientOrderId: new BN(clientOrderId),
      orderType,
      reduceOnly,
      expiryTimestamp: expiryTimestamp
        ? new BN(Math.floor(expiryTimestamp))
        : ZERO_BN,
      limit: new BN(limit), // one byte; max 255
    };

    return makePlacePerpOrderIx(
      this._program,
      {
        marginAccountPk: this._marginAccount.publicKey,
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
      { args }
    );
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
    const placePerpOrderIx = await this.makePlacePerpOrderIx(
      perpMarket,
      side,
      price,
      quantity,
      options
    );
    const ixs = await this._marginAccount.createChainedIxs(
      placePerpOrderIx, // TODO: need to crank/consume?
      InstructionLayout.ObserveAndCheckAfter
    );

    const tx = new Transaction();
    tx.add(...ixs);
    const sig = await processTransaction(this._program.provider, tx);

    await this.observe();
    return sig;
  }

  /**
   * Create transaction instruction to cancel a perp order.
   *
   * @returns `MangoCancelPerpOrder` transaction instruction
   */
  async makeCancelPerpOrderIx(
    market: PerpMarket,
    orderId: BN,
    invalidIdOk: boolean
  ) {
    const [mangoAuthorityPk] = await getUtpAuthority(
      this._config.mango.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    return makeCancelPerpOrderIx(
      this._program,
      {
        marginAccountPk: this._marginAccount.publicKey,
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
  async cancelPerpOrder(
    perpMarket: PerpMarket,
    orderId: BN,
    invalidIdOk: boolean
  ) {
    const cancelPerpOrderIx = await this.makeCancelPerpOrderIx(
      perpMarket,
      orderId,
      invalidIdOk
    );
    const ixs = await this._marginAccount.createChainedIxs(
      cancelPerpOrderIx, // TODO: need to crank/consume?
      InstructionLayout.ObserveAndCheckAfter
    );

    const tx = new Transaction();
    tx.add(...ixs);
    const sig = await processTransaction(this._program.provider, tx);

    await this.observe();
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
  async localObserve(): Promise<UtpCache> {
    const [mangoGroupAi, mangoAccountAi, mangoCacheAi] =
      await this._program.provider.connection.getMultipleAccountsInfo([
        this._config.mango.group.publicKey,
        this._utpConfig.address,
        this._config.mango.group.mangoCache,
      ]);

    if (!mangoGroupAi)
      throw Error(
        `Mango group account not found: ${this._config.mango.group.publicKey}`
      );
    if (!mangoAccountAi)
      throw Error(`Mango account not found: ${this._utpConfig.address}`);
    if (!mangoCacheAi)
      throw Error(
        `Mango cache not found: ${this._config.mango.group.mangoCache}`
      );

    const timestamp = Math.round(new Date().getTime() / 1000);
    return UtpCache.fromWasm(
      observe_mango(
        mangoGroupAi.data as Buffer,
        mangoAccountAi.data as Buffer,
        mangoCacheAi.data as Buffer,
        BigInt(timestamp)
      )
    );
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
    [
      mangoGroupPk.toBytes(),
      authority.toBytes(),
      new BN(accountNumber).toBuffer('le', 8),
    ],
    programId
  );
}
