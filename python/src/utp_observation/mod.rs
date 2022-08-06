pub mod mango;
pub mod zo;

use self::{mango::create_mango_mod, zo::create_zo_mod};
use pyo3::prelude::*;
use std::collections::HashMap;

#[allow(dead_code)]
#[pyclass]
pub struct ObservationRaw {
    #[pyo3(get)]
    pub timestamp: u64,
    #[pyo3(get)]
    pub free_collateral: i128,
    #[pyo3(get)]
    pub is_empty: bool,
    #[pyo3(get)]
    pub is_rebalance_deposit_valid: bool,
    #[pyo3(get)]
    pub max_rebalance_deposit_amount: i128,
    #[pyo3(get)]
    pub init_margin_requirement: i128,
    #[pyo3(get)]
    pub equity: i128,
    #[pyo3(get)]
    pub liquidation_value: i128,
}

pub fn create_utp_observation_mod(py: Python<'_>) -> PyResult<&PyModule> {
    let utp_observation_mod = PyModule::new(py, "utp_observation")?;
    let mango_mod = create_mango_mod(py)?;
    let zo_mod = create_zo_mod(py)?;
    let submodules = [mango_mod, zo_mod];
    let modules: HashMap<String, &PyModule> = submodules
        .iter()
        .map(|x| {
            (
                format!("marginpy.utp_observation.{}", x.name().unwrap()),
                *x,
            )
        })
        .collect();
    let sys_modules = py.import("sys")?.getattr("modules")?;
    sys_modules.call_method1("update", (modules,))?;
    for sm in submodules {
        utp_observation_mod.add_submodule(sm)?;
    }
    Ok(utp_observation_mod)
}
