#![cfg(feature = "test-bpf")]

use solana_program_test::{BanksClientError, *};

use mango_v3_reimbursement::state::*;
use program_test::*;
use std::sync::Arc;

mod program_test;

fn make_table(authority: Pubkey, rows: &[Row]) -> solana_sdk::account::Account {
    let mut data = vec![0u8; 40 + rows.len() * 160];
    data[5..37].copy_from_slice(&authority.to_bytes());
    for (i, row) in rows.iter().enumerate() {
        data[40 + i * 160..40 + (i + 1) * 160].copy_from_slice(bytemuck::bytes_of(row));
    }
    let mut acc =
        solana_sdk::account::Account::new(u32::MAX as u64, data.len(), &Pubkey::new_unique());
    acc.data.copy_from_slice(&data);
    acc
}

async fn token_transfer(
    solana: &Arc<SolanaCookie>,
    from: Pubkey,
    to: Pubkey,
    authority: TestKeypair,
    amount: u64,
) -> std::result::Result<(), BanksClientError> {
    let mut tx = ClientTransaction::new(solana);
    tx.add_instruction_direct(
        spl_token::instruction::transfer(
            &spl_token::ID,
            &from,
            &to,
            &authority.pubkey(),
            &[&authority.pubkey()],
            amount,
        )
        .unwrap(),
    );
    tx.add_signer(authority);
    tx.send().await
}

async fn create_ata(
    solana: &Arc<SolanaCookie>,
    authority: Pubkey,
    payer: TestKeypair,
    mint: Pubkey,
) -> std::result::Result<Pubkey, BanksClientError> {
    let mut tx = ClientTransaction::new(solana);
    tx.add_instruction_direct(
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &authority,
            &mint,
        ),
    );
    tx.add_signer(payer);
    tx.send().await?;
    Ok(spl_associated_token_account::get_associated_token_address(
        &authority, &mint,
    ))
}

async fn load_reimbursement(
    solana: &SolanaCookie,
    reimbursement_account: Pubkey,
) -> ([bool; 16], [bool; 16]) {
    let data: ReimbursementAccount = solana.get_account(reimbursement_account).await;
    let reimb = (0..16).map(|i| data.reimbursed(i)).collect::<Vec<bool>>();
    let transf = (0..16)
        .map(|i| data.claim_transferred(i))
        .collect::<Vec<bool>>();
    (reimb.try_into().unwrap(), transf.try_into().unwrap())
}

