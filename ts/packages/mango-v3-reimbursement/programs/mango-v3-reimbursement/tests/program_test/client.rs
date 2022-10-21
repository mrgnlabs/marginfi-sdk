#![allow(dead_code)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;
use anchor_spl::token::Token;
use solana_program_test::BanksClientError;
use solana_sdk::instruction;
use solana_sdk::transport::TransportError;
use std::sync::Arc;

use super::solana::SolanaCookie;
use super::utils::TestKeypair;
use mango_v3_reimbursement::state::*;

#[async_trait::async_trait(?Send)]
pub trait ClientAccountLoader {
    async fn load_bytes(&self, pubkey: &Pubkey) -> Option<Vec<u8>>;
    async fn load<T: AccountDeserialize>(&self, pubkey: &Pubkey) -> Option<T> {
        let bytes = self.load_bytes(pubkey).await?;
        AccountDeserialize::try_deserialize(&mut &bytes[..]).ok()
    }
}

#[async_trait::async_trait(?Send)]
impl ClientAccountLoader for &SolanaCookie {
    async fn load_bytes(&self, pubkey: &Pubkey) -> Option<Vec<u8>> {
        self.get_account_data(*pubkey).await
    }
}

// TODO: report error outwards etc
pub async fn send_tx<CI: ClientInstruction>(
    solana: &SolanaCookie,
    ix: CI,
) -> std::result::Result<CI::Accounts, TransportError> {
    let (accounts, instruction) = ix.to_instruction(solana).await;
    let signers = ix.signers();
    let instructions = vec![instruction];
    solana
        .process_transaction(&instructions, Some(&signers[..]))
        .await?;
    Ok(accounts)
}

/// Build a transaction from multiple instructions
pub struct ClientTransaction {
    solana: Arc<SolanaCookie>,
    instructions: Vec<instruction::Instruction>,
    signers: Vec<TestKeypair>,
}

impl<'a> ClientTransaction {
    pub fn new(solana: &Arc<SolanaCookie>) -> Self {
        Self {
            solana: solana.clone(),
            instructions: vec![],
            signers: vec![],
        }
    }

    pub async fn add_instruction<CI: ClientInstruction>(&mut self, ix: CI) -> CI::Accounts {
        let solana: &SolanaCookie = &self.solana;
        let (accounts, instruction) = ix.to_instruction(solana).await;
        self.instructions.push(instruction);
        self.signers.extend(ix.signers());
        accounts
    }

    pub fn add_instruction_direct(&mut self, ix: instruction::Instruction) {
        self.instructions.push(ix);
    }

    pub fn add_signer(&mut self, keypair: TestKeypair) {
        self.signers.push(keypair);
    }

    pub async fn send(&self) -> std::result::Result<(), BanksClientError> {
        self.solana
            .process_transaction(&self.instructions, Some(&self.signers))
            .await
    }
}

#[async_trait::async_trait(?Send)]
pub trait ClientInstruction {
    type Accounts: anchor_lang::ToAccountMetas;
    type Instruction: anchor_lang::InstructionData;

    async fn to_instruction(
        &self,
        loader: impl ClientAccountLoader + 'async_trait,
    ) -> (Self::Accounts, instruction::Instruction);
    fn signers(&self) -> Vec<TestKeypair>;
}

fn make_instruction(
    program_id: Pubkey,
    accounts: &impl anchor_lang::ToAccountMetas,
    data: impl anchor_lang::InstructionData,
) -> instruction::Instruction {
    instruction::Instruction {
        program_id,
        accounts: anchor_lang::ToAccountMetas::to_account_metas(accounts, None),
        data: anchor_lang::InstructionData::data(&data),
    }
}

//
// a struct for each instruction along with its
// ClientInstruction impl
//

