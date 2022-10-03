use marginfi_sdk::{
    client::{MarginClient},
    marginfi_account::MarginAccount,
};


#[tokio::main]
async fn main() {
    let marginfi_client = MarginClient::new_from_env().await.unwrap();
    let address = marginfi_client
        .config
        .marginfi_account
        .expect("MARGINFI_ACCOUNT not set");
    let marginfi_account = MarginAccount::load(&marginfi_client, &address)
        .await
        .unwrap();

    println!("{}", marginfi_account);
}