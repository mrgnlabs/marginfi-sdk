use anchor_lang::prelude::*;
use marginfi_cpi;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod example_cpi {
    use super::*;

    pub fn initialize_account(ctx: Context<InitializeAccount>) -> Result<()> {
        let ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::InitMarginfiAccount {
                authority: ctx.accounts.signer.to_account_info(),
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        marginfi_cpi::cpi::init_marginfi_account(ctx)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeAccount<'info> {
    /// CHECK: TODO
    pub marginfi_program: AccountInfo<'info>,

    /// CHECK: TODO
    pub marginfi_group: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(zero)]
    pub marginfi_account: AccountInfo<'info>,

    #[account(mut)]
    signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
