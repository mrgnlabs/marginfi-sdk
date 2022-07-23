pub mod mango;
pub mod zo;

use self::{mango::create_mango_mod, zo::create_zo_mod};
use pyo3::prelude::*;
use std::collections::HashMap;

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
