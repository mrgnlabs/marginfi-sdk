use fixed::types::I80F48;
use fixed_macro::{fixed, types::I80F48};
use std::{
    cmp::{max, min},
    ops::{Div, Mul, Neg, Sub},
};
use zo_abi::{Cache, Control, Margin, OpenOrdersInfo, OracleCache, PerpType, State, Symbol};

const I80F48_ZERO: I80F48 = fixed!(0: I80F48);
const I80F48_ONE: I80F48 = fixed!(1: I80F48);

#[derive(Clone, Copy)]
#[cfg_attr(fuzzing, derive(Debug))]
pub enum MfReturnOption {
    Mf,
    Imf,
    Mmf,
    Omf,
    Cmf,
}

fn get_oracle_index(cache: &Cache, s: &Symbol) -> Option<usize> {
    if s.is_nil() {
        return None;
    }

    cache.oracles.binary_search_by_key(s, |&x| x.symbol).ok()
}

fn get_oracle<'a>(cache: &'a Cache, s: &Symbol) -> Option<&'a OracleCache> {
    Some(&cache.oracles[get_oracle_index(cache, s)?])
}

fn get_price_collateral(
    position: &I80F48,
    state: &State,
    cache: &Cache,
    i: usize,
) -> Option<I80F48> {
    let adjustment: I80F48 = if position.is_negative() {
        cache.borrow_cache[i].borrow_multiplier.into()
    } else {
        cache.borrow_cache[i].supply_multiplier.into()
    };

    let unadjusted_price = I80F48::from(
        get_oracle(cache, &state.collaterals[i].oracle_symbol)
            .unwrap()
            .price,
    );

    unadjusted_price.checked_mul(adjustment)
}

fn get_price_market(state: &State, cache: &Cache, i: usize) -> I80F48 {
    match state.perp_markets[i].perp_type {
        PerpType::Future => get_oracle(cache, &state.perp_markets[i].oracle_symbol)
            .unwrap()
            .price
            .into(),
        PerpType::Square => cache.marks[i].price.into(),
        _ => {
            println!("Not implemented bruh");
            I80F48_ZERO
        }
    }
}

const I80F48_1000: I80F48 = I80F48!(1000);

const INV_1000: I80F48 = I80F48!(0.001);
const INV_0500: I80F48 = I80F48!(0.0005);
const INV_0625: I80F48 = I80F48!(0.000625);

fn get_weight_market(
    mf: MfReturnOption,
    position: &I80F48,
    state: &State,
    i: usize,
) -> Option<I80F48> {
    let neg_sign = position.is_negative();

    if matches!(mf, MfReturnOption::Mf | MfReturnOption::Omf) {
        return Some(I80F48_ZERO);
    }

    let base_weight = I80F48::from_num(state.perp_markets[i].base_imf);

    let weight = match mf {
        MfReturnOption::Imf => base_weight.mul(INV_1000),
        MfReturnOption::Mmf => base_weight.mul(INV_0500),
        MfReturnOption::Cmf => base_weight.mul(INV_0625),
        _ => unreachable!(),
    };

    Some(if neg_sign { weight.neg() } else { weight })
}

const SPOT_IMF: I80F48 = fixed!(1100: I80F48);
const SPOT_MMF: I80F48 = fixed!(1030: I80F48);

fn get_weight_collateral(
    mf: MfReturnOption,
    position: &I80F48,
    state: &State,
    i: usize,
) -> Option<I80F48> {
    let position_positive = !position.is_negative();

    if position_positive && !matches!(mf, MfReturnOption::Mf | MfReturnOption::Omf) {
        return Some(I80F48_ZERO);
    }

    Some(match mf {
        MfReturnOption::Mf | MfReturnOption::Omf => {
            if position_positive {
                I80F48::from_num(state.collaterals[i].weight).mul(INV_1000)
            } else {
                I80F48_ONE
            }
        }
        MfReturnOption::Mmf => -SPOT_MMF
            .checked_div(I80F48::from_num(state.collaterals[i].weight))?
            .sub(I80F48_ONE),
        MfReturnOption::Imf | MfReturnOption::Cmf => -SPOT_IMF
            .checked_div(I80F48::from_num(state.collaterals[i].weight))?
            .sub(I80F48_ONE),
    })
}

