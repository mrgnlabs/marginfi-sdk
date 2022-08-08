use anchor_client::anchor_lang::system_program;
use anchor_client::anchor_lang::InstructionData;
use anchor_client::anchor_lang::ToAccountMetas;
use anchor_client::{Client, Cluster, Program};
use bytemuck::from_bytes;
use bytemuck::Pod;
use fixed::types::I80F48;
use log::{debug, info};
use mango_protocol::state::{
    HealthCache, MangoAccount, MangoCache, MangoGroup, NodeBank, RootBank, UserActiveAssets,
    MAX_PAIRS, QUOTE_INDEX,
};
use marginfi::{
    constants::{MANGO_UTP_INDEX, PDA_BANK_VAULT_SEED, PDA_UTP_AUTH_SEED, ZO_UTP_INDEX},
    prelude::{MarginfiAccount, MarginfiGroup},
    state::mango_state::is_rebalance_deposit_valid,
};
use serum_dex::state::OpenOrders;
use solana_client::{
    rpc_client::RpcClient,
    rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
};
use solana_sdk::instruction::AccountMeta;
use solana_sdk::program_error::ProgramError;
use solana_sdk::pubkey;
use solana_sdk::signature::read_keypair_file;
use solana_sdk::sysvar::SysvarId;
use solana_sdk::transaction::Transaction;
use solana_sdk::{
    account_info::AccountInfo, instruction::Instruction, program_pack::Pack, pubkey::Pubkey,
    signature::Keypair, signer::Signer, system_instruction::create_account,
};

use std::ops::Div;
use std::str::FromStr;
use std::thread::sleep;
use std::{cell::Ref, rc::Rc, time::Duration};

macro_rules! setup_sentry_if_enabled {
    () => {
        #[cfg(feature = "sentry-reporting")]
        let _sentry_guard = sentry::init((
            std::env::var("SENTRY_DSN").expect("SENTRY_DSN must be set"),
            sentry::ClientOptions {
                release: sentry::release_name!(),
                ..Default::default()
            },
        ));
    };
}

pub struct DoctorConfig {
    pub marginfi_program: Pubkey,
    pub marginfi_group: Pubkey,
    cluster_string: String,
    pub rpc_endpoint: String,
    pub timeout: u64,
}

impl DoctorConfig {
    pub fn from_env() -> DoctorConfig {
        let marginfi_program = Pubkey::from_str(
            &std::env::var("MARGINFI_PROGRAM").expect("Missing MARGINFI_PROGRAM env var"),
        )
        .unwrap();
        let marginfi_group = Pubkey::from_str(
            &std::env::var("MARGINFI_GROUP").expect("Missing MARGINFI_GROUP env var"),
        )
        .unwrap();
        let cluster_string = std::env::var("ENV").expect("Missing ENV env var");
        let timeout = std::env::var("TIMEOUT")
            .expect("Missing TIMEOUT env var")
            .parse::<u64>()
            .unwrap();
        let rpc_endpoint = std::env::var("RPC_ENDPOINT").expect("Missing RPC_ENDPOINT env var");

        info!("Starting Doctor\n\tProgram: {:?}\n\tGroup: {:?}\n\tEnv: {:?}\n\tRpcEndpoint: {:?}\n\tTimeout: {:?}s,\n\tSentry Reporting: {}",
            marginfi_program,
            marginfi_group,
            cluster_string,
            rpc_endpoint,
            timeout,
            cfg!(feature = "sentry-reporting")
        );

        DoctorConfig {
            marginfi_program,
            marginfi_group,
            cluster_string,
            rpc_endpoint,
            timeout,
        }
    }

    pub fn cluster(&self) -> Cluster {
        Cluster::from_str(&self.cluster_string).unwrap()
    }

    pub fn keypair(&self) -> Keypair {
        if let Ok(wallet_path) = std::env::var("WALLET") {
            read_keypair_file(wallet_path).unwrap()
        } else if let Ok(wallet_key) = std::env::var("WALLET_KEY") {
            load_keypair_from_array_string(wallet_key.as_str())
        } else {
            panic!("WALLET or WALLET_KEY must be set");
        }
    }
}

