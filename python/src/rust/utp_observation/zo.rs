use crate::handle_py_value_err;
use bytemuck::from_bytes;
use marginfi::constants::COLLATERAL_SCALING_FACTOR;
use marginfi::prelude::MarginfiError;
use marginfi::state::zo_state;
use pyo3::prelude::*;
use rust_decimal::prelude::{Decimal, ToPrimitive};
use zo_abi::{Cache, Control, Margin, State};

#[pyfunction]
fn get_free_collateral(
    zo_margin_data: &[u8],
    zo_control_data: &[u8],
    zo_state_data: &[u8],
    zo_cache_data: &[u8],
) -> PyResult<u64> {
    let zo_margin: &Margin = from_bytes(&zo_margin_data[8..]);
    let zo_control: &Control = from_bytes(&zo_control_data[8..]);
    let zo_state: &State = from_bytes(&zo_state_data[8..]);
    let zo_cache: &Cache = from_bytes(&zo_cache_data[8..]);

    handle_py_value_err(
        zo_state::get_free_collateral(zo_margin, zo_control, zo_state, zo_cache)
            .unwrap()
            .checked_mul(Decimal::from(COLLATERAL_SCALING_FACTOR))
            .ok_or(MarginfiError::MathError)
            .unwrap()
            .to_u64()
            .ok_or(MarginfiError::MathError),
    )
}

pub(crate) fn create_zo_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let m = PyModule::new(py, "zo")?;
    m.add_function(wrap_pyfunction!(get_free_collateral, m)?)?;
    Ok(m)
}