fn calc_unrealized_pnl(info: &OpenOrdersInfo, price: I80F48, pos_size: I80F48) -> Option<I80F48> {
    pos_size
        .checked_mul(price)?
        .checked_add(info.native_pc_total.into())
}

const I80F48_POWERS_OF_TEN: [I80F48; 15] = [
    I80F48!(1),
    I80F48!(10),
    I80F48!(100),
    I80F48!(1_000),
    I80F48!(10_000),
    I80F48!(100_000),
    I80F48!(1_000_000),
    I80F48!(10_000_000),
    I80F48!(100_000_000),
    I80F48!(1_000_000_000),
    I80F48!(10_000_000_000),
    I80F48!(100_000_000_000),
    I80F48!(1_000_000_000_000),
    I80F48!(10_000_000_000_000),
    I80F48!(100_000_000_000_000),
];

fn calc_realized_pnl(
    info: &OpenOrdersInfo,
    cache: &Cache,
    state: &State,
    position: I80F48,
    i: usize,
) -> Option<I80F48> {
    let funding_diff = I80F48::from_num(info.funding_index)
        .checked_sub(I80F48::from_num({ cache.funding_cache }[i]))?;

    if funding_diff.is_zero() {
        return Some(info.realized_pnl.into());
    }

    let unrealized_funding = funding_diff
        .checked_mul(position)?
        .checked_div(I80F48_POWERS_OF_TEN[state.perp_markets[i].asset_decimals as usize])?;

    unrealized_funding.checked_add(info.realized_pnl.into())
}

pub fn get_mf(
    mf: MfReturnOption,
    margin: &Margin,
    control: &Control,
    state: &State,
    cache: &Cache,
) -> Option<I80F48> {
    let mut mf_value = I80F48_ZERO;

    let mut unrealized_pnl = I80F48_ZERO;
    let mut realized_pnl = I80F48_ZERO;

    for i in 0..(state.total_markets as usize) {
        let info = control.open_orders_agg[i];
        if info.pos_size == 0 && info.coin_on_asks == 0 && info.coin_on_bids == 0 {
            continue;
        }
        let price = get_price_market(state, cache, i);
        let position = I80F48::from(info.pos_size);

        if info.pos_size != 0 {
            unrealized_pnl =
                unrealized_pnl.checked_add(calc_unrealized_pnl(&info, price, position)?)?;
            realized_pnl =
                realized_pnl.checked_add(calc_realized_pnl(&info, cache, state, position, i)?)?
        }

        let position = {
            let position = I80F48::from(info.pos_size);

            match mf {
                MfReturnOption::Imf | MfReturnOption::Cmf => max(
                    position.checked_add(info.coin_on_bids.into())?.abs(),
                    position.checked_sub(info.coin_on_asks.into())?.abs(),
                ),
                _ => position,
            }
        };

        let weight = get_weight_market(mf, &position, state, i)?;

        if weight.is_zero() {
            continue;
        }

        let weighted_price = price.checked_mul(weight)?;

        mf_value = mf_value.checked_add(position.checked_mul(weighted_price)?)?;
    }

    for i in 0..(state.total_collaterals as usize) {
        if margin.collateral[i].data == 0 && (i != 0 || realized_pnl.is_zero()) {
            continue;
        }

        let position = I80F48::from(margin.collateral[i]);
        let weight = get_weight_collateral(mf, &position, state, i)?;

        if weight.is_zero() {
            continue;
        }

        if i == 0 {
            mf_value = mf_value.checked_add(realized_pnl.checked_mul(weight)?)?;

            if position.is_zero() {
                continue;
            }
        }

        let price = get_price_collateral(&position, state, cache, i)?;
        let weighted_price_mf_omf = price.checked_mul(weight)?;

        mf_value = mf_value.checked_add(position.checked_mul(weighted_price_mf_omf)?)?;
    }

    if matches!(mf, MfReturnOption::Mf) {
        mf_value = mf_value.checked_add(unrealized_pnl)?;
    }

    if matches!(mf, MfReturnOption::Omf) {
        mf_value = mf_value.checked_add(min(unrealized_pnl, I80F48_ZERO))?;
    }

    Some(mf_value)
}

