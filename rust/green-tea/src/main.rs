use account_service::{AccountWithContext, RpcAccountService};
use anyhow::{anyhow, Result};
use bytemuck::Pod;
use fixed::types::I80F48;
use mango_common::Loadable;
use mango_protocol::state::{MangoAccount, MangoCache, MangoGroup};
use marginfi_sdk::{
    client::MarginClient,
    instructions::mango::mango_make_deposit_ix,
    marginfi::{
        constants::{MANGO_UTP_INDEX, MAX_UTPS, ZO_UTP_INDEX},
        prelude::MarginfiAccount,
        state::{
            marginfi_account::{EquityType, MarginRequirement},
            utp_observation::Observable,
            zo_state::ZO_STATE_ADDRESS_INDEX,
        },
    },
    marginfi_account::MarginAccount,
    observer::{ClientObserver, MangoObserver, ZoObserver},
    utils::{load_anchor, load_mango},
};
use solana_client::{nonblocking::pubsub_client::PubsubClient, rpc_client::RpcClient};
use solana_sdk::{account_info::AccountInfo, pubkey::Pubkey, transaction::Transaction};
use std::{
    cmp::max,
    env, fmt,
    mem::size_of,
    sync::Arc,
    thread::sleep,
    time::{Duration, Instant},
};

mod account_service;

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    let client = MarginClient::new_from_env().await?;
    let (s, r) = crossbeam_channel::unbounded::<u64>();
    let rpc_client = Arc::new(RpcClient::new(&client.rpc_endpoint.url()));
    let pubsub_client =
        Arc::new(PubsubClient::new(&env::var("WS_ENDPOINT").expect("WS_URL not set")).await?);
    let ras = RpcAccountService::new(Arc::new(s), rpc_client, pubsub_client);

    ras.start(&client)?;

    loop {
        process_accounts(ras.clone(), &client)?;
        sleep(Duration::from_secs(5));
    }

    Ok(())
}

fn process_accounts(ras: Arc<RpcAccountService>, marginfi_client: &MarginClient) -> Result<()> {
    let start_time = Instant::now();
    let margin_accounts = load_margin_accounts(ras.clone(), marginfi_client)?;
    let actions = find_actions(ras, marginfi_client, &margin_accounts)?;

    println!(
        "Processed {} accounts in {:?}",
        margin_accounts.len(),
        start_time.elapsed()
    );

    Ok(())
}

fn get_transactions(
    action_configs: Vec<(MarginAccount, ActionsConfig)>,
) -> Result<Vec<Transaction>> {
    action_configs
        .iter()
        .map(|(margin_account, action_config)| {
            let actions: Vec<Action> = action_config.into();
        });

    Ok(vec![])
}

#[derive(Clone, Copy, Default)]
struct ActionsConfig {
    deposit_rebalance: [Option<I80F48>; MAX_UTPS],
    withdraw_rebalance: Option<I80F48>,
}

impl ActionsConfig {
    pub fn actionable(&self) -> bool {
        self.deposit_rebalance.iter().any(|x| x.is_some()) || self.withdraw_rebalance.is_some()
    }
}

impl Into<Vec<Action>> for &ActionsConfig {
    fn into(self) -> Vec<Action> {
        let mut actions = vec![];
        for (i, deposit_rebalance) in self.deposit_rebalance.iter().enumerate() {
            if let Some(deposit_rebalance) = deposit_rebalance {
                actions.push(Action::DepositRebalance {
                    utp_index: i,
                    amount: *deposit_rebalance,
                });
            }
        }

        if let Some(withdraw_rebalance) = self.withdraw_rebalance {
            actions.push(Action::WithdrawRebalance {
                amount: withdraw_rebalance,
            });
        }

        actions
    }
}

enum Action {
    DepositRebalance { utp_index: usize, amount: I80F48 },
    WithdrawRebalance { amount: I80F48 },
}

impl Action {
    pub fn to_transaction(&self, margin_accunt: &MarginAccount) -> Option<Transaction> {
        match self {
            Action::DepositRebalance {
                utp_index: 0,
                amount,
            } => Some(mango_make_deposit_ix(accounts, amount.to_num::<u64>())),
            Action::DepositRebalance {
                utp_index: 1,
                amount,
            } => {
                todo!()
            }
            Action::WithdrawRebalance { amount } => todo!(),
            _ => panic!("Invalid action"),
        }
    }
}

