use std::mem::size_of;

pub use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

#[account(zero_copy)]
pub struct Group {
    pub group_num: u32,
    pub table: Pubkey,
    pub claim_transfer_destination: Pubkey,
    pub authority: Pubkey,
    pub vaults: [Pubkey; 16],
    pub claim_mints: [Pubkey; 16],
    pub mints: [Pubkey; 16],
    pub reimbursement_started: u8,
    pub bump: u8,
    pub testing: u8,
    pub padding: [u8; 1],
}
const_assert_eq!(
    size_of::<Group>(),
    4 + 32 + 32 + 32 + 32 * 16 + 32 * 16 + 32 * 16 + 4
);
const_assert_eq!(size_of::<Group>() % 8, 0);

impl Group {
    pub fn has_reimbursement_started(&self) -> bool {
        self.reimbursement_started == 1
    }

    pub fn is_testing(&self) -> bool {
        self.testing == 1
    }
}
