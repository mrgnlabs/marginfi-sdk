use crate::config::WalletPath;
use anchor_client::{Client, Cluster, Program};
use anyhow::Result;
use mango_protocol::state::MangoGroup;
use marginfi::prelude::MarginfiAccount;
use marginfi::state::utp_observation::{Observable, UtpObserver};
use solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType};
use solana_program::pubkey;
use solana_sdk::account::Account;
use solana_sdk::account_info::{Account as AccountInfoAccount, AccountInfo};
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::{commitment_config::CommitmentConfig, signature::read_keypair_file};
use std::{rc::Rc, str::FromStr, thread::sleep, time::Duration};

pub struct Bot {
    pub payer: Keypair,
    pub client: Client,
    pub program: Program,
    pub cluster: Cluster,

    pub mango_group_pk: Pubkey,
    pub mango_cache_pk: Pubkey,

    pub zo_state_pk: Pubkey,
    pub zo_cache_pk: Pubkey,
}

impl Bot {
    pub fn new(wallet_path: &WalletPath, cluster: Cluster) -> Self {
        let payer = read_keypair_file(&*shellexpand::tilde(&wallet_path.to_string()))
            .expect("Example requires a keypair file");

        let client = Client::new_with_options(
            cluster.clone(),
            Rc::new(payer),
            CommitmentConfig::processed(),
        );
        let program = client
            .program(Pubkey::from_str("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK").unwrap());

        // Cache UTP observation account addresses.
        // Assumes pks are static throughout the bot's life.

        let (mango_program_pk, mango_group_pk) = match cluster {
            Cluster::Devnet => (
                pubkey!("4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA"),
                pubkey!("Ec2enZyoC4nGpEfu2sUNAa2nUGJHWxoUWYSEJ2hNTWTA"),
            ),
            Cluster::Mainnet => (
                pubkey!("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68"),
                pubkey!("98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue"),
            ),
            _ => panic!("cluster {} not supported", cluster),
        };

        let (_zo_program_pk, zo_state_pk) = match cluster {
            Cluster::Devnet => (
                pubkey!("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ"),
                pubkey!("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F"),
            ),
            Cluster::Mainnet => (
                pubkey!("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk"),
                pubkey!("71yykwxq1zQqy99PgRsgZJXi2HHK2UDx9G4va7pH6qRv"),
            ),

            _ => panic!("cluster {} not supported", cluster),
        };

        let accounts_raw: Vec<Account> = program
            .rpc()
            .get_multiple_accounts(&[mango_group_pk, zo_state_pk])
            .unwrap()
            .into_iter()
            .map(Option::<Account>::unwrap)
            .collect();

        let mut mango_group_account = accounts_raw[0].clone();
        let mango_group_account = mango_group_account.get();
        let mango_group_ai = AccountInfo::new(
            &mango_group_pk,
            false,
            false,
            mango_group_account.0,
            mango_group_account.1,
            mango_group_account.2,
            mango_group_account.3,
            mango_group_account.4,
        );
        let mango_group = MangoGroup::load_checked(&mango_group_ai, &mango_program_pk).unwrap();

        let zo_state: zo_abi::State = program.account(zo_state_pk).unwrap();

        let payer = read_keypair_file(&*shellexpand::tilde(&wallet_path.to_string()))
            .expect("Example requires a keypair file");

        Self {
            payer,
            client,
            program,
            cluster,
            mango_group_pk,
            mango_cache_pk: mango_group.mango_cache,
            zo_state_pk,
            zo_cache_pk: zo_state.cache,
        }
    }

    pub fn run(&self, group: Pubkey, pause_duration: Duration) -> Result<()> {
        loop {
            let accounts = self.fetch_all_margin_accounts(group)?;
            // println!(
            //     "{:?}",
            //     accounts.iter().map(|a| a.0).collect::<Vec<Pubkey>>()
            // );
            self.rebalance_if_needed(&accounts[1].1);
            //     for (_, account) in accounts.iter() {
            //     rebalance_if_needed(&program, account);
            // }
            sleep(pause_duration);
        }
    }

