import BigNumber from "bignumber.js";
import { format } from "util";

export interface IUtpObservation {
  timestamp: Date,
  equity: BigNumber,
  freeCollateral: BigNumber,
  liquidationValue: BigNumber,
  isRebalanceDepositNeeded: boolean,
  maxRebalanceDepositAmount: BigNumber,
  isEmpty: boolean,
}

/**
 * UtpObservation struct mirroring on-chain data.
 * Contains a UTP health metrics.
 */
export class UtpObservation implements IUtpObservation {
  public timestamp: Date
  public equity: BigNumber
  public freeCollateral: BigNumber
  public liquidationValue: BigNumber
  public isRebalanceDepositNeeded: boolean
  public maxRebalanceDepositAmount: BigNumber
  public isEmpty: boolean

  static EMPTY_OBSERVATION = new UtpObservation({
    timestamp: new Date(0),
    equity: new BigNumber(0),
    freeCollateral: new BigNumber(0),
    maxRebalanceDepositAmount: new BigNumber(0),
    liquidationValue: new BigNumber(0),
    isEmpty: false,
    isRebalanceDepositNeeded: false,
  })

  constructor(
    data: IUtpObservation
  ) {
    this.timestamp = data.timestamp
    this.equity = data.equity
    this.freeCollateral = data.freeCollateral
    this.liquidationValue = data.liquidationValue
    this.isRebalanceDepositNeeded = data.isRebalanceDepositNeeded
    this.maxRebalanceDepositAmount = data.maxRebalanceDepositAmount
    this.isEmpty = data.isEmpty
  }

  toString() {
    return format(
      "Timestamp: %s\nEquity: %s\nFree Collateral: %s\nLiquidation Value: %s\nRebalance Needed: %s\nMax Rebalance: %s\nIs empty: %s",
      this.timestamp,
      this.equity.toString(),
      this.freeCollateral.toString(),
      this.liquidationValue.toString(),
      this.isRebalanceDepositNeeded,
      this.maxRebalanceDepositAmount.toString(),
      this.isEmpty,
    );
  }
}