pub struct CreateGroupInstruction {
    pub group_num: u32,
    pub claim_transfer_destination: Pubkey,
    pub testing: bool,
    pub table: Pubkey,
    pub payer: TestKeypair,
    pub authority: TestKeypair,
}
#[async_trait::async_trait(?Send)]
impl ClientInstruction for CreateGroupInstruction {
    type Accounts = mango_v3_reimbursement::accounts::CreateGroup;
    type Instruction = mango_v3_reimbursement::instruction::CreateGroup;
    async fn to_instruction(
        &self,
        _account_loader: impl ClientAccountLoader + 'async_trait,
    ) -> (Self::Accounts, instruction::Instruction) {
        let program_id = mango_v3_reimbursement::id();
        let instruction = Self::Instruction {
            group_num: self.group_num,
            claim_transfer_destination: self.claim_transfer_destination,
            testing: if self.testing { 1 } else { 0 },
        };

        let group = Pubkey::find_program_address(
            &[b"Group".as_ref(), &self.group_num.to_le_bytes()],
            &program_id,
        )
        .0;

        let accounts = Self::Accounts {
            group,
            table: self.table,
            payer: self.payer.pubkey(),
            authority: self.authority.pubkey(),
            system_program: System::id(),
        };

        let instruction = make_instruction(program_id, &accounts, instruction);
        (accounts, instruction)
    }

    fn signers(&self) -> Vec<TestKeypair> {
        vec![self.payer, self.authority]
    }
}

pub struct CreateVaultInstruction {
    pub group: Pubkey,
    pub authority: TestKeypair,
    pub token_index: usize,
    pub mint: Pubkey,
    pub payer: TestKeypair,
}
#[async_trait::async_trait(?Send)]
impl ClientInstruction for CreateVaultInstruction {
    type Accounts = mango_v3_reimbursement::accounts::CreateVault;
    type Instruction = mango_v3_reimbursement::instruction::CreateVault;
    async fn to_instruction(
        &self,
        account_loader: impl ClientAccountLoader + 'async_trait,
    ) -> (Self::Accounts, instruction::Instruction) {
        let program_id = mango_v3_reimbursement::id();

        let group: Group = account_loader.load(&self.group).await.unwrap();

        let instruction = Self::Instruction {
            token_index: self.token_index,
        };

        let claim_mint = Pubkey::find_program_address(
            &[
                b"Mint".as_ref(),
                self.group.as_ref(),
                &self.token_index.to_le_bytes(),
            ],
            &program_id,
        )
        .0;

        let claim_transfer_token_account =
            anchor_spl::associated_token::get_associated_token_address(
                &group.claim_transfer_destination,
                &claim_mint,
            );

        let vault =
            anchor_spl::associated_token::get_associated_token_address(&self.group, &self.mint);

        let accounts = Self::Accounts {
            group: self.group,
            vault,
            mint: self.mint,
            authority: self.authority.pubkey(),
            payer: self.payer.pubkey(),
            claim_transfer_token_account,
            claim_transfer_destination: group.claim_transfer_destination,
            claim_mint,
            token_program: Token::id(),
            system_program: System::id(),
            rent: sysvar::rent::id(),
            associated_token_program: anchor_spl::associated_token::ID,
        };

        let instruction = make_instruction(program_id, &accounts, instruction);
        (accounts, instruction)
    }

    fn signers(&self) -> Vec<TestKeypair> {
        vec![self.authority, self.payer]
    }
}

pub struct StartReimbursementInstruction {
    pub group: Pubkey,
    pub authority: TestKeypair,
}
#[async_trait::async_trait(?Send)]
impl ClientInstruction for StartReimbursementInstruction {
    type Accounts = mango_v3_reimbursement::accounts::StartReimbursement;
    type Instruction = mango_v3_reimbursement::instruction::StartReimbursement;
    async fn to_instruction(
        &self,
        _account_loader: impl ClientAccountLoader + 'async_trait,
    ) -> (Self::Accounts, instruction::Instruction) {
        let program_id = mango_v3_reimbursement::id();
        let instruction = Self::Instruction {};

        let accounts = Self::Accounts {
            group: self.group,
            authority: self.authority.pubkey(),
        };

        let instruction = make_instruction(program_id, &accounts, instruction);
        (accounts, instruction)
    }

