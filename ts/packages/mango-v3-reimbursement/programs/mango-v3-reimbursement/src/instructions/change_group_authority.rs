use anchor_lang::prelude::*;

use crate::state::Group;

#[derive(Accounts)]
pub struct ChangeGroupAuthority<'info> {
    #[account(
        mut,
        has_one = authority,
        has_one = table
    )]
    pub group: AccountLoader<'info, Group>,

    /// CHECK: verification in handler
    pub table: UncheckedAccount<'info>,

    pub authority: Signer<'info>,
}

pub fn handle_change_group_authority(
    ctx: Context<ChangeGroupAuthority>,
    new_authority: Pubkey,
) -> Result<()> {
    let mut group = ctx.accounts.group.load_mut()?;
    group.authority = new_authority;

    // Sanity checks on table
    let table_ai = &ctx.accounts.table;
    let data = table_ai.try_borrow_data()?;
    if !group.is_testing() {
        require_keys_eq!(Pubkey::new(&data[5..37]), new_authority);
    }

    msg!("Changed group authority to {:?}", new_authority);

    Ok(())
}
