import construct

from marginpy.utp.mango.utils import (
    DecimalAdapter,
    PublicKeyAdapter,
    FloatI80F48Adapter,
    SignedDecimalAdapter,
    DatetimeAdapter,
    DATA_TYPE,
    MAX_TOKENS,
    MAX_PAIRS,
    MAX_NODE_BANKS,
)

METADATA = construct.Struct(
    "data_type" / DATA_TYPE,
    "version" / DecimalAdapter(1),
    "is_initialized" / DecimalAdapter(1),
    construct.Padding(5),
)


TOKEN_INFO = construct.Struct(
    "mint" / PublicKeyAdapter(),
    "root_bank" / PublicKeyAdapter(),
    "decimals" / DecimalAdapter(1),
    construct.Padding(7),
)


SPOT_MARKET_INFO = construct.Struct(
    "spot_market" / PublicKeyAdapter(),
    "maint_asset_weight" / FloatI80F48Adapter(),
    "init_asset_weight" / FloatI80F48Adapter(),
    "maint_liab_weight" / FloatI80F48Adapter(),
    "init_liab_weight" / FloatI80F48Adapter(),
    "liquidation_fee" / FloatI80F48Adapter(),
)


PERP_MARKET_INFO = construct.Struct(
    "perp_market" / PublicKeyAdapter(),
    "maint_asset_weight" / FloatI80F48Adapter(),
    "init_asset_weight" / FloatI80F48Adapter(),
    "maint_liab_weight" / FloatI80F48Adapter(),
    "init_liab_weight" / FloatI80F48Adapter(),
    "liquidation_fee" / FloatI80F48Adapter(),
    "maker_fee" / FloatI80F48Adapter(),
    "taker_fee" / FloatI80F48Adapter(),
    "base_lot_size" / SignedDecimalAdapter(),
    "quote_lot_size" / SignedDecimalAdapter(),
)


MANGO_GROUP = construct.Struct(
    "meta_data" / METADATA,
    "num_oracles" / DecimalAdapter(),
    "tokens" / construct.Array(MAX_TOKENS, TOKEN_INFO),
    "spot_markets" / construct.Array(MAX_PAIRS, SPOT_MARKET_INFO),
    "perp_markets" / construct.Array(MAX_PAIRS, PERP_MARKET_INFO),
    "oracles" / construct.Array(MAX_PAIRS, PublicKeyAdapter()),
    "signer_nonce" / DecimalAdapter(),
    "signer_key" / PublicKeyAdapter(),
    "admin" / PublicKeyAdapter(),
    "serum_program_address" / PublicKeyAdapter(),
    "cache" / PublicKeyAdapter(),
    "valid_interval" / DecimalAdapter(),
    "insurance_vault" / PublicKeyAdapter(),
    "srm_vault" / PublicKeyAdapter(),
    "msrm_vault" / PublicKeyAdapter(),
    "fees_vault" / PublicKeyAdapter(),
    "max_mango_accounts" / DecimalAdapter(4),
    "num_mango_accounts" / DecimalAdapter(4),
    "referral_surcharge_centibps" / DecimalAdapter(4),
    "referral_share_centibps" / DecimalAdapter(4),
    "referral_mngo_required" / DecimalAdapter(),
    construct.Padding(8),
)

# # 🥭 ROOT_BANK
#
# Here's the [Rust structure](https://github.com/blockworks-foundation/mango-v3/blob/main/program/src/state.rs):
# ```
# /// This is the root bank for one token's lending and borrowing info
# #[derive(Copy, Clone, Pod, Loadable)]
# #[repr(C)]
# pub struct RootBank {
#     pub meta_data: MetaData,
#
#     pub optimal_util: I80F48,
#     pub optimal_rate: I80F48,
#     pub max_rate: I80F48,
#
#     pub num_node_banks: usize,
#     pub node_banks: [Pubkey; MAX_NODE_BANKS],
#
#     pub deposit_index: I80F48,
#     pub borrow_index: I80F48,
#     pub last_updated: u64,
#
#     padding: [u8; 64], // used for future expansions
# }
# ```
ROOT_BANK = construct.Struct(
    "meta_data" / METADATA,
    "optimal_util" / FloatI80F48Adapter(),
    "optimal_rate" / FloatI80F48Adapter(),
    "max_rate" / FloatI80F48Adapter(),
    "num_node_banks" / DecimalAdapter(),
    "node_banks" / construct.Array(MAX_NODE_BANKS, PublicKeyAdapter()),
    "deposit_index" / FloatI80F48Adapter(),
    "borrow_index" / FloatI80F48Adapter(),
    "last_updated" / DatetimeAdapter(),
    construct.Padding(64),
)


