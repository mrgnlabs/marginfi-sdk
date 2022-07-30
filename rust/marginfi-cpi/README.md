<div align="center">
  <img height="170" src="https://github.com/mrgnlabs/marginfi-sdk/logo.png" />

  <h1>marginfi</h1>
  
  <p>
    <!-- License -->
    <a href="http://www.apache.org/licenses/LICENSE-2.0"><img alt="License" src="https://img.shields.io/github/license/mrgnlabs/marginfi-sdk/rust/marginfi-cpi?style=flat-square&color=ffff00"/></a>
  </p>

  <h4>
    <a href="https://marginfi.com/">marginfi.com</a>
  </h4>
</div>

marginfi is a decentralized portfolio margining protocol for trading on Solana. The protocol gives traders a unified account to access margin, compose a portfolio, and improve capital efficiency across underlying trading protocols.

## Overview

This crate provides a CPI interface to the marginfi program. It leverages the [anchor-gen](https://github.com/saber-hq/anchor-gen) tool to generate it from the program IDL.

## Usage

```rs
use anchor_lang::prelude::*;

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
}
```

For a more complete example usage, check out the [sample program](https://github.com/mrgnlabs/marginfi-sdk/tree/main/rust/marginfi-cpi/example-cpi)