fn load_keypair_from_array_string(array_string: &str) -> Keypair {
    let trimmed_string = array_string.replace(&['[', ']'][..], "");
    let array = trimmed_string
        .split(',')
        .map(|s| s.parse::<u8>().unwrap())
        .collect::<Vec<u8>>();

    Keypair::from_bytes(&array).unwrap()
}

struct AddressBook {
    pub mango_program: Pubkey,
    pub mango_group: Pubkey,
    pub zo_program: Pubkey,
    pub zo_state: Pubkey,
}

impl AddressBook {
    pub fn new(cluster: Cluster) -> AddressBook {
        match cluster {
            Cluster::Mainnet => AddressBook {
                mango_program: pubkey!("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68"),
                mango_group: pubkey!("98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue"),
                zo_program: pubkey!("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk"),
                zo_state: pubkey!("71yykwxq1zQqy99PgRsgZJXi2HHK2UDx9G4va7pH6qRv"),
            },
            Cluster::Devnet => AddressBook {
                mango_program: pubkey!("4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA"),
                mango_group: pubkey!("Ec2enZyoC4nGpEfu2sUNAa2nUGJHWxoUWYSEJ2hNTWTA"),
                zo_program: pubkey!("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ"),
                zo_state: pubkey!("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F"),
            },
            _ => panic!("Cluster {} not supported", cluster),
        }
    }
}

struct GroupCache {
    pub marginfi_group: (Pubkey, MarginfiGroup),
    pub bank_authority: Pubkey,

    pub mango_group: (Pubkey, MangoGroup),
    pub mango_cache: (Pubkey, MangoCache),
    pub mango_root_bank_pk: Pubkey,
    pub mango_node_bank_pk: Pubkey,
    pub mango_vault_pk: Pubkey,

    pub zo_state: (Pubkey, zo_abi::State),
    pub zo_cache: (Pubkey, zo_abi::Cache),
    pub zo_state_signer_pda: Pubkey,
    pub zo_vault_pk: Pubkey,
}

impl GroupCache {
    pub fn new(program: &Program, config: &DoctorConfig, address_book: &AddressBook) -> Self {
        setup_sentry_if_enabled!();

        debug!("Loading group cache");
        let marginfi_group: MarginfiGroup = program.account(config.marginfi_group).unwrap();

        let (bank_authority, _) = Pubkey::find_program_address(
            &[PDA_BANK_VAULT_SEED, &config.marginfi_group.to_bytes()],
            &config.marginfi_program,
        );

        let rpc = program.rpc();

        let mango_group_account = rpc.get_account(&address_book.mango_group).unwrap();
        let mango_group_raw = &mut (address_book.mango_group, mango_group_account);
        let mango_group_ai = AccountInfo::from(mango_group_raw);
        let mango_group =
            MangoGroup::load_checked(&mango_group_ai, &address_book.mango_program).unwrap();

        let mango_cache_account = rpc.get_account(&mango_group.mango_cache).unwrap();

        let mango_cache_raw = &mut (mango_group.mango_cache, mango_cache_account);
        let mango_cache_ai = AccountInfo::from(mango_cache_raw);
        let mango_cache =
            MangoCache::load_checked(&mango_cache_ai, &address_book.mango_program, &mango_group)
                .unwrap();

        let root_bank_pk = mango_group.tokens[QUOTE_INDEX].root_bank;
        let root_bank_account = rpc.get_account(&root_bank_pk).unwrap();
        let root_bank_raw = &mut (root_bank_pk, root_bank_account);
        let root_bank_ai = AccountInfo::from(root_bank_raw);
        let root_bank = RootBank::load_checked(&root_bank_ai, &address_book.mango_program).unwrap();

        let node_bank_pk = root_bank.node_banks[0];
        let node_bank_account = rpc.get_account(&node_bank_pk).unwrap();
        let node_bank_raw = &mut (node_bank_pk, node_bank_account);
        let node_bank_ai = AccountInfo::from(node_bank_raw);
        let node_bank = NodeBank::load_checked(&node_bank_ai, &address_book.mango_program).unwrap();

        let zo_state_pk = address_book.zo_state;
        let zo_state_account = rpc.get_account(&zo_state_pk).unwrap();

        let zo_state_raw = &mut (zo_state_pk, zo_state_account);
        let zo_state_ai = AccountInfo::from(zo_state_raw);
        let zo_state: Ref<zo_abi::State> = load(&zo_state_ai).unwrap();

        let zo_cache_account = rpc.get_account(&zo_state.cache).unwrap();

        let zo_cache_raw = &mut (zo_state.cache, zo_cache_account);
        let zo_cache_ai = AccountInfo::from(zo_cache_raw);
        let zo_cache: Ref<zo_abi::Cache> = load(&zo_cache_ai).unwrap();

        let (zo_state_signer_pubkey, _) =
            Pubkey::find_program_address(&[zo_state_pk.as_ref()], &address_book.zo_program);

        let (collateral_index, _) = zo_state
            .collaterals
            .iter()
            .enumerate()
            .find(|(_, c)| c.mint.eq(&marginfi_group.bank.mint))
            .unwrap();

        let vault_pk = zo_state.vaults[collateral_index];

        Self {
            marginfi_group: (config.marginfi_group, marginfi_group),
            bank_authority,

            mango_group: (address_book.mango_group, *mango_group),
            mango_cache: (mango_group.mango_cache, *mango_cache),
            mango_root_bank_pk: root_bank_pk,
            mango_node_bank_pk: node_bank_pk,
            mango_vault_pk: node_bank.vault,

            zo_state: (zo_state_pk, *zo_state),
            zo_cache: (zo_state.cache, *zo_cache),
            zo_state_signer_pda: zo_state_signer_pubkey,
            zo_vault_pk: vault_pk,
        }
    }

