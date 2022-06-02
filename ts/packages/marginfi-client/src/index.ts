import { IS_BROWSER } from './utils';
import { NodeWallet } from './nodeWallet';
import { WasmMarginRequirement, init } from '@mrgnlabs/marginfi-wasm-tools';

import * as constants from './constants';
export * from './constants';

import * as config from './config';
export * from './config';

import * as idl from './idl';
export * from './idl';

import * as state from './state';
export * from './state';

import * as types from './types';
export * from './types';

import * as utils from './utils';
export * from './utils';

import * as utp from './utp';
export * from './utp';

export * from './client';
export * from './marginAccount';
export * from './marginfiGroup';

export declare class Wallet extends NodeWallet {}
if (!IS_BROWSER) {
  exports.Wallet = require('./nodeWallet').NodeWallet;
}

export { config, constants, idl, state, types, utils, utp };
export { WasmMarginRequirement as MarginRequirementType }

init(); // enable logging from WebAssembly
