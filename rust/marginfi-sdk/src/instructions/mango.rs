use anchor_lang::prelude::Pubkey;
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use marginfi::constants::MANGO_PROGRAM;
use marginfi::instructions::UtpMangoPlacePerpOrderArgs;
use solana_sdk::instruction::Instruction;

pub struct PlacePerpOrderAccounts {
    marginfi_account: Pubkey,
    marginfi_group: Pubkey,
    signer: Pubkey,
    mango_authority: Pubkey,
    mango_account: Pubkey,
    mango_group: Pubkey,
    mango_cache: Pubkey,
    mango_perp_market: Pubkey,
    mango_bids: Pubkey,
    mango_asks: Pubkey,
    mango_event_queue: Pubkey,
}

pub fn make_place_perp_order_ix(
    acc: PlacePerpOrderAccounts,
    args: UtpMangoPlacePerpOrderArgs,
) -> Instruction {
    let accounts = marginfi::accounts::UtpMangoPlacePerpOrder {
        marginfi_account: acc.marginfi_account,
        marginfi_group: acc.marginfi_group,
        signer: acc.signer,
        mango_authority: acc.mango_authority,
        mango_account: acc.mango_account,
        mango_program: MANGO_PROGRAM,
        mango_group: acc.mango_group,
        mango_cache: acc.mango_cache,
        mango_perp_market: acc.mango_perp_market,
        mango_bids: acc.mango_bids,
        mango_asks: acc.mango_asks,
        mango_event_queue: acc.mango_event_queue,
    }
    .to_account_metas(Some(true));

    Instruction {
        program_id: marginfi::ID,
        accounts,
        data: marginfi::instruction::UtpMangoUsePlacePerpOrder { args }.data(),
    }
}
