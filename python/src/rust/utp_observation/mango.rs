use crate::handle_py_value_err;
use mango_protocol::state::{
    HealthCache, MangoAccount, MangoCache, MangoGroup, UserActiveAssets, MAX_PAIRS,
};
use marginfi::constants::COLLATERAL_SCALING_FACTOR;
use marginfi::prelude::MarginfiError;
use marginfi::state::mango_state;
use pyo3::prelude::*;
use rust_decimal::prelude::{Decimal, ToPrimitive};
use serum_dex::state::OpenOrders;

fn sum(a: usize, b: usize) -> usize {
    a + b
}

/// Formats the sum of two numbers as string.
#[pyfunction]
fn sum_as_string(a: usize, b: usize) -> PyResult<String> {
    Ok(sum(a, b).to_string())
}

#[pyfunction]
fn get_free_collateral(
    mango_group_data: &[u8],
    mango_account_data: &[u8],
    mango_cache_data: &[u8],
) -> PyResult<u64> {
    let mango_group: &MangoGroup = bytemuck::from_bytes(mango_group_data);
    let mango_account: &MangoAccount = bytemuck::from_bytes(mango_account_data);
    let mango_cache: &MangoCache = bytemuck::from_bytes(mango_cache_data);

    let active_assets = UserActiveAssets::new(mango_group, mango_account, vec![]);

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

    handle_py_value_err(
        mango_state::get_free_collateral(&mut health_cache, mango_group)
            .unwrap()
            .checked_mul(Decimal::from(COLLATERAL_SCALING_FACTOR))
            .ok_or(MarginfiError::MathError)
            .unwrap()
            .to_u64()
            .ok_or(MarginfiError::MathError),
    )
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
}