    fn signers(&self) -> Vec<TestKeypair> {
        vec![self.authority]
    }
}

pub struct CreateReimbursementAccountInstruction {
    pub group: Pubkey,
    pub mango_account_owner: Pubkey,
    pub payer: TestKeypair,
}
#[async_trait::async_trait(?Send)]
impl ClientInstruction for CreateReimbursementAccountInstruction {
    type Accounts = mango_v3_reimbursement::accounts::CreateReimbursementAccount;
    type Instruction = mango_v3_reimbursement::instruction::CreateReimbursementAccount;
    async fn to_instruction(
        &self,
        _account_loader: impl ClientAccountLoader + 'async_trait,
    ) -> (Self::Accounts, instruction::Instruction) {
        let program_id = mango_v3_reimbursement::id();
        let instruction = Self::Instruction {};

        let reimbursement_account = Pubkey::find_program_address(
            &[
                b"ReimbursementAccount".as_ref(),
                self.group.as_ref(),
                self.mango_account_owner.as_ref(),
            ],
            &program_id,
        )
        .0;

        let accounts = Self::Accounts {
            group: self.group,
            reimbursement_account,
            mango_account_owner: self.mango_account_owner,
            payer: self.payer.pubkey(),
            system_program: System::id(),
            rent: sysvar::rent::id(),
        };

        let instruction = make_instruction(program_id, &accounts, instruction);
        (accounts, instruction)
    }

    fn signers(&self) -> Vec<TestKeypair> {
        vec![self.payer]
    }
}

pub struct ReimburseInstruction {
    pub group: Pubkey,
    pub token_index: usize,
    pub mango_account_owner: TestKeypair,
    pub transfer_claim: bool,
    pub token_account: Pubkey,
    pub table_index: usize,
}
#[async_trait::async_trait(?Send)]
impl ClientInstruction for ReimburseInstruction {
    type Accounts = mango_v3_reimbursement::accounts::Reimburse;
    type Instruction = mango_v3_reimbursement::instruction::Reimburse;
    async fn to_instruction(
        &self,
        account_loader: impl ClientAccountLoader + 'async_trait,
    ) -> (Self::Accounts, instruction::Instruction) {
        let program_id = mango_v3_reimbursement::id();

        let group: Group = account_loader.load(&self.group).await.unwrap();

        let instruction = Self::Instruction {
            index_into_table: self.table_index,
            token_index: self.token_index,
            transfer_claim: self.transfer_claim,
        };

        let reimbursement_account = Pubkey::find_program_address(
            &[
                b"ReimbursementAccount".as_ref(),
                self.group.as_ref(),
                self.mango_account_owner.pubkey().as_ref(),
            ],
            &program_id,
        )
        .0;

        let claim_mint_token_account = anchor_spl::associated_token::get_associated_token_address(
            &group.claim_transfer_destination,
            &group.claim_mints[self.token_index],
        );

        let accounts = Self::Accounts {
            group: self.group,
            vault: group.vaults[self.token_index],
            token_account: self.token_account,
            reimbursement_account,
            mango_account_owner: self.mango_account_owner.pubkey(),
            signer: self.mango_account_owner.pubkey(),
            claim_mint_token_account,
            claim_mint: group.claim_mints[self.token_index],
            table: group.table,
            token_program: Token::id(),
            system_program: System::id(),
            rent: sysvar::rent::id(),
        };

        let instruction = make_instruction(program_id, &accounts, instruction);
        (accounts, instruction)
    }

    fn signers(&self) -> Vec<TestKeypair> {
        vec![self.mango_account_owner]
    }
}
