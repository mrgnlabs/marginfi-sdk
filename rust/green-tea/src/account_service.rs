use anyhow::{anyhow, Result};
use crossbeam_channel::Sender;
use dashmap::DashMap;
use futures::{future::join_all, StreamExt};
use log::{debug, error, info};
use marginfi_sdk::{client::MarginClient, marginfi::constants::{MANGO_PROGRAM, ZO_PROGRAM}};
use solana_account_decoder::UiAccountEncoding;
use solana_client::{
    nonblocking::pubsub_client::PubsubClient,
    rpc_client::RpcClient,
    rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig},
    rpc_filter::RpcFilterType,
};
use solana_sdk::{
    account::Account, account_info::AccountInfo, commitment_config::CommitmentConfig,
    pubkey::Pubkey,
};
use std::{
    str::FromStr,
    sync::{atomic::AtomicBool, Arc},
};

#[derive(Clone)]
pub struct AccountWithContext {
    pub address: Pubkey,
    pub account: Account,
    pub slot: u64,
}

impl AccountWithContext {
    pub fn new(address: Pubkey, account: Account, slot: u64) -> Self {
        Self {
            account,
            slot,
            address,
        }
    }
}

impl<'a> Into<AccountInfo<'a>> for &'a mut AccountWithContext {
    fn into(self) -> AccountInfo<'a> {
        (&self.address, &mut self.account).into()
    }
}

pub type ActiveState = Arc<DashMap<Pubkey, AccountWithContext>>;

pub struct RpcAccountService {
    rpc_client: Arc<RpcClient>,
    pubsub_client: Arc<PubsubClient>,
    pub active_state: ActiveState,
    channel: Arc<Sender<u64>>,
}

#[derive(Clone, Debug, Default)]
pub struct RpcAccountServiceConfig {
    pub filters: Option<Vec<RpcFilterType>>,
    pub load_state: Option<bool>,
}

impl RpcAccountService {
    pub fn new(
        sender: Arc<Sender<u64>>,
        rpc_client: Arc<RpcClient>,
        pubsub_client: Arc<PubsubClient>,
    ) -> Arc<Self> {
        Arc::new(Self {
            active_state: Arc::new(DashMap::new()),
            channel: sender,
            rpc_client,
            pubsub_client,
        })
    }

    pub fn start(
        self: &Arc<Self>,
        marginfi_client: &MarginClient,
    ) -> Result<()> {
        // Load margin accounts from the RPC node
        // Subscribe to all margin changes
        // Find all UTP accounts

        self.watch_program_accounts(&marginfi_client.config.marginfi_program, None)?;
        self.watch_program_accounts(&MANGO_PROGRAM, None)?;
        self.watch_program_accounts(&ZO_PROGRAM, None)?;

        Ok(())
    }

    pub fn watch_accounts(self: &Arc<Self>, active_state_addresses: &Vec<Pubkey>) -> Result<()> {
        self.load_active_state_accounts(active_state_addresses)?;
        tokio::spawn(
            self.clone()
                .subscribe_accounts(active_state_addresses.clone()),
        );

        Ok(())
    }

    pub fn load_active_state_accounts(
        self: &Arc<Self>,
        active_state_addresses: &Vec<Pubkey>,
    ) -> Result<()> {
        debug!(
            "Loading {} accounts",
            active_state_addresses.len()
        );
        let slot = self.rpc_client.get_slot()?;
        let res = self
            .rpc_client
            .get_multiple_accounts(&active_state_addresses)?;

        res.iter().zip(active_state_addresses.iter()).try_for_each(
            |(account, address)| -> Result<()> {
                self.active_state.insert(
                    *address,
                    AccountWithContext::new(
                        *address,
                        account
                            .as_ref()
                            .ok_or(anyhow!("Account {} not found", address))?
                            .clone(),
                        slot,
                    ),
                );
                Ok(())
            },
        )?;

        debug!("Done!");
        Ok(())
    }

