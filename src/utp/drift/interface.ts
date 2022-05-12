import { MarketsAccount, StateAccount, UserAccount } from '@drift-labs/sdk';
import { Idl, Program, BN } from '@project-serum/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { MarginfiIdl } from '../../idl';
import {
  UTPAccountConfig,
  UtpData,
  UtpAccount,
  InstructionLayout,
} from '../../types';
import {
  getBankAuthority,
  getUtpAuthority,
  processTransaction,
} from '../../utils';
import {
  makeActivateIx,
  makeClosePositionIx,
  makeDepositCrankIx,
  makeDepositIx,
  makeObserveIx,
  makeOpenPositionIx,
  makeWithdrawIx,
} from './instruction';
import DriftIdl from '@drift-labs/sdk/src/idl/clearing_house.json';
import * as DriftSDK from '@drift-labs/sdk';
import { MarginAccount } from '../../marginAccount';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { UtpCache } from '../../state';
import { DriftClosePositionArgs, DriftOpenPositionArgs } from './types';

import { MarginfiConfig } from '../../config';
import { observe_drift } from '@mrgnlabs/utp-utils';

/**
 * Class encapsulating Drift-specific interactions (internal)
 */
export class DriftAccount implements UtpAccount {
  private _program: Program<MarginfiIdl>;
  private _config: MarginfiConfig;
  private _marginAccount: MarginAccount;
  private _driftProgram: Program<any>; // TODO: type

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
    this._driftProgram = new Program(
      DriftIdl as Idl,
      config.drift.programId,
      program.provider
    );

    this._isActive = accountData.isActive;
    this._utpConfig = accountData.accountConfig;
    this._utpCache = UtpCache.fromAccountData(accountData.accountCache);
  }

  // --- Getters and setters

  /**
   * UTP index
   */
  public get index() {
    return this._config.drift.utpIndex;
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
   * Create transaction instruction to activate Drift.
   *
   * @returns `ActivateUtp` transaction instruction
   */
  async makeActivateIx(
    authoritySeed: PublicKey,
    driftUserPositionsPk: PublicKey
  ) {
    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const [driftAuthorityPk, driftAuthorityBump] = await getUtpAuthority(
      this._config.drift.programId,
      authoritySeed,
      this._program.programId
    );
    const driftUserPk = await DriftSDK.getUserAccountPublicKey(
      this._config.drift.programId,
      driftAuthorityPk
    );

    return makeActivateIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        driftProgramId: this._config.drift.programId,
        driftStatePk,
        driftUserPk,
        driftUserPositionsPk,
        driftAuthorityPk,
      },
      { authoritySeed, authorityBump: driftAuthorityBump }
    );
  }

  /**
   * Activate Drift.
   *
   * @returns Transaction signature
   */
  async activate() {
    const authoritySeed = Keypair.generate();
    const userPositionsKey = Keypair.generate();

    const activateIx = await this.makeActivateIx(
      authoritySeed.publicKey,
      userPositionsKey.publicKey
    );

    const tx = new Transaction().add(activateIx);
    const sig = await processTransaction(this._program.provider, tx, [
      userPositionsKey,
    ]);

    await this._marginAccount.fetch(); // Required to update the internal UTP address
    await this.observe();
    return sig;
  }

  /**
   * Create transaction instruction to deactivate Drift.
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
   * Create transaction instruction to deposit collateral into the Drift account.
   *
   * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
   * @param amount Amount to deposit (mint native unit)
   * @returns `DriftDepositCollateral` transaction instruction
   */
  async makeDepositIx(proxyTokenAccountPk: PublicKey, amount: BN) {
    const [marginBankAuthorityPk] = await getBankAuthority(
      this._config.groupPk,
      this._program.programId
    );
    const [driftAuthorityPk] = await getUtpAuthority(
      this._config.drift.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        marginCollateralVaultPk: this._marginAccount.group.bank.vault,
        bankAuthorityPk: marginBankAuthorityPk,
        proxyTokenAccountPk,
        driftAuthorityPk,
        driftProgramId: this._config.drift.programId,
        driftStatePk: driftStatePk,
        driftUserPk: this._utpConfig.address,
        driftUserPositionsPk: driftUser.positions,
        driftCollateralVaultPk: driftState.collateralVault,
        driftMarketsPk: driftState.markets,
        driftDepositHistoryPk: driftState.depositHistory,
        driftFundingPaymentHistoryPk: driftState.fundingPaymentHistory,
      },
      { amount }
    );
  }

  /**
   * Deposit collateral into the Drift account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async deposit(amount: BN) {
    const proxyTokenAccountKey = Keypair.generate();

    const [driftAuthority] = await getUtpAuthority(
      this._config.drift.programId,
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
      driftAuthority
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
   * Create transaction instruction to perform a crank deposit into the Drift account (if margin requirements allow).
   *
   * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
   * @param amount Amount to deposit (mint native unit)
   * @returns `DriftDepositCollateralCrank` transaction instruction
   */
  async makeDepositCrankIx(proxyTokenAccountPk: PublicKey, amount: BN) {
    const [marginBankAuthorityPk] = await getBankAuthority(
      this._config.groupPk,
      this._program.programId
    );
    const [driftAuthorityPk] = await getUtpAuthority(
      this._config.drift.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;

    return makeDepositCrankIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        marginCollateralVaultPk: this._marginAccount.group.bank.vault,
        bankAuthorityPk: marginBankAuthorityPk,
        proxyTokenAccountPk,
        driftAuthorityPk,
        driftProgramId: this._config.drift.programId,
        driftStatePk: driftStatePk,
        driftUserPk: this._utpConfig.address,
        driftUserPositionsPk: driftUser.positions,
        driftCollateralVaultPk: driftState.collateralVault,
        driftMarketsPk: driftState.markets,
        driftDepositHistoryPk: driftState.depositHistory,
        driftFundingPaymentHistoryPk: driftState.fundingPaymentHistory,
      },
      { amount }
    );
  }

  /**
   * Perform a crank deposit into the Drift account (if margin requirements allow).
   *
   * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async depositCrank(amount: BN) {
    const proxyTokenAccountKey = Keypair.generate();

    const [driftAuthority] = await getUtpAuthority(
      this._config.drift.programId,
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
      driftAuthority
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
   * Create transaction instruction to withdraw from the Drift account to the margin account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `DriftWithdrawCollateral` transaction instruction
   */
  async makeWithdrawIx(amount: BN) {
    const [driftAuthorityPk] = await getUtpAuthority(
      this._config.drift.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;

    return makeWithdrawIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        marginCollateralVaultPk: this._marginAccount.group.bank.vault,
        driftProgramId: this._config.drift.programId,
        driftStatePk: driftStatePk,
        driftUserPk: this._utpConfig.address,
        driftUserPositionsPk: driftUser.positions,
        driftAuthorityPk,
        driftCollateralVaultPk: driftState.collateralVault,
        driftCollateralVaultAuthorityPk: driftState.collateralVaultAuthority,
        driftMarketsPk: driftState.markets,
        driftDepositHistoryPk: driftState.depositHistory,
        driftFundingPaymentHistoryPk: driftState.fundingPaymentHistory,
        driftInsuranceVaultPk: driftState.insuranceVault,
        driftInsuranceVaultAuthorityPk: driftState.insuranceVaultAuthority,
      },
      { amount }
    );
  }

  /**
   * Withdraw from the Drift account to the margin account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async withdraw(amount: BN) {
    const withdrawIx = await this.makeWithdrawIx(amount);

    const ixs = await this._marginAccount.createChainedIxs(
      withdrawIx,
      InstructionLayout.ObserveAndCheckAfter
    );

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this._program.provider, tx);

    await this.observe();
    return sig;
  }

  /**
   * Create transaction instruction to observe and cache the health of the Drift account.
   *
   * @returns `DriftObserve` transaction instruction
   */
  async makeObserveIx() {
    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;

    return makeObserveIx(this._program, {
      marginAccountPk: this._marginAccount.publicKey,
      driftUserPk: this._utpConfig.address,
      driftStatePk: driftStatePk,
      driftUserPositionsPk: driftUser.positions,
      driftMarketsPk: driftState.markets,
    });
  }

  /**
   * Observe and cache the health of the Drift account.
   *
   * @returns Transaction signature
   */
  async observe() {
    const observeIx = await this.makeObserveIx();
    const tx = new Transaction().add(observeIx);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create transaction instruction to open a position.
   *
   * @returns `DriftOpenPosition` transaction instruction
   */
  async makeOpenPositionIx(args: DriftOpenPositionArgs) {
    const [driftAuthorityPk] = await getUtpAuthority(
      this._config.drift.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;
    const markets: MarketsAccount =
      (await this._driftProgram.account.markets.fetch(
        driftState.markets
      )) as any;

    return makeOpenPositionIx(
      this._program,
      {
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        driftProgramId: this._config.drift.programId,
        driftStatePk: driftStatePk,
        driftUserPk: this._utpConfig.address,
        driftAuthorityPk,
        driftMarketsPk: driftState.markets,
        driftUserPositionsPk: driftUser.positions,
        driftTradeHistoryPk: driftState.tradeHistory,
        driftFundingPaymentHistoryPk: driftState.fundingPaymentHistory,
        driftFundingRateHistoryPk: driftState.fundingRateHistory,
        driftOraclePk: markets.markets[args.marketIndex.toNumber()].amm.oracle,
      },
      { args }
    );
  }

  /**
   * Open a position.
   *
   * @returns Transaction signature
   */
  async openPosition(args: DriftOpenPositionArgs) {
    const openPositionIx = await this.makeOpenPositionIx(args);

    const ixs = await this._marginAccount.createChainedIxs(
      openPositionIx,
      InstructionLayout.ObserveAndCheckAfter
    );

    const tx = new Transaction();
    tx.add(...ixs);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create transaction instruction to close a position.
   *
   * @returns `DriftClosePosition` transaction instruction
   */
  async makeClosePositionIx(args: DriftClosePositionArgs) {
    const [driftAuthorityPk] = await getUtpAuthority(
      this._config.drift.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;
    const markets: MarketsAccount =
      (await this._driftProgram.account.markets.fetch(
        driftState.markets
      )) as any;

    return makeClosePositionIx(
      this._program,
      {
        marginfiGroupPk: this._marginAccount.group.publicKey,
        marginAccountPk: this._marginAccount.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        driftProgramId: this._config.drift.programId,
        driftStatePk: driftStatePk,
        driftUserPk: this._utpConfig.address,
        driftAuthorityPk,
        driftMarketsPk: driftState.markets,
        driftUserPositionsPk: driftUser.positions,
        driftTradeHistoryPk: driftState.tradeHistory,
        driftFundingPaymentHistoryPk: driftState.fundingPaymentHistory,
        driftFundingRateHistoryPk: driftState.fundingRateHistory,
        driftOraclePk: markets.markets[args.marketIndex.toNumber()].amm.oracle,
      },
      { args }
    );
  }

  /**
   * Close a position.
   *
   * @returns `DriftClosePosition` transaction instruction
   */
  async closePosition(args: DriftClosePositionArgs) {
    const closePositionIx = await this.makeClosePositionIx(args);

    const ixs = await this._marginAccount.createChainedIxs(
      closePositionIx,
      InstructionLayout.ObserveAndCheckAfter
    );

    const tx = new Transaction();
    tx.add(...ixs);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Refresh and retrieve the health cache for the Drift account, directly from the Drift account.
   *
   * @returns Health cache for the Drift UTP
   */
  async localObserve(): Promise<UtpCache> {
    let connection = this._program.provider.connection;
    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;

    let [driftUserAi, driftUserPositionsAi, driftMarketsAi] =
      await connection.getMultipleAccountsInfo([
        this._utpConfig.address,
        driftUser.positions,
        driftState.markets,
      ]);

    if (!driftUserAi)
      throw Error(`Drift user account not found: ${this._utpConfig.address}`);
    if (!driftUserPositionsAi)
      throw Error(
        `Drift user positions account not found: ${driftUser.positions}`
      );
    if (!driftMarketsAi)
      throw Error(`Drift markets account not found: ${driftState.markets}`);

    return UtpCache.fromWasm(
      observe_drift(
        driftUserAi.data as Buffer,
        driftUserPositionsAi.data as Buffer,
        driftMarketsAi.data as Buffer
      )
    );
  }
}
