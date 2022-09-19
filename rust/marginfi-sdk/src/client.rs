use std::{
    convert::{TryFrom, TryInto},
    str::FromStr,
    sync::Arc,
};

use crate::utils::{fetch_anchor, get_group_account_filter, load_anchor, Res};
use anchor_lang::prelude::*;
use anyhow::Result;
use marginfi::prelude::{MarginfiAccount, MarginfiGroup};
use serde::Deserialize;
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::RpcProgramAccountsConfig,
    rpc_filter::{Memcmp, RpcFilterType},
};
use solana_sdk::signature::{read_keypair_file, Keypair};

#[derive(Deserialize, Debug, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Env {
    MAINNET,
    DEVNET,
    OTHER,
}

#[derive(Deserialize, Debug)]
pub struct MarginfiClientConfigRaw {
    pub marginfi_program: String,
    pub marginfi_group: String,
    pub env: Env,
    pub rpc_endpoint: String,
    pub wallet: String,
    pub marginfi_account: Option<String>,
}

#[derive(Debug)]
pub struct MarginfiClientConfig {
    pub marginfi_program: Pubkey,
    pub marginfi_group: Pubkey,
    pub env: Env,
    pub rpc_endpoint: String,
    pub wallet: String,
    pub marginfi_account: Option<Pubkey>,
}

impl TryFrom<MarginfiClientConfigRaw> for MarginfiClientConfig {
    type Error = anyhow::Error;

    fn try_from(value: MarginfiClientConfigRaw) -> std::result::Result<Self, Self::Error> {
        let marginfi_program = Pubkey::from_str(&value.marginfi_program)?;
        let marginfi_group = Pubkey::from_str(&value.marginfi_group)?;
        let marginfi_account = match value.marginfi_account {
            Some(marginfi_account) => Some(Pubkey::from_str(&marginfi_account)?),
            None => None,
        };

        Ok(Self {
            marginfi_program,
            marginfi_group,
            env: value.env,
            rpc_endpoint: value.rpc_endpoint,
            wallet: value.wallet,
            marginfi_account,
        })
    }
}

pub struct MarginClient {
    pub rpc_endpoint: Arc<RpcClient>,
    pub config: MarginfiClientConfig,
    pub group: MarginfiGroup,
    pub keypair: Keypair,
}

impl MarginClient {
    pub async fn new(config: MarginfiClientConfig) -> Result<Self> {
        let rpc_endpoint = Arc::new(RpcClient::new(config.rpc_endpoint.clone()));
        let group = fetch_anchor::<MarginfiGroup>(&rpc_endpoint, &config.marginfi_group).await?;
        let keypair = read_keypair_file(&config.wallet).expect("Failed to read wallet file");

        Ok(Self {
            rpc_endpoint,
            group,
            config,
            keypair,
        })
    }
    pub async fn new_from_env() -> Result<Self> {
        let config = envy::from_env::<MarginfiClientConfigRaw>()?.try_into()?;
        Self::new(config).await
    }

    pub async fn load_group(&self) -> Result<MarginfiGroup> {
        let group =
            fetch_anchor::<MarginfiGroup>(&self.rpc_endpoint, &self.config.marginfi_group).await?;
        Ok(group)
    }

    pub async fn get_all_marginfi_accounts(&self) -> Result<Vec<MarginfiAccount>> {
        self.rpc_endpoint
            .get_program_accounts_with_config(
                &self.config.marginfi_program,
                RpcProgramAccountsConfig {
                    filters: Some(vec![get_group_account_filter(&self.config.marginfi_group)]),
                    ..Default::default()
                },
            )
            .await?
            .into_iter()
            .map(|(address, account)| {
                let mut account = account.clone();
                let ai: AccountInfo = (&address, &mut account).into();
                let marginfi_account = load_anchor::<MarginfiAccount>(&ai)?;

                Ok::<_, anyhow::Error>(*marginfi_account)
            })
            .collect::<Result<Vec<MarginfiAccount>>>()
    }
}
