use std::time::Duration;

use crate::{config::GlobalOptions, processor};
use anyhow::Result;
use clap::Parser;
use dotenv::dotenv;
use solana_sdk::pubkey::Pubkey;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Parser)]
#[clap(author, version = VERSION, about, long_about = None)]
pub struct Args {
    #[clap(flatten)]
    pub global_option: GlobalOptions,
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Debug, Parser)]
pub enum Command {
    Rebalance {
        #[clap(long, short)]
        group: Pubkey,
        #[clap(short, long, value_parser, default_value_t = 1000)]
        pause: u64,
    },
}

pub fn entry(opts: Args) -> Result<()> {
    env_logger::init();
    dotenv().ok();
    match opts.command {
        Command::Rebalance { group, pause } => {
            processor::rebalance(opts.global_option, group, Duration::from_millis(pause))
        }
    }
}
