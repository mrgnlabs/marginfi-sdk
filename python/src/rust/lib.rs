pub mod utp_observation;

// use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use std::collections::HashMap;
use utp_observation::create_utp_observation_mod;

struct PyErrWrapper(PyErr);

impl From<PyErrWrapper> for PyErr {
    fn from(e: PyErrWrapper) -> Self {
        e.0
    }
}

// fn to_py_err<T: Into<PyErrWrapper>>(e: T) -> PyErr {
//     let wrapped: PyErrWrapper = e.into();
//     wrapped.into()
// }

// fn handle_py_err<T: Into<P>, E: ToString + Into<PyErrWrapper>, P>(
//     res: Result<T, E>,
// ) -> PyResult<P> {
//     res.map_or_else(|e| Err(to_py_err(e)), |v| Ok(v.into()))
// }

// fn to_py_value_err(err: &impl ToString) -> PyErr {
//     PyValueError::new_err(err.to_string())
// }

// fn handle_py_value_err<T: Into<P>, E: ToString, P>(res: Result<T, E>) -> PyResult<P> {
//     res.map_or_else(|e| Err(to_py_value_err(&e)), |v| Ok(v.into()))
// }

/// A Python module implemented in Rust.
#[pymodule]
fn marginpy(py: Python, m: &PyModule) -> PyResult<()> {
    let utp_observation_mod = create_utp_observation_mod(py)?;
    let submodules = [utp_observation_mod];
    let modules: HashMap<String, &PyModule> = submodules
        .iter()
        .map(|x| (format!("marginpy.{}", x.name().unwrap()), *x))
        .collect();
    let sys_modules = py.import("sys")?.getattr("modules")?;
    sys_modules.call_method1("update", (modules,))?;
    for submod in submodules {
        m.add_submodule(submod)?;
    }
    Ok(())
}
