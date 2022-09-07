use crate::marginfi_account::MarginAccount;
use anchor_lang::prelude::{Pubkey, Sysvar};
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use anyhow::Result;
use marginfi::instructions::UtpZoPlacePerpOrderIxArgs;
use marginfi::{
    constants::{ZO_PROGRAM, ZO_UTP_INDEX},
};
use solana_sdk::sysvar::SysvarId;
use solana_sdk::{instruction::Instruction, signer::Signer};
use zo_abi::ZO_DEX_PID;

pub struct PlacePerpOrderAccounts {
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

pub fn make_place_perp_order_ix(
    acc: PlacePerpOrderAccounts,
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
