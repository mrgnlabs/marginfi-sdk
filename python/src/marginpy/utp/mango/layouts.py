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
    MAX_NODE_BANKS
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
