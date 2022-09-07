use anchor_lang::prelude::*;
use marginfi::prelude::MarginfiGroup;
use serde::Deserialize;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::{read_keypair_file, Keypair};
use crate::utils::{fetch_anchor, Res};



#[derive(Deserialize, Debug, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Env {
    MAINNET,
    DEVNET,
    OTHER,
}

#[derive(Deserialize, Debug)]
pub struct MarginfiClientConfig {
    pub program: Pubkey,
    pub group: Pubkey,
    pub env: Env,
    pub rpc_endpoint: String,
    pub wallet: String,
    pub marginfi_account: Option<Pubkey>
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
        let group = fetch_anchor::<MarginfiGroup>(&rpc_endpoint, &config.group).await?;
        let keypair = read_keypair_file(&config.wallet)?;
        
        Ok(Self {
            rpc_endpoint,
            group,
            config,
            keypair,
        })
    }
    pub async fn new_from_env() -> Res<Self> {
        let config = envy::from_env::<MarginfiClientConfig>()?;
        Self::new(config).await
    }

    pub async fn load_group(&self) -> Res<MarginfiGroup> {
        let group = fetch_anchor::<MarginfiGroup>(&self.rpc_endpoint, &self.config.group).await?;
        Ok(group)
    }
}
