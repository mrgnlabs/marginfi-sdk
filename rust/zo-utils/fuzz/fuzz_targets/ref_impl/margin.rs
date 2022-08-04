use fixed::types::I80F48;
use fixed_macro::fixed;
use std::convert::TryInto;
use zo_abi::{
    Cache, Control, Margin, PerpType, State, MAX_COLLATERALS, MAX_MARKETS, SPOT_INITIAL_MARGIN_REQ,
    SPOT_MAINT_MARGIN_REQ,
};

use super::{math::*, utils::*};

#[derive(Clone, Copy)]
pub enum MfReturnOption {
    Mf,
    Imf,
    Mmf,
    Omf,
    Cmf,
}

impl From<zo_utils::MfReturnOption> for MfReturnOption {
    fn from(mro: zo_utils::MfReturnOption) -> Self {
        match mro {
            zo_utils::MfReturnOption::Mf => MfReturnOption::Mf,
            zo_utils::MfReturnOption::Imf => MfReturnOption::Imf,
            zo_utils::MfReturnOption::Mmf => MfReturnOption::Mmf,
            zo_utils::MfReturnOption::Omf => MfReturnOption::Omf,
            zo_utils::MfReturnOption::Cmf => MfReturnOption::Cmf,
        }
    }
}

/*
 * ###############################################################
 * ####################  START OF OVERHAUL  ######################
 * ###############################################################
 * All values are reported in small units, i.e. 1,000,000 = 1 USD.
 * This information available in the state collateral info.
 * All values are also in I80F48 format
 * to prevent floating point errors.
 * Functions are meant to be stand-alone and easy to test.
 * Also note that we don't deal with the total position open notional.
 * It appears the same way in each formula, so it is redundant to include it.
*/

/// Make a vector of positions for the given margin.
/// Each entry is denominated in smol assets.
/// Does not include pnl or open orders.
/// Mostly a helper function to interface margin and math.
fn get_position_vector(
    margin: &Margin,
    control: &Control,
) -> [I80F48; MAX_COLLATERALS + MAX_MARKETS] {
    let mut position = [I80F48::ZERO; MAX_COLLATERALS + MAX_MARKETS];

    for i in 0..MAX_COLLATERALS {
        position[i] = margin.collateral[i].into(); // In smol
    }

    for i in 0..MAX_MARKETS {
        position[i + MAX_COLLATERALS] = I80F48::from_num(control.open_orders_agg[i].pos_size);
    }

    position
}

fn get_position_open_vector(
    margin: &Margin,
    control: &Control,
) -> [I80F48; MAX_COLLATERALS + MAX_MARKETS] {
    let mut position = get_position_vector(margin, control);

    for (i, info) in control.open_orders_agg.iter().enumerate() {
        position[i + MAX_COLLATERALS] = I80F48::from_num(
            { info.pos_size }
                .safe_add(info.coin_on_bids as i64)
                .unwrap()
                .abs(),
        )
        .max(I80F48::from_num(
            { info.pos_size }
                .safe_sub(info.coin_on_asks as i64)
                .unwrap()
                .abs(),
        ));
    }
    position
}

/// Analogous vector for the state.
pub fn get_price_vector(
    state: &State,
    cache: &Cache,
    position: &[I80F48; MAX_COLLATERALS + MAX_MARKETS], // Needed to determine interest rates
) -> [I80F48; MAX_COLLATERALS + MAX_MARKETS] {
    // In sUSD/sAsset
    let mut price = [I80F48::ZERO; MAX_COLLATERALS + MAX_MARKETS];

    for i in 0..state.total_collaterals {
        let i = i as usize;
        let adjustment: I80F48 = if position[i].is_negative() {
            cache.borrow_cache[i].borrow_multiplier.into()
        } else {
            cache.borrow_cache[i].supply_multiplier.into()
        };

        let unadjusted_price = get_oracle(cache, &state.collaterals[i].oracle_symbol)
            .unwrap()
            .price
            .into();

        price[i] = safe_mul_i80f48(unadjusted_price, adjustment);
    }

    for i in 0..state.total_markets {
        let i = i as usize;
        match state.perp_markets[i].perp_type {
            PerpType::Future => {
                price[i + MAX_COLLATERALS] =
                    get_oracle(cache, &state.perp_markets[i].oracle_symbol)
                        .unwrap()
                        .price
                        .into();
            }
            PerpType::Square => {
                price[i + MAX_COLLATERALS] = cache.marks[i].price.into();
            }
            _ => {
                println!("Not implemented bruh");
            }
        }
    }

    price
}

