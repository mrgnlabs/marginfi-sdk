import { init, WasmMarginRequirement } from "@mrgnlabs/marginfi-wasm-tools-web";
import * as constants from "./constants";

import * as config from "../base/src/config";
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

init(); // enable logging from WebAssembly
