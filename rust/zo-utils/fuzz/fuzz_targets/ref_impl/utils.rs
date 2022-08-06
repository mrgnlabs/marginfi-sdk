use zo_abi::{Cache, OracleCache, Symbol};

fn get_oracle_index(cache: &Cache, s: &Symbol) -> Option<usize> {
    if s.is_nil() {
        return None;
    }

    (&cache.oracles).binary_search_by_key(s, |&x| x.symbol).ok()
}

pub fn get_oracle<'a>(cache: &'a Cache, s: &Symbol) -> Option<&'a OracleCache> {
    Some(&cache.oracles[get_oracle_index(cache, s)?])
}