pub fn get_pnl_vectors(
    control: &Control,
    state: &State,
    cache: &Cache,
    funding_cache: &[I80F48; MAX_MARKETS], // In smol for the asset
) -> (
    [I80F48; MAX_COLLATERALS + MAX_MARKETS],
    [I80F48; MAX_COLLATERALS + MAX_MARKETS],
) {
    let mut unrealized_pnls = [I80F48::ZERO; MAX_COLLATERALS + MAX_MARKETS];
    let mut realized_pnls = [I80F48::ZERO; MAX_COLLATERALS + MAX_MARKETS];

    for (i, &info) in control.open_orders_agg.iter().enumerate() {
        if info.pos_size == 0 {
            continue;
        }
        // Realized pnl calcs
        let funding_diff = I80F48::from_num(info.funding_index).unwrapped_sub(funding_cache[i]);
        let unrealized_funding = safe_mul_i80f48(funding_diff, I80F48::from_num(info.pos_size))
            .unwrapped_div(I80F48::from_num(
                10u64.pow(state.perp_markets[i].asset_decimals as u32),
            )); // In smol asset

        // Unrealized pnl calcs
        let price = match state.perp_markets[i].perp_type {
            PerpType::Future => get_oracle(cache, &state.perp_markets[i].oracle_symbol)
                .unwrap()
                .price
                .into(),
            PerpType::Square => cache.marks[i].price.into(),
            _ => {
                println!("Not implemented bruh");
                I80F48::ZERO
            }
        };

        let unrealized_pnl = safe_mul_i80f48(I80F48::from_num(info.pos_size), price)
            .unwrapped_add(I80F48::from_num(info.native_pc_total));

        unrealized_pnls[i + MAX_COLLATERALS] = unrealized_pnl;

        realized_pnls[i + MAX_COLLATERALS] =
            unrealized_funding + I80F48::from_num(info.realized_pnl);
    }
    (realized_pnls, unrealized_pnls)
}

pub fn get_base_weight_vector(state: &State) -> [I80F48; MAX_COLLATERALS + MAX_MARKETS] {
    let mut weight = [I80F48::ZERO; MAX_COLLATERALS + MAX_MARKETS];

    for i in 0..state.total_collaterals as usize {
        weight[i] =
            I80F48::from_num(state.collaterals[i].weight).unwrapped_div(I80F48::from_num(1000u32));
    }

    for i in 0..state.total_markets as usize {
        weight[i + MAX_COLLATERALS] = I80F48::from_num(state.perp_markets[i].base_imf)
            .unwrapped_div(I80F48::from_num(1000u32));
    }
    weight
}


const SPOT_IMF: I80F48 = fixed!(1.1: I80F48);
const SPOT_MMF: I80F48 = fixed!(1.03: I80F48);

