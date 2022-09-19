use anchor_lang::prelude::Pubkey;
use anyhow::Result;
use mango_protocol::state::{
    HealthCache, MangoAccount, MangoCache, MangoGroup, UserActiveAssets, MAX_TOKENS,
};
use marginfi::{
    constants::{MANGO_UTP_INDEX, ZO_UTP_INDEX},
    prelude::MarginfiAccount,
    state::{
        mango_state,
        marginfi_account::UTPAccountConfig,
        utp_observation::{Observable, Observer},
        zo_state::{self, ZO_STATE_ADDRESS_INDEX},
    },
};
use solana_client::nonblocking::rpc_client::RpcClient;

#[derive(Default, Clone)]
pub struct ClientObserver {
    pub mango_observer: Option<MangoObserver>,
    pub zo_observer: Option<ZoObserver>,
}

use crate::utils::{fetch_anchor, fetch_mango};

impl ClientObserver {
    pub fn new(mango_observer: Option<MangoObserver>, zo_observer: Option<ZoObserver>) -> Self {
        Self {
            mango_observer,
            zo_observer,
        }
    }

    pub async fn load(rpc_client: &RpcClient, mfi_account: &MarginfiAccount) -> Result<Self> {
        let mut observer = Self::default();

        if mfi_account.active_utps[MANGO_UTP_INDEX] {
            observer
                .load_mango_observer(rpc_client, &mfi_account.utp_account_config[MANGO_UTP_INDEX])
                .await?;
        }

        if mfi_account.active_utps[ZO_UTP_INDEX] {
            observer
                .load_zo_observer(rpc_client, &mfi_account.utp_account_config[ZO_UTP_INDEX])
                .await?;
        }

        Ok(observer)
    }

    pub async fn load_mango_observer(
        &mut self,
        rpc_client: &RpcClient,
        utp_config: &UTPAccountConfig,
    ) -> Result<()> {
        let mango_account_address = utp_config.address;
        let mango_account = fetch_mango::<MangoAccount>(rpc_client, &mango_account_address).await?;
        let mango_group = fetch_mango::<MangoGroup>(rpc_client, &mango_account.mango_group).await?;
        let mango_cache = fetch_mango::<MangoCache>(rpc_client, &mango_group.mango_cache).await?;

        self.mango_observer = Some(MangoObserver::new(
            mango_account_address,
            mango_account.mango_group,
            mango_group.mango_cache,
            mango_account,
            mango_group,
            mango_cache,
        ));

        Ok(())
    }

    pub async fn load_zo_observer(
        &mut self,
        rpc_client: &RpcClient,
        utp_config: &UTPAccountConfig,
    ) -> Result<()> {
        let zo_margin = fetch_anchor::<zo_abi::Margin>(rpc_client, &utp_config.address).await?;
        let zo_control = fetch_anchor::<zo_abi::Control>(rpc_client, &zo_margin.control).await?;
        let zo_state = fetch_anchor::<zo_abi::State>(
            rpc_client,
            &utp_config.utp_address_book[ZO_STATE_ADDRESS_INDEX],
        )
        .await?;
        let zo_cache = fetch_anchor::<zo_abi::Cache>(rpc_client, &zo_state.cache).await?;

        let zo_margin_pk = utp_config.address;
        let zo_control_pk = zo_margin.control;
        let zo_state_pk = utp_config.utp_address_book[ZO_STATE_ADDRESS_INDEX];
        let zo_cache_pk = zo_state.cache;

        self.zo_observer = Some(ZoObserver::new(
            zo_margin_pk,
            zo_control_pk,
            zo_state_pk,
            zo_cache_pk,
            zo_margin,
            zo_control,
            zo_state,
            zo_cache,
        ));

        Ok(())
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
            .map(|ui| self.observation(marginfi_account, ui).unwrap())
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
pub struct MangoObserver {
    pub mango_account_pk: Pubkey,
    pub mango_group_pk: Pubkey,
    pub mango_cache_pk: Pubkey,

    pub mango_account: MangoAccount,
    pub mango_group: MangoGroup,
    pub mango_cache: MangoCache,
}

impl MangoObserver {
    pub fn new(
        mango_account_pk: Pubkey,
        mango_group_pk: Pubkey,
        mango_cache_pk: Pubkey,

        mango_account: MangoAccount,
        mango_group: MangoGroup,
        mango_cache: MangoCache,
    ) -> Self {
        Self {
            mango_account_pk,
            mango_group_pk,
            mango_cache_pk,

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
                &[None; MAX_TOKENS],
            )
            .unwrap();

        health_cache
    }

    pub fn get_observation_accounts(&self) -> Vec<Pubkey> {
        vec![
            self.mango_account_pk,
            self.mango_group_pk,
            self.mango_cache_pk,
        ]
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

    fn get_max_rebalance_deposit_amount(
        &self,
    ) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        let mut health_cache = self.get_health_cache();
        mango_state::get_max_rebalance_deposit_amount(&mut health_cache, &self.mango_group)
    }
}

#[derive(Clone, Copy)]
pub struct ZoObserver {
    pub margin_pk: Pubkey,
    pub control_pk: Pubkey,
    pub state_pk: Pubkey,
    pub cache_pk: Pubkey,

    pub margin: zo_abi::Margin,
    pub control: zo_abi::Control,
    pub state: zo_abi::State,
    pub cache: zo_abi::Cache,
}

impl ZoObserver {
    pub fn new(
        margin_pk: Pubkey,
        control_pk: Pubkey,
        state_pk: Pubkey,
        cache_pk: Pubkey,

        margin: zo_abi::Margin,
        control: zo_abi::Control,
        state: zo_abi::State,
        cache: zo_abi::Cache,
    ) -> Self {
        Self {
            margin_pk,
            control_pk,
            state_pk,
            cache_pk,

            margin,
            control,
            state,
            cache,
        }
    }

    pub fn get_observation_accounts(&self) -> Vec<Pubkey> {
        vec![
            self.margin_pk,
            self.control_pk,
            self.state_pk,
            self.cache_pk,
        ]
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

    fn get_max_rebalance_deposit_amount(
        &self,
    ) -> marginfi::prelude::MarginfiResult<fixed::types::I80F48> {
        zo_state::get_max_rebalance_deposit_amount(
            &self.margin,
            &self.control,
            &self.state,
            &self.cache,
        )
    }
}