pub fn get_net_free_collateral(
    margin: &Margin,
    control: &Control,
    state: &State,
    cache: &Cache,
) -> Option<I80F48> {
    let mut equity = I80F48_ZERO;

    let mut unrealized_pnl = I80F48_ZERO;
    let mut realized_pnl = I80F48_ZERO;

    let mut margin_requirement = I80F48_ZERO;
    for i in 0..(state.total_markets as usize) {
        let info = control.open_orders_agg[i];

        if info.pos_size == 0 && info.coin_on_asks == 0 && info.coin_on_bids == 0 {
            continue;
        }

        let price = get_price_market(state, cache, i);
        let position = I80F48::from(info.pos_size);

        if info.pos_size != 0 {
            unrealized_pnl =
                unrealized_pnl.checked_add(calc_unrealized_pnl(&info, price, position)?)?;
            realized_pnl =
                realized_pnl.checked_add(calc_realized_pnl(&info, cache, state, position, i)?)?
        }

        let imf_position = max(
            position.checked_add(info.coin_on_bids.into())?.abs(),
            position.checked_sub(info.coin_on_asks.into())?.abs(),
        );

        let imf_weight = get_weight_market(MfReturnOption::Imf, &imf_position, state, i)?;

        let position_margin_req = price.checked_mul(imf_weight)?;
        margin_requirement =
            margin_requirement.checked_add(imf_position.checked_mul(position_margin_req)?)?;
    }

    for i in 0..(state.total_collaterals as usize) {
        if margin.collateral[i].data == 0 && (i != 0 || realized_pnl.is_zero()) {
            continue;
        }

        let position = I80F48::from(margin.collateral[i]);
        let base_weight = I80F48::from_num(state.collaterals[i].weight).div(I80F48_1000);

        if !position.is_negative() {
            // Maybe jump to next collateral if position is zero?
            if i == 0 {
                equity = equity.checked_add(realized_pnl.checked_mul(base_weight)?)?;
            }

            let price = get_price_collateral(&position, state, cache, i)?;
            let weighted_price_omf = price.checked_mul(base_weight)?;
            equity = equity.checked_add(position.checked_mul(weighted_price_omf)?)?;
        } else {
            let imf_weight = get_weight_collateral(MfReturnOption::Imf, &position, state, i)?;

            if i == 0 {
                equity = equity.checked_add(realized_pnl)?;

                margin_requirement =
                    margin_requirement.checked_add(realized_pnl.checked_mul(imf_weight)?)?;
            }
            let price = get_price_collateral(&position, state, cache, i)?;
            let weighted_price_imf = price.checked_mul(imf_weight)?;

            equity = equity.checked_add(position.checked_mul(price)?)?;

            margin_requirement =
                margin_requirement.checked_add(position.checked_mul(weighted_price_imf)?)?;
        }
    }

    equity = equity.checked_add(min(unrealized_pnl, I80F48_ZERO))?;
    equity = equity.checked_sub(margin_requirement)?;

    Some(equity)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::read;

    #[test]
    fn success_1() {
        let zo_margin_data = read("../test-data/zo_margin-2").unwrap();
        let zo_control_data = read("../test-data/zo_control-2").unwrap();
        let zo_state_data = read("../test-data/zo_state-2").unwrap();
        let zo_cache_data = read("../test-data/zo_cache-2").unwrap();

        let margin: &zo_abi::Margin =
            bytemuck::from_bytes::<zo_abi::Margin>(&zo_margin_data.as_slice()[8..]);
        let control: &zo_abi::Control =
            bytemuck::from_bytes::<zo_abi::Control>(&zo_control_data.as_slice()[8..]);
        let state: &zo_abi::State =
            bytemuck::from_bytes::<zo_abi::State>(&zo_state_data.as_slice()[8..]);
        let cache: &zo_abi::Cache =
            bytemuck::from_bytes::<zo_abi::Cache>(&zo_cache_data.as_slice()[8..]);
        let (mf_value, imf_value, mmf_value, omf_value, cmf_value) = (
            get_mf(MfReturnOption::Mf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Imf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Mmf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Omf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Cmf, margin, control, state, cache).unwrap(),
        );

        assert_eq!(mf_value, fixed!(45400195254.452856067750822: I80F48));
        assert_eq!(imf_value, fixed!(7035481.708697723532886: I80F48));
        assert_eq!(mmf_value, fixed!(4573063.110653464057506: I80F48));
        assert_eq!(omf_value, fixed!(45400195254.452856067750822: I80F48));
        assert_eq!(cmf_value, fixed!(7035481.708697723532886: I80F48));

        let fc = get_net_free_collateral(margin, control, state, cache).unwrap();
        assert_eq!(fc, fixed!(45393159772.68863455210041: I80F48));
    }

    #[test]
    fn success_2() {
        let zo_margin_data =
            read("../test-data/H7GZdkVKz99Cug7jCCEDbPZ3vWWSkkuih7GafNfkHWT6/zoMargin").unwrap();
        let zo_control_data =
            read("../test-data/H7GZdkVKz99Cug7jCCEDbPZ3vWWSkkuih7GafNfkHWT6/zoControl").unwrap();
        let zo_state_data =
            read("../test-data/H7GZdkVKz99Cug7jCCEDbPZ3vWWSkkuih7GafNfkHWT6/zoState").unwrap();
        let zo_cache_data =
            read("../test-data/H7GZdkVKz99Cug7jCCEDbPZ3vWWSkkuih7GafNfkHWT6/zoCache").unwrap();

        let margin: &zo_abi::Margin =
            bytemuck::from_bytes::<zo_abi::Margin>(&zo_margin_data.as_slice()[8..]);
        let control: &zo_abi::Control =
            bytemuck::from_bytes::<zo_abi::Control>(&zo_control_data.as_slice()[8..]);
        let state: &zo_abi::State =
            bytemuck::from_bytes::<zo_abi::State>(&zo_state_data.as_slice()[8..]);
        let cache: &zo_abi::Cache =
            bytemuck::from_bytes::<zo_abi::Cache>(&zo_cache_data.as_slice()[8..]);

        let (mf_value, imf_value, mmf_value, omf_value, cmf_value) = (
            get_mf(MfReturnOption::Mf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Imf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Mmf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Omf, margin, control, state, cache).unwrap(),
            get_mf(MfReturnOption::Cmf, margin, control, state, cache).unwrap(),
        );

        let fc = get_net_free_collateral(margin, control, state, cache).unwrap();

        assert_eq!(mf_value, fixed!(83402791.718188989947222: I80F48));
        assert_eq!(imf_value, fixed!(10216544.803199130565392: I80F48));
        assert_eq!(mmf_value, fixed!(5109759.402492717495246: I80F48));
        assert_eq!(omf_value, fixed!(80074390.04542256130746: I80F48));
        assert_eq!(cmf_value, fixed!(6382552.375285145411528: I80F48));
        assert_eq!(fc, fixed!(69857845.242125660013027: I80F48));
    }
}