#[tokio::test]
async fn test_basic() -> Result<()> {
    use mango_v3_reimbursement::accounts;

    let authority = TestKeypair::new();
    let table = Pubkey::new_unique();
    let user1 = TestKeypair::new();
    let user2 = TestKeypair::new();
    let table_rows = vec![
        Row {
            owner: user1.pubkey(),
            balances: (0..16)
                .map(|i| 100 + i)
                .collect::<Vec<u64>>()
                .try_into()
                .unwrap(),
        },
        Row {
            owner: user2.pubkey(),
            balances: (0..16).collect::<Vec<u64>>().try_into().unwrap(),
        },
    ];
    let table_account = make_table(authority.pubkey(), &table_rows);

    let mut builder = TestContextBuilder::new();
    builder.test().add_account(table, table_account);

    let context = builder.start_default().await;
    let solana = &context.solana.clone();

    let payer = context.users[1].key;

    let mut user1_token = vec![];
    for i in 0..2 {
        user1_token.push(
            create_ata(solana, user1.pubkey(), payer, context.mints[i].pubkey)
                .await
                .unwrap(),
        );
    }
    let mut user2_token = vec![];
    for i in 0..2 {
        user2_token.push(
            create_ata(solana, user2.pubkey(), payer, context.mints[i].pubkey)
                .await
                .unwrap(),
        );
    }

    let accounts::CreateGroup { group, .. } = send_tx(
        solana,
        CreateGroupInstruction {
            group_num: 0,
            testing: false,
            claim_transfer_destination: authority.pubkey(),
            authority,
            payer,
            table,
        },
    )
    .await
    .unwrap();

    let mut claim_accounts = vec![];
    for i in [0, 1, 15] {
        let accounts::CreateVault {
            vault,
            claim_transfer_token_account,
            ..
        } = send_tx(
            solana,
            CreateVaultInstruction {
                group,
                authority,
                payer,
                token_index: i,
                mint: context.mints[i].pubkey,
            },
        )
        .await
        .unwrap();
        token_transfer(
            solana,
            context.users[1].token_accounts[i],
            vault,
            payer,
            1000,
        )
        .await
        .unwrap();
        claim_accounts.push(claim_transfer_token_account);
    }

    //
    // Test reimbursing user1
    //

    let accounts::CreateReimbursementAccount {
        reimbursement_account,
        ..
    } = send_tx(
        solana,
        CreateReimbursementAccountInstruction {
            group,
            mango_account_owner: user1.pubkey(),
            payer,
        },
    )
    .await
    .unwrap();

    // Creating twice is ok
    send_tx(
        solana,
        CreateReimbursementAccountInstruction {
            group,
            mango_account_owner: user1.pubkey(),
            payer,
        },
    )
    .await
    .unwrap();

    // Cannot reimburse before start
    assert!(send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 0,
            table_index: 0,
            mango_account_owner: user1,
            transfer_claim: true,
            token_account: user1_token[0],
        }
    )
    .await
    .is_err());

    send_tx(solana, StartReimbursementInstruction { group, authority })
        .await
        .unwrap();

    // Cannot reimburse a bad table index
    assert!(send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 0,
            table_index: 1,
            mango_account_owner: user1,
            transfer_claim: true,
            token_account: user1_token[0],
        }
    )
    .await
    .is_err());

    // Cannot transfer_claim: false
    assert!(send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 0,
            table_index: 0,
            mango_account_owner: user1,
            transfer_claim: false,
            token_account: user1_token[0],
        }
    )
    .await
    .is_err());

    send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 0,
            table_index: 0,
            mango_account_owner: user1,
            transfer_claim: true,
            token_account: user1_token[0],
        },
    )
    .await
    .unwrap();

    assert_eq!(solana.token_account_balance(user1_token[0]).await, 100);
    assert_eq!(solana.token_account_balance(claim_accounts[0]).await, 100);
    {
        let (reimb, transf) = load_reimbursement(solana, reimbursement_account).await;
        assert_eq!(reimb[0], true);
        assert_eq!(reimb[1..], [false; 15]);
        assert_eq!(transf, reimb);
    }

    // does not work again
    assert!(send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 0,
            table_index: 0,
            mango_account_owner: user1,
            transfer_claim: true,
            token_account: user1_token[0],
        }
    )
    .await
    .is_err());

    // can claim a second token
    send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 1,
            table_index: 0,
            mango_account_owner: user1,
            transfer_claim: true,
            token_account: user1_token[1],
        },
    )
    .await
    .unwrap();

    assert_eq!(solana.token_account_balance(user1_token[1]).await, 101);
    assert_eq!(solana.token_account_balance(claim_accounts[1]).await, 101);
    {
        let (reimb, transf) = load_reimbursement(solana, reimbursement_account).await;
        assert_eq!(reimb[0..2], [true; 2]);
        assert_eq!(reimb[2..], [false; 14]);
        assert_eq!(transf, reimb);
    }

    // can't claim again
    assert!(send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 1,
            table_index: 0,
            mango_account_owner: user1,
            transfer_claim: true,
            token_account: user1_token[1],
        }
    )
    .await
    .is_err());

    //
    // Test reimbursing user2
    //

    let accounts::CreateReimbursementAccount {
        reimbursement_account,
        ..
    } = send_tx(
        solana,
        CreateReimbursementAccountInstruction {
            group,
            mango_account_owner: user2.pubkey(),
            payer,
        },
    )
    .await
    .unwrap();

    send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 1,
            table_index: 1,
            mango_account_owner: user2,
            transfer_claim: true,
            token_account: user2_token[1],
        },
    )
    .await
    .unwrap();

    // ok to call reimburse, even if amount=0
    send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 0,
            table_index: 1,
            mango_account_owner: user2,
            transfer_claim: true,
            token_account: user2_token[0],
        },
    )
    .await
    .unwrap();

    assert_eq!(solana.token_account_balance(user2_token[0]).await, 0);
    assert_eq!(solana.token_account_balance(user2_token[1]).await, 1);
    assert_eq!(
        solana.token_account_balance(claim_accounts[1]).await,
        101 + 1
    );
    {
        let (reimb, transf) = load_reimbursement(solana, reimbursement_account).await;
        assert_eq!(reimb[0..2], [true; 2]);
        assert_eq!(reimb[2..], [false; 14]);
        assert_eq!(transf, reimb);
    }

    // Can claim the rightmost row entry too
    let user2_token15 = create_ata(solana, user2.pubkey(), payer, context.mints[15].pubkey)
        .await
        .unwrap();
    send_tx(
        solana,
        ReimburseInstruction {
            group,
            token_index: 15,
            table_index: 1,
            mango_account_owner: user2,
            transfer_claim: true,
            token_account: user2_token15,
        },
    )
    .await
    .unwrap();

    assert_eq!(solana.token_account_balance(user2_token15).await, 15);
    assert_eq!(solana.token_account_balance(claim_accounts[2]).await, 15);
    {
        let (reimb, transf) = load_reimbursement(solana, reimbursement_account).await;
        assert_eq!(reimb[0..2], [true; 2]);
        assert_eq!(reimb[2..15], [false; 13]);
        assert_eq!(reimb[15], true);
        assert_eq!(transf, reimb);
    }

    Ok(())
}
