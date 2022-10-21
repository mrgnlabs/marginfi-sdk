use anchor_lang::prelude::*;

use crate::state::{Group, ReimbursementAccount};

#[derive(Accounts)]
pub struct CreateReimbursementAccount<'info> {
    pub group: AccountLoader<'info, Group>,

    #[account(
        init_if_needed,
        seeds = [b"ReimbursementAccount".as_ref(), group.key().as_ref(), mango_account_owner.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + std::mem::size_of::<ReimbursementAccount>(),
    )]
    pub reimbursement_account: AccountLoader<'info, ReimbursementAccount>,

    /// CHECK: we want this be permissionless
    pub mango_account_owner: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_create_reimbursement_account(
    _ctx: Context<CreateReimbursementAccount>,
) -> Result<()> {
    Ok(())
}
