import { OrderType as IZoOrderType } from "@zero_one/client";
import BN from "bn.js";

export const ZoPerpOrderType = {
  Limit: { limit: {} },
  ImmediateOrCancel: { immediateOrCancel: {} },
  PostOnly: { postOnly: {} },
  ReduceOnlyIoc: { reduceOnlyIoc: {} },
  ReduceOnlyLimit: { reduceOnlyLimit: {} },
  FillOrKill: { fillOrKill: {} },
};

export interface UtpZoPlacePerpOrderArgs {
  isLong: boolean;
  limitPrice: BN;
  maxBaseQuantity: BN;
  maxQuoteQuantity: BN;
  orderType: IZoOrderType;
  limit: number;
  clientId: BN;
}
