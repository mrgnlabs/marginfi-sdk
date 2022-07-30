use anchor_lang::prelude::*;
use anchor_spl::token::Token;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod example_cpi {

    use super::*;

    /// -----------------------------------------------------------------------
    /// INITIALIZE
    /// -----------------------------------------------------------------------

    #[derive(Accounts)]
    pub struct InitializeAccount<'info> {
        /// CHECK: no validation, for educational purpose only
        pub marginfi_program: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        pub marginfi_group: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(zero)]
        pub marginfi_account: AccountInfo<'info>,

        #[account(mut)]
        signer: Signer<'info>,

        pub system_program: Program<'info, System>,
    }

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

    /// -----------------------------------------------------------------------
    /// DEPOSIT
    /// -----------------------------------------------------------------------

    #[derive(Accounts)]
    pub struct Deposit<'info> {
        /// CHECK: no validation, for educational purpose only
        pub marginfi_program: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_group: AccountInfo<'info>,

        pub signer: Signer<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub funding_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub token_vault: AccountInfo<'info>,

        pub token_program: Program<'info, Token>,
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

    /// -----------------------------------------------------------------------
    /// WITHDRAW
    /// -----------------------------------------------------------------------

    #[derive(Accounts)]
    pub struct Withdraw<'info> {
        /// CHECK: no validation, for educational purpose only
        pub marginfi_program: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_group: AccountInfo<'info>,

        pub signer: Signer<'info>,

        /// CHECK: no validation, for educational purpose only
        pub margin_bank_authority: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub receiving_token_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub token_vault: AccountInfo<'info>,

        pub token_program: Program<'info, Token>,
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

    /// -----------------------------------------------------------------------
    /// ATOMIC DEPOSIT -> WITHDRAW
    /// -----------------------------------------------------------------------

    #[derive(Accounts)]
    pub struct DepositAndWithdraw<'info> {
        /// CHECK: no validation, for educational purpose only
        pub marginfi_program: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_group: AccountInfo<'info>,

        pub signer: Signer<'info>,

        /// CHECK: no validation, for educational purpose only
        pub margin_bank_authority: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub user_token_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub token_vault: AccountInfo<'info>,

        pub token_program: Program<'info, Token>,
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

    /// -----------------------------------------------------------------------
    /// ATOMIC DEPOSIT -> ACTIVATE MANGO -> DEPOSIT TO MANGO
    /// -----------------------------------------------------------------------

    #[derive(Accounts)]
    pub struct SetupMango<'info> {
        /// CHECK: no validation, for educational purpose only
        pub marginfi_program: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub marginfi_group: AccountInfo<'info>,

        pub signer: Signer<'info>,

        /// CHECK: no validation, for educational purpose only
        pub margin_bank_authority: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub temp_collateral_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub funding_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub token_vault: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_authority: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_account: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        pub mango_program: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_group: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_cache: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_root_bank: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_node_bank: AccountInfo<'info>,

        /// CHECK: no validation, for educational purpose only
        #[account(mut)]
        pub mango_vault: AccountInfo<'info>,

        pub token_program: Program<'info, Token>,

        pub system_program: Program<'info, System>,
    }

    pub fn setup_mango<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, SetupMango<'info>>,
        amount: u64,
        authority_seed: Pubkey,
        authority_bump: u8,
    ) -> Result<()> {
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

        let cpi_ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::UtpMangoActivate {
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
                mango_authority: ctx.accounts.mango_authority.to_account_info(),
                mango_account: ctx.accounts.mango_account.to_account_info(),
                mango_group: ctx.accounts.mango_group.to_account_info(),
                mango_program: ctx.accounts.mango_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        );
        marginfi_cpi::cpi::utp_mango_activate(cpi_ctx, authority_seed, authority_bump)?;

        let mut cpi_ctx = CpiContext::new(
            ctx.accounts.marginfi_program.to_account_info(),
            marginfi_cpi::cpi::accounts::UtpMangoDeposit {
                marginfi_account: ctx.accounts.marginfi_account.to_account_info(),
                marginfi_group: ctx.accounts.marginfi_group.to_account_info(),
                signer: ctx.accounts.signer.to_account_info(),
                bank_authority: ctx.accounts.margin_bank_authority.to_account_info(),
                margin_collateral_vault: ctx.accounts.token_vault.to_account_info(),
                temp_collateral_account: ctx.accounts.temp_collateral_account.to_account_info(),
                mango_authority: ctx.accounts.mango_authority.to_account_info(),
                mango_account: ctx.accounts.mango_account.to_account_info(),
                mango_group: ctx.accounts.mango_group.to_account_info(),
                mango_cache: ctx.accounts.mango_cache.to_account_info(),
                mango_vault: ctx.accounts.mango_vault.to_account_info(),
                mango_root_bank: ctx.accounts.mango_root_bank.to_account_info(),
                mango_node_bank: ctx.accounts.mango_node_bank.to_account_info(),
                mango_program: ctx.accounts.mango_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        );
        let remaining_accounts: &[AccountInfo] = ctx.remaining_accounts;
        cpi_ctx.remaining_accounts = remaining_accounts.to_vec();
        marginfi_cpi::cpi::utp_mango_deposit(cpi_ctx, amount)?;

        Ok(())
    }
}
