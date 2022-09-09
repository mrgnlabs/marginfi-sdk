use marginfi_sdk::{
    client::{Env, MarginClient, MarginfiClientConfig},
    marginfi_account::MarginAccount,
};
use solana_sdk::pubkey;

#[tokio::main]
async fn main() {
    let config = MarginfiClientConfig {
        marginfi_program: pubkey!("MRGNWSHaWmz3CPFcYt9Fyh8VDcvLJyy2SCURnMco2bC"),
        marginfi_group: pubkey!("2FdddfNp6knT5tDjKjFREKUjsFKvAppc61bCyuCrTnj2"),
        env: Env::MAINNET,
        rpc_endpoint: env!("RPC_ENDPOINT").to_owned(),
        wallet: "/Users/jakob/.config/solana/id.json".to_owned(),
        marginfi_account: None,
    };

    let address = pubkey!("ANSb3uegManRtrH2kvqzwXc8PxMxNFoY3esSHmjM5hGU");

    let marginfi_client = MarginClient::new(config).await.unwrap();
    let marginfi_account = MarginAccount::load(&marginfi_client, &address)
        .await
        .unwrap();

    println!("{}", marginfi_account);
}