fn weight_conversion(
    return_type: MfReturnOption,
    position: &I80F48,
    base_weight: &I80F48,
    is_spot: bool,
) -> I80F48 {
    match return_type {
        MfReturnOption::Mf | MfReturnOption::Omf => {
            if is_spot && !position.is_negative() {
                base_weight.clone()
            } else if is_spot {
                I80F48::ONE
            } else {
                I80F48::ZERO
            }
        }
        MfReturnOption::Imf => {
            if is_spot && !position.is_negative() {
                I80F48::ZERO
            } else if is_spot {
                -SPOT_IMF
                    .unwrapped_div(base_weight.clone())
                    .unwrapped_sub(I80F48::ONE)
            } else {
                let sign = if position.is_negative() { -1 } else { 1 };

                sign * base_weight.clone()
            }
        }
        MfReturnOption::Cmf => {
            if is_spot && !position.is_negative() {
                I80F48::ZERO
            } else if is_spot {
                -SPOT_IMF
                    .unwrapped_div(base_weight.clone())
                    .unwrapped_sub(I80F48::ONE)
            } else {
                let sign = if position.is_negative() { -1 } else { 1 };

                sign * safe_mul_i80f48(
                    I80F48::from_str_binary("0.101").unwrap(),
                    base_weight.clone(),
                )
            }
        }
        MfReturnOption::Mmf => {
            if is_spot && !position.is_negative() {
                I80F48::ZERO
            } else if is_spot {
                -SPOT_MMF
                    .unwrapped_div(base_weight.clone())
                    .unwrapped_sub(I80F48::ONE)
            } else {
                let sign = if position.is_negative() { -1 } else { 1 };

                sign * safe_mul_i80f48(I80F48::from_str_binary("0.1").unwrap(), base_weight.clone())
            }
        }
    }
}

fn get_mf(
    mf: MfReturnOption,
    position: &[I80F48; MAX_COLLATERALS + MAX_MARKETS],
    prices: &[I80F48; MAX_COLLATERALS + MAX_MARKETS],
    realized_pnl: &[I80F48; MAX_COLLATERALS + MAX_MARKETS],
    unrealized_pnl: &[I80F48; MAX_COLLATERALS + MAX_MARKETS],
    base_weight: &[I80F48; MAX_COLLATERALS + MAX_MARKETS],
) -> I80F48 {
    let mut mf_value = I80F48::ZERO;

    let total_realized_pnl: I80F48 = realized_pnl.iter().sum();
    let total_unrealized_pnl: I80F48 = unrealized_pnl.iter().sum();

    for i in 0..(MAX_COLLATERALS + MAX_MARKETS) {
        let weight = weight_conversion(mf, &position[i], &base_weight[i], i < MAX_COLLATERALS);
        let weighted_price = safe_mul_i80f48(prices[i], weight);

        if i == 0 {
            mf_value = safe_add_i80f48(
                mf_value,
                safe_mul_i80f48(total_realized_pnl, weight), // Already in big at t=T
            );
        }

        mf_value = safe_add_i80f48(mf_value, safe_mul_i80f48(position[i], weighted_price));
    }
    let pos_unrealized = match mf {
        MfReturnOption::Mf => total_unrealized_pnl,
        MfReturnOption::Omf => total_unrealized_pnl.min(I80F48::ZERO),
        _ => I80F48::ZERO,
    };

    mf_value + pos_unrealized
}

pub fn get_mf_wrapped(
    mf: MfReturnOption,
    margin: &Margin,
    control: &Control,
    state: &State,
    cache: &Cache,
) -> I80F48 {
    let position_vector = match mf {
        MfReturnOption::Imf => get_position_open_vector(margin, control),
        MfReturnOption::Cmf => get_position_open_vector(margin, control),
        _ => get_position_vector(margin, control),
    };

    let price_vector = get_price_vector(state, cache, &position_vector);

    let weight_vector = get_base_weight_vector(state);

    let funding_cache: [I80F48; MAX_MARKETS] = { cache.funding_cache }
        .iter()
        .map(|x| I80F48::from_num(*x)) //  i128 to I80 might not be ideal.
        // Think if dividing here instead of in pnl and using pos_size in pnl
        .collect::<Vec<I80F48>>()
        .try_into()
        .unwrap(); // This is a bruh moment

    let (realized_pnl, unrealized_pnl) = get_pnl_vectors(control, state, cache, &funding_cache);

    get_mf(
        mf,
        &position_vector,
        &price_vector,
        &realized_pnl,
        &unrealized_pnl,
        &weight_vector,
    )
}
