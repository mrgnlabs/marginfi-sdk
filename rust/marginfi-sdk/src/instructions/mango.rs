use anchor_lang::prelude::AccountMeta;
use anchor_lang::prelude::Pubkey;
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use anchor_spl::token;
use bytemuck::bytes_of;
use idontsee;
use mango_protocol::state::MangoGroup;
use mango_protocol::state::NodeBank;
use mango_protocol::state::PerpMarket;
use mango_protocol::state::PerpMarketInfo;
use mango_protocol::state::RootBank;
use mango_protocol::state::QUOTE_INDEX;
use marginfi::constants::MANGO_PROGRAM;
use marginfi::constants::MANGO_UTP_INDEX;
use marginfi::instructions::UtpMangoPlacePerpOrderArgs;
use marginfi::state::mango_state::MANGO_GROUP_ADDRESS_INDEX;
use marginfi::state::marginfi_group::BankVaultType;
use solana_sdk::instruction::Instruction;
use solana_sdk::signer::Signer;

use crate::marginfi_account::MarginAccount;
use crate::observer::MangoObserver;
use crate::utils::get_bank_authority;
use crate::utils::pubkey_to_readonly_account_metas;

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
    observation_accounts: Vec<Pubkey>,
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
            observation_accounts: margin_account.get_observation_accounts(),
        }
    }
}

