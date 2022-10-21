use crate::Error;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::Group;

#[derive(Accounts)]
#[instruction(token_index: usize)]
pub struct CreateVault<'info> {
    #[account (
        mut,
        has_one = authority,
        has_one = claim_transfer_destination,
        constraint = !group.load()?.has_reimbursement_started() @ Error::ReimbursementAlreadyStarted
    )]
    pub group: AccountLoader<'info, Group>,

    pub authority: Signer<'info>,

    #[account(
        init,
        associated_token::mint = mint,
        payer = payer,
        associated_token::authority = group,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: ATA program will verify this
    pub claim_transfer_token_account: UncheckedAccount<'info>,
    /// CHECK: verified with a has_one on group
    pub claim_transfer_destination: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"Mint".as_ref(), group.key().as_ref(), &token_index.to_le_bytes()],
        bump,
        mint::authority = group,
        mint::decimals = mint.decimals,
        payer = payer
    )]
    pub claim_mint: Account<'info, Mint>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_create_vault(ctx: Context<CreateVault>, token_index: usize) -> Result<()> {
    // Create claim transfer token account manually to guarantee that it is created
    // after its mint
    let cpi_program = ctx.accounts.associated_token_program.to_account_info();
    let cpi_accounts = anchor_spl::associated_token::Create {
        payer: ctx.accounts.payer.to_account_info(),
        associated_token: ctx.accounts.claim_transfer_token_account.to_account_info(),
        authority: ctx.accounts.claim_transfer_destination.to_account_info(),
        mint: ctx.accounts.claim_mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_ctx = anchor_lang::context::CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::associated_token::create(cpi_ctx)?;

    require!(token_index < 16usize, Error::SomeError);

    let mut group = ctx.accounts.group.load_mut()?;
    require_eq!(group.vaults[token_index], Pubkey::default());
    require_eq!(group.claim_mints[token_index], Pubkey::default());
    require_eq!(group.mints[token_index], Pubkey::default());
    group.vaults[token_index] = ctx.accounts.vault.key();
    group.claim_mints[token_index] = ctx.accounts.claim_mint.key();
    group.mints[token_index] = ctx.accounts.mint.key();
    Ok(())
}
