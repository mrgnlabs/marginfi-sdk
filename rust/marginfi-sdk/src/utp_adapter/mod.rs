use crate::{
    instructions::{
        mango::{mango_make_withdraw_ix, MangoWithdrawAccounts},
        zo::{zo_make_withdraw_ix, UtpZoWithdrawAccounts},
    },
    marginfi_account::MarginAccount,
    utils::fetch_mango,
};
use anyhow::Result;
use async_trait::async_trait;
use mango_protocol::state::{NodeBank, RootBank, QUOTE_INDEX};
use marginfi::constants::{MANGO_UTP_INDEX, ZO_UTP_INDEX};
use solana_client::rpc_config::RpcSendTransactionConfig;
use solana_sdk::{signature::Signature, signer::Signer, transaction::Transaction};
pub trait UtpAdapter {
    fn withdraw(&self, amount: u64) -> Result<Signature>;
}
pub enum Utp<'a> {
    Mango(Mango<'a>),
    Zo(Zo<'a>),
}

impl<'a> Utp<'a> {
    pub fn withdraw(&self, amount: u64) -> Result<Signature> {
        match self {
            Utp::Mango(utp) => utp.withdraw(amount),
            Utp::Zo(utp) => utp.withdraw(amount),
        }
    }

    pub async fn load_by_index(
        index: usize,
        margin_account: &'a MarginAccount<'a>,
    ) -> Result<Utp<'a>> {
        match index {
            MANGO_UTP_INDEX => Ok(Utp::Mango(Mango::load(margin_account).await?)),
            ZO_UTP_INDEX => Ok(Utp::Zo(Zo::new(margin_account))),
            _ => panic!("Unknown UTP index"),
        }
    }
}

pub struct Mango<'a> {
    margin_account: &'a MarginAccount<'a>,
    quote_root_bank: RootBank,
    quote_node_bank: NodeBank,
}

impl<'a> Mango<'a> {
    pub fn new(
        margin_account: &'a MarginAccount,
        root_bank: RootBank,
        node_bank: NodeBank,
    ) -> Self {
        Self {
            margin_account,
            quote_root_bank: root_bank,
            quote_node_bank: node_bank,
        }
    }

    pub async fn load(margin_account: &'a MarginAccount<'a>) -> Result<Mango<'a>> {
        let mango_observer = margin_account
            .observer
            .mango_observer
            .expect("Mango observer not found");

        let root_bank = fetch_mango::<RootBank>(
            &margin_account.client.non_blocking_rpc_client,
            &mango_observer.mango_group.tokens[QUOTE_INDEX].root_bank,
        )
        .await?;

        let node_bank = fetch_mango(
            &margin_account.client.non_blocking_rpc_client,
            &root_bank.node_banks.first().expect("No node bank found"),
        )
        .await?;

        Ok(Self::new(margin_account, root_bank, node_bank))
    }
}

#[async_trait]
impl<'a> UtpAdapter for Mango<'a> {
    fn withdraw(&self, amount: u64) -> Result<Signature> {
        let recent_block_hash = self
            .margin_account
            .client
            .rpc_client
            .get_latest_blockhash()?;

        let ix = mango_make_withdraw_ix(
            MangoWithdrawAccounts::new(
                self.margin_account,
                &self.quote_root_bank,
                &self.quote_node_bank,
            ),
            amount,
        );
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.margin_account.client.keypair.pubkey()),
            &[&self.margin_account.client.keypair],
            recent_block_hash,
        );

        Ok(self
            .margin_account
            .client
            .rpc_client
            .send_and_confirm_transaction(&tx)?)
    }
}

pub struct Zo<'a> {
    margin_account: &'a MarginAccount<'a>,
}

impl<'a> Zo<'a> {
    pub fn new(margin_account: &'a MarginAccount) -> Self {
        Self { margin_account }
    }
}

#[async_trait]
impl<'a> UtpAdapter for Zo<'a> {
    fn withdraw(&self, amount: u64) -> Result<Signature> {
        let recent_block_hash = self
            .margin_account
            .client
            .rpc_client
            .get_latest_blockhash()?;
        let ix = zo_make_withdraw_ix(UtpZoWithdrawAccounts::new(self.margin_account), amount);
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.margin_account.client.keypair.pubkey()),
            &[&self.margin_account.client.keypair],
            recent_block_hash,
        );

        // TODO: Move to the margin client
        Ok(self
            .margin_account
            .client
            .rpc_client
            .send_and_confirm_transaction(&tx)?)
    }
}
