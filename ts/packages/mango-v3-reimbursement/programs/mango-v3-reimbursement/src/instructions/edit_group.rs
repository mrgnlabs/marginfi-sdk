use anchor_lang::prelude::*;

use crate::state::Group;
use crate::Error;

#[derive(Accounts)]
pub struct EditGroup<'info> {
    #[account(
        mut,
        has_one = authority,
        constraint = group.load()?.is_testing() @ Error::TestingOnly,
    )]
    pub group: AccountLoader<'info, Group>,

    pub authority: Signer<'info>,
}

pub fn handle_edit_group(ctx: Context<EditGroup>, table: Pubkey) -> Result<()> {
    let mut group = ctx.accounts.group.load_mut()?;
    group.table = table;
    Ok(())
}
