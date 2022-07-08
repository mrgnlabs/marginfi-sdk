import MarginfiAccount from "./account";
import Bank from "./bank";
import MarginfiClient from "./client";
import MarginfiGroup from "./group";
import instructions from "./instructions";
import { NodeWallet } from "./nodeWallet";
import { IS_BROWSER } from "./utils";

export * from "./account";
export * from "./config";
export * from "./constants";
export * from "./group";
export * from "./idl";
export * from "./types";
export * from "./utils";
export * from "./utp";
export { Bank, MarginfiAccount, MarginfiClient, MarginfiGroup, instructions };

export declare class Wallet extends NodeWallet {}
if (!IS_BROWSER) {
  exports.Wallet = require("./nodeWallet").NodeWallet;
}
