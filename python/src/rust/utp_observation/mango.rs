use mango_protocol::state::{
    HealthCache, MangoAccount, MangoCache, MangoGroup, UserActiveAssets, MAX_PAIRS,
};
use marginfi::state::mango_state;
use pyo3::prelude::*;
use serum_dex::state::OpenOrders;

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

    let free_collateral: u64 = mango_state::get_free_collateral(&mut health_cache, mango_group)
        .unwrap()
        .to_num();

    Ok(free_collateral)
}

pub(crate) fn create_mango_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let m = PyModule::new(py, "mango")?;
    m.add_function(wrap_pyfunction!(get_free_collateral, m)?)?;
    Ok(m)
}
