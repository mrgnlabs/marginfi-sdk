use crate::marginfi_account::MarginAccount;
use anchor_lang::prelude::Pubkey;
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;

use marginfi::constants::{ZO_PROGRAM, ZO_UTP_INDEX};
use marginfi::instructions::UtpZoPlacePerpOrderIxArgs;
use marginfi::state::zo_state::ZO_STATE_ADDRESS_INDEX;
use solana_sdk::sysvar::SysvarId;
use solana_sdk::{instruction::Instruction, signer::Signer};
use zo_abi::dex::ZoDexMarket;
use zo_abi::{PerpMarketInfo, ZO_DEX_PID};

pub struct ZoPlacePerpOrderAccounts {
    marginfi_account: Pubkey,
    marginfi_group: Pubkey,
    signer: Pubkey,
    utp_authority: Pubkey,
    state: Pubkey,
    state_signer: Pubkey,
    cache: Pubkey,
    margin: Pubkey,
    control: Pubkey,
    open_orders: Pubkey,
    dex_market: Pubkey,
    req_q: Pubkey,
    event_q: Pubkey,
    market_bids: Pubkey,
    market_asks: Pubkey,
}

pub fn get_state_signer(state_pk: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[state_pk.as_ref()], &ZO_PROGRAM)
}

pub fn get_open_orders_key(dex_market_pk: &Pubkey, control_pk: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[control_pk.as_ref(), dex_market_pk.as_ref()], &ZO_DEX_PID)
}

impl ZoPlacePerpOrderAccounts {
    pub fn new(
        margin_account: &MarginAccount,
        zo_state: &zo_abi::State,
        zo_margin: &zo_abi::Margin,
        perp_market_info: &PerpMarketInfo,
        dex_market: &ZoDexMarket,
    ) -> Self {
        let state_pk = margin_account.marginfi_account.utp_account_config[ZO_UTP_INDEX]
            .utp_address_book[ZO_STATE_ADDRESS_INDEX];
        ZoPlacePerpOrderAccounts {
            marginfi_account: margin_account.address,
            marginfi_group: margin_account.client.config.marginfi_group,
            signer: margin_account.client.keypair.pubkey(),
            utp_authority: margin_account.get_utp_authority(ZO_UTP_INDEX).0,
            state: state_pk,
            state_signer: get_state_signer(&state_pk).0,
            cache: zo_state.cache,
            margin: margin_account.marginfi_account.utp_account_config[ZO_UTP_INDEX].address,
            control: zo_margin.control,
            open_orders: get_open_orders_key(&perp_market_info.dex_market, &zo_margin.control).0,
            dex_market: perp_market_info.dex_market,
            req_q: dex_market.req_q,
            event_q: dex_market.event_q,
            market_bids: dex_market.bids,
            market_asks: dex_market.asks,
        }
    }
}

pub fn zo_make_place_perp_order_ix(
    acc: ZoPlacePerpOrderAccounts,
    args: UtpZoPlacePerpOrderIxArgs,
) -> Instruction {
    let accounts = marginfi::accounts::UtpZoPlacePerpOrder {
        header: marginfi::accounts::HeaderAccountsNoAuthorityCheck {
            marginfi_account: acc.marginfi_account,
            marginfi_group: acc.marginfi_group,
            signer: acc.signer,
            utp_authority: acc.utp_authority,
        },
        zo_program: ZO_PROGRAM,
        state: acc.state,
        state_signer: acc.state_signer,
        cache: acc.cache,
        margin: acc.margin,
        control: acc.control,
        open_orders: acc.open_orders,
        dex_market: acc.dex_market,
        req_q: acc.req_q,
        event_q: acc.event_q,
        market_bids: acc.market_bids,
        market_asks: acc.market_asks,
        dex_program: ZO_DEX_PID,
        rent: solana_sdk::sysvar::rent::Rent::id(),
    }
    .to_account_metas(Some(true));

    Instruction {
        program_id: marginfi::ID,
        accounts,
        data: marginfi::instruction::UtpZoPlacePerpOrder { args }.data(),
    }
}
