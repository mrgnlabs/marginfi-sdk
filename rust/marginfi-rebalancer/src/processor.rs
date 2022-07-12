use crate::bot::Bot;
use crate::config::GlobalOptions;
use anyhow::Result;
use solana_sdk::pubkey::Pubkey;
use std::time::Duration;

pub fn rebalance(
    global_options: GlobalOptions,
    group: Pubkey,
    pause_duration: Duration,
) -> Result<()> {
    let bot = Bot::new(&global_options.wallet, global_options.cluster);
    bot.run(group, pause_duration);

    Ok(())
}
