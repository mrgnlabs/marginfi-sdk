use mango_protocol::state::{HealthCache, MangoAccount, MangoCache, MangoGroup, UserActiveAssets};
use marginfi::{
    constants::{MANGO_UTP_INDEX, ZO_UTP_INDEX},
    prelude::MarginfiAccount,
    state::{
        mango_state::{self, get_free_collateral, is_empty},
        marginfi_account::UTPAccountConfig,
        marginfi_group::Bank,
        utp_observation::{Observable, Observer},
        zo_state::{self, ZO_STATE_ADDRESS_INDEX},
    },
};
use solana_client::nonblocking::rpc_client::RpcClient;

#[derive(Default)]
struct ClientObserver {
    mango_observer: Option<MangoObserver>,
    zo_observer: Option<ZoObserver>,
}

use crate::utils::{fetch_anchor, fetch_mango};

impl ClientObserver {
    pub async fn new(rpc_client: &RpcClient, mfi_account: &MarginfiAccount) -> Self {
        let mut empty = Self::default();

        if mfi_account.active_utps[MANGO_UTP_INDEX] {
            empty
                .load_mango_observer(rpc_client, &mfi_account.utp_account_config[MANGO_UTP_INDEX])
                .await;
        }

        empty
    }

    pub async fn load_mango_observer(
        &mut self,
        rpc_client: &RpcClient,
        utp_config: &UTPAccountConfig,
    ) {
        let mango_account_address = utp_config.address;
        let mango_account = fetch_mango::<MangoAccount>(rpc_client, &mango_account_address).await;
        let mango_group = fetch_mango::<MangoGroup>(rpc_client, &mango_account.mango_group).await;
        let mango_cache = fetch_mango::<MangoCache>(rpc_client, &mango_group.mango_cache).await;

        self.mango_observer = Some(MangoObserver::new(mango_account, mango_group, mango_cache));
    }

    pub async fn load_zo_observer(
        &mut self,
        rpc_client: &RpcClient,
        utp_config: &UTPAccountConfig,
    ) {
        let zo_margin = fetch_anchor::<zo_abi::Margin>(rpc_client, &utp_config.address).await;
        let zo_control = fetch_anchor::<zo_abi::Control>(rpc_client, &zo_margin.control).await;
        let zo_state = fetch_anchor::<zo_abi::State>(
            rpc_client,
            &utp_config.utp_address_book[ZO_STATE_ADDRESS_INDEX],
        )
        .await;
        let zo_cache = fetch_anchor::<zo_abi::Cache>(rpc_client, &zo_state.cache).await;

        self.zo_observer = Some(ZoObserver::new(zo_margin, zo_control, zo_state, zo_cache));
    }
}

impl<'a> Observer<'a> for ClientObserver {
    fn observations(
        &self,
        marginfi_account: &marginfi::prelude::MarginfiAccount,
    ) -> marginfi::prelude::MarginfiResult<
        Vec<Box<dyn marginfi::state::utp_observation::Observable + 'a>>,
    > {
        Ok(marginfi_account
            .active_utps
            .iter()
            .enumerate()
            .filter_map(|(uindex, active)| if *active { Some(uindex) } else { None })
            .map(|ui| self.observation(&marginfi_account, ui).unwrap())
            .collect())
    }

    fn observation(
        &self,
        _marginfi_account: &marginfi::prelude::MarginfiAccount,
        utp_index: usize,
    ) -> marginfi::prelude::MarginfiResult<Box<dyn marginfi::state::utp_observation::Observable + 'a>>
    {
        Ok(match utp_index {
            MANGO_UTP_INDEX => Box::new(self.mango_observer.unwrap()),
            ZO_UTP_INDEX => Box::new(self.zo_observer.unwrap()),
            _ => panic!("Unknown UTP index"),
        })
    }
}

#[derive(Clone, Copy)]
struct MangoObserver {
    mango_account: MangoAccount,
    mango_group: MangoGroup,
    mango_cache: MangoCache,
}

impl MangoObserver {
    pub fn new(
        mango_account: MangoAccount,
        mango_group: MangoGroup,
        mango_cache: MangoCache,
    ) -> Self {
        Self {
            mango_account,
            mango_group,
            mango_cache,
        }
    }

    /// Create health cache
    pub fn get_health_cache(&self) -> HealthCache {
        let uaa = UserActiveAssets::new(&self.mango_group, &self.mango_account, vec![]);
        let mut health_cache = HealthCache::new(uaa);
        health_cache
            .init_vals_with_orders_vec::<&serum_dex::state::OpenOrders>(
                &self.mango_group,
                &self.mango_cache,
                &self.mango_account,
                &[],
            )
            .unwrap();

        health_cache
    }
}

impl Observable for MangoObserver {
    fn get_free_collateral(&self) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        let mut health_cache = self.get_health_cache();
        mango_state::get_free_collateral(&mut health_cache, &self.mango_group)
    }

    fn is_empty(&self) -> marginfi::prelude::MarginfiResult<bool> {
        let mut health_cache = self.get_health_cache();
        mango_state::is_empty(&mut health_cache, &self.mango_group)
    }

    fn is_rebalance_deposit_valid(&self) -> marginfi::prelude::MarginfiResult<bool> {
        let mut health_cache = self.get_health_cache();
        mango_state::is_rebalance_deposit_valid(&mut health_cache, &self.mango_group)
    }

    fn get_equity(&self) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        let mut health_cache = self.get_health_cache();
        mango_state::get_equity(&mut health_cache, &self.mango_group)
    }

    fn get_liquidation_value(&self) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        let mut health_cache = self.get_health_cache();
        mango_state::get_liquidation_value(&mut health_cache, &self.mango_group)
    }
}

#[derive(Clone, Copy)]
struct ZoObserver {
    margin: zo_abi::Margin,
    control: zo_abi::Control,
    state: zo_abi::State,
    cache: zo_abi::Cache,
}

impl ZoObserver {
    pub fn new(
        margin: zo_abi::Margin,
        control: zo_abi::Control,
        state: zo_abi::State,
        cache: zo_abi::Cache,
    ) -> Self {
        Self {
            margin,
            control,
            state,
            cache,
        }
    }
}

impl Observable for ZoObserver {
    fn get_free_collateral(&self) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        zo_state::get_free_collateral(&self.margin, &self.control, &self.state, &self.cache)
    }

    fn is_empty(&self) -> marginfi::prelude::MarginfiResult<bool> {
        zo_state::is_empty(&self.margin, &self.control, &self.state, &self.cache)
    }

    fn is_rebalance_deposit_valid(&self) -> marginfi::prelude::MarginfiResult<bool> {
        zo_state::is_rebalance_deposit_valid(&self.margin, &self.control, &self.state, &self.cache)
    }

    fn get_equity(&self) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        zo_state::get_equity(&self.margin, &self.control, &self.state, &self.cache)
    }

    fn get_liquidation_value(&self) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        zo_state::get_liquidation_value(&self.margin, &self.control, &self.state, &self.cache)
    }
}

fn test(mfia: MarginfiAccount, bank: Bank, co: ClientObserver) {
    let a = mfia.get_equity(
        &bank,
        marginfi::state::marginfi_account::EquityType::InitReqAdjusted,
        &co,
    );
}
