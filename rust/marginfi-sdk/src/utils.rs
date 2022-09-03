use std::{
    cell::{Ref, RefCell},
    error::Error,
    rc::Rc,
    sync::Arc,
};

use anchor_lang::prelude::{AccountInfo, Pubkey};
use bytemuck::Pod;
use mango_common::Loadable;
use solana_client::{nonblocking::rpc_client::RpcClient};
use solana_sdk::{account::Account, account_info::IntoAccountInfo};

pub fn to_account_info<'a>(address: &'a Pubkey, account: &'a mut Account) -> AccountInfo<'a> {
    AccountInfo {
        key: address,
        is_signer: false,
        is_writable: false,
        lamports: Rc::new(RefCell::new(&mut account.lamports)),
        data: Rc::new(RefCell::new(&mut account.data)),
        owner: &account.owner,
        executable: false,
        rent_epoch: 0,
    }
}


pub async fn fetch_mango<T: Loadable>(rpc_client: &RpcClient, address: &Pubkey) -> T {
    let mut account = rpc_client.get_account(address).await.unwrap();
    let ai = (address, &mut account).into_account_info();
    let t = T::load(&ai).unwrap();
    
    *t
}

pub async fn fetch_anchor<T: Pod + Copy>(rpc_client: &RpcClient, address: &Pubkey) -> T {
    let mut account = rpc_client.get_account(address).await.unwrap();
    let ai = (address, &mut account).into_account_info();
    let t = load::<T>(&ai).unwrap();
    
    *t
}

// async fn fetch<T: Pod + Clone>(rpc_client: &Arc<RpcClient>, address: &Pubkey) -> T {
//     let mut account = rpc_client.get_account(address).await.unwrap();
//     let ai = to_account_info(address, &mut account);
//     println!("len {}, real {}", ai.data.borrow().len(), size_of::<T>());
//     let t = load_no_anchor::<T>(&ai).unwrap();
//     *t
// }

pub fn load<'a, T: bytemuck::Pod>(account: &'a AccountInfo) -> Result<Ref<'a, T>, Box<dyn Error>> {
    Ok(Ref::map(account.try_borrow_data()?, |data| {
        bytemuck::from_bytes(&data[8..])
    }))
}