# # 🥭 NODE_BANK
#
# Here's the [Rust structure](https://github.com/blockworks-foundation/mango-v3/blob/main/program/src/state.rs):
# ```
# #[derive(Copy, Clone, Pod, Loadable)]
# #[repr(C)]
# pub struct NodeBank {
#     pub meta_data: MetaData,
#
#     pub deposits: I80F48,
#     pub borrows: I80F48,
#     pub vault: Pubkey,
# }
# ```
NODE_BANK = construct.Struct(
    "meta_data" / METADATA,
    "deposits" / FloatI80F48Adapter(),
    "borrows" / FloatI80F48Adapter(),
    "vault" / PublicKeyAdapter(),
)


# # 🥭 LIQUIDITY_MINING_INFO
#
# Here's the [Rust structure](https://github.com/blockworks-foundation/mango-v3/blob/main/program/src/state.rs):
# ```
# #[derive(Copy, Clone, Pod)]
# #[repr(C)]
# /// Information regarding market maker incentives for a perp market
# pub struct LiquidityMiningInfo {
#     /// Used to convert liquidity points to MNGO
#     pub rate: I80F48,
#
#     pub max_depth_bps: I80F48,
#
#     /// start timestamp of current liquidity incentive period; gets updated when mngo_left goes to 0
#     pub period_start: u64,
#
#     /// Target time length of a period in seconds
#     pub target_period_length: u64,
#
#     /// Paper MNGO left for this period
#     pub mngo_left: u64,
#
#     /// Total amount of MNGO allocated for current period
#     pub mngo_per_period: u64,
# }
# ```
LIQUIDITY_MINING_INFO = construct.Struct(
    "rate" / FloatI80F48Adapter(),
    "max_depth_bps" / FloatI80F48Adapter(),
    "period_start" / DatetimeAdapter(),
    "target_period_length" / DecimalAdapter(),
    "mngo_left" / DecimalAdapter(),
    "mngo_per_period" / DecimalAdapter(),
)


# # 🥭 PERP_MARKET
#
# Here's the [Rust structure](https://github.com/blockworks-foundation/mango-v3/blob/main/program/src/state.rs):
# ```
# /// This will hold top level info about the perps market
# /// Likely all perps transactions on a market will be locked on this one because this will be passed in as writable
# #[derive(Copy, Clone, Pod, Loadable)]
# #[repr(C)]
# pub struct PerpMarket {
#     pub meta_data: MetaData,
#
#     pub mango_group: Pubkey,
#     pub bids: Pubkey,
#     pub asks: Pubkey,
#     pub event_queue: Pubkey,
#     pub quote_lot_size: i64, // number of quote native that reresents min tick
#     pub base_lot_size: i64,  // represents number of base native quantity; greater than 0
#
#     pub long_funding: I80F48,
#     pub short_funding: I80F48,
#
#     pub open_interest: i64, // This is i64 to keep consistent with the units of contracts, but should always be > 0
#
#     pub last_updated: u64,
#     pub seq_num: u64,
#     pub fees_accrued: I80F48, // native quote currency
#
#     pub liquidity_mining_info: LiquidityMiningInfo,
#
#     // mngo_vault holds mango tokens to be disbursed as liquidity incentives for this perp market
#     pub mngo_vault: Pubkey,
# }
# ```
PERP_MARKET = construct.Struct(
    "meta_data" / METADATA,
    "group" / PublicKeyAdapter(),
    "bids" / PublicKeyAdapter(),
    "asks" / PublicKeyAdapter(),
    "event_queue" / PublicKeyAdapter(),
    "quote_lot_size" / SignedDecimalAdapter(),
    "base_lot_size" / SignedDecimalAdapter(),
    "long_funding" / FloatI80F48Adapter(),
    "short_funding" / FloatI80F48Adapter(),
    "open_interest" / SignedDecimalAdapter(),
    "last_updated" / DatetimeAdapter(),
    "seq_num" / DecimalAdapter(),
    "fees_accrued" / FloatI80F48Adapter(),
    "liquidity_mining_info" / LIQUIDITY_MINING_INFO,
    "mngo_vault" / PublicKeyAdapter(),
)
