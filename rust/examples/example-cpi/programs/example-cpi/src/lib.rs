use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use marginfi_cpi;

declare_id!("7zJZFQtYZ7Q3YKC3FFkof9QWUs3LVpN9aCF25VMCYtsR");

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

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::MarginDepositCollateral {
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                signer: ctx.accounts.signer.to_account_info(),
                funding_account: ctx.accounts.funding_account.to_account_info(),
                token_vault: ctx.accounts.token_vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        );
        marginfi_cpi::cpi::margin_deposit_collateral(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::MarginWithdrawCollateral {
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                signer: ctx.accounts.signer.to_account_info(),
                margin_bank_authority: ctx.accounts.margin_bank_authority.to_account_info(),
                receiving_token_account: ctx.accounts.receiving_token_account.to_account_info(),
                margin_collateral_vault: ctx.accounts.token_vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        );
        marginfi_cpi::cpi::margin_withdraw_collateral(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn deposit_and_withdraw(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::MarginDepositCollateral {
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                signer: ctx.accounts.signer.to_account_info(),
                funding_account: ctx.accounts.user_token_account.to_account_info(),
                token_vault: ctx.accounts.token_vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        );
        marginfi_cpi::cpi::margin_deposit_collateral(cpi_ctx, amount)?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::MarginWithdrawCollateral {
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                signer: ctx.accounts.signer.to_account_info(),
                margin_bank_authority: ctx.accounts.margin_bank_authority.to_account_info(),
                receiving_token_account: ctx.accounts.user_token_account.to_account_info(),
                margin_collateral_vault: ctx.accounts.token_vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        );
        marginfi_cpi::cpi::margin_withdraw_collateral(cpi_ctx, amount - 1)?;

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

#[derive(Accounts)]
pub struct Deposit<'info> {
    /// CHECK: TODO
    pub marginfi_program: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub marginfi_account: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub marginfi_group: AccountInfo<'info>,

    pub signer: Signer<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub funding_account: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub token_vault: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// CHECK: TODO
    pub marginfi_program: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub marginfi_account: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub marginfi_group: AccountInfo<'info>,

    pub signer: Signer<'info>,

    /// CHECK: TODO
    pub margin_bank_authority: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub receiving_token_account: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub token_vault: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DepositAndWithdraw<'info> {
    /// CHECK: TODO
    pub marginfi_program: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub marginfi_account: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub marginfi_group: AccountInfo<'info>,

    pub signer: Signer<'info>,

    /// CHECK: TODO
    pub margin_bank_authority: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub user_token_account: AccountInfo<'info>,

    /// CHECK: TODO
    #[account(mut)]
    pub token_vault: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}
