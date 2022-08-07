#![no_main]

mod ref_impl;

use anchor_lang::prelude::*;
use arbitrary::Arbitrary;
use fixed::types::I80F48;
use libfuzzer_sys::fuzz_target;
use ref_impl::*;
use std::cmp::max;
use std::fs::read;
use std::ops::{Div, Mul};
use zo_abi::{Cache, Control, Margin, OpenOrdersInfo, State, TwapInfo, WrappedI80F48};

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct DummyOpenOrdersInfo {
    pub native_pc_total: i8,
    pub pos_size: i8,
    pub realized_pnl: i8,
    pub coin_on_bids: u8,
    pub coin_on_asks: u8,
    pub order_count: u8,
    pub funding_index: i8,
}

impl From<DummyOpenOrdersInfo> for OpenOrdersInfo {
    fn from(doo: DummyOpenOrdersInfo) -> Self {
        Self {
            key: Pubkey::default(),
            native_pc_total: doo.native_pc_total as i64,
            pos_size: doo.pos_size as i64,
            realized_pnl: doo.realized_pnl as i64,
            coin_on_bids: doo.coin_on_bids as u64,
            coin_on_asks: doo.coin_on_asks as u64,
            order_count: doo.order_count as u8,
            funding_index: doo.funding_index as i128,
        }
    }
}

const MAX_COLLATERALS: usize = 5;
const MAX_MARKETS: usize = 4;

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct DummyState {
    pub insurance: u8, // in smol usd

    /// Fees accrued through borrow lending
    pub collaterals: [CollateralInfo; MAX_COLLATERALS],
    pub perp_markets: [PerpMarketInfo; MAX_MARKETS],
    // pub total_collaterals: u16,
    // pub total_markets: u16,

    // pub _padding: [u8; 1280],
}

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct CollateralInfo {
    // pub mint: Pubkey,
    // pub oracle_symbol: Symbol,
    // pub decimals: u8,
    pub weight: u8, //  in permil
                    // pub liq_fee: u8, // in permil

                    // borrow lending info
                    // pub is_borrowable: bool,
                    // pub optimal_util: u16, // in permil
                    // pub optimal_rate: u16, // in permil
                    // pub max_rate: u16, // in permil
                    // pub og_fee: u16, // in bps

                    // swap info
                    // pub is_swappable: bool,
                    // pub serum_open_orders: Pubkey,

                    // pub max_deposit: u64,    // in smol
                    // pub dust_threshold: u16, // in smol

                    // pub _padding: [u8; 384],
}

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct PerpMarketInfo {
    // info
    // pub symbol: Symbol, // Convention ex: "BTC-EVER-C" or "BTC-PERP"
    // pub oracle_symbol: Symbol,
    // pub perp_type: PerpType,
    // settings
    // pub asset_decimals: u8,
    // pub asset_lot_size: u64,
    // pub quote_lot_size: u64,
    // pub strike: u8, // in smolUSD per bigAsset
    pub base_imf: u8, // in permil (i.e. 1% <=> 10 permil)
                      // pub liq_fee: u8, // in permil
}
#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct DummyCache {
    pub oracles: [OracleCache; MAX_COLLATERALS],
    /// Mapped to `State.perp_markets`
    pub marks: [MarkCache; MAX_MARKETS],
    pub funding_cache: [i8; MAX_MARKETS], // long to short
    /// Mapped to 'State.collaterals'
    pub borrow_cache: [BorrowCache; MAX_COLLATERALS],
}

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct OracleCache {
    // pub symbol: Symbol,
    // pub sources: [OracleSource; MAX_ORACLE_SOURCES],
    // pub last_updated: u64,
    pub price: u8, // smol quote per smol asset
    pub twap: u8,
    // pub base_decimals: u8, // actual decimal of the mint
    // pub quote_decimals: u8,
}

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct MarkCache {
    pub price: u8, // smol usd per smol asset
    /// Hourly twap sampled every 5min.
    pub twap: DTwapInfo,
}

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct DTwapInfo {
    pub cumul_avg: u8,
    pub open: u8,
    pub high: u8,
    pub low: u8,
    pub close: u8,
    pub last_sample_start_time: u8,
}

