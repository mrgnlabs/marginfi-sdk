import * as constants from "./constants";
import { NodeWallet } from "./nodeWallet";
import { IS_BROWSER } from "./utils";

import * as config from "./config";
import * as idl from "./idl";
import * as instruction from "./instruction";
import * as bank from "./bank";
import * as types from "./types";
import * as utils from "./utils";
import * as utp from "./utp";

export * from "./client";
export * from "./config";
export * from "./constants";
export * from "./idl";
export * from "./utpAccount";
export * from "./utpObservation";
export * from "./marginfiAccount";
export * from "./marginfiGroup";
export * from "./bank";
export * from "./types";
export * from "./utils";
export * from "./utp";

export { config, constants, idl, bank, types, utils, utp, instruction };

export declare class Wallet extends NodeWallet { }
if (!IS_BROWSER) {
  exports.Wallet = require("./nodeWallet").NodeWallet;
}
