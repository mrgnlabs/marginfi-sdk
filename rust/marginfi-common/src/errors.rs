use thiserror::Error;

#[derive(Error, Debug)]
pub enum MarginCommonError {
    #[error("Math error")]
    MathError,
}

#[macro_export]
macro_rules! math_error {
    () => {{
        || {
            let error_code = $crate::errors::MarginCommonError::MathError;
            println!(
                "Error \"{}\" thrown at {}:{}",
                error_code,
                file!(),
                line!()
            );
            error_code
        }
    }};
}
