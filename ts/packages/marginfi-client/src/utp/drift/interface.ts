import {
  ClearingHouse,
  ClearingHouseUser,
  MarketsAccount,
  StateAccount,
  UserAccount,
} from '@drift-labs/sdk';
import { Idl, Program, BN } from '@project-serum/anchor';
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { UTPAccountConfig, UtpData, UtpAccount } from '../../types';
import {
  getBankAuthority,
  getUtpAuthority,
  processTransaction,
} from '../../utils';
import {
  makeActivateIx,
  makeClosePositionIx,
  makeDepositIx,
  makeOpenPositionIx,
  makeWithdrawIx,
} from './instruction';
import DriftIdl from '@drift-labs/sdk/src/idl/clearing_house.json';
import * as DriftSDK from '@drift-labs/sdk';
import { MarginAccount } from '../../marginAccount';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { UtpObservation } from '../../state';
import { DriftClosePositionArgs, DriftOpenPositionArgs } from './types';

import { observe_drift } from '@mrgnlabs/marginfi-wasm-tools';
import { MarginfiClient } from '../..';

/**
 * Class encapsulating Drift-specific interactions (internal)
 */
export class UptDriftAccount implements UtpAccount {
  private _client: MarginfiClient;
  private _marginAccount: MarginAccount;
  private _driftProgram: Program<any>; // TODO: type

  private _isActive: boolean;
  private _utpConfig: UTPAccountConfig;

  /** @internal */
  constructor(
    client: MarginfiClient,
    mfAccount: MarginAccount,
    accountData: UtpData
  ) {
    this._client = client;
    this._marginAccount = mfAccount;
    this._driftProgram = new Program(
      DriftIdl as Idl,
      this._config.drift.programId,
      this._program.provider
    );

    this._isActive = accountData.isActive;
    this._utpConfig = accountData.accountConfig;
  }

  public get address(): PublicKey {
    return this.config.address;
  }

  public get _config() {
    return this._client.config;
  }

  public get _program() {
    return this._client.program;
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

  // --- Others

  /**
   * Update instance data from provided data struct.
   *
   * @internal
   */
  update(data: UtpData) {
    this._isActive = data.isActive;
    this._utpConfig = data.accountConfig;
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
      {
        authoritySeed,
        authorityBump: driftAuthorityBump,
      }
    );
  }