    async fn subscribe_accounts(
        self: Arc<Self>,
        active_state_addresses: Vec<Pubkey>,
    ) -> Result<()> {
        debug!("Spawning subscriber");
        debug!("Subscribing to {} accounts", active_state_addresses.len());

        let pubsub_client = &self.pubsub_client;
        let active_state = &self.active_state;

        join_all(
            active_state_addresses
                .iter()
                .zip(vec![self.channel.clone(); active_state_addresses.len()])
                .map(|(address, signal_channel)| async move {
                    let (mut stream, _) = pubsub_client
                        .account_subscribe(
                            &address.clone(),
                            Some(RpcAccountInfoConfig {
                                encoding: Some(UiAccountEncoding::Base64),
                                commitment: Some(CommitmentConfig::confirmed()),
                                ..Default::default()
                            }),
                        )
                        .await?;

                    debug!("Subscribed to {}", address);

                    while let Some(ui_account) = stream.next().await {
                        let active_state = active_state.clone();
                        debug!("Received update for {}", address);

                        if let Some(account) = ui_account.value.decode::<Account>() {
                            active_state.insert(
                                *address,
                                AccountWithContext::new(*address, account, ui_account.context.slot),
                            );
                            signal_channel.send(ui_account.context.slot)?;
                            debug!("Updated state for {}", address);
                        } else {
                            error!("Failed to decode account {}", address);
                        }
                    }

                    Ok::<(), anyhow::Error>(())
                }),
        )
        .await
        .into_iter()
        .collect::<Result<_>>()?;

        Ok::<(), anyhow::Error>(())
    }

    pub fn watch_program_accounts(
        self: &Arc<Self>,
        program_id: &Pubkey,
        config: Option<RpcAccountServiceConfig>,
    ) -> Result<()> {
        let filters = config.clone().map_or_else(|| None, |config| config.filters);
        self.load_active_state_program_accounts(program_id, filters.clone())?;

        tokio::spawn(
            self.clone()
                .subscribe_program_accounts(*program_id, filters.clone()),
        );

        Ok(())
    }

    fn load_active_state_program_accounts(
        self: &Arc<Self>,
        program_id: &Pubkey,
        filters: Option<Vec<RpcFilterType>>,
    ) -> Result<()> {
        info!(
            "Loading current state for {} with filters {:?}",
            program_id, filters
        );
        let slot = self.rpc_client.get_slot()?;
        let res = self.rpc_client.get_program_accounts_with_config(
            program_id,
            RpcProgramAccountsConfig {
                filters,
                account_config: RpcAccountInfoConfig {
                    encoding: Some(UiAccountEncoding::Base64),
                    commitment: Some(CommitmentConfig::confirmed()),
                    ..Default::default()
                },
                ..Default::default()
            },
        )?;

        info!("Loaded {} accounts", res.len());

        res.iter().for_each(|(address, account)| {
            self.active_state.insert(
                *address,
                AccountWithContext::new(*address, account.clone(), slot),
            );
        });

        debug!("Loaded current state");
        self.channel.send(slot)?;
        Ok(())
    }

    async fn subscribe_program_accounts(
        self: Arc<Self>,
        program_id: Pubkey,
        filters: Option<Vec<RpcFilterType>>,
    ) -> Result<()> {
        info!(
            "Subscribing to program {} with filters {:?}",
            program_id, filters
        );

        let pubsub_client = &self.pubsub_client;
        let active_state = &self.active_state;

        let (mut stream, _) = pubsub_client
            .program_subscribe(
                &program_id,
                Some(RpcProgramAccountsConfig {
                    account_config: RpcAccountInfoConfig {
                        encoding: Some(UiAccountEncoding::Base64),
                        commitment: Some(CommitmentConfig::confirmed()),
                        ..Default::default()
                    },
                    filters,
                    ..Default::default()
                }),
            )
            .await
            .unwrap();

        while let Some(response) = stream.next().await {
            let active_state = active_state.clone();
            // debug!("Received update for {}", program_id);

            if let Some(account) = response.value.account.decode::<Account>() {
                // Maybe ignore error and continue?
                let address = Pubkey::from_str(&response.value.pubkey)?;
                active_state.insert(
                    address.clone(),
                    AccountWithContext::new(address.clone(), account, response.context.slot),
                );
                self.channel.send(response.context.slot)?;
                // debug!("Updated state for {}", program_id);
            } else {
                error!("Failed to decode account {}", program_id);
            }
        }

        Ok(())
    }
}
