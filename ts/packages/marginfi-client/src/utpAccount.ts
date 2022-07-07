import { AccountMeta, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { format } from "util";
import { getUtpAuthority, MarginfiAccount, MarginfiClient, UtpConfig } from ".";
import { UTPAccountConfig, UtpData, UtpIndex, UTP_NAME } from "./types";
import { IUtpObservation, UtpObservation } from "./utpObservation";

export abstract class UtpAccount implements Omit<IUtpObservation, "timestamp"> {
  public index: UtpIndex;
  public address: PublicKey;
  public isActive: boolean;

  /** @internal */
  protected _utpConfig: UTPAccountConfig;
  /** @internal */
  protected _cachedObservation: UtpObservation = UtpObservation.EMPTY_OBSERVATION;

  abstract getObservationAccounts(): Promise<AccountMeta[]>;
  abstract observe(): Promise<UtpObservation>;
  abstract deposit(amount: BN): Promise<string>;
  abstract withdraw(amount: BN): Promise<string>;
  abstract config: UtpConfig;

  constructor(
    protected readonly _client: MarginfiClient,
    protected readonly _marginfiAccount: MarginfiAccount,
    isActive: boolean,
    utpConfig: UTPAccountConfig
  ) {
    this.index = _client.config.mango.utpIndex;
    this.address = utpConfig.address;
    this.isActive = isActive;
    this._utpConfig = utpConfig;
    this._cachedObservation = UtpObservation.EMPTY_OBSERVATION;
  }

  toString() {
    return format(
      "Timestamp: %s\nEquity: %s\nFree Collateral: %s\nLiquidation Value: %s\nRebalance Needed: %s\nMax Rebalance: %s\nIs empty: %s",
      this.equity.toString(),
      this.freeCollateral.toString(),
      this.liquidationValue.toString(),
      this.isRebalanceDepositNeeded,
      this.maxRebalanceDepositAmount.toString(),
      this.isEmpty
    );
  }

  /** @internal */
  public get _config() {
    return this._client.config;
  }

  /** @internal */
  public get _program() {
    return this._client.program;
  }

  get cachedObservation() {
    const fetchAge = (new Date().getTime() - this._cachedObservation.timestamp.getTime()) / 1000.0;
    if (fetchAge > 5) {
      console.log(`[WARNNG] Last ${UTP_NAME[this.index]} observation was fetched ${fetchAge} seconds ago`);
    }
    return this._cachedObservation;
  }

  get equity() {
    return this.cachedObservation.equity;
  }

  get freeCollateral() {
    return this.cachedObservation.freeCollateral;
  }

  get liquidationValue() {
    return this.cachedObservation.liquidationValue;
  }

  get isRebalanceDepositNeeded() {
    return this.cachedObservation.isRebalanceDepositNeeded;
  }

  get maxRebalanceDepositAmount() {
    return this.cachedObservation.maxRebalanceDepositAmount;
  }

  get isEmpty() {
    return this.cachedObservation.isEmpty;
  }

  // --- Others

  /**
   * Update instance data from provided data struct.
   *
   * @internal
   */
  update(data: UtpData) {
    this.isActive = data.isActive;
    this._utpConfig = data.accountConfig;
  }

  async getUtpAuthority() {
    const utpAuthority = await getUtpAuthority(
      this.config.programId,
      this._utpConfig.authoritySeed,
      this._program.programId
    );
    return utpAuthority;
  }
}
