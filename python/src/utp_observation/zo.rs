use crate::utp_observation::ObservationRaw;
use bytemuck::from_bytes;
use marginfi_common::zo;
use pyo3::prelude::*;
use std::time::{SystemTime, UNIX_EPOCH};
use zo_abi::{Cache, Control, Margin, State};

#[pyfunction]
fn get_observation(
    zo_margin_data: &[u8],
    zo_control_data: &[u8],
    zo_state_data: &[u8],
    zo_cache_data: &[u8],
) -> PyResult<ObservationRaw> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let zo_margin: &Margin = from_bytes(&zo_margin_data[8..]);
    let zo_control: &Control = from_bytes(&zo_control_data[8..]);
    let zo_state: &State = from_bytes(&zo_state_data[8..]);
    let zo_cache: &Cache = from_bytes(&zo_cache_data[8..]);

    let free_collateral: i128 = zo::get_free_collateral(zo_margin, zo_control, zo_state, zo_cache)
        .unwrap()
        .to_num();
    let is_empty: bool = zo::is_empty(zo_margin, zo_control, zo_state, zo_cache).unwrap();
    let is_rebalance_deposit_valid: bool =
        zo::is_rebalance_deposit_valid(zo_margin, zo_control, zo_state, zo_cache).unwrap();
    let max_rebalance_deposit_amount: i128 =
        zo::get_max_rebalance_deposit_amount(zo_margin, zo_control, zo_state, zo_cache)
            .unwrap()
            .to_num();
    let init_margin_requirement: i128 =
        zo::get_init_margin_requirement(zo_margin, zo_control, zo_state, zo_cache)
            .unwrap()
            .to_num();
    let equity: i128 = zo::get_equity(zo_margin, zo_control, zo_state, zo_cache)
        .unwrap()
        .to_num();
    let liquidation_value: i128 =
        zo::get_liquidation_value(zo_margin, zo_control, zo_state, zo_cache)
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

pub(crate) fn create_zo_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let m = PyModule::new(py, "zo")?;
    m.add_function(wrap_pyfunction!(get_observation, m)?)?;
    Ok(m)
}
