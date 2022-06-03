export interface UtpMangoPlacePerpOrderOptions {
  maxQuoteQuantity?: number;
  limit?: number;
  orderType?: PerpOrderType;
  clientOrderId?: number;
  //   bookSideInfo?: AccountInfo<Buffer>;
  reduceOnly?: boolean;
  //   referrerMangoAccountPk?: PublicKey;
  expiryTimestamp?: number;
}

export enum Side {
  Bid = "bid",
  Ask = "ask",
}

export function toProgramSide(side: Side) {
  if (side == Side.Bid) return { bid: {} };
  if (side == Side.Ask) return { ask: {} };
  throw Error("Invalid side");
}

export enum PerpOrderType {
  Limit,
  ImmediateOrCancel,
  PostOnly,
  Market,
  PostOnlySlide,
}

export function toProgramPerpOrderType(orderType: PerpOrderType) {
  if (orderType == PerpOrderType.Limit) return { limit: {} };
  if (orderType == PerpOrderType.ImmediateOrCancel) return { immediateOrCancel: {} };
  if (orderType == PerpOrderType.PostOnly) return { postOnly: {} };
  if (orderType == PerpOrderType.Market) return { market: {} };
  if (orderType == PerpOrderType.PostOnlySlide) return { postOnlySlide: {} };
  throw Error("Invalid side");
}
