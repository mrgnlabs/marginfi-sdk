import { init, WasmMarginRequirement } from "@mrgnlabs/marginfi-wasm-tools";
import * as constants from "./constants";
import { NodeWallet } from "./nodeWallet";
import { IS_BROWSER } from "./utils";

import * as config from "./config";
import * as idl from "./idl";
import * as instruction from "./instruction";
import * as state from "./state";
import * as types from "./types";
import * as utils from "./utils";
import * as utp from "./utp";

export * from "./client";
export * from "./config";
export * from "./constants";
export * from "./idl";
export * from "./marginfiAccount";
export * from "./marginfiGroup";
export * from "./state";
export * from "./types";
export * from "./utils";
export * from "./utp";
export { config, constants, idl, state, types, utils, utp, instruction };
export { WasmMarginRequirement as MarginRequirementType };

export declare class Wallet extends NodeWallet {}
if (!IS_BROWSER) {
  exports.Wallet = require("./nodeWallet").NodeWallet;
}

init(); // enable logging from WebAssembly