    // pub fn reload_cache(&mut self, program: Program) {
    //     let mango_cache_account = program.rpc().get_account(&self.mango_cache.0).unwrap();

    //     let mango_cache_raw = &mut (self.mango_cache.0, mango_cache_account.clone());
    //     let mango_cache_ai = AccountInfo::from(mango_cache_raw);
    //     let mango_cache =
    //         MangoCache::load_checked(&mango_cache_ai, &MANGO_PROGRAM, &self.mango_group.1).unwrap();

    //     let zo_cache_account = program.rpc().get_account(&self.zo_cache.0).unwrap();

    //     let zo_cache_raw = &mut (self.zo_cache.0, zo_cache_account);
    //     let zo_cache_ai = AccountInfo::from(zo_cache_raw);
    //     let zo_cache: Ref<zo_abi::Cache> = load(&zo_cache_ai).unwrap();

    //     self.mango_cache.1 = *mango_cache;
    //     self.zo_cache.1 = *zo_cache;
    // }

    pub fn reload(&mut self, program: &Program, config: &DoctorConfig, address_book: &AddressBook) {
        *self = GroupCache::new(program, config, address_book);
    }
}

pub struct Doctor {
    config: DoctorConfig,
    program: Program,
    group_cache: GroupCache,
    address_book: AddressBook,
}

#[cfg(feature = "sentry-reporting")]
fn ping_sentry() {
    setup_sentry_if_enabled!();
    sentry::capture_message("ping", sentry::Level::Info);
}

impl Doctor {
    pub fn new(config: DoctorConfig) -> Doctor {
        #[cfg(feature = "sentry-reporting")]
        ping_sentry();

        let address_book = AddressBook::new(config.cluster());
        let client = Client::new(config.cluster(), Rc::new(config.keypair()));
        let program = client.program(config.marginfi_program);
        let group_cache = GroupCache::new(&program, &config, &address_book);

        Self {
            config,
            program,
            group_cache,
            address_book,
        }
    }

    pub fn run(&mut self) {
        loop {
            self.task();

            sleep(Duration::from_secs(self.config.timeout));
        }
    }

    fn task(&mut self) {
        self.group_cache
            .reload(&self.program, &self.config, &self.address_book);

        let accounts = self.fetch_all_marginfi_accounts();
        debug!("Found {} accounts", accounts.len());
        accounts.iter().for_each(|(address, marginfi_account)| {
            let account_handler = MarginAccountHandler::new(
                &self.program,
                address,
                marginfi_account,
                &self.group_cache,
                &self.config,
                &self.address_book,
            );

            account_handler.rebalance_if_needed();
        });
    }

