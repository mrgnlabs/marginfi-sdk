use crate::{
    observer::ClientObserver,
    utils::{fetch_anchor, get_utp_ui_name, Res},
};
use anchor_lang::prelude::Pubkey;
use fixed::types::I80F48;
use marginfi::{
    prelude::{MarginfiAccount, MarginfiGroup},
    state::{
        marginfi_account::{EquityType, MarginRequirement},
        marginfi_group::LendingSide,
        utp_observation::Observer,
    },
};
use serde::Deserialize;
use solana_client::nonblocking::rpc_client::RpcClient;
use std::fmt::Display;

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
}

pub struct MarginClient {
    pub rpc_endpoint: RpcClient,
    pub config: MarginfiClientConfig,
    pub group: MarginfiGroup,
}

impl MarginClient {
    pub async fn new(config: MarginfiClientConfig) -> Self {
        let rpc_endpoint = RpcClient::new(config.rpc_endpoint.clone());
        let group = fetch_anchor::<MarginfiGroup>(&rpc_endpoint, &config.group).await;
        Self {
            rpc_endpoint,
            group,
            config,
        }
    }
    pub async fn new_from_env() -> Res<Self> {
        let config = envy::from_env::<MarginfiClientConfig>()?;
        let rpc_endpoint = RpcClient::new(config.rpc_endpoint.clone());

        let group = fetch_anchor::<MarginfiGroup>(&rpc_endpoint, &config.group).await;
        Ok(Self {
            rpc_endpoint,
            group,
            config,
        })
    }

    pub async fn load_group(&self) -> Res<MarginfiGroup> {
        let group = fetch_anchor::<MarginfiGroup>(&self.rpc_endpoint, &self.config.group).await;
        Ok(group)
    }
}

pub struct MarginAccount<'a> {
    pub address: Pubkey,
    pub marginfi_account: MarginfiAccount,
    pub client: &'a MarginClient,
    pub observer: ClientObserver,
}

impl<'a> MarginAccount<'a> {
    pub async fn load(mfi_client: &'a MarginClient, address: &Pubkey) -> Res<MarginAccount<'a>> {
        let marginfi_account =
            fetch_anchor::<MarginfiAccount>(&mfi_client.rpc_endpoint, address).await;
        let observer = ClientObserver::load(&mfi_client.rpc_endpoint, &marginfi_account).await;

        Ok(Self {
            address: *address,
            marginfi_account,
            client: mfi_client,
            observer,
        })
    }

    pub fn balance(&self) -> Res<I80F48> {
        Ok(self.client.group.bank.get_native_amount(
            self.marginfi_account.deposit_record.into(),
            LendingSide::Deposit,
        )?)
    }

    pub fn liabilities(&self) -> Res<I80F48> {
        Ok(self.client.group.bank.get_native_amount(
            self.marginfi_account.borrow_record.into(),
            LendingSide::Borrow,
        )?)
    }

    pub fn equity(&self, equity_type: EquityType) -> Res<I80F48> {
        Ok(self.marginfi_account.get_equity(
            &self.client.group.bank,
            equity_type,
            &self.observer,
        )?)
    }

    pub fn get_margin_requirement(&self, mr_type: MarginRequirement) -> Res<I80F48> {
        Ok(self
            .marginfi_account
            .get_margin_requirement(&self.client.group.bank, mr_type)?)
    }
}

const SCALE: I80F48 = fixed_macro::types::I80F48!(1_000_000);

impl<'a> Display for MarginAccount<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let balance = self.balance().unwrap() / SCALE;
        let liabilities = self.liabilities().unwrap() / SCALE;
        let equity = self.equity(EquityType::Total).unwrap() / SCALE;
        let equity_imr = self.equity(EquityType::InitReqAdjusted).unwrap() / SCALE;

        let margin_ratio = if liabilities.is_zero() {
            I80F48::MAX
        } else {
            equity_imr / liabilities
        };

        let imr = self
            .get_margin_requirement(MarginRequirement::Init)
            .unwrap()
            / SCALE;
        let mmr = self
            .get_margin_requirement(MarginRequirement::Maint)
            .unwrap()
            / SCALE;

        let imr_health = if imr.is_zero() {
            I80F48::MAX
        } else {
            equity_imr / imr
        };

        let mmr_health = if mmr.is_zero() {
            I80F48::MAX
        } else {
            equity_imr / mmr
        };

        write!(
            f,
            r#"-----------------
Marginfi Account:
    Address: {},
    Balance: ${:.3},
    Equity: ${:.3},
    Mr Adjusted Equity: ${:.3},
    Liabilities: ${:.3},
    Margin Ratio: {:.3}, Leverage {:.3}x,
    Margin Requirement
        Init: ${:.3}, health [{}]: {:.3},
        Maint: ${:.3}, health [{}]: {:.3}"#,
            &self.address,
            balance,
            equity,
            equity_imr,
            liabilities,
            margin_ratio,
            I80F48::ONE / margin_ratio,
            imr,
            self.client
                .group
                .bank
                .get_margin_ratio(MarginRequirement::Init),
            imr_health,
            mmr,
            self.client
                .group
                .bank
                .get_margin_ratio(MarginRequirement::Maint),
            mmr_health
        )?;

        write!(
            f,
            r#"
-----------------
UTPs"#
        )?;

        for (ui, _) in self
            .marginfi_account
            .active_utps
            .iter()
            .enumerate()
            .filter(|(_, active)| **active)
        {
            let utp_config = self.marginfi_account.utp_account_config[ui];
            let utp_observer = self
                .observer
                .observation(&self.marginfi_account, ui)
                .unwrap();

            let address = utp_config.address;
            let equity = utp_observer.get_equity().unwrap() / SCALE;
            let free_collateral = utp_observer.get_free_collateral().unwrap() / SCALE;

            write!(
                f,
                r#"
    {}:
        Address: {}
        Equity: ${:.3}
        Free Collateral: ${:.3}
        Needs to be rebalanced: {} (${:.3})"#,
                get_utp_ui_name(ui),
                address,
                equity,
                free_collateral,
                utp_observer.is_rebalance_deposit_valid().unwrap(),
                utp_observer.get_max_rebalance_deposit_amount().unwrap() / SCALE,
            )?;
        }

        Ok(())
    }
}
