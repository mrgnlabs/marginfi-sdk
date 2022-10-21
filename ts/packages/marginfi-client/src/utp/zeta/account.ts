import { BN, Idl, Program } from "@project-serum/anchor";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { idl, Market, types as zetaTypes, utils as zetaUtils } from "@zetamarkets/sdk";
import BigNumber from "bignumber.js";
import { MarginfiAccount, MarginfiClient, UtpObservation } from "../..";
import { InstructionsWrapper, UiAmount, UtpData } from "../../types";
import { getBankAuthority, getUtpAuthority, processTransaction, uiToNative } from "../../utils";
import UtpAccount from "../account";
import instructions from "./instructions";

/**
 * Class encapsulating Zeta-specific interactions (internal)
 */
export class UtpZetaAccount extends UtpAccount {
  //@ts-ignore
  _zetaProgram: Program<typeof idl>;

  /** @internal */
  constructor(client: MarginfiClient, marginfiAccount: MarginfiAccount, accountData: UtpData) {
    super(client, marginfiAccount, accountData.isActive, accountData.accountConfig);
    //@ts-ignore
    this._zetaProgram = new Program(idl as Idl, this._config.zeta.programId, this._program.provider);
  }

  // --- Getters / Setters

  /**
   * UTP-specific config
   */
  public get config() {
    return this._config.zeta;
  }

  // --- Others