    fn fetch_all_margin_accounts(&self, group: Pubkey) -> Result<Vec<(Pubkey, MarginfiAccount)>> {
        let account_type_filter = RpcFilterType::Memcmp(Memcmp {
            offset: 8 + 32,
            bytes: MemcmpEncodedBytes::Base58(group.to_string()),
            encoding: None,
        });

        Ok(self.program.accounts(vec![account_type_filter])?)
    }

    fn rebalance_if_needed(&self, account: &MarginfiAccount) -> Result<()> {
        self.deposit_if_needed(account)?;
        self.withdraw_if_needed(account)?;

        Ok(())
    }

    fn deposit_if_needed(&self, marginfi_account: &MarginfiAccount) -> Result<()> {
        let observation_account_ais = self.get_observation_account_infos(marginfi_account);
        let utp_observer = UtpObserver::new(observation_account_ais.as_slice());
        // let utp_observer = UtpObserver::new(observation_account_ais.as_slice());
        for (utp_index, observation) in self.get_observations(marginfi_account, &utp_observer) {
            if !observation.is_rebalance_deposit_valid()? {
                continue;
            };
            let max_deposit = observation.get_rebalance_deposit_cap()?;
            println!("Max deposit for {}: {}", utp_index, max_deposit);
        }

        Ok(())
    }

    fn withdraw_if_needed(&self, _account: &MarginfiAccount) -> Result<()> {
        Ok(())
    }

    fn get_active_utps<'a>(&self, marginfi_account: &MarginfiAccount) -> Vec<usize> {
        marginfi_account
            .active_utps
            .iter()
            .enumerate()
            .filter_map(|(utp_index, is_active)| match is_active {
                true => Some(utp_index),
                false => None,
            })
            .collect::<Vec<usize>>()
    }

    fn get_observations<'a>(
        &self,
        marginfi_account: &MarginfiAccount,
        utp_observer: &UtpObserver<'a, '_>,
    ) -> Vec<(usize, Box<dyn Observable + 'a>)> {
        self.get_active_utps(marginfi_account)
            .iter()
            .map(|utp_index| {
                (
                    utp_index.to_owned(),
                    utp_observer
                        .observation(marginfi_account, utp_index.to_owned())
                        .unwrap(),
                )
            })
            .collect::<Vec<(usize, Box<dyn Observable>)>>()
    }

    fn get_observation_account_infos(
        &self,
        marginfi_account: &MarginfiAccount,
    ) -> Vec<AccountInfo> {
        // ) {
        self.get_active_utps(marginfi_account)
            .iter()
            .flat_map(|utp_index| match utp_index {
                MANGO_UTP_INDEX => self.get_mango_observation_accounts().to_vec(),
                ZO_UTP_INDEX => self.get_zo_observation_accounts().to_vec(),
                _ => panic!("utp index not supported"),
            })
            .collect()
    }

    fn get_mango_observation_accounts<'a, 'b>(&self) -> &'a [AccountInfo<'b>] {
        // fetch and deser group
        let accounts_raw: Vec<Account> = self
            .program
            .rpc()
            .get_multiple_accounts(&[self.mango_group_pk, self.mango_cache_pk])
            .unwrap()
            .into_iter()
            .map(Option::<Account>::unwrap)
            .collect();

        let mango_group_account = &mut (self.mango_group_pk, accounts_raw[0].clone());
        let mango_group_ai = AccountInfo::from(mango_group_account);

        let mango_cache_account = &mut (self.mango_group_pk, accounts_raw[0].clone());
        let mango_cache_ai = AccountInfo::from(mango_cache_account);

        &[mango_group_ai, mango_cache_ai]
    }

    fn get_zo_observation_accounts(&self) -> &[AccountInfo] {
        // fetch and deser state
        // fetch remaining accounts
        // convert all to AccountInfo

        &[]
    }
}
