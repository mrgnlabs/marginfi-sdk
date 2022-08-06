use crate::utp_observation::ObservationRaw;
use mango_protocol::state::{
    HealthCache, MangoAccount, MangoCache, MangoGroup, UserActiveAssets, MAX_PAIRS,
};
use marginfi_common::mango;
use pyo3::prelude::*;
use serum_dex::state::OpenOrders;
use std::time::{SystemTime, UNIX_EPOCH};

#[pyfunction]
fn get_observation(
    mango_group_data: &[u8],
    mango_account_data: &[u8],
    mango_cache_data: &[u8],
) -> PyResult<ObservationRaw> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

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

    let free_collateral: i128 = mango::get_free_collateral(&mut health_cache, mango_group)
        .unwrap()
        .to_num();
    let is_empty: bool = mango::is_empty(&mut health_cache, mango_group).unwrap();
    let is_rebalance_deposit_valid: bool =
        mango::is_rebalance_deposit_valid(&mut health_cache, mango_group).unwrap();
    let max_rebalance_deposit_amount: i128 =
        mango::get_max_rebalance_deposit_amount(&mut health_cache, mango_group)
            .unwrap()
            .to_num();
    let init_margin_requirement: i128 =
        mango::get_init_margin_requirement(&mut health_cache, mango_group)
            .unwrap()
            .to_num();
    let equity: i128 = mango::get_equity(&mut health_cache, mango_group)
        .unwrap()
        .to_num();
    let liquidation_value: i128 = mango::get_liquidation_value(&mut health_cache, mango_group)
        .unwrap()
        .to_num();

    Ok(ObservationRaw {
        timestamp,
        free_collateral,
        is_empty,
        is_rebalance_deposit_valid,
        max_rebalance_deposit_amount,
        init_margin_requirement,
        equity,
        liquidation_value,
    })
}

pub(crate) fn create_mango_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let m = PyModule::new(py, "mango")?;
    m.add_function(wrap_pyfunction!(get_observation, m)?)?;
    Ok(m)
}
