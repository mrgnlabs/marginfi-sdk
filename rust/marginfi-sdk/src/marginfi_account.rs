use crate::{
    client::MarginClient,
    observer::ClientObserver,
    utils::{fetch_anchor, get_utp_ui_name, Res},
};
use anchor_lang::prelude::Pubkey;

use fixed::types::I80F48;
use marginfi::{
    constants::{MANGO_PROGRAM, MANGO_UTP_INDEX, PDA_UTP_AUTH_SEED, ZO_PROGRAM, ZO_UTP_INDEX},
    prelude::MarginfiAccount,
    state::{
        marginfi_account::{EquityType, MarginRequirement},
        marginfi_group::LendingSide,
        utp_observation::Observer,
    },
};

use std::fmt::Display;

#[derive(Clone)]
pub struct MarginAccount<'a> {
    pub address: Pubkey,
    pub marginfi_account: MarginfiAccount,
    pub client: &'a MarginClient,
    pub observer: ClientObserver,
}

impl<'a> MarginAccount<'a> {
    pub async fn load(mfi_client: &'a MarginClient, address: &Pubkey) -> Res<MarginAccount<'a>> {
        let marginfi_account =
            fetch_anchor::<MarginfiAccount>(&mfi_client.rpc_endpoint, address).await?;
        let observer = ClientObserver::load(&mfi_client.rpc_endpoint, &marginfi_account).await?;

        Ok(Self {
            address: *address,
            marginfi_account,
            client: mfi_client,
            observer,
        })
    }

    pub async fn load_from_marginfi_account(
        mfi_client: &'a MarginClient,
        address: Pubkey,
        marginfi_account: &MarginfiAccount,
    ) -> Res<MarginAccount<'a>> {
        let observer = ClientObserver::load(&mfi_client.rpc_endpoint, &marginfi_account).await?;

        Ok(Self {
            address,
            marginfi_account: marginfi_account.clone(),
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

    #[inline]
    pub fn get_utp_authority(&self, utp_index: usize) -> (Pubkey, u8) {
        let utp_program_address = match utp_index {
            MANGO_UTP_INDEX => MANGO_PROGRAM,
            ZO_UTP_INDEX => ZO_PROGRAM,
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
            &marginfi::ID,
        )
    }

    pub fn get_observation_accounts(&self) -> Vec<Pubkey> {
        let mut observation_accounts = vec![];

        observation_accounts.extend(
            self.observer
                .mango_observer
                .map(|o| o.get_observation_accounts())
                .unwrap_or_default(),
        );

        observation_accounts.extend(
            self.observer
                .zo_observer
                .map(|o| o.get_observation_accounts())
                .unwrap_or_default(),
        );

        observation_accounts
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
