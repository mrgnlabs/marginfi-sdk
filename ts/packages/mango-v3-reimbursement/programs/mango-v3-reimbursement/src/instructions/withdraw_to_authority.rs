use crate::state::Group;
use crate::Error;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(token_index: usize)]
pub struct WithdrawToAuthority<'info> {
    #[account (
        has_one = authority,
    )]
    pub group: AccountLoader<'info, Group>,

    #[account(
        mut,
        address = group.load()?.vaults[token_index]
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = authority_token_account.owner == authority.key()
    )]
    pub authority_token_account: Box<Account<'info, TokenAccount>>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_withdraw_to_authority<'key, 'accounts, 'remaining, 'info>(
    ctx: Context<'key, 'accounts, 'remaining, 'info, WithdrawToAuthority<'info>>,
    token_index: usize,
) -> Result<()> {
    require!(token_index < 16usize, Error::SomeError);

    let group = ctx.accounts.group.load()?;

    token::transfer(
        {
            let accounts = token::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.authority_token_account.to_account_info(),
                authority: ctx.accounts.group.to_account_info(),
            };
            CpiContext::new(ctx.accounts.token_program.to_account_info(), accounts).with_signer(&[
                &[
                    b"Group".as_ref(),
                    &group.group_num.to_le_bytes(),
                    &[group.bump],
                ],
            ])
        },
        ctx.accounts.vault.amount,
    )?;

    Ok(())
}