pub fn mango_make_place_perp_order_ix(
    acc: MangoPlacePerpOrderAccounts,
    args: UtpMangoPlacePerpOrderArgs,
) -> Instruction {
    let mut accounts = marginfi::accounts::UtpMangoPlacePerpOrder {
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

    let mut observation_account_metas = acc
        .observation_accounts
        .iter()
        .map(|acc| AccountMeta::new_readonly(*acc, false))
        .collect::<Vec<_>>();

    accounts.append(&mut observation_account_metas);

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

pub struct MangoDepositAccounts {
    marginfi_account: Pubkey,
    marginfi_group: Pubkey,
    signer: Pubkey,
    mango_authority: Pubkey,
    mango_account: Pubkey,
    mango_program: Pubkey,
    mango_group: Pubkey,
    mango_cache: Pubkey,
    mango_node_bank: Pubkey,
    mango_root_bank: Pubkey,
    bank_authority: Pubkey,
    mango_vault: Pubkey,
    margin_collateral_vault: Pubkey,
    temp_collateral_account: Pubkey,
    token_program: Pubkey,
    observation_accounts: Vec<Pubkey>,
}

impl MangoDepositAccounts {
    pub fn new(
        margin_account: &MarginAccount,
        root_bank: &RootBank,
        node_bank: &NodeBank,
        temp_collateral_account: Pubkey,
    ) -> Self {
        let (mango_authority, _) = margin_account.get_utp_authority(MANGO_UTP_INDEX);
        let utp_config = &margin_account.marginfi_account.utp_account_config[MANGO_UTP_INDEX];

        let mango_observer = &margin_account
            .observer
            .mango_observer
            .expect("mango observer not found");

        let mango_group = mango_observer.mango_group;
        let root_bank_pk = mango_group.tokens[QUOTE_INDEX].root_bank;

        let (bank_authority, _) = get_bank_authority(
            BankVaultType::LiquidityVault,
            &margin_account.client.config.marginfi_group,
        );

        Self {
            marginfi_account: margin_account.address,
            marginfi_group: margin_account.client.config.marginfi_group,
            signer: margin_account.client.keypair.pubkey(),
            mango_authority,
            mango_account: utp_config.address,
            mango_program: MANGO_PROGRAM,
            mango_group: mango_observer.mango_group_pk,
            mango_cache: mango_observer.mango_cache_pk,
            mango_root_bank: root_bank_pk,
            mango_node_bank: root_bank
                .node_banks
                .first()
                .expect("node bank not found")
                .clone(),
            bank_authority,
            mango_vault: node_bank.vault,
            margin_collateral_vault: margin_account.client.group.bank.vault,
            temp_collateral_account,
            token_program: anchor_spl::token::ID,
            observation_accounts: margin_account.get_observation_accounts(),
        }
    }
}

pub fn mango_make_deposit_ix(accounts: MangoDepositAccounts, amount: u64) -> Instruction {
    let mut account_metas = marginfi::accounts::UtpMangoDeposit {
        marginfi_account: accounts.marginfi_account,
        marginfi_group: accounts.marginfi_group,
        signer: accounts.signer,
        mango_authority: accounts.mango_authority,
        mango_account: accounts.mango_account,
        mango_program: accounts.mango_program,
        mango_group: accounts.mango_group,
        mango_cache: accounts.mango_cache,
        mango_root_bank: accounts.mango_root_bank,
        mango_node_bank: accounts.mango_node_bank,
        bank_authority: accounts.bank_authority,
        mango_vault: accounts.mango_vault,
        margin_collateral_vault: accounts.margin_collateral_vault,
        temp_collateral_account: accounts.temp_collateral_account,
        token_program: accounts.token_program,
    }
    .to_account_metas(Some(true));

    account_metas.append(&mut pubkey_to_readonly_account_metas(
        &accounts.observation_accounts,
    ));

    Instruction {
        program_id: marginfi::id(),
        accounts: account_metas,
        data: marginfi::instruction::UtpMangoDeposit { amount }.data(),
    }
}

pub struct MangoWithdrawAccounts {
    marginfi_account: Pubkey,
    marginfi_group: Pubkey,
    signer: Pubkey,
    margin_collateral_vault: Pubkey,
    mango_authority: Pubkey,
    mango_account: Pubkey,
    mango_program: Pubkey,
    mango_group: Pubkey,
    mango_cache: Pubkey,
    mango_root_bank: Pubkey,
    mango_node_bank: Pubkey,
    mango_vault: Pubkey,
    mango_vault_authority: Pubkey,
    token_program: Pubkey,
}

impl MangoWithdrawAccounts {
    pub fn new(margin_account: &MarginAccount, root_bank: &RootBank, node_bank: &NodeBank) -> Self {
        let (mango_authority, _) = margin_account.get_utp_authority(MANGO_UTP_INDEX);
        let mango_config = &margin_account.marginfi_account.utp_account_config[MANGO_UTP_INDEX];

        let MangoObserver {
            mango_account_pk,
            mango_group_pk,
            mango_cache_pk,
            mango_account,
            mango_group,
            mango_cache,
        } = &margin_account
            .observer
            .mango_observer
            .expect("mango observer not found");

        let root_bank_pk = mango_group.tokens[QUOTE_INDEX].root_bank;

        let (mango_vault_authority, _) = Pubkey::find_program_address(
            &[mango_group_pk.as_ref(), bytes_of(&mango_group.signer_nonce)],
            &MANGO_PROGRAM,
        );

        Self {
            marginfi_account: margin_account.address,
            marginfi_group: margin_account.client.config.marginfi_group,
            signer: margin_account.client.keypair.pubkey(),
            margin_collateral_vault: margin_account.client.group.bank.vault,
            mango_authority: mango_authority,
            mango_account: mango_account_pk,
            mango_program: MANGO_PROGRAM,
            mango_group: mango_group_pk,
            mango_cache: mango_cache_pk,
            mango_root_bank: root_bank_pk,
            mango_node_bank: root_bank
                .node_banks
                .first()
                .expect("node bank not found")
                .clone(),
            mango_vault: node_bank.vault,
            mango_vault_authority,
            token_program: token::ID,
        }
    }
}

pub fn mango_make_withdraw_ix(accounts: MangoDepositAccounts, amount: u64) -> Instruction {
    let account_metas = marginfi::accounts::UtpMangoWithdraw {
        marginfi_account: accounts.marginfi_account,
        marginfi_group: accounts.marginfi_group,
        signer: accounts.signer,
        margin_collateral_vault: accounts.margin_collateral_vault,
        mango_authority: accounts.mango_authority,
        mango_account: accounts.mango_account,
        mango_program: accounts.mango_program,
        mango_group: accounts.mango_group,
        mango_cache: accounts.mango_cache,
        mango_root_bank: accounts.mango_root_bank,
        mango_node_bank: accounts.mango_node_bank,
        mango_vault: accounts.mango_vault,
        mango_vault_authority: accounts.mango_vault_authority,
        token_program: accounts.token_program,
    }
    .to_account_metas(Some(true));

    Instruction {
        program_id: marginfi::id(),
        accounts: (),
        data: marginfi::instruction::UtpMangoWithdraw { amount }.data(),
    }
}
