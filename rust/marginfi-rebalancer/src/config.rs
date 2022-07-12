use anchor_client::Cluster;
use clap::Parser;
use std::str::FromStr;

#[derive(Default, Debug, Parser)]
pub struct GlobalOptions {
    #[clap(global = true, long, short, default_value_t = Cluster::Devnet)]
    pub cluster: Cluster,
    #[clap(global = true, long, short, default_value_t = WalletPath::default())]
    pub wallet: WalletPath,
}

crate::home_path!(WalletPath, ".config/solana/id.json");