impl From<DTwapInfo> for TwapInfo {
    fn from(dt: DTwapInfo) -> TwapInfo {
        Self {
            cumul_avg: towfixed(dt.cumul_avg),
            open: towfixed(dt.open),
            high: towfixed(dt.high),
            low: towfixed(dt.low),
            close: towfixed(dt.close),
            last_sample_start_time: dt.last_sample_start_time.into(),
        }
    }
}

#[derive(Clone, Copy, Debug, Arbitrary)]
pub struct BorrowCache {
    pub supply: u8,            // in smol
    pub borrows: u8,           // in smol
    pub supply_multiplier: u8, // earned interest per asset supplied
    pub borrow_multiplier: u8, // earned interest per asset borrowed
    pub last_updated: u8,
}

#[derive(Clone, Debug, Arbitrary)]
pub struct FuzzInputs {
    // Margin
    pub collaterals: [i8; MAX_COLLATERALS],

    // Control
    pub open_orders: [DummyOpenOrdersInfo; MAX_MARKETS],

    // State
    // pub state_collaterals_weights: [u8; MAX_COLLATERALS + MAX_MARKETS],
    pub state: DummyState,

    pub cache: DummyCache,
}

fn towfixed<G>(n: G) -> WrappedI80F48
where
    G: Into<i128>,
{
    WrappedI80F48 { data: n.into() }
}