    fn fetch_all_marginfi_accounts(&self) -> Vec<(Pubkey, MarginfiAccount)> {
        setup_sentry_if_enabled!();
        let account_type_filter = RpcFilterType::Memcmp(Memcmp {
            offset: 8 + 32,
            bytes: MemcmpEncodedBytes::Base58(self.config.marginfi_group.to_string()),
            encoding: None,
        });

        self.program.accounts(vec![account_type_filter]).unwrap()
    }
}

fn load<'a, T: Pod>(account: &'a AccountInfo) -> Result<Ref<'a, T>, ProgramError> {
    Ok(Ref::map(account.try_borrow_data()?, |data| {
        from_bytes(&data[8..])
    }))
}

fn create_temp_token_account(
    rpc: RpcClient,
    authority: Pubkey,
    mint: Pubkey,
    payer: Pubkey,
) -> ([Instruction; 2], Keypair) {
    setup_sentry_if_enabled!();
    let temp_token_account_kp = Keypair::new();
    let lamports = rpc
        .get_minimum_balance_for_rent_exemption(spl_token::state::Account::LEN)
        .unwrap();

    let create_token_account_ix = create_account(
        &payer,
        &temp_token_account_kp.pubkey(),
        lamports,
        spl_token::state::Account::LEN as u64,
        &spl_token::ID,
    );

    let init_token_account_ix = spl_token::instruction::initialize_account(
        &spl_token::ID,
        &temp_token_account_kp.pubkey(),
        &mint,
        &authority,
    )
    .unwrap();

    (
        [create_token_account_ix, init_token_account_ix],
        temp_token_account_kp,
    )
}

#[derive(Default)]
struct MarginAccountCache {
    pub utp_mango_cache: Option<UtpMangoCache>,
    pub utp_zo_cache: Option<UtpZoCache>,
}

impl MarginAccountCache {
    pub fn new(
        program: &Program,
        marginfi_account: &MarginfiAccount,
        group_cache: &GroupCache,
        address_book: &AddressBook,
    ) -> MarginAccountCache {
        let mut cache = MarginAccountCache::default();

        if marginfi_account.active_utps[MANGO_UTP_INDEX] {
            cache.utp_mango_cache = Some(UtpMangoCache::new(
                program.rpc(),
                marginfi_account.utp_account_config[MANGO_UTP_INDEX].address,
                group_cache.mango_group.0,
                address_book.mango_program,
            ));
        }

        if marginfi_account.active_utps[ZO_UTP_INDEX] {
            cache.utp_zo_cache = Some(UtpZoCache::new(
                program.rpc(),
                marginfi_account.utp_account_config[ZO_UTP_INDEX].address,
            ));
        }

        cache
    }
}

struct UtpMangoCache {
    pub mango_account: (Pubkey, MangoAccount),
}

impl UtpMangoCache {
    pub fn new(
        rpc: RpcClient,
        mango_account_pk: Pubkey,
        mango_group_pk: Pubkey,
        mango_program: Pubkey,
    ) -> UtpMangoCache {
        setup_sentry_if_enabled!();

        let mango_account = rpc.get_account(&mango_account_pk).unwrap();
        let mango_account_raw = &mut (mango_account_pk, mango_account);
        let mango_account_ai = AccountInfo::from(mango_account_raw);
        let mango_account =
            MangoAccount::load_checked(&mango_account_ai, &mango_program, &mango_group_pk).unwrap();

        UtpMangoCache {
            mango_account: (mango_account_pk, *mango_account),
        }
    }
}

struct UtpZoCache {
    pub zo_margin: (Pubkey, zo_abi::Margin),
    pub zo_control: (Pubkey, zo_abi::Control),
}

impl UtpZoCache {
    pub fn new(rpc: RpcClient, zo_margin_pk: Pubkey) -> UtpZoCache {
        setup_sentry_if_enabled!();

        let zo_margin_account = rpc.get_account(&zo_margin_pk).unwrap();

        let zo_margin_raw = &mut (zo_margin_pk, zo_margin_account);
        let zo_margin_ai = AccountInfo::from(zo_margin_raw);
        let zo_margin: Ref<zo_abi::Margin> = load(&zo_margin_ai).unwrap();

        let zo_control_pk = zo_margin.control;

        let zo_control_tmp = rpc.get_account(&zo_control_pk).unwrap();
        let zo_control_raw = &mut (zo_control_pk, zo_control_tmp);
        let zo_control_ai = AccountInfo::from(zo_control_raw);
        let zo_control: Ref<zo_abi::Control> = load(&zo_control_ai).unwrap();

        UtpZoCache {
            zo_margin: (zo_margin_pk, *zo_margin),
            zo_control: (zo_control_pk, *zo_control),
        }
    }
}

