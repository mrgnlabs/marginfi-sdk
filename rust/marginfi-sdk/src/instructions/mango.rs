use anchor_lang::prelude::Pubkey;
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use idontsee;
use mango_protocol::state::MangoGroup;
use mango_protocol::state::PerpMarket;
use mango_protocol::state::PerpMarketInfo;
use marginfi::constants::MANGO_PROGRAM;
use marginfi::constants::MANGO_UTP_INDEX;
use marginfi::instructions::UtpMangoPlacePerpOrderArgs;
use marginfi::state::mango_state::MANGO_GROUP_ADDRESS_INDEX;
use solana_sdk::instruction::Instruction;
use solana_sdk::signer::Signer;

use crate::marginfi_account::MarginAccount;

pub struct MangoPlacePerpOrderAccounts {
    marginfi_account: Pubkey,
    marginfi_group: Pubkey,
    signer: Pubkey,
    mango_authority: Pubkey,
    mango_account: Pubkey,
    mango_group: Pubkey,
    mango_cache: Pubkey,
    mango_perp_market: Pubkey,
    mango_bids: Pubkey,
    mango_asks: Pubkey,
    mango_event_queue: Pubkey,
}

impl MangoPlacePerpOrderAccounts {
    pub fn new(
        margin_account: &MarginAccount,
        mango_group: &MangoGroup,
        perp_market_info: &PerpMarketInfo,
        perp_market: &PerpMarket,
    ) -> Self {
        let mango_utp_config = &margin_account.marginfi_account.utp_account_config[MANGO_UTP_INDEX];
        MangoPlacePerpOrderAccounts {
            marginfi_account: margin_account.address,
            marginfi_group: margin_account.client.config.marginfi_group,
            signer: margin_account.client.keypair.pubkey(),
            mango_authority: margin_account.get_utp_authority(MANGO_UTP_INDEX).0,
            mango_account: mango_utp_config.address,
            mango_group: mango_utp_config.utp_address_book[MANGO_GROUP_ADDRESS_INDEX],
            mango_cache: mango_group.mango_cache,
            mango_perp_market: perp_market_info.perp_market,
            mango_bids: perp_market.bids,
            mango_asks: perp_market.asks,
            mango_event_queue: perp_market.event_queue,
        }
    }
}

pub fn mango_make_place_perp_order_ix(
    acc: MangoPlacePerpOrderAccounts,
    args: UtpMangoPlacePerpOrderArgs,
) -> Instruction {
    let accounts = marginfi::accounts::UtpMangoPlacePerpOrder {
        marginfi_account: acc.marginfi_account,
        marginfi_group: acc.marginfi_group,
        signer: acc.signer,
        mango_authority: acc.mango_authority,
        mango_account: acc.mango_account,
        mango_program: MANGO_PROGRAM,
        mango_group: acc.mango_group,
        mango_cache: acc.mango_cache,
        mango_perp_market: acc.mango_perp_market,
        mango_bids: acc.mango_bids,
        mango_asks: acc.mango_asks,
        mango_event_queue: acc.mango_event_queue,
    }
    .to_account_metas(Some(true));

    Instruction {
        program_id: marginfi::ID,
        accounts,
        data: marginfi::instruction::UtpMangoUsePlacePerpOrder { args }.data(),
    }
}

pub struct MangoGuardArgs {
    is_long: bool,
    price_limit: u64,
    size: u64,
}

impl MangoGuardArgs {
    pub fn new(is_long: bool, price_limit: u64, size: u64) -> Self {
        MangoGuardArgs {
            is_long,
            price_limit,
            size,
        }
    }
}

pub fn make_mango_guard_ix(
    mango_group_pk: &Pubkey,
    perp_market_info: &PerpMarketInfo,
    perp_market: &PerpMarket,
    args: MangoGuardArgs,
) -> Instruction {
    let accounts = idontsee::accounts::MangoGuard {
        asks: perp_market.asks,
        bids: perp_market.bids,
        market: perp_market_info.perp_market,
        mango_group: *mango_group_pk,
        mango_program: MANGO_PROGRAM,
    }
    .to_account_metas(Some(true));

    let MangoGuardArgs {
        is_long,
        price_limit,
        size,
    } = args;

    Instruction {
        program_id: idontsee::ID,
        accounts,
        data: idontsee::instruction::MangoGuard {
            is_long,
            price_limit,
            size,
        }
        .data(),
    }
}
