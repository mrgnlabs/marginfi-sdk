use marginfi_sdk::marginfi_account::{Env, MarginAccount, MarginClient, MarginfiClientConfig};
use solana_sdk::pubkey;

#[tokio::main]
async fn main() {
    let config = MarginfiClientConfig {
        program: pubkey!("MRGNWSHaWmz3CPFcYt9Fyh8VDcvLJyy2SCURnMco2bC"),
        group: pubkey!("2FdddfNp6knT5tDjKjFREKUjsFKvAppc61bCyuCrTnj2"),
        env: Env::MAINNET,
        rpc_endpoint: env!("RPC_ENDPOINT").to_owned(),
    };

    let address = pubkey!("ANSb3uegManRtrH2kvqzwXc8PxMxNFoY3esSHmjM5hGU");

    let marginfi_client = MarginClient::new(config).await;
    let marginfi_account = MarginAccount::load(&marginfi_client, &address)
        .await
        .unwrap();

    println!("{}", marginfi_account);
}
