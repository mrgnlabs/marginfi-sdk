import * as constants from "./constants";
import { NodeWallet } from "./nodeWallet";
import { IS_BROWSER } from "./utils";

import * as bank from "./bank";
import * as config from "./config";
import * as idl from "./idl";
import * as instruction from "./instruction";
import * as types from "./types";
import * as utils from "./utils";
import * as utp from "./utp";

export * from "./bank";
export * from "./client";
export * from "./config";
export * from "./constants";
export * from "./idl";
export * from "./account";
export * from "./group";
export * from "./types";
export * from "./utils";
export * from "./utp";
export * from "./utpAccount";
export * from "./utpObservation";
export { config, constants, idl, bank, types, utils, utp, instruction };

export declare class Wallet extends NodeWallet { }
if (!IS_BROWSER) {
  exports.Wallet = require("./nodeWallet").NodeWallet;
}
