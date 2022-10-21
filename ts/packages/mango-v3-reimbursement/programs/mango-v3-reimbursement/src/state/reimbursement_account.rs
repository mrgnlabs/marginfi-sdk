use std::mem::size_of;

use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

#[account(zero_copy)]
pub struct ReimbursementAccount {
    pub reimbursed: u16,
    pub claim_transferred: u16,
    pub padding: [u8; 4],
}
const_assert_eq!(size_of::<ReimbursementAccount>(), 8);
const_assert_eq!(size_of::<ReimbursementAccount>() % 8, 0);

impl ReimbursementAccount {
    pub fn reimbursed(&self, token_index: usize) -> bool {
        self.reimbursed & (1 << token_index) != 0
    }

    pub fn mark_reimbursed(&mut self, token_index: usize) {
        self.reimbursed |= 1 << token_index
    }

    pub fn claim_transferred(&self, token_index: usize) -> bool {
        self.claim_transferred & (1 << token_index) != 0
    }

    pub fn mark_claim_transferred(&mut self, token_index: usize) {
        self.claim_transferred |= 1 << token_index
    }
}