fuzz_target!(|inputs: FuzzInputs| {
    // -------- Load baseline accounts
    let (mut margin, mut control, mut state, mut cache) = load();

    // -------- Modify baseline account with random inputs
    // Set collateral amounts
    for collateral_index in 0..state.total_collaterals as usize {
        margin.collateral[collateral_index] = WrappedI80F48 {
            data: inputs.collaterals[collateral_index].into(),
        };
    }

    // Control
    for i in 0..state.total_markets as usize {
        control.open_orders_agg[i] = inputs.open_orders[i].into()
    }

    // Set asset weights (collaterals & markets)
    for collateral_index in 0..state.total_collaterals as usize {
        state.collaterals[collateral_index].weight =
            1 + inputs.state.collaterals[collateral_index].weight as u16;
    }
    for market_index in 0..state.total_markets as usize {
        state.perp_markets[market_index].base_imf =
            1 + inputs.state.perp_markets[market_index].base_imf as u16;
        state.perp_markets[market_index].asset_decimals = 6;
    }

    // Cache
    for i in 0..MAX_COLLATERALS {
        cache.oracles[i].price = WrappedI80F48 {
            data: inputs.cache.oracles[i].price.into(),
        };
        cache.oracles[i].twap = WrappedI80F48 {
            data: inputs.cache.oracles[i].twap.into(),
        };

        cache.borrow_cache[i].supply = WrappedI80F48 {
            data: inputs.cache.borrow_cache[i].supply.into(),
        };

        cache.borrow_cache[i].borrows = WrappedI80F48 {
            data: inputs.cache.borrow_cache[i].borrows.into(),
        };

        cache.borrow_cache[i].supply_multiplier = WrappedI80F48 {
            data: inputs.cache.borrow_cache[i].supply_multiplier.into(),
        };

        cache.borrow_cache[i].borrow_multiplier = WrappedI80F48 {
            data: inputs.cache.borrow_cache[i].borrow_multiplier.into(),
        };

        cache.borrow_cache[i].last_updated = inputs.cache.borrow_cache[i].last_updated.into();
    }

    for i in 0..MAX_MARKETS {
        cache.marks[i].price = WrappedI80F48 {
            data: inputs.cache.marks[i].price.into(),
        };

        cache.marks[i].twap = inputs.cache.marks[i].twap.into();
        cache.funding_cache[i] = inputs.cache.funding_cache[i].into();
    }

    let (mf_value, imf_value, mmf_value, omf_value, cmf_value) = (
        zo_utils::get_mf(
            zo_utils::MfReturnOption::Mf,
            &margin,
            &control,
            &state,
            &cache,
        )
        .unwrap(),
        zo_utils::get_mf(
            zo_utils::MfReturnOption::Imf,
            &margin,
            &control,
            &state,
            &cache,
        )
        .unwrap(),
        zo_utils::get_mf(
            zo_utils::MfReturnOption::Mmf,
            &margin,
            &control,
            &state,
            &cache,
        )
        .unwrap(),
        zo_utils::get_mf(
            zo_utils::MfReturnOption::Omf,
            &margin,
            &control,
            &state,
            &cache,
        )
        .unwrap(),
        zo_utils::get_mf(
            zo_utils::MfReturnOption::Cmf,
            &margin,
            &control,
            &state,
            &cache,
        )
        .unwrap(),
    );

    compare_mf(
        zo_utils::MfReturnOption::Mf,
        &margin,
        &control,
        &state,
        &cache,
        mf_value,
    );

    compare_mf(
        zo_utils::MfReturnOption::Imf,
        &margin,
        &control,
        &state,
        &cache,
        imf_value,
    );

    compare_mf(
        zo_utils::MfReturnOption::Mmf,
        &margin,
        &control,
        &state,
        &cache,
        mmf_value,
    );

    compare_mf(
        zo_utils::MfReturnOption::Omf,
        &margin,
        &control,
        &state,
        &cache,
        omf_value,
    );

    compare_mf(
        zo_utils::MfReturnOption::Cmf,
        &margin,
        &control,
        &state,
        &cache,
        cmf_value,
    );

    let fc = zo_utils::get_fc(&margin, &control, &state, &cache).unwrap();
    let omf_cmp = get_mf_wrapped(MfReturnOption::Omf, &margin, &control, &state, &cache);
    let imf_cmp = get_mf_wrapped(MfReturnOption::Imf, &margin, &control, &state, &cache);

    assert_eq!(
        trim(fc),
        trim(omf_cmp - imf_cmp)
    );
});

fn load() -> (Margin, Control, State, Cache) {
    let zo_margin_data = read("../test-data/zo_margin-2").unwrap();
    let zo_control_data = read("../test-data/zo_control-2").unwrap();
    let zo_state_data = read("../test-data/zo_state-2").unwrap();
    let zo_cache_data = read("../test-data/zo_cache-2").unwrap();

    let margin: &Margin = bytemuck::from_bytes::<Margin>(&zo_margin_data.as_slice()[8..]);
    let control: &Control = bytemuck::from_bytes::<Control>(&zo_control_data.as_slice()[8..]);
    let state: &State = bytemuck::from_bytes::<State>(&zo_state_data.as_slice()[8..]);
    let cache: &Cache = bytemuck::from_bytes::<Cache>(&zo_cache_data.as_slice()[8..]);

    (*margin, *control, *state, *cache)
}

const PRECISION_CHECK: I80F48 = fixed_macro::types::I80F48!(1);

fn compare_mf(
    mf_type: zo_utils::MfReturnOption,
    margin: &Margin,
    control: &Control,
    state: &State,
    cache: &Cache,
    result: I80F48,
) {
    // Compute results via both custom and original methods
    let expected = get_mf_wrapped(mf_type.into(), &margin, &control, &state, &cache);

    // Assert results match
    assert_eq!(
        trim(result),
        trim(expected),
        "{:?}: {} <-> {}",
        mf_type,
        result,
        expected
    )
}

fn trim(n: I80F48) -> I80F48 {
    n.mul(PRECISION_CHECK).round_to_zero()
}
