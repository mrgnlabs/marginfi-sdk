// bench.rs
#![feature(test)]

extern crate test;

use std::fs::read;
use test::Bencher;
use zo_abi::{Cache, Control, Margin, State};
use zo_utils::{get_mf, get_net_free_collateral};

// function to benchmark must be annotated with `#[bench]`
fn load() -> (Margin, Control, State, Cache) {
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

    (*margin, *control, *state, *cache)
}

#[bench]
fn get_free_collateral(b: &mut Bencher) {
    // exact code to benchmark must be passed as a closure to the iter
    // method of Bencher
    let (margin, control, state, cache) = &load();

    b.iter(|| get_net_free_collateral(margin, control, state, cache))
}

#[bench]
fn bench_mf(b: &mut Bencher) {
    // exact code to benchmark must be passed as a closure to the iter
    // method of Bencher
    let (margin, control, state, cache) = &load();

    b.iter(|| {
        get_mf(
            zo_utils::MfReturnOption::Omf,
            margin,
            control,
            state,
            cache,
        )
    })
}

#[bench]
fn bench_get_fc_old(b: &mut Bencher) {
    // exact code to benchmark must be passed as a closure to the iter
    // method of Bencher
    let (margin, control, state, cache) = &load();

    b.iter(|| {
        let omf = get_mf(
            zo_utils::MfReturnOption::Omf,
            margin,
            control,
            state,
            cache,
        )
        .unwrap();

        let imf = get_mf(
            zo_utils::MfReturnOption::Imf,
            margin,
            control,
            state,
            cache,
        )
        .unwrap();

        let _fc = omf.checked_sub(imf).unwrap();
    })
}
