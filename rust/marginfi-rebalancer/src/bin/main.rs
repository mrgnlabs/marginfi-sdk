use anyhow::Result;
use clap::Parser;
use marginfi_rebalancer::Args;

fn main() -> Result<()> {
    marginfi_rebalancer::entry(Args::parse())
}
