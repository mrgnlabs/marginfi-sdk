use anchor_lang::prelude::*;

use crate::state::{Group, Row};
use crate::Error;

#[derive(Accounts)]
#[instruction(group_num: u32)]
pub struct CreateGroup<'info> {
    #[account(
        init,
        seeds = [b"Group".as_ref(), &group_num.to_le_bytes()],
        bump,
        payer = payer,
        space = 8 + std::mem::size_of::<Group>(),
    )]
    pub group: AccountLoader<'info, Group>,

    /// CHECK: verification in handler
    pub table: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_group(
    ctx: Context<CreateGroup>,
    group_num: u32,
    claim_transfer_destination: Pubkey,
    testing: u8,
) -> Result<()> {
    let mut group = ctx.accounts.group.load_init()?;
    group.group_num = group_num;
    group.table = ctx.accounts.table.key();
    group.claim_transfer_destination = claim_transfer_destination;
    group.authority = ctx.accounts.authority.key();
    group.bump = *ctx.bumps.get("group").ok_or(Error::SomeError)?;
    group.testing = testing;

    // Check authority on table
    let table_ai = &ctx.accounts.table;
    let data = table_ai.try_borrow_data()?;
    if !group.is_testing() {
        require_keys_eq!(Pubkey::new(&data[5..37]), group.authority);
    }

    // Some debug logging
    let num_of_rows = Row::get_num_of_rows(&ctx.accounts.table.try_borrow_data()?)?;
    msg!(
        "Created group (testing = {:?}) {:?} with table {:?} of {:?} rows, and claim_transfer_destination {:?}",
        group.is_testing(),
        group_num,
        ctx.accounts.table.key(),
        num_of_rows,
        claim_transfer_destination
    );
    if num_of_rows > 2 {
        for index_into_table in 0..2 {
            let data = &ctx.accounts.table.try_borrow_data()?;
            let row = Row::load(data, index_into_table)?;
            msg!("Debug: Row {:?} {:?}", index_into_table, row);
        }
    }

    Ok(())
}
