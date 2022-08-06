use crate::{constants::DUST_THRESHOLD_F, math_error};
use anyhow::Result;
use fixed::types::I80F48;
use std::cmp::max;
use zo_abi::{Cache, Control, Margin, State};

/// Observation helpers

pub fn get_free_collateral<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<I80F48> {
    let free_collateral_uncapped =
        zo_utils::get_net_free_collateral(zo_margin, zo_control, zo_state, zo_cache)
            .ok_or_else(math_error!())?;

    Ok(max(I80F48::ZERO, free_collateral_uncapped))
}

pub fn is_empty<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<bool> {
    let equity = zo_utils::get_mf(
        zo_utils::MfReturnOption::Mf,
        zo_margin,
        zo_control,
        zo_state,
        zo_cache,
    )
    .ok_or_else(math_error!())?;

    Ok(equity < DUST_THRESHOLD_F)
}

pub fn is_rebalance_deposit_valid<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<bool> {
    let free_collateral =
        zo_utils::get_net_free_collateral(zo_margin, zo_control, zo_state, zo_cache)
            .ok_or_else(math_error!())?;

    Ok(free_collateral.is_negative())
}

pub fn get_max_rebalance_deposit_amount<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<I80F48> {
    let max_rebalance_deposit_amount_uncapped =
        zo_utils::get_net_free_collateral(zo_margin, zo_control, zo_state, zo_cache)
            .ok_or_else(math_error!())?;

    Ok(max(I80F48::ZERO, max_rebalance_deposit_amount_uncapped))
}

pub fn get_init_margin_requirement<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<I80F48> {
    let margin_requirement_init = zo_utils::get_mf(
        zo_utils::MfReturnOption::Imf,
        zo_margin,
        zo_control,
        zo_state,
        zo_cache,
    )
    .ok_or_else(math_error!())?;

    Ok(margin_requirement_init)
}

pub fn get_equity<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<I80F48> {
    let equity = zo_utils::get_mf(
        zo_utils::MfReturnOption::Mf,
        zo_margin,
        zo_control,
        zo_state,
        zo_cache,
    )
    .ok_or_else(math_error!())?;

    Ok(equity)
}

pub fn get_liquidation_value<'a>(
    zo_margin: &'a Margin,
    zo_control: &'a Control,
    zo_state: &'a State,
    zo_cache: &'a Cache,
) -> Result<I80F48> {
    get_equity(zo_margin, zo_control, zo_state, zo_cache)
}