fn find_actions<'a>(
    ras: Arc<RpcAccountService>,
    marginfi_client: &'a MarginClient,
    margin_accounts: &Vec<MarginAccount<'a>>,
) -> Result<Vec<(MarginAccount<'a>, ActionsConfig)>> {
    let bank = &marginfi_client.group.bank;
    let actions = margin_accounts
        .iter()
        .map(|margin_account| {
            let mut action = ActionsConfig::default();
            if let Some(mango_observer) = margin_account.observer.mango_observer {
                let rebalance_valid = mango_observer.is_rebalance_deposit_valid()?;

                if rebalance_valid {
                    let max_deposit_value = mango_observer.get_max_rebalance_deposit_amount()?;
                    action.deposit_rebalance[MANGO_UTP_INDEX] = Some(max_deposit_value);
                }
            }

            if let Some(zo_observer) = margin_account.observer.zo_observer {
                let rebalance_valid = zo_observer.is_rebalance_deposit_valid()?;

                if rebalance_valid {
                    let max_deposit_value = zo_observer.get_max_rebalance_deposit_amount()?;
                    action.deposit_rebalance[ZO_UTP_INDEX] = Some(max_deposit_value);
                }
            };

            {
                let margin_init_requirement = margin_account
                    .marginfi_account
                    .get_margin_requirement(bank, MarginRequirement::Init)?;
                let equity = margin_account.marginfi_account.get_equity(
                    bank,
                    EquityType::InitReqAdjusted,
                    &margin_account.observer,
                )?;

                let diff = max(margin_init_requirement - equity, I80F48::ZERO);
                if equity < margin_init_requirement && diff > I80F48::ONE {
                    let max_withdraw_rebalance = margin_init_requirement - equity;
                    action.withdraw_rebalance = Some(max_withdraw_rebalance);
                }
            }

            Ok((margin_account.clone(), action))
        })
        .collect::<Result<Vec<_>>>()?
        .iter()
        .filter(|(_, action)| action.actionable())
        .map(|(margin_account, action)| (margin_account.clone(), *action))
        .collect::<Vec<(_, _)>>();

    Ok(actions)
}

fn load_margin_accounts(
    ras: Arc<RpcAccountService>,
    marginfi_client: &MarginClient,
) -> Result<Vec<MarginAccount>> {
    ras.active_state
        .iter()
        .filter(|ac| ac.account.data.len() == size_of::<MarginfiAccount>() + 8)
        .map(|ac| ac.clone())
        .map(|ac| {
            let mut ac_clone = ac.clone();
            let ai: AccountInfo = (&mut ac_clone).into();
            let mfi_account = load_anchor::<MarginfiAccount>(&ai)?;

            Ok((ac.address, *mfi_account))
        })
        .collect::<Result<Vec<_>>>()?
        .iter()
        .filter(|(_, ma)| ma.marginfi_group == marginfi_client.config.marginfi_group)
        .map(|(address, mfi_account)| {
            let (mango_observer, zo_observer) = {
                let (mut mango_observer, mut zo_observer) = (None, None);

                if mfi_account.active_utps[MANGO_UTP_INDEX] {
                    let utp_config = mfi_account.utp_account_config[MANGO_UTP_INDEX];
                    let mango_account_address = utp_config.address;
                    let mango_account =
                        ras_load_mango::<MangoAccount>(ras.clone(), &mango_account_address)?;
                    let mango_group =
                        ras_load_mango::<MangoGroup>(ras.clone(), &mango_account.mango_group)?;
                    let mango_cache =
                        ras_load_mango::<MangoCache>(ras.clone(), &mango_group.mango_cache)?;

                    mango_observer = Some(MangoObserver::new(
                        mango_account_address,
                        mango_account.mango_group,
                        mango_group.mango_cache,
                        mango_account,
                        mango_group,
                        mango_cache,
                    ));
                }

                if mfi_account.active_utps[ZO_UTP_INDEX] {
                    let utp_config = mfi_account.utp_account_config[ZO_UTP_INDEX];
                    let zo_account_address = utp_config.address;
                    let zo_state_pk = utp_config.utp_address_book[ZO_STATE_ADDRESS_INDEX];

                    let zo_margin =
                        ras_load_anchor::<zo_abi::Margin>(ras.clone(), &zo_account_address)?;
                    let zo_control =
                        ras_load_anchor::<zo_abi::Control>(ras.clone(), &zo_margin.control)?;
                    let zo_state = ras_load_anchor::<zo_abi::State>(ras.clone(), &zo_state_pk)?;
                    let zo_cache = ras_load_anchor::<zo_abi::Cache>(ras.clone(), &zo_state.cache)?;

                    zo_observer = Some(ZoObserver::new(
                        zo_account_address,
                        zo_margin.control,
                        zo_state_pk,
                        zo_state.cache,
                        zo_margin,
                        zo_control,
                        zo_state,
                        zo_cache,
                    ));
                }

                (mango_observer, zo_observer)
            };

            Ok(MarginAccount::new(
                address.clone(),
                *mfi_account,
                marginfi_client,
                ClientObserver::new(mango_observer, zo_observer),
            ))
        })
        .collect::<Result<Vec<_>>>()
}

fn ras_load_mango<T: Loadable>(ras: Arc<RpcAccountService>, address: &Pubkey) -> Result<T> {
    let mut ac_clone = {
        let account_ac = ras.active_state.get(&address).ok_or(anyhow!(
            "Mango account {} not found in active state",
            address
        ))?;

        account_ac.clone()
    };

    let ai: AccountInfo = (&mut ac_clone).into();
    let mango_account = load_mango::<T>(&ai)?;

    Ok(mango_account)
}

fn ras_load_anchor<T: Pod>(ras: Arc<RpcAccountService>, address: &Pubkey) -> Result<T> {
    let mut ac_clone = {
        let account_ac = ras
            .active_state
            .get(&address)
            .ok_or(anyhow!("Account {} not found in active state", address))?;

        account_ac.clone()
    };

    let ai: AccountInfo = (&mut ac_clone).into();
    let deserialized_account = load_anchor::<T>(&ai)?;

    Ok(*deserialized_account)
}
