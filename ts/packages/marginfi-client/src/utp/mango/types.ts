import BN from "bn.js";
import { UiAmount } from "../../types";

export interface UtpMangoPlacePerpOrderOptions {
  maxQuoteQuantity?: UiAmount;
  limit?: number;
  orderType?: MangoPerpOrderType;
  clientOrderId?: number;
  reduceOnly?: boolean;
  expiryTimestamp?: number;
  expiryType?: ExpiryType;
}

export interface UtpMangoPlacePerpOrderArgs {
  side: MangoOrderSide;
  price: BN;
  maxBaseQuantity: BN;
  maxQuoteQuantity: BN;
  clientOrderId: BN;
  orderType: MangoPerpOrderType;
  reduceOnly?: boolean;
  expiryTimestamp?: BN;
  limit: BN; // one byte; max 255
  expiryType: ExpiryType;
}

export enum MangoOrderSide {
  Bid = "bid",
  Ask = "ask",
}

/**
 * @internal
 */
export function toProgramSide(side: MangoOrderSide) {
  if (side == MangoOrderSide.Bid) return { bid: {} };
  if (side == MangoOrderSide.Ask) return { ask: {} };
  throw Error("Invalid side");
}

export type IMangoOrderType =
  | {
      limit: {};
    }
  | {
      immediateOrCancel: {};
    }
  | {
      postOnly: {};
    }
  | {
      market: {};
    }
  | {
      postOnlySlide: {};
    };

export enum MangoPerpOrderType {
  Limit,
  ImmediateOrCancel,
  PostOnly,
  Market,
  PostOnlySlide,
}

/**
 * @internal
 */
export function toProgramPerpOrderType(orderType: MangoPerpOrderType): IMangoOrderType {
  if (orderType == MangoPerpOrderType.Limit) return { limit: {} };
  if (orderType == MangoPerpOrderType.ImmediateOrCancel) return { immediateOrCancel: {} };
  if (orderType == MangoPerpOrderType.PostOnly) return { postOnly: {} };
  if (orderType == MangoPerpOrderType.Market) return { market: {} };
  if (orderType == MangoPerpOrderType.PostOnlySlide) return { postOnlySlide: {} };
  throw Error("Invalid side");
}

export enum ExpiryType {
  Absolute,
  Relative,
}

/**
 * @internal
 */
export function toProgramExpiryType(orderType: ExpiryType) {
  if (orderType == ExpiryType.Absolute) return { absolute: {} };
  if (orderType == ExpiryType.Relative) return { relative: {} };
  throw Error("Invalid side");
}
