import { AccountMeta, PublicKey } from "@solana/web3.js";
import { format } from "util";
import { getUtpAuthority, MarginfiAccount, MarginfiClient, UtpConfig } from "..";
import { INSURANCE_VAULT_LIQUIDATION_FEE, LIQUIDATOR_LIQUIDATION_FEE } from "../constants";
import { LiquidationPrices, UiAmount, UTPAccountConfig, UtpData, UTP_NAME } from "../types";
import { IUtpObservation, UtpObservation } from "./observation";

abstract class UtpAccount implements Omit<IUtpObservation, "timestamp"> {
  public address: PublicKey;
  public isActive: boolean;

  /** @internal */
  protected _utpConfig: UTPAccountConfig;
  /** @internal */
  protected _cachedObservation: UtpObservation = UtpObservation.EMPTY_OBSERVATION;

  abstract getObservationAccounts(): Promise<AccountMeta[]>;
  abstract observe(): Promise<UtpObservation>;
  abstract deposit(amount: UiAmount): Promise<string>;
  abstract withdraw(amount: UiAmount): Promise<string>;
  abstract config: UtpConfig;

  constructor(
    protected readonly _client: MarginfiClient,
    protected readonly _marginfiAccount: MarginfiAccount,
    isActive: boolean,
    utpConfig: UTPAccountConfig
  ) {
    this.address = utpConfig.address;
    this.isActive = isActive;
    this._utpConfig = utpConfig;
    this._cachedObservation = UtpObservation.EMPTY_OBSERVATION;
  }

  // --- Getters / Setters

  public get index() {
    return this.config.utpIndex;
  }

  /** @internal */
  public get _config() {
    return this._client.config;
  }

  /** @internal */
  public get _program() {
    return this._client.program;
  }

  public get cachedObservation() {
    const fetchAge = (new Date().getTime() - this._cachedObservation.timestamp.getTime()) / 1000.0;
    if (fetchAge > 5) {
      console.log(`[WARNNG] Last ${UTP_NAME[this.index]} observation was fetched ${fetchAge} seconds ago`);
    }
    return this._cachedObservation;
  }

  public get equity() {
    return this.cachedObservation.equity;
  }

  public get freeCollateral() {
    return this.cachedObservation.freeCollateral;
  }

  public get initMarginRequirement() {
    return this.cachedObservation.initMarginRequirement;
  }

  public get liquidationValue() {
    return this.cachedObservation.liquidationValue;
  }

  public get isRebalanceDepositNeeded() {
    return this.cachedObservation.isRebalanceDepositNeeded;
  }

  public get maxRebalanceDepositAmount() {
    return this.cachedObservation.maxRebalanceDepositAmount;
  }

  public get isEmpty() {
    return this.cachedObservation.isEmpty;
  }

  /**
   * UTP authority (PDA)
   */
  public async authority(seed?: PublicKey): Promise<[PublicKey, number]> {
    return getUtpAuthority(this.config.programId, seed || this._utpConfig.authoritySeed, this._program.programId);
  }

  // --- Others

  /**
   * Calculates liquidation parameters given an account value.
   */
  public computeLiquidationPrices(): LiquidationPrices {
    let liquidatorFee = this.liquidationValue.times(LIQUIDATOR_LIQUIDATION_FEE);
    let insuranceVaultFee = this.liquidationValue.times(INSURANCE_VAULT_LIQUIDATION_FEE);

    let discountedLiquidatorPrice = this.liquidationValue.minus(liquidatorFee);
    let finalPrice = discountedLiquidatorPrice.minus(insuranceVaultFee);

    return {
      finalPrice,
      discountedLiquidatorPrice,
      insuranceVaultFee,
    };
  }

  /**
   * Update instance data from provided data struct.
   *
   * @internal
   */
  public update(data: UtpData) {
    this.isActive = data.isActive;
    this._utpConfig = data.accountConfig;
  }

  public toString() {
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
}

export default UtpAccount;
