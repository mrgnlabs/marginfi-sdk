use anyhow::Result;

pub enum Utp {
    Mango(MangoUtpAdapter),
    Zo(ZoUtpAdapter),
}

pub struct MangoUtpAdapter {

}

impl MangoUtpAdapter {
    pub fn new() -> Self {
        Self {

        }
    }

    pub async fn withdraw(&self, amount: u64) -> Result<String> {
        
    }
}

pub struct ZoUtpAdapter {

}