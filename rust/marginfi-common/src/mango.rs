use crate::{constants::DUST_THRESHOLD_F, math_error};
use anyhow::Result;
use fixed::types::I80F48;
use mango_protocol::state::{HealthCache, HealthType, MangoGroup};
use std::cmp::max;

/// Observation helpers

pub fn get_free_collateral<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<I80F48> {
    let (init_total_collateral, margin_requirement_init) =
        health_cache.get_health_components(mango_group, HealthType::Init);

    let free_collateral_uncapped = init_total_collateral
        .checked_sub(margin_requirement_init)
        .ok_or_else(math_error!())?;

    Ok(max(I80F48::ZERO, free_collateral_uncapped))
}

pub fn is_empty<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<bool> {
    let (assets, _) = health_cache.get_health_components(mango_group, HealthType::Equity);

    Ok(assets < DUST_THRESHOLD_F)
}

pub fn is_rebalance_deposit_valid<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<bool> {
    let (init_total_collateral, margin_requirement_init) =
        health_cache.get_health_components(mango_group, HealthType::Init);

    Ok(init_total_collateral <= margin_requirement_init)
}

pub fn get_max_rebalance_deposit_amount<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<I80F48> {
    let (init_total_collateral, margin_requirement_init) =
        health_cache.get_health_components(mango_group, HealthType::Init);

    let max_rebalance_deposit_amount_uncapped = margin_requirement_init
        .checked_sub(init_total_collateral)
        .ok_or_else(math_error!())?;

    Ok(max(I80F48::ZERO, max_rebalance_deposit_amount_uncapped))
}

pub fn get_init_margin_requirement<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<I80F48> {
    Ok(health_cache
        .get_health_components(mango_group, HealthType::Init)
        .0)
}

pub fn get_equity<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<I80F48> {
    let (assets, liabilities) = health_cache.get_health_components(mango_group, HealthType::Equity);

    let equity_uncapped = assets.checked_sub(liabilities).ok_or_else(math_error!())?;

    Ok(max(I80F48::ZERO, equity_uncapped))
}

pub fn get_liquidation_value<'a>(
    health_cache: &'a mut HealthCache,
    mango_group: &'a MangoGroup,
) -> Result<I80F48> {
    get_equity(health_cache, mango_group)
}
