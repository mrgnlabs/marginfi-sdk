#[cfg(feature = "mainnet-beta")]
anchor_lang::declare_id!("MRGNWSHaWmz3CPFcYt9Fyh8VDcvLJyy2SCURnMco2bC");
#[cfg(not(feature = "mainnet-beta"))]
anchor_lang::declare_id!("mf2tjVmwcxgNfscvVNdN9t2LZ8YwPkNQabeTzyYw2Hn");

anchor_gen::generate_cpi_interface!(
    idl_path = "src/idl.json",
    zero_copy(
        MarginfiGroup,
        MarginfiAccount,
        UTPAccountConfig,
        MDecimal,
        UTPConfig,
        Bank,
    ),
    packed(
        MarginfiGroup,
        MarginfiAccount,
        UTPAccountConfig,
        Bank,
        MDecimal
    )
);

impl Default for state::MarginfiGroup {
    fn default() -> Self {
        Self {
            admin: Default::default(),
            bank: Default::default(),
            paused: false,
            reserved_space: [0; 384],
        }
    }
}