  /**
   * Activate Drift.
   *
   * @returns Transaction signature
   */
  async activate() {
    const debug = require('debug')(
      `mfi:margin-account:${this._marginAccount.publicKey}:utp:drift:activate`
    );
    debug('Activate Drift UTP');
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

    debug('Sig %s', sig);

    await this._marginAccount.reload(); // Required to update the internal UTP address
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

  private verifyActive() {
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:verify-active`
    );
    if (!this.isActive) {
      debug("Utp isn't active");
      throw new Error("Utp isn't active");
    }
  }

  /**
   * Deactivate UTP.
   *
   * @returns Transaction signature
   */
  async deactivate() {
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:deactivate`
    );
    debug('Deactivating Drift');
    this.verifyActive();
    const sig = await this._marginAccount.deactivateUtp(new BN(this.index));

    debug('Sig %s', sig);

    await this._marginAccount.reload();
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
    const remainingAccounts =
      await this._marginAccount.getObservationAccounts();

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        signerPk: this._program.provider.wallet.publicKey,
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
      { amount },
      remainingAccounts
    );
  }

  /**
   * Deposit collateral into the Drift account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async deposit(amount: BN) {
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:deposit`
    );
    debug('Depositing %s into Drift', amount);

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

    const ixs = [createProxyTokenAccountIx, initProxyTokenAccountIx, depositIx];
    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this._program.provider, tx, [
      proxyTokenAccountKey,
    ]);
    debug('Sig %s', sig);
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
    const remainingAccounts =
      await this._marginAccount.getObservationAccounts();

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
        marginAccountPk: this._marginAccount.publicKey,
        signerPk: this._program.provider.wallet.publicKey,
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
      { amount },
      remainingAccounts
    );
  }

  /**
  //  * Perform a crank deposit into the Drift account (if margin requirements allow).
  //  *
  //  * @param proxyTokenAccountPk Address to the temporary token account used as proxy for Bank -> UTP deposits
  //  * @param amount Amount to deposit (mint native unit)
  //  * @returns Transaction signature
  //  */
  // async deposit(amount: BN) {
  //   const debug = require('debug')(
  //     `mfi:utp:${this.config.address}:drift:deposit-crank`
  //   );
  //   debug('Crank depositing %s into Drift', amount);
  //   const proxyTokenAccountKey = Keypair.generate();

  //   const [driftAuthority] = await getUtpAuthority(
  //     this._config.drift.programId,
  //     this._utpConfig.authoritySeed,
  //     this._program.programId
  //   );

  //   const createProxyTokenAccountIx = SystemProgram.createAccount({
  //     fromPubkey: this._program.provider.wallet.publicKey,
  //     lamports:
  //       await this._program.provider.connection.getMinimumBalanceForRentExemption(
  //         AccountLayout.span
  //       ),
  //     newAccountPubkey: proxyTokenAccountKey.publicKey,
  //     programId: TOKEN_PROGRAM_ID,
  //     space: AccountLayout.span,
  //   });
  //   const initProxyTokenAccountIx = Token.createInitAccountInstruction(
  //     TOKEN_PROGRAM_ID,
  //     this._marginAccount.group.bank.mint,
  //     proxyTokenAccountKey.publicKey,
  //     driftAuthority
  //   );
  //   const depositIx = await this.makeDepositCrankIx(
  //     proxyTokenAccountKey.publicKey,
  //     amount
  //   );

  //   const ixs = [createProxyTokenAccountIx, initProxyTokenAccountIx, depositIx];
  //   const tx = new Transaction().add(...ixs);
  //   const sig = await processTransaction(this._program.provider, tx, [
  //     proxyTokenAccountKey,
  //   ]);
  //   debug('Sig %s', sig);
  //   return sig;
  // }

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
        signerPk: this._program.provider.wallet.publicKey,
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
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:withdraw`
    );
    debug('Withdrawing %s from Drift', amount);

    const withdrawIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(withdrawIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug('Sig %', sig);

    return sig;
  }

  /**
   * Create list of account metas required to observe a Drift account.
   *
   * @returns `AccountMeta[]` list of account metas
   */
  async getObservationAccounts(): Promise<AccountMeta[]> {
    const driftStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(
      this._config.drift.programId
    );
    const driftState: StateAccount =
      (await this._driftProgram.account.state.fetch(driftStatePk)) as any;
    const driftUser: UserAccount = (await this._driftProgram.account.user.fetch(
      this._utpConfig.address
    )) as any;
    return [
      {
        pubkey: this._utpConfig.address,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: driftUser.positions,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: driftState.markets, isSigner: false, isWritable: false },
    ];
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
    const remainingAccounts =
      await this._marginAccount.getObservationAccounts();

    return makeOpenPositionIx(
      this._program,
      {
        marginfiGroupPk: this._config.groupPk,
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
      { args },
      remainingAccounts
    );
  }

  /**
   * Open a position.
   *
   * @returns Transaction signature
   */
  async openPosition(args: DriftOpenPositionArgs) {
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:open-position`
    );
    debug('Opening a drift positions %o', args);

    const openPositionIx = await this.makeOpenPositionIx(args);
    const tx = new Transaction().add(openPositionIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug('Sig %s', sig);
    return sig;
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
    const remainingAccounts =
      await this._marginAccount.getObservationAccounts();

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
      { args },
      remainingAccounts
    );
  }

  /**
   * Close a position.
   *
   * @returns `DriftClosePosition` transaction instruction
   */
  async closePosition(args: DriftClosePositionArgs) {
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:close-position`
    );
    debug('Closing Drift position %o', args);

    const closePositionIx = await this.makeClosePositionIx(args);
    const tx = new Transaction().add(closePositionIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug('Sig %s', sig);
    return sig;
  }

  /**
   * Refresh and retrieve the health cache for the Drift account, directly from the Drift account.
   *
   * @returns Health cache for the Drift UTP
   */
  async localObserve(): Promise<UtpObservation> {
    const debug = require('debug')(
      `mfi:utp:${this.config.address}:drift:local-observe`
    );
    debug('Observing Locally');
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

    return UtpObservation.fromWasm(
      observe_drift(
        driftUserAi.data as Buffer,
        driftUserPositionsAi.data as Buffer,
        driftMarketsAi.data as Buffer
      )
    );
  }

  async getClearingHouseAndUser(
    accountLoader: DriftSDK.BulkAccountLoader = new DriftSDK.BulkAccountLoader(
      this._client.program.provider.connection,
      'confirmed',
      5000
    )
  ): Promise<[ClearingHouse, ClearingHouseUser]> {
    const connection = this._client.program.provider.connection;

    const config = DriftSDK.getPollingClearingHouseConfig(
      connection,
      this._program.provider.wallet,
      this._config.drift.programId,
      accountLoader
    );
    const clearingHouse = DriftSDK.getClearingHouse(config);
    await clearingHouse.subscribe();

    // Set up Clearing House user client
    const [driftPda, _] = await getUtpAuthority(
      this._config.drift.programId,
      this.config.authoritySeed,
      this._program.programId
    );
    const chUserConfig = DriftSDK.getPollingClearingHouseUserConfig(
      clearingHouse,
      driftPda,
      accountLoader
    );
    const user = DriftSDK.getClearingHouseUser(chUserConfig);
    await user.subscribe();

    return [clearingHouse, user];
  }
}