  /**
   * Create transaction instruction to activate Zeta.
   *
   * @returns `ActivateUtp` transaction instruction
   */
  async makeActivateIx(authoritySeed: PublicKey): Promise<InstructionsWrapper> {
    const [zetaAuthorityPk, zetaAuthorityBump] = await this.authority(authoritySeed);
    const [zetaAccountPk] = await zetaUtils.getMarginAccount(
      this._config.zeta.programId,
      this._config.zeta.groupPk,
      zetaAuthorityPk
    );

    return {
      instructions: [
        await instructions.makeActivateIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            zetaProgramId: this._config.zeta.programId,
            zetaAccountPk,
            zetaAuthorityPk,
            zetaGroupPk: this._config.zeta.groupPk,
            authorityPk: this._program.provider.wallet.publicKey,
          },
          { authoritySeed: authoritySeed, authorityBump: zetaAuthorityBump }
        ),
      ],
      keys: [],
    };
  }

  async activate() {
    const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zeta:activate`);
    debug("Activate Zeta UTP");
    const authoritySeed = Keypair.generate();
    const [utpAuthorityPk] = await this.authority(authoritySeed.publicKey);

    await this._fundAuthorityPda(this._program.provider.wallet.publicKey, utpAuthorityPk, 0.045 * LAMPORTS_PER_SOL);
    const activateIx = await this.makeActivateIx(authoritySeed.publicKey);
    const tx = new Transaction().add(...activateIx.instructions);
    const sig = await processTransaction(this._program.provider, tx);
    await this._marginfiAccount.reload(); // Required to update the internal UTP address
    debug("Sig %s", sig);
    return sig;
  }

  async makeDeactivateIx() {
    return this._marginfiAccount.makeDeactivateUtpIx(this.index);
  }

  async deactivate() {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:deactivate`);
    this.verifyActive();
    debug("Deactivating Zeta UTP");
    const sig = await this._marginfiAccount.deactivateUtp(this.index);
    debug("Sig %s", sig);
    await this._marginfiAccount.reload();
    return sig;
  }

  async makeDepositIx(amount: UiAmount): Promise<InstructionsWrapper> {
    const proxyTokenAccountKey = Keypair.generate();
    const [zetaAuthorityPk] = await this.authority();

    const [marginBankAuthority] = await getBankAuthority(this._config.groupPk, this._program.programId);

    const [utpAuthority] = await getUtpAuthority(
      this._config.zeta.programId,
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
      this._client.group.bank.mint,
      proxyTokenAccountKey.publicKey,
      utpAuthority
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
            authorityPk: this._program.provider.wallet.publicKey,
            bankVaultPk: this._marginfiAccount.group.bank.vault,
            bankAuthorityPk: marginBankAuthority,
            tempCollateralAccount: proxyTokenAccountKey.publicKey,
            zetaProgramId: this._config.zeta.programId,
            zetaGroupPk: this._config.zeta.groupPk,
            zetaAccountPk: this._utpConfig.address,
            zetaVaultPk: this._config.zeta.vaultPk,
            zetaSocializedLossAccount: this._config.zeta.socializedLossAccountPk,
            zetaAuthorityPk,
            zetaStatePk: this._config.zeta.statePk,
            zetaGreeksPk: this._config.zeta.greeksPk,
          },
          { amount: uiToNative(amount) }
        ),
      ],
      keys: [proxyTokenAccountKey],
    };
  }

  async deposit(amount: UiAmount) {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:deposit`);
    this.verifyActive();

    debug("Deposit %s into Zeta", amount);

    const depositIx = await this.makeDepositIx(amount);
    const tx = new Transaction().add(...depositIx.instructions);
    const sig = await processTransaction(this._client.provider, tx, [...depositIx.keys]);
    debug("Sig %s", sig);
    return sig;
  }

  async makeWithdrawIx(amount: UiAmount): Promise<InstructionsWrapper> {
    const [zetaAuthorityPk] = await await this.authority();
    const pythOracle = this._config.zeta.priceFeeds["SOL/USD"];

    return {
      instructions: [
        await instructions.makeWithdrawIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            zetaAuthorityPk: zetaAuthorityPk,
            authorityPk: this._program.provider.wallet.publicKey,
            bankVaultPk: this._client.group.bank.vault,
            zetaAccountPk: this._utpConfig.address,
            zetaVaultPk: this._config.zeta.vaultPk,
            zetaGreeksPk: this._config.zeta.greeksPk,
            zetaOraclePk: pythOracle,
            zetaProgramId: this._config.zeta.programId,
            zetaGroupPk: this._config.zeta.groupPk,
            zetaSocializedLossAccount: this._config.zeta.socializedLossAccountPk,
            zetaStatePk: this._config.zeta.statePk,
          },
          { amount: uiToNative(amount) }
        ),
      ],
      keys: [],
    };
  }

  async withdraw(amount: UiAmount) {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:withdraw`);
    debug("Withdrawing %s from Zeta", amount);
    this.verifyActive();

    const depositIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(...depositIx.instructions);
    const sig = await processTransaction(this._client.provider, tx);
    debug("Sig %s", sig);
    return sig;
  }

  async makeInitOpenOrdersAccountIx(market: Market) {
    const [utpAuthority] = await getUtpAuthority(
      this._config.zeta.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const [openOrders] = await zetaUtils.getOpenOrders(this._config.zeta.programId, market.address, utpAuthority);
    const [openOrdersMap] = await zetaUtils.getOpenOrdersMap(this._config.zeta.programId, openOrders);

    return instructions.makeInitOpenOrdersAccountIx(this._program, {
      marginfiGroupPk: this._config.groupPk,
      marginfiAccountPk: this._marginfiAccount.publicKey,
      authorityPk: this._program.provider.wallet.publicKey,
      zetaProgramId: this._config.zeta.programId,
      zetaGroupPk: this._config.zeta.groupPk,
      zetaStatePk: this._config.zeta.statePk,
      dexProgramId: this._config.zeta.dexPid,
      zetaOpenOrdersPk: openOrders,
      zetaAccountPk: this._utpConfig.address,
      zetaAuthorityPk: utpAuthority,
      zetaMarketPk: market.address,
      zetaSerumAuthorityPk: this._config.zeta.serumAuthorityPk,
      zetaOpenOrdersMapPk: openOrdersMap,
    });
  }

  async initOpenOrdersAccount(market: Market) {
    const [utpAuthority] = await getUtpAuthority(
      this._config.zeta.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );

    await this._fundAuthorityPda(this._program.provider.wallet.publicKey, utpAuthority, 0.025 * LAMPORTS_PER_SOL);

    const initOpenOrdersAccountIx = await this.makeInitOpenOrdersAccountIx(market);

    const tx = new Transaction().add(initOpenOrdersAccountIx);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create list of account metas required to observe a Zeta account.
   *
   * @returns `AccountMeta[]` list of account metas
   */
  async getObservationAccounts(): Promise<AccountMeta[]> {
    return [{ pubkey: this.address, isSigner: false, isWritable: false }]; // TODO
  }

  async makePlaceOrderIx(
    market: Market,
    price: UiAmount,
    size: UiAmount,
    side: zetaTypes.Side
  ): Promise<InstructionsWrapper> {
    const greeks = await this._zetaProgram.account.greeks.fetch(this._config.zeta.greeksPk);

    const [utpAuthority] = await getUtpAuthority(
      this._config.zeta.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const [openOrders] = await zetaUtils.getOpenOrders(this._config.zeta.programId, market.address, utpAuthority);
    const pythOracle = this._config.zeta.priceFeeds["SOL/USD"];

    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    return {
      instructions: [
        await instructions.makePlaceOrderIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            authorityPk: this._program.provider.wallet.publicKey,
            zetaAccountPk: this._utpConfig.address,
            zetaProgramId: this._config.zeta.programId,
            zetaStatePk: this._config.zeta.statePk,
            zetaGroupPk: this._config.zeta.groupPk,
            dexProgramId: this._config.zeta.dexPid,
            zetaSerumAuthorityPk: this._config.zeta.serumAuthorityPk,
            zetaGreeksPk: this._config.zeta.greeksPk,
            zetaOpenOrdersPk: openOrders,
            zetaMarketPk: market.address,
            zetaRequestQueuePk: market.serumMarket.decoded.requestQueue,
            zetaEventQueuePk: market.serumMarket.decoded.eventQueue,
            zetaBidsPk: market.serumMarket.decoded.bids,
            zetaAsksPk: market.serumMarket.decoded.asks,
            zetaCoinVaultPk: market.serumMarket.decoded.baseVault,
            zetaPcVaultPk: market.serumMarket.decoded.quoteVault,
            zetaOrderPayerTokenAccountPk: side == zetaTypes.Side.BID ? market.quoteVault : market.baseVault,
            zetaCoinWalletPk: market.baseVault,
            zetaPcWalletPk: market.quoteVault,
            zetaAuthorityPk: utpAuthority,
            zetaOraclePk: pythOracle,
            zetaMarketNodePk: greeks.nodeKeys[market.marketIndex],
            zetaMarketMintPk:
              side == zetaTypes.Side.BID ? market.serumMarket.quoteMintAddress : market.serumMarket.baseMintAddress,
            zetaMintAuthorityPk: this._config.zeta.mintAuthorityPk,
          },
          { price: uiToNative(price), size: uiToNative(size), side },
          remainingAccounts
        ),
      ],
      keys: [],
    };
  }

  async placeOrder(market: Market, price: UiAmount, size: UiAmount, side: zetaTypes.Side) {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:place-perp-order2`);
    debug("Placing a %s order for %s @ %s of %s", side, size, price, market.marketIndex);
    this.verifyActive();

    const placeOrderIx = await this.makePlaceOrderIx(market, price, size, side);
    const tx = new Transaction().add(...placeOrderIx.instructions);
    const sig = await processTransaction(this._client.provider, tx);
    debug("Signature %s", sig);
    return sig;
  }

  async makeCancelOrderIx(market: Market, side: zetaTypes.Side, orderId: BN): Promise<InstructionsWrapper> {
    const [utpAuthority] = await getUtpAuthority(
      this._config.zeta.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    const [zetaOpenOrdersPk] = await zetaUtils.getOpenOrders(this._config.zeta.programId, market.address, utpAuthority);
    const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

    return {
      instructions: [
        await instructions.makeCancelOrderIx(
          this._program,
          {
            marginfiGroupPk: this._config.groupPk,
            marginfiAccountPk: this._marginfiAccount.publicKey,
            authorityPk: this._program.provider.wallet.publicKey,
            zetaAccountPk: this._utpConfig.address,
            zetaProgramId: this._config.zeta.programId,
            zetaStatePk: this._config.zeta.statePk,
            zetaGroupPk: this._config.zeta.groupPk,
            dexProgramId: this._config.zeta.dexPid,
            zetaSerumAuthorityPk: this._config.zeta.serumAuthorityPk,
            zetaOpenOrdersPk,
            zetaMarketAccountsMarketPk: market.address,
            zetaMarketAccountsEventQueuePk: market.serumMarket.decoded.eventQueue,
            zetaMarketAccountsBidsPk: market.serumMarket.decoded.bids,
            zetaMarketAccountsAsksPk: market.serumMarket.decoded.asks,
            zetaAuthorityPk: utpAuthority,
          },
          { side, orderId },
          remainingAccounts
        ),
      ],
      keys: [],
    };
  }

  async cancelOrder(market: Market, side: zetaTypes.Side, orderId: BN) {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:place-perp-order2`);
    debug("Cancelling perp order %s", orderId);
    this.verifyActive();

    const cancelOrderIx = await this.makeCancelOrderIx(market, side, orderId);
    const tx = new Transaction().add(...cancelOrderIx.instructions);
    const sig = await processTransaction(this._client.provider, tx);
    debug("Signature %s", sig);
    return sig;
  }

  private async _fundAuthorityPda(payerPk: PublicKey, utpAuthority: PublicKey, amount: number) {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payerPk,
        lamports: amount,
        toPubkey: utpAuthority,
      })
    );
    return processTransaction(this._program.provider, tx);
  }

  /** @internal */
  private verifyActive() {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:verify-active`);
    if (!this.isActive) {
      debug("Utp isn't active");
      throw new Error("Utp isn't active");
    }
  }

  /**
   * Refresh and retrieve the health cache for the Zeta account, directly from the zeta account.
   *
   * @returns Health cache for the Zeta UTP
   */
  async observe(): Promise<UtpObservation> {
    const debug = require("debug")(`mfi:utp:${this.address}:zeta:local-observe`);
    debug("Observing Locally");
    const observation = new UtpObservation({
      timestamp: new Date(),
      equity: new BigNumber(0),
      freeCollateral: new BigNumber(0),
      initMarginRequirement: new BigNumber(0),
      liquidationValue: new BigNumber(0),
      isRebalanceDepositNeeded: false,
      maxRebalanceDepositAmount: new BigNumber(0),
      isEmpty: false,
    });
    this._cachedObservation = observation;
    return observation;
  }
}
