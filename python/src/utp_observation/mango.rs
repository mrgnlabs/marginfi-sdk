use fixed::types::I80F48;
use mango_protocol::matching::Side;
use mango_protocol::state::{HealthCache, INFO_LEN, MangoAccount, MangoCache, MangoGroup, MAX_PAIRS, MAX_PERP_OPEN_ORDERS, MAX_TOKENS, MetaData, PerpAccount, UserActiveAssets};
use marginfi::constants::COLLATERAL_SCALING_FACTOR;
use marginfi::prelude::MarginfiError;
use pyo3::prelude::*;
use marginfi::state::mango_state;
use rust_decimal::prelude::{Decimal, ToPrimitive};
use serum_dex::state::OpenOrders;
use solana_sdk::pubkey::Pubkey;
use crate::handle_py_value_err;

fn sum(a: usize, b: usize) -> usize {
    a + b
}

/// Formats the sum of two numbers as string.
#[pyfunction]
fn sum_as_string(a: usize, b: usize) -> PyResult<String> {
    Ok(sum(a, b).to_string())
}

#[pyfunction]
fn get_free_collateral(mango_group_data: &[u8], mango_account_data: &[u8], mango_cache_data: &[u8]) -> PyResult<u64> {
    println!("");
    println!("MangoGroup size: struct: {}, fetched: {}", std::mem::size_of::<MangoGroup>(), std::mem::size_of_val(mango_group_data));
    println!("MangoGroup align : struct: {}, fetched: {}", std::mem::align_of::<MangoGroup>(), std::mem::align_of_val(mango_group_data));
    println!("MangoAccount size: struct: {}, fetched: {}", std::mem::size_of::<MangoAccount>(), std::mem::size_of_val(mango_account_data));
    println!("MangoAccount align : struct: {}, fetched: {}", std::mem::align_of::<MangoAccount>(), std::mem::align_of_val(mango_account_data));
    println!("MangoCache size: struct: {}, fetched: {}", std::mem::size_of::<MangoCache>(), std::mem::size_of_val(mango_cache_data));
    println!("MangoCache align : struct: {}, fetched: {}", std::mem::align_of::<MangoCache>(), std::mem::align_of_val(mango_cache_data));
// println!("{}", std::mem::size_of::<MetaData>());
    // println!("{}", std::mem::size_of::<Pubkey>());
    // println!("{}", std::mem::size_of::<Pubkey>());
    // println!("{}", std::mem::size_of::<[bool; MAX_PAIRS]>());
    // println!("{}", std::mem::size_of::<u8>());
    // println!("{}", std::mem::size_of::<[I80F48; MAX_TOKENS]>());
    // println!("{}", std::mem::size_of::<[I80F48; MAX_TOKENS]>());
    // println!("{}", std::mem::size_of::<[Pubkey; MAX_PAIRS]>());
    println!("{}", std::mem::size_of::<[PerpAccount; MAX_PAIRS]>());
    println!("{}", std::mem::size_of::<PerpAccount>());
    // println!("{}", std::mem::size_of::<[u8; MAX_PERP_OPEN_ORDERS]>());
    // println!("{}", std::mem::size_of::<[Side; MAX_PERP_OPEN_ORDERS]>());
    // println!("{}", std::mem::size_of::<[i128; MAX_PERP_OPEN_ORDERS]>());
    // println!("{}", std::mem::size_of::<[u64; MAX_PERP_OPEN_ORDERS]>());
    // println!("{}", std::mem::size_of::<u64>());
    // println!("{}", std::mem::size_of::<bool>());
    // println!("{}", std::mem::size_of::<bool>());
    // println!("{}", std::mem::size_of::<[u8; INFO_LEN]>());
    // println!("{}", std::mem::size_of::<Pubkey>());
    // println!("{}", std::mem::size_of::<bool>());
    // println!("{}", std::mem::size_of::<Pubkey>());
    // println!("{}", std::mem::size_of::<[u8; 5]>());
    let mango_group: &MangoGroup = bytemuck::from_bytes(mango_group_data);
    let mango_account: &MangoAccount = bytemuck::from_bytes(mango_account_data);
    let mango_cache: &MangoCache = bytemuck::from_bytes(mango_cache_data);

    let active_assets = UserActiveAssets::new(mango_group, mango_account, vec![]);

    // mango_cache
    //     .check_valid(mango_group, &active_assets, timestamp)
    //     .map_err(|_| MarginfiError::MangoError)?;
    let mut health_cache = HealthCache::new(active_assets);
    let open_orders_accounts: Vec<Option<&OpenOrders>> = vec![None; MAX_PAIRS];

    health_cache
        .init_vals_with_orders_vec(
            mango_group,
            mango_cache,
            mango_account,
            &open_orders_accounts,
        )
        .unwrap();

    handle_py_value_err(mango_state::get_free_collateral(&mut health_cache, mango_group).unwrap()
        .checked_mul(Decimal::from(COLLATERAL_SCALING_FACTOR)).ok_or(MarginfiError::MathError).unwrap()
        .to_u64().ok_or(MarginfiError::MathError))
}

pub(crate) fn create_mango_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let m = PyModule::new(py, "mango")?;
    m.add_function(wrap_pyfunction!(get_free_collateral, m)?)?;
    Ok(m)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_test_str_res() {
        let exp = Some(String::from("2"));
        assert_eq!(sum_as_string(1, 1).ok(), exp);
    }

    #[test]
    fn simple_test_str() {
        assert_eq!(sum(1, 1), 2);
    }

    #[test]
    fn simple_test_false() {
        assert_eq!(is_prime(0), false);
        assert_eq!(is_prime(1), false);
        assert_eq!(is_prime(12), false)
    }

    #[test]
    fn simple_test_true() {
        assert_eq!(is_prime(2), true);
        assert_eq!(is_prime(3), true);
        assert_eq!(is_prime(41), true)
    }
}

