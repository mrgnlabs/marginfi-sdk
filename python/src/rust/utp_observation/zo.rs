use bytemuck::from_bytes;
use marginfi::state::zo_state;
use pyo3::prelude::*;
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

    let free_collateral: u64 =
        zo_state::get_free_collateral(zo_margin, zo_control, zo_state, zo_cache)
            .unwrap()
            .to_num();
    Ok(free_collateral)
}

pub(crate) fn create_zo_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let m = PyModule::new(py, "zo")?;
    m.add_function(wrap_pyfunction!(get_free_collateral, m)?)?;
    Ok(m)
}
