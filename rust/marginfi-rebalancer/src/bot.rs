use crate::config::WalletPath;
use anchor_client::{Client, Cluster, Program};
use anyhow::Result;
use bytemuck::{from_bytes, Pod};
use mango_protocol::state::{MangoAccount, MangoCache, MangoGroup};
use marginfi::constants::{MANGO_UTP_INDEX, ZO_UTP_INDEX};
use marginfi::prelude::MarginfiAccount;
use marginfi::state::utp_observation::Observable;
use marginfi::state::{mango_state::MangoObserver, zo_state::ZoObserver};
use solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType};
use solana_program::pubkey;
use solana_sdk::account::Account;
use solana_sdk::account_info::AccountInfo;
use solana_sdk::program_error::ProgramError;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::{commitment_config::CommitmentConfig, signature::read_keypair_file};
use std::cell::Ref;
use std::{rc::Rc, str::FromStr, thread::sleep, time::Duration};
use zo_abi::{Cache, Control, Margin, State};

pub struct Bot {
    pub payer: Keypair,
    pub client: Client,
    pub program: Program,
    pub cluster: Cluster,

    pub mango_program_pk: Pubkey,
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

        let mango_group_account = &mut (mango_group_pk, accounts_raw[0].clone());
        let mango_group_ai = AccountInfo::from(mango_group_account);
        let mango_group = MangoGroup::load_checked(&mango_group_ai, &mango_program_pk).unwrap();

        let zo_state: State = program.account(zo_state_pk).unwrap();

        let payer = read_keypair_file(&*shellexpand::tilde(&wallet_path.to_string()))
            .expect("Example requires a keypair file");

        Self {
            payer,
            client,
            program,
            cluster,
            mango_program_pk,
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
        for (utp_index, observation) in self.get_observations(marginfi_account)? {
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
    ) -> Result<Vec<(usize, Box<dyn Observable + 'a>)>> {
        Ok(self
            .get_active_utps(marginfi_account)
            .into_iter()
            .map(|utp_index| {
                (
                    utp_index.to_owned(),
                    match utp_index {
                        MANGO_UTP_INDEX => self.get_mango_observer(marginfi_account).unwrap(),
                        ZO_UTP_INDEX => self.get_zo_observer(marginfi_account).unwrap(),
                        _ => panic!("utp index not supported"),
                    },
                )
            })
            .collect::<Vec<(usize, Box<dyn Observable>)>>())
    }

    fn get_mango_observer<'a>(
        &self,
        marginfi_account: &MarginfiAccount,
    ) -> Result<Box<dyn Observable + 'a>> {
        let mango_account_pk = marginfi_account.utp_account_config[MANGO_UTP_INDEX].address;

        let accounts_raw: Vec<Account> = self
            .program
            .rpc()
            .get_multiple_accounts(&[mango_account_pk, self.mango_group_pk, self.mango_cache_pk])
            .unwrap()
            .into_iter()
            .map(Option::<Account>::unwrap)
            .collect();

        let mango_account_raw = &mut (mango_account_pk, accounts_raw[1].clone());
        let mango_account_ai = AccountInfo::from(mango_account_raw);
        let mango_account = MangoAccount::load_checked(
            &mango_account_ai,
            &self.mango_program_pk,
            &self.mango_group_pk,
        )
        .unwrap();

        let mango_group_raw = &mut (self.mango_group_pk, accounts_raw[1].clone());
        let mango_group_ai = AccountInfo::from(mango_group_raw);
        let mango_group =
            MangoGroup::load_checked(&mango_group_ai, &self.mango_program_pk).unwrap();

        let mango_cache_raw = &mut (self.mango_cache_pk, accounts_raw[2].clone());
        let mango_cache_ai = AccountInfo::from(mango_cache_raw);
        let mango_cache =
            MangoCache::load_checked(&mango_cache_ai, &self.mango_program_pk, &mango_group)
                .unwrap();

        Ok(Box::new(MangoObserver {
            mango_account,
            mango_group,
            mango_cache,
        }))
    }

    fn get_zo_observer<'a>(
        &self,
        marginfi_account: &MarginfiAccount,
    ) -> Result<Box<dyn Observable + 'a>> {
        let zo_margin_pk = marginfi_account.utp_account_config[ZO_UTP_INDEX].address;

        let accounts_raw: Vec<Account> = self
            .program
            .rpc()
            .get_multiple_accounts(&[zo_margin_pk, self.zo_state_pk, self.zo_cache_pk])
            .unwrap()
            .into_iter()
            .map(Option::<Account>::unwrap)
            .collect();

        let zo_margin_raw = &mut (zo_margin_pk, accounts_raw[0].clone());
        let zo_margin_ai = AccountInfo::from(zo_margin_raw);
        let zo_margin: Ref<Margin> = load(&zo_margin_ai)?;

        let zo_state_raw = &mut (self.zo_state_pk, accounts_raw[1].clone());
        let zo_state_ai = AccountInfo::from(zo_state_raw);
        let zo_state: Ref<State> = load(&zo_state_ai)?;

        let zo_cache_raw = &mut (self.zo_cache_pk, accounts_raw[2].clone());
        let zo_cache_ai = AccountInfo::from(zo_cache_raw);
        let zo_cache: Ref<Cache> = load(&zo_cache_ai)?;

        let zo_control_pk = zo_margin.control;

        let zo_control_tmp = self.program.rpc().get_account(&zo_control_pk).unwrap();
        let zo_control_raw = &mut (self.zo_cache_pk, zo_control_tmp);
        let zo_control_ai = AccountInfo::from(zo_control_raw);
        let zo_control: Ref<Control> = load(&zo_control_ai)?;

        Ok(Box::new(ZoObserver {
            zo_margin,
            zo_control,
            zo_state,
            zo_cache,
        }))
    }
}

pub fn load<'a, T: Pod>(account: &'a AccountInfo) -> Result<Ref<'a, T>, ProgramError> {
    Ok(Ref::map(account.try_borrow_data()?, |data| {
        from_bytes(&data[8..])
    }))
}
