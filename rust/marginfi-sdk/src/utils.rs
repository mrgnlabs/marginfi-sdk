use anchor_lang::prelude::{AccountInfo, AccountMeta, Pubkey};
use anyhow::{anyhow, Result};
use bytemuck::Pod;
use mango_common::Loadable;
use marginfi::{
    constants::{
        MANGO_UTP_INDEX, PDA_BANK_FEE_VAULT_SEED, PDA_BANK_INSURANCE_VAULT_SEED,
        PDA_BANK_VAULT_SEED, ZO_UTP_INDEX,
    },
    state::marginfi_group::BankVaultType,
};
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_filter::{Memcmp, RpcFilterType},
};
use solana_sdk::account_info::IntoAccountInfo;
use std::{cell::Ref, error::Error};

pub type Res<T> = std::result::Result<T, Box<dyn Error>>;

pub fn pubkey_to_readonly_account_metas(pubkeys: &Vec<Pubkey>) -> Vec<AccountMeta> {
    pubkeys
        .iter()
        .map(|pk| AccountMeta::new_readonly(*pk, false))
        .collect()
}

pub fn get_bank_authority(bank_type: BankVaultType, mgroup_pk: &Pubkey) -> (Pubkey, u8) {
    let bank_seed = match bank_type {
        BankVaultType::LiquidityVault => PDA_BANK_VAULT_SEED,
        BankVaultType::InsuranceVault => PDA_BANK_INSURANCE_VAULT_SEED,
        BankVaultType::ProtocolFeeVault => PDA_BANK_FEE_VAULT_SEED,
    };

    Pubkey::find_program_address(&[bank_seed, mgroup_pk.as_ref()], &marginfi::id())
}

pub fn get_group_account_filter(marginfi_program: &Pubkey) -> RpcFilterType {
    RpcFilterType::Memcmp(Memcmp {
        offset: 8 + 32,
        bytes: solana_client::rpc_filter::MemcmpEncodedBytes::Bytes(
            marginfi_program.to_bytes().to_vec(),
        ),
        encoding: None,
    })
}

pub async fn fetch_mango<T: Loadable>(rpc_client: &RpcClient, address: &Pubkey) -> Result<T> {
    let mut account = rpc_client.get_account(address).await?;
    let ai = (address, &mut account).into_account_info();
    load_mango(&ai)
}

pub fn load_mango<T: Loadable>(ai: &AccountInfo) -> Result<T> {
    let t = T::load(ai)?;
    Ok(*t)
}

pub async fn fetch_anchor<T: Pod + Copy>(rpc_client: &RpcClient, address: &Pubkey) -> Result<T> {
    let mut account = rpc_client.get_account(address).await?;
    let ai = (address, &mut account).into_account_info();
    let t = load_anchor::<T>(&ai).map_err(|_| anyhow!("Failed to load account {}", address))?;

    Ok(*t)
}

pub async fn fetch_no_discriminator<T: Pod + Copy>(
    rpc_client: &RpcClient,
    address: &Pubkey,
) -> Result<T> {
    let mut account = rpc_client.get_account(address).await?;
    let ai = (address, &mut account).into_account_info();
    let t = load_no_discriminator::<T>(&ai)
        .map_err(|_| anyhow!("Failed to load account {}", address))?;

    Ok(*t)
}

#[inline]
pub fn get_utp_ui_name(index: usize) -> String {
    match index {
        MANGO_UTP_INDEX => "Mango Markets".to_owned(),
        ZO_UTP_INDEX => "01 Protocol".to_owned(),
        _ => panic!("Unknown UTP index"),
    }
}

#[inline]
pub fn load_anchor<'a, T: bytemuck::Pod>(account: &'a AccountInfo) -> Result<Ref<'a, T>> {
    Ok(Ref::map(account.try_borrow_data()?, |data| {
        bytemuck::from_bytes(&data[8..])
    }))
}

#[inline]
pub fn load_no_discriminator<'a, T: bytemuck::Pod>(account: &'a AccountInfo) -> Result<Ref<'a, T>> {
    Ok(Ref::map(account.try_borrow_data()?, |data| {
        bytemuck::from_bytes(&data)
    }))
}
