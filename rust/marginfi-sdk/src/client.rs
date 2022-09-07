use std::{
    convert::{TryFrom, TryInto},
    str::FromStr,
};

use crate::utils::{fetch_anchor, Res};
use anchor_lang::prelude::*;
use marginfi::prelude::MarginfiGroup;
use serde::Deserialize;
use solana_client::nonblocking::rpc_client::RpcClient;
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
    pub rpc_endpoint: RpcClient,
    pub config: MarginfiClientConfig,
    pub group: MarginfiGroup,
    pub keypair: Keypair,
}

impl MarginClient {
    pub async fn new(config: MarginfiClientConfig) -> Res<Self> {
        let rpc_endpoint = RpcClient::new(config.rpc_endpoint.clone());
        let group = fetch_anchor::<MarginfiGroup>(&rpc_endpoint, &config.marginfi_group).await?;
        let keypair = read_keypair_file(&config.wallet)?;

        Ok(Self {
            rpc_endpoint,
            group,
            config,
            keypair,
        })
    }
    pub async fn new_from_env() -> Res<Self> {
        let config = envy::from_env::<MarginfiClientConfigRaw>()?.try_into()?;
        Self::new(config).await
    }

    pub async fn load_group(&self) -> Res<MarginfiGroup> {
        let group =
            fetch_anchor::<MarginfiGroup>(&self.rpc_endpoint, &self.config.marginfi_group).await?;
        Ok(group)
    }
}