struct MarginAccountHandler<'a> {
    marginfi_account_pk: &'a Pubkey,
    marginfi_account: &'a MarginfiAccount,
    program: &'a Program,
    group_cache: &'a GroupCache,
    margin_account_cache: MarginAccountCache,
    doctor_config: &'a DoctorConfig,
    address_book: &'a AddressBook,
}

impl<'a> MarginAccountHandler<'a> {
    pub fn new(
        program: &'a Program,
        marginfi_account_pk: &'a Pubkey,
        marginfi_account: &'a MarginfiAccount,
        group_cache: &'a GroupCache,
        doctor_config: &'a DoctorConfig,
        address_book: &'a AddressBook,
    ) -> Self {
        MarginAccountHandler {
            marginfi_account_pk,
            marginfi_account,
            program,
            group_cache,
            margin_account_cache: MarginAccountCache::new(
                program,
                marginfi_account,
                group_cache,
                address_book,
            ),
            doctor_config,
            address_book,
        }
    }

    fn get_observation_accounts(&self) -> Vec<AccountMeta> {
        setup_sentry_if_enabled!();

        self.marginfi_account
            .active_utps
            .iter()
            .enumerate()
            .filter(|(_, active)| **active)
            .map(|(i, _)| i)
            .fold(vec![], |accumulator, index| {
                setup_sentry_if_enabled!();

                let utp_config = self.marginfi_account.utp_account_config[index];
                let mut utp_observe_accounts = match index {
                    MANGO_UTP_INDEX => vec![
                        AccountMeta::new_readonly(utp_config.address, false),
                        AccountMeta::new_readonly(self.group_cache.mango_group.0, false),
                        AccountMeta::new_readonly(self.group_cache.mango_cache.0, false),
                    ],
                    ZO_UTP_INDEX => vec![
                        AccountMeta::new_readonly(utp_config.address, false),
                        AccountMeta::new_readonly(
                            self.margin_account_cache
                                .utp_zo_cache
                                .as_ref()
                                .unwrap()
                                .zo_control
                                .0,
                            false,
                        ),
                        AccountMeta::new_readonly(self.group_cache.zo_state.0, false),
                        AccountMeta::new_readonly(self.group_cache.zo_cache.0, false),
                    ],
                    _ => panic!("Unsupported utp index {}", index),
                };

                let mut a = accumulator;
                a.append(&mut utp_observe_accounts);
                a
            })
    }

    fn get_utp_authority(&self, utp_index: usize) -> (Pubkey, u8) {
        setup_sentry_if_enabled!();

        let utp_program_address = match utp_index {
            MANGO_UTP_INDEX => self.address_book.mango_program,
            ZO_UTP_INDEX => self.address_book.zo_program,
            _ => panic!("Unsupported utp index {}", utp_index),
        }
        .to_bytes();

        let utp_config = &self.marginfi_account.utp_account_config[utp_index];

        Pubkey::find_program_address(
            &[
                PDA_UTP_AUTH_SEED,
                &utp_program_address,
                &utp_config.authority_seed.to_bytes(),
            ],
            &self.doctor_config.marginfi_program,
        )
    }

