use crate::marginfi_account::MarginAccount;
use crate::utils::get_bank_authority;
use anchor_lang::prelude::AccountMeta;
use anchor_lang::prelude::Pubkey;
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;

use marginfi::constants::{ZO_PROGRAM, ZO_UTP_INDEX};
use marginfi::instructions::UtpZoPlacePerpOrderIxArgs;
use marginfi::state::marginfi_group::BankVaultType;
use marginfi::state::zo_state::ZO_STATE_ADDRESS_INDEX;
use solana_sdk::system_program;
use solana_sdk::sysvar;
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
    observation_accounts: Vec<Pubkey>,
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
            observation_accounts: margin_account.get_observation_accounts(),
        }
    }
}

pub fn zo_make_place_perp_order_ix(
    acc: ZoPlacePerpOrderAccounts,
    args: UtpZoPlacePerpOrderIxArgs,
) -> Instruction {
    let mut accounts = marginfi::accounts::UtpZoPlacePerpOrder {
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

    let mut observation_account_metas = acc
        .observation_accounts
        .iter()
        .map(|acc| AccountMeta::new_readonly(*acc, false))
        .collect::<Vec<_>>();

    accounts.append(&mut observation_account_metas);

    Instruction {
        program_id: marginfi::ID,
        accounts,
        data: marginfi::instruction::UtpZoPlacePerpOrder { args }.data(),
    }
}

pub struct UtpZoDepositAccounts {
    marginfi_group: Pubkey,
    marginfi_account: Pubkey,
    signer: Pubkey,
    margin_collateral_vault: Pubkey,
    bank_authority: Pubkey,
    temp_collateral_account: Pubkey,
    utp_authority: Pubkey,
    zo_program: Pubkey,
    zo_margin: Pubkey,
    zo_state: Pubkey,
    zo_state_signer: Pubkey,
    zo_cache: Pubkey,
    zo_vault: Pubkey,
    token_program: Pubkey,
    rent: Pubkey,
    system_program: Pubkey,
}

impl UtpZoDepositAccounts {
    pub fn new(margin_account: &MarginAccount, temp_collateral_account: &Pubkey) -> Self {
        let (bank_authority, _) = get_bank_authority(
            BankVaultType::LiquidityVault,
            &margin_account.client.config.marginfi_group,
        );

        let (utp_authority, _) = margin_account.get_utp_authority(ZO_UTP_INDEX);

        let zo_observer = margin_account.observer.zo_observer.expect("no zo observer");

        let (zo_state_signer, _) = get_state_signer(&zo_observer.state_pk);

        let zo_state = zo_observer.state;

        let vault_mint = margin_account.client.group.bank.mint;
        let vault_index = zo_state
            .collaterals
            .iter()
            .position(|ci| ci.mint == vault_mint)
            .expect("Cannot find zo vault");

        let zo_vault = zo_state.vaults[vault_index];

        Self {
            marginfi_group: margin_account.client.config.marginfi_group,
            marginfi_account: margin_account.address,
            signer: margin_account.client.keypair.pubkey(),
            margin_collateral_vault: margin_account.client.group.bank.vault,
            bank_authority,
            temp_collateral_account: *temp_collateral_account,
            utp_authority,
            zo_program: ZO_PROGRAM,
            zo_margin: zo_observer.margin_pk,
            zo_state: zo_observer.state_pk,
            zo_state_signer,
            zo_cache: zo_observer.cache_pk,
            zo_vault: zo_vault,
            token_program: anchor_spl::token::ID,
            rent: sysvar::rent::ID,
            system_program: system_program::ID,
        }
    }
}

pub fn zo_make_deposit_ix(amount: u64) -> Instruction {
    let accounts = marginfi::accounts::UtpZoDeposit {
        marginfi_group: Pubkey::new_unique(),
        marginfi_account: Pubkey::default(),
        signer: Pubkey::default(),
        margin_collateral_vault: Pubkey::default(),
        bank_authority: Pubkey::default(),
        temp_collateral_account: Pubkey::default(),
        utp_authority: Pubkey::default(),
        zo_program: ZO_PROGRAM,
        zo_margin: Pubkey::default(),
        zo_state: Pubkey::default(),
        zo_state_signer: Pubkey::default(),
        zo_cache: Pubkey::default(),
        zo_vault: Pubkey::default(),
        token_program: anchor_spl::token::ID,
        rent: Pubkey::default(),
        system_program: solana_sdk::system_program::ID,
    };

    Instruction {
        program_id: marginfi::ID,
        accounts: vec![],
        data: marginfi::instruction::UtpZoDeposit { amount }.data(),
    }
}
