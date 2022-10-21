use anchor_lang::prelude::*;

use crate::state::Group;
use crate::Error;

#[derive(Accounts)]
pub struct StartReimbursement<'info> {
    #[account(
        mut,
        has_one = authority,
        constraint = !group.load()?.has_reimbursement_started() @ Error::ReimbursementAlreadyStarted
    )]
    pub group: AccountLoader<'info, Group>,

    pub authority: Signer<'info>,
}

// TODO: do we also want to have a end/freeze reimbursement?
pub fn handle_start_reimbursement(ctx: Context<StartReimbursement>) -> Result<()> {
    let mut group = ctx.accounts.group.load_mut()?;
    group.reimbursement_started = 1;
    Ok(())
}