    pub fn rebalance_if_needed(&self) {
        setup_sentry_if_enabled!();

        self.marginfi_account
            .active_utps
            .iter()
            .enumerate()
            .filter(|(_, a)| **a)
            .for_each(|(index, _)| match index {
                MANGO_UTP_INDEX => {
                    setup_sentry_if_enabled!();

                    let (marginfi_group_pk, marginfi_group) = self.group_cache.marginfi_group;
                    let (mango_group_pk, mango_group) = &self.group_cache.mango_group;
                    let (_, mango_cache) = &self.group_cache.mango_cache;
                    let (mango_account_pk, mango_account) = &self
                        .margin_account_cache
                        .utp_mango_cache
                        .as_ref()
                        .unwrap()
                        .mango_account;

                    let mut health_cache =
                        HealthCache::new(UserActiveAssets::new(mango_group, mango_account, vec![]));

                    let open_orders_accounts: Vec<Option<&OpenOrders>> = vec![None; MAX_PAIRS];

                    health_cache
                        .init_vals_with_orders_vec(
                            mango_group,
                            mango_cache,
                            mango_account,
                            &open_orders_accounts,
                        )
                        .unwrap();

                    let rebalance_needed =
                        is_rebalance_deposit_valid(&mut health_cache, mango_group).unwrap();

                    if !rebalance_needed {
                        return;
                    }

                    let deposit_amount =
                        marginfi::state::mango_state::get_max_rebalance_deposit_amount(
                            &mut health_cache,
                            mango_group,
                        )
                        .unwrap()
                        .div(I80F48::from_num(2_u8))
                        .to_num();

                    info!(
                        "Depositing {} into Mango Markets {}",
                        deposit_amount, self.marginfi_account_pk
                    );

                    #[cfg(feature = "sentry-reporting")]
                    sentry::capture_event(sentry::protocol::Event {
                        user: Some(sentry::User {
                            id: Some(self.marginfi_account_pk.to_string()),
                            ..Default::default()
                        }),
                        message: Some(format!("Depositing {} into Mango Markets", deposit_amount)),
                        level: sentry::protocol::Level::Info,
                        ..Default::default()
                    });

                    let (mango_authority, _) = self.get_utp_authority(MANGO_UTP_INDEX);

                    let ([create_token_account_ix, init_token_account_ix], temp_token_account) =
                        create_temp_token_account(
                            self.program.rpc(),
                            mango_authority,
                            marginfi_group.bank.mint,
                            self.program.payer(),
                        );

                    let mut account_metas: Vec<AccountMeta> = marginfi::accounts::UtpMangoDeposit {
                        marginfi_account: *self.marginfi_account_pk,
                        marginfi_group: marginfi_group_pk,
                        signer: self.program.payer(),
                        margin_collateral_vault: marginfi_group.bank.vault,
                        bank_authority: self.group_cache.bank_authority,
                        temp_collateral_account: temp_token_account.pubkey(),
                        mango_authority,
                        mango_account: *mango_account_pk,
                        mango_program: self.address_book.mango_program,
                        mango_group: *mango_group_pk,
                        mango_cache: mango_group.mango_cache,
                        mango_root_bank: self.group_cache.mango_root_bank_pk,
                        mango_node_bank: self.group_cache.mango_node_bank_pk,
                        mango_vault: self.group_cache.mango_vault_pk,
                        token_program: spl_token::ID,
                    }
                    .to_account_metas(Some(true));

                    account_metas.append(&mut self.get_observation_accounts());

                    let deposit_ix = Instruction {
                        program_id: self.doctor_config.marginfi_program,
                        accounts: account_metas,
                        data: marginfi::instruction::UtpMangoDeposit {
                            amount: deposit_amount,
                        }
                        .data(),
                    };

                    let tx = Transaction::new_signed_with_payer(
                        &[create_token_account_ix, init_token_account_ix, deposit_ix],
                        Some(&self.program.payer()),
                        &[&self.doctor_config.keypair(), &temp_token_account],
                        self.program.rpc().get_latest_blockhash().unwrap(),
                    );

                    let res = self.program.rpc().send_and_confirm_transaction(&tx);

                    match res {
                        Ok(sig) => {
                            debug!("Transaction Sig: {:?}", sig);
                        }
                        Err(_err) => {
                            #[cfg(feature = "sentry-reporting")]
                            sentry::capture_error(&_err);
                        }
                    }
                }
                ZO_UTP_INDEX => {
                    setup_sentry_if_enabled!();

                    let (zo_state_pk, zo_state) = &self.group_cache.zo_state;
                    let (_zo_cache_pk, zo_cache) = &self.group_cache.zo_cache;
                    let (zo_margin_pk, zo_margin) = &self
                        .margin_account_cache
                        .utp_zo_cache
                        .as_ref()
                        .unwrap()
                        .zo_margin;
                    let (_zo_control_pk, zo_control) = &self
                        .margin_account_cache
                        .utp_zo_cache
                        .as_ref()
                        .unwrap()
                        .zo_control;

                    let (_marginfi_group_pk, marginfi_group) = self.group_cache.marginfi_group;

                    let rebalance_required = marginfi::state::zo_state::is_rebalance_deposit_valid(
                        zo_margin, zo_control, zo_state, zo_cache,
                    )
                    .unwrap();

                    if !rebalance_required {
                        return;
                    }

                    let deposit_amount =
                        marginfi::state::zo_state::get_max_rebalance_deposit_amount(
                            zo_margin, zo_control, zo_state, zo_cache,
                        )
                        .unwrap()
                        .div(I80F48::from_num(2_u8));

                    info!(
                        "Depositing {} into 01 Protocol {}",
                        deposit_amount, self.marginfi_account_pk
                    );

                    #[cfg(feature = "sentry-reporting")]
                    sentry::capture_event(sentry::protocol::Event {
                        user: Some(sentry::User {
                            id: Some(self.marginfi_account_pk.to_string()),
                            ..Default::default()
                        }),
                        message: Some(format!("Depositing {} into 01 Protocol", deposit_amount)),
                        level: sentry::protocol::Level::Info,
                        ..Default::default()
                    });

                    let (zo_authority, _) = self.get_utp_authority(ZO_UTP_INDEX);
                    let ([create_token_account_ix, init_token_account_ix], temp_token_account) =
                        create_temp_token_account(
                            self.program.rpc(),
                            zo_authority,
                            marginfi_group.bank.mint,
                            self.program.payer(),
                        );

                    let mut account_metas: Vec<AccountMeta> = marginfi::accounts::UtpZoDeposit {
                        marginfi_account: *self.marginfi_account_pk,
                        marginfi_group: self.marginfi_account.marginfi_group,
                        signer: self.program.payer(),
                        margin_collateral_vault: marginfi_group.bank.vault,
                        bank_authority: self.group_cache.bank_authority,
                        temp_collateral_account: temp_token_account.pubkey(),
                        utp_authority: zo_authority,
                        zo_program: self.address_book.zo_program,
                        zo_state: *zo_state_pk,
                        zo_state_signer: self.group_cache.zo_state_signer_pda,
                        zo_cache: zo_state.cache,
                        zo_margin: *zo_margin_pk,
                        zo_vault: self.group_cache.zo_vault_pk,
                        rent: solana_sdk::sysvar::rent::Rent::id(),
                        token_program: spl_token::ID,
                        system_program: system_program::ID,
                    }
                    .to_account_metas(Some(true));

                    account_metas.append(&mut self.get_observation_accounts());

                    let utp_zo_deposit_ix = Instruction {
                        program_id: self.doctor_config.marginfi_program,
                        accounts: account_metas,
                        data: marginfi::instruction::UtpZoDeposit {
                            amount: deposit_amount.to_num(),
                        }
                        .data(),
                    };

                    let tx = Transaction::new_signed_with_payer(
                        &[
                            create_token_account_ix,
                            init_token_account_ix,
                            utp_zo_deposit_ix,
                        ],
                        Some(&self.program.payer()),
                        &[&self.doctor_config.keypair(), &temp_token_account],
                        self.program.rpc().get_latest_blockhash().unwrap(),
                    );

                    let res = self.program.rpc().send_and_confirm_transaction(&tx);

                    match res {
                        Ok(sig) => {
                            debug!("Transaction Sig: {:?}", sig);
                        }
                        Err(_err) => {
                            #[cfg(feature = "sentry-reporting")]
                            sentry::capture_error(&_err);
                        }
                    }
                }
                _ => panic!("Unknown UTP index"),
            });
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn success_load_keypair_from_array_string() {
        let keypair = load_keypair_from_array_string("[181,29,31,182,80,117,145,58,115,132,159,87,174,13,6,8,197,4,42,68,254,227,96,76,118,251,186,160,121,224,208,232,109,249,190,23,41,7,221,81,205,212,201,15,144,145,229,229,238,88,207,253,103,82,242,233,161,18,16,238,186,70,56,56]");
        assert_eq!(
            keypair.pubkey(),
            Pubkey::from_str("8QJK8fvfasXJ68yE8kBpWHrsv514o7Wn3ZbQBJ3qZKmy").unwrap(),
        );
    }
}
