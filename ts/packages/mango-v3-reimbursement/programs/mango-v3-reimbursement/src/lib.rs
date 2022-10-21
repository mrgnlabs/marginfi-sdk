pub mod instructions;
pub mod state;

use instructions::*;

use anchor_lang::prelude::*;

declare_id!("m3roABq4Ta3sGyFRLdY4LH1KN16zBtg586gJ3UxoBzb");

#[program]
pub mod mango_v3_reimbursement {

    use super::*;

    pub fn create_group(
        ctx: Context<CreateGroup>,
        group_num: u32,
        claim_transfer_destination: Pubkey,
        testing: u8,
    ) -> Result<()> {
        handle_create_group(ctx, group_num, claim_transfer_destination, testing)
    }

    pub fn edit_group(ctx: Context<EditGroup>, table: Pubkey) -> Result<()> {
        handle_edit_group(ctx, table)
    }

    pub fn change_group_authority(
        ctx: Context<ChangeGroupAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        handle_change_group_authority(ctx, new_authority)
    }

    pub fn create_vault(ctx: Context<CreateVault>, token_index: usize) -> Result<()> {
        handle_create_vault(ctx, token_index)
    }

    pub fn withdraw_to_authority<'key, 'accounts, 'remaining, 'info>(
        ctx: Context<'key, 'accounts, 'remaining, 'info, WithdrawToAuthority<'info>>,
        token_index: usize,
    ) -> Result<()> {
        handle_withdraw_to_authority(ctx, token_index)
    }

    pub fn create_reimbursement_account(ctx: Context<CreateReimbursementAccount>) -> Result<()> {
        handle_create_reimbursement_account(ctx)
    }

    pub fn start_reimbursement(ctx: Context<StartReimbursement>) -> Result<()> {
        handle_start_reimbursement(ctx)
    }

    /// Disclaimer:
    /// Please make sure you and your users (of integrating programs) read and accept
    /// the following waiver when reclaiming their funds using below instruction:
    ///
    ///  By executing this instruction and accepting the tokens, I hereby
    ///  irrevocably sell, convey, transfer and assign to Mango Labs,
    ///  LLC all of my right, title and interest in, to and under all
    ///  claims arising out of or related to the loss of my tokens in
    ///  the October 2022 incident, including, without limitation, all
    ///  of my causes of action or other rights with respect to such
    ///  claims, all rights to receive any amounts or property or other
    ///  distribution in respect of or in connection with such claims,
    ///  and any and all proceeds of any of the foregoing (including
    ///  proceeds of proceeds). I further irrevocably and
    ///  unconditionally release all claims I may have against Mango
    ///  Labs, LLC, the Mango Decentralized Autonomous Entity, its core
    ///  contributors, and any of their agents, affiliates, officers,
    ///  employees, or principals related to this matter. This release
    ///  constitutes an express, informed, knowing and voluntary waiver
    ///  and relinquishment to the fullest extent permitted by law.
    pub fn reimburse<'key, 'accounts, 'remaining, 'info>(
        ctx: Context<'key, 'accounts, 'remaining, 'info, Reimburse<'info>>,
        token_index: usize,
        index_into_table: usize,
        transfer_claim: bool,
    ) -> Result<()> {
        handle_reimburse(ctx, token_index, index_into_table, transfer_claim)
    }
}

#[error_code]
pub enum Error {
    SomeError,
    ReimbursementAlreadyStarted,
    ReimbursementNotStarted,
    TokenAccountNotOwnedByMangoAccountOwner,
    AlreadyReimbursed,
    BadSigner,
    TestingOnly,
    TableRowHasWrongOwner,
    MustTransferClaim,
}
