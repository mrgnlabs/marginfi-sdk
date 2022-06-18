/* tslint:disable */
/* eslint-disable */
/**
* @returns {Uint8Array}
*/
export function create_observer(): Uint8Array;
/**
* @param {Uint8Array} observer_data
* @param {WasmObservation} wasm_observation
* @param {number} utp_index
* @returns {Uint8Array}
*/
export function inject_observation_into_observer(observer_data: Uint8Array, wasm_observation: WasmObservation, utp_index: number): Uint8Array;
/**
* @param {WasmObservation} wasm_observation
* @returns {boolean}
*/
export function rebalance_deposit_valid(wasm_observation: WasmObservation): boolean;
/**
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {Uint8Array} utp_observer_data
* @returns {boolean}
*/
export function is_bankrupt(marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, utp_observer_data: Uint8Array): boolean;
/**
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {Uint8Array} utp_observer_data
* @returns {boolean}
*/
export function rebalance_withdraw_valid(marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, utp_observer_data: Uint8Array): boolean;
/**
* @param {WasmObservation} observation
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {Uint8Array} utp_observer_data
* @returns {WasmDecimal}
*/
export function get_max_rebalance_deposit_amount(observation: WasmObservation, marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, utp_observer_data: Uint8Array): WasmDecimal;
/**
* @param {WasmObservation} observation
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {Uint8Array} utp_observer_data
* @returns {WasmDecimal}
*/
export function get_max_rebalance_withdraw_amount(observation: WasmObservation, marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, utp_observer_data: Uint8Array): WasmDecimal;
/**
* @param {Uint8Array} mango_group_data
* @param {Uint8Array} mango_account_data
* @param {Uint8Array} mango_cache_data
* @param {BigInt} timestamp
* @returns {WasmObservation}
*/
export function observe_mango(mango_group_data: Uint8Array, mango_account_data: Uint8Array, mango_cache_data: Uint8Array, timestamp: BigInt): WasmObservation;
/**
* @param {Uint8Array} zo_margin_data
* @param {Uint8Array} zo_control_data
* @param {Uint8Array} zo_state_data
* @param {Uint8Array} zo_cache_data
* @returns {WasmObservation}
*/
export function observe_zo(zo_margin_data: Uint8Array, zo_control_data: Uint8Array, zo_state_data: Uint8Array, zo_cache_data: Uint8Array): WasmObservation;
/**
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {Uint8Array} utp_observer_data
* @returns {boolean}
*/
export function liquidation_valid(marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, utp_observer_data: Uint8Array): boolean;
/**
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {boolean} deposit
* @returns {BigInt}
*/
export function get_quote_balance(marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, deposit: boolean): BigInt;
/**
* @param {Uint8Array} marginfi_account_data
* @param {Uint8Array} marginfi_group_data
* @param {number} wasm_mreq_t
* @returns {WasmDecimal}
*/
export function get_margin_requirement(marginfi_account_data: Uint8Array, marginfi_group_data: Uint8Array, wasm_mreq_t: number): WasmDecimal;
/**
* @param {WasmObservation} wasm_observation
* @returns {BigInt}
*/
export function get_utp_liquidator_price(wasm_observation: WasmObservation): BigInt;
/**
* Initialize Javascript logging and panic handler
*/
export function init(): void;
/**
*/
export enum WasmMarginRequirement {
  Init,
  Maint,
}
/**
*/
export class Hash {
  free(): void;
/**
* Create a new Hash object
*
* * `value` - optional hash as a base58 encoded string, `Uint8Array`, `[number]`
* @param {any} value
*/
  constructor(value: any);
/**
* Return the base58 string representation of the hash
* @returns {string}
*/
  toString(): string;
/**
* Checks if two `Hash`s are equal
* @param {Hash} other
* @returns {boolean}
*/
  equals(other: Hash): boolean;
/**
* Return the `Uint8Array` representation of the hash
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
* A directive for a single invocation of a Solana program.
*
* An instruction specifies which program it is calling, which accounts it may
* read or modify, and additional data that serves as input to the program. One
* or more instructions are included in transactions submitted by Solana
* clients. Instructions are also used to describe [cross-program
* invocations][cpi].
*
* [cpi]: https://docs.solana.com/developing/programming-model/calling-between-programs
*
* During execution, a program will receive a list of account data as one of
* its arguments, in the same order as specified during `Instruction`
* construction.
*
* While Solana is agnostic to the format of the instruction data, it has
* built-in support for serialization via [`borsh`] and [`bincode`].
*
* [`borsh`]: https://docs.rs/borsh/latest/borsh/
* [`bincode`]: https://docs.rs/bincode/latest/bincode/
*
* # Specifying account metadata
*
* When constructing an [`Instruction`], a list of all accounts that may be
* read or written during the execution of that instruction must be supplied as
* [`AccountMeta`] values.
*
* Any account whose data may be mutated by the program during execution must
* be specified as writable. During execution, writing to an account that was
* not specified as writable will cause the transaction to fail. Writing to an
* account that is not owned by the program will cause the transaction to fail.
*
* Any account whose lamport balance may be mutated by the program during
* execution must be specified as writable. During execution, mutating the
* lamports of an account that was not specified as writable will cause the
* transaction to fail. While _subtracting_ lamports from an account not owned
* by the program will cause the transaction to fail, _adding_ lamports to any
* account is allowed, as long is it is mutable.
*
* Accounts that are not read or written by the program may still be specified
* in an `Instruction`'s account list. These will affect scheduling of program
* execution by the runtime, but will otherwise be ignored.
*
* When building a transaction, the Solana runtime coalesces all accounts used
* by all instructions in that transaction, along with accounts and permissions
* required by the runtime, into a single account list. Some accounts and
* account permissions required by the runtime to process a transaction are
* _not_ required to be included in an `Instruction`s account list. These
* include:
*
* - The program ID &mdash; it is a separate field of `Instruction`
* - The transaction's fee-paying account &mdash; it is added during [`Message`]
*   construction. A program may still require the fee payer as part of the
*   account list if it directly references it.
*
* [`Message`]: crate::message::Message
*
* Programs may require signatures from some accounts, in which case they
* should be specified as signers during `Instruction` construction. The
* program must still validate during execution that the account is a signer.
*/
export class Instruction {
  free(): void;
}
/**
*/
export class Instructions {
  free(): void;
/**
*/
  constructor();
/**
* @param {Instruction} instruction
*/
  push(instruction: Instruction): void;
}
/**
* A Solana transaction message (legacy).
*
* See the [`message`] module documentation for further description.
*
* [`message`]: crate::message
*
* Some constructors accept an optional `payer`, the account responsible for
* paying the cost of executing a transaction. In most cases, callers should
* specify the payer explicitly in these constructors. In some cases though,
* the caller is not _required_ to specify the payer, but is still allowed to:
* in the `Message` structure, the first account is always the fee-payer, so if
* the caller has knowledge that the first account of the constructed
* transaction's `Message` is both a signer and the expected fee-payer, then
* redundantly specifying the fee-payer is not strictly required.
*/
export class Message {
  free(): void;
/**
* The id of a recent ledger entry.
*/
  recent_blockhash: Hash;
}
/**
*/
export class Pubkey {
  free(): void;
/**
* Create a new Pubkey object
*
* * `value` - optional public key as a base58 encoded string, `Uint8Array`, `[number]`
* @param {any} value
*/
  constructor(value: any);
/**
* Return the base58 string representation of the public key
* @returns {string}
*/
  toString(): string;
/**
* Check if a `Pubkey` is on the ed25519 curve.
* @returns {boolean}
*/
  isOnCurve(): boolean;
/**
* Checks if two `Pubkey`s are equal
* @param {Pubkey} other
* @returns {boolean}
*/
  equals(other: Pubkey): boolean;
/**
* Return the `Uint8Array` representation of the public key
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* Derive a Pubkey from another Pubkey, string seed, and a program id
* @param {Pubkey} base
* @param {string} seed
* @param {Pubkey} owner
* @returns {Pubkey}
*/
  static createWithSeed(base: Pubkey, seed: string, owner: Pubkey): Pubkey;
/**
* Derive a program address from seeds and a program id
* @param {any[]} seeds
* @param {Pubkey} program_id
* @returns {Pubkey}
*/
  static createProgramAddress(seeds: any[], program_id: Pubkey): Pubkey;
/**
* Find a valid program address
*
* Returns:
* * `[PubKey, number]` - the program address and bump seed
* @param {any[]} seeds
* @param {Pubkey} program_id
* @returns {any}
*/
  static findProgramAddress(seeds: any[], program_id: Pubkey): any;
}
export class SystemInstruction {
  free(): void;
/**
* @param {Pubkey} from_pubkey
* @param {Pubkey} to_pubkey
* @param {BigInt} lamports
* @param {BigInt} space
* @param {Pubkey} owner
* @returns {Instruction}
*/
  static createAccount(from_pubkey: Pubkey, to_pubkey: Pubkey, lamports: BigInt, space: BigInt, owner: Pubkey): Instruction;
/**
* @param {Pubkey} from_pubkey
* @param {Pubkey} to_pubkey
* @param {Pubkey} base
* @param {string} seed
* @param {BigInt} lamports
* @param {BigInt} space
* @param {Pubkey} owner
* @returns {Instruction}
*/
  static createAccountWithSeed(from_pubkey: Pubkey, to_pubkey: Pubkey, base: Pubkey, seed: string, lamports: BigInt, space: BigInt, owner: Pubkey): Instruction;
/**
* @param {Pubkey} pubkey
* @param {Pubkey} owner
* @returns {Instruction}
*/
  static assign(pubkey: Pubkey, owner: Pubkey): Instruction;
/**
* @param {Pubkey} pubkey
* @param {Pubkey} base
* @param {string} seed
* @param {Pubkey} owner
* @returns {Instruction}
*/
  static assignWithSeed(pubkey: Pubkey, base: Pubkey, seed: string, owner: Pubkey): Instruction;
/**
* @param {Pubkey} from_pubkey
* @param {Pubkey} to_pubkey
* @param {BigInt} lamports
* @returns {Instruction}
*/
  static transfer(from_pubkey: Pubkey, to_pubkey: Pubkey, lamports: BigInt): Instruction;
/**
* @param {Pubkey} from_pubkey
* @param {Pubkey} from_base
* @param {string} from_seed
* @param {Pubkey} from_owner
* @param {Pubkey} to_pubkey
* @param {BigInt} lamports
* @returns {Instruction}
*/
  static transferWithSeed(from_pubkey: Pubkey, from_base: Pubkey, from_seed: string, from_owner: Pubkey, to_pubkey: Pubkey, lamports: BigInt): Instruction;
/**
* @param {Pubkey} pubkey
* @param {BigInt} space
* @returns {Instruction}
*/
  static allocate(pubkey: Pubkey, space: BigInt): Instruction;
/**
* @param {Pubkey} address
* @param {Pubkey} base
* @param {string} seed
* @param {BigInt} space
* @param {Pubkey} owner
* @returns {Instruction}
*/
  static allocateWithSeed(address: Pubkey, base: Pubkey, seed: string, space: BigInt, owner: Pubkey): Instruction;
/**
* @param {Pubkey} from_pubkey
* @param {Pubkey} nonce_pubkey
* @param {Pubkey} authority
* @param {BigInt} lamports
* @returns {Array<any>}
*/
  static createNonceAccount(from_pubkey: Pubkey, nonce_pubkey: Pubkey, authority: Pubkey, lamports: BigInt): Array<any>;
/**
* @param {Pubkey} nonce_pubkey
* @param {Pubkey} authorized_pubkey
* @returns {Instruction}
*/
  static advanceNonceAccount(nonce_pubkey: Pubkey, authorized_pubkey: Pubkey): Instruction;
/**
* @param {Pubkey} nonce_pubkey
* @param {Pubkey} authorized_pubkey
* @param {Pubkey} to_pubkey
* @param {BigInt} lamports
* @returns {Instruction}
*/
  static withdrawNonceAccount(nonce_pubkey: Pubkey, authorized_pubkey: Pubkey, to_pubkey: Pubkey, lamports: BigInt): Instruction;
/**
* @param {Pubkey} nonce_pubkey
* @param {Pubkey} authorized_pubkey
* @param {Pubkey} new_authority
* @returns {Instruction}
*/
  static authorizeNonceAccount(nonce_pubkey: Pubkey, authorized_pubkey: Pubkey, new_authority: Pubkey): Instruction;
}
/**
*/
export class WasmDecimal {
  free(): void;
/**
* @param {number} flags
* @param {number} hi
* @param {number} lo
* @param {number} mid
* @returns {WasmDecimal}
*/
  static new(flags: number, hi: number, lo: number, mid: number): WasmDecimal;
/**
*/
  flags: number;
/**
*/
  hi: number;
/**
*/
  lo: number;
/**
*/
  mid: number;
}
/**
*/
export class WasmObservation {
  free(): void;
/**
* @param {BigInt} total_collateral
* @param {BigInt} free_collateral
* @param {BigInt} margin_requirement_init
* @param {BigInt} margin_requirement_maint
* @param {BigInt} equity
* @param {boolean} valid
* @returns {WasmObservation}
*/
  static new(total_collateral: BigInt, free_collateral: BigInt, margin_requirement_init: BigInt, margin_requirement_maint: BigInt, equity: BigInt, valid: boolean): WasmObservation;
/**
* @returns {WasmObservation}
*/
  static invalid(): WasmObservation;
/**
*/
  equity: BigInt;
/**
* Amount of collateral not locked by margin requirements;
* Available for opening new positions
*/
  free_collateral: BigInt;
/**
* Amount of collateral required by initialization margin requirements
* of positions in a UTP
*/
  margin_requirement_init: BigInt;
/**
* Amount of collateral required by initialization margin requirements
* of positions in a UTP
*/
  margin_requirement_maint: BigInt;
/**
* Total amount of collateral available in a UTP
*/
  total_collateral: BigInt;
/**
*/
  valid: boolean;
}
