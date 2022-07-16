from asyncio import sleep
from os import path
from pathlib import Path

from anchorpy import localnet_fixture, Wallet, Provider, Program
from pytest import mark
from solana.keypair import Keypair
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.transaction import Transaction

from marginpy import MarginfiConfig, Environment, load_idl, MarginfiGroup, BankVaultType
from marginpy.instruction import make_init_marginfi_group_ix, InitMarginfiGroupArgs, InitMarginfiGroupAccounts
from marginpy.utils import get_bank_authority
from tests.utils import create_new_collateral_mint, make_create_vault_account_ixs

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
localnet = localnet_fixture(path=PATH, timeout_seconds=5)


@mark.asyncio
@mark.integration
async def test_create_group(localnet) -> None:
    await sleep(5.)

    dummy_config = MarginfiConfig(Environment.LOCALNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient("http://127.0.0.1:8899", commitment=Confirmed)
    provider = Provider(rpc_client, wallet)
    program = Program(load_idl(), dummy_config.program_id, provider=provider)

    mint_pk, _ = await create_new_collateral_mint(wallet, program)
    group_keypair = Keypair()
    group_pk = group_keypair.public_key
    create_marginfi_group_account_ix = await program.account['MarginfiGroup'].create_instruction(group_keypair)

    liquidity_vault_authority, liquidity_vault_bump = get_bank_authority(group_pk, program.program_id,
                                                                         BankVaultType.LiquidityVault)
    insurance_vault_authority, insurance_vault_bump = get_bank_authority(group_pk, program.program_id,
                                                                         BankVaultType.InsuranceVault)
    fee_vault_authority, fee_vault_bump = get_bank_authority(group_pk, program.program_id, BankVaultType.FeeVault)

    liquidity_vault_keypair, liquidity_vault_ixs = await make_create_vault_account_ixs(mint_pk,
                                                                                       liquidity_vault_authority,
                                                                                       wallet,
                                                                                       rpc_client)
    insurance_vault_keypair, insurance_vault_ixs = await make_create_vault_account_ixs(mint_pk,
                                                                                       insurance_vault_authority,
                                                                                       wallet,
                                                                                       rpc_client)
    fee_vault_keypair, fee_vault_ixs = await make_create_vault_account_ixs(mint_pk, fee_vault_authority, wallet,
                                                                           rpc_client)

    create_marginfi_group_ix = make_init_marginfi_group_ix(
        InitMarginfiGroupArgs(bank_authority_pda_bump=liquidity_vault_bump,
                              insurance_vault_authority_pda_bump=insurance_vault_bump,
                              fee_vault_authority_pda_bump=fee_vault_bump),
        InitMarginfiGroupAccounts(
            marginfi_group=group_pk,
            admin=wallet.public_key,
            mint=mint_pk,
            bank_vault=liquidity_vault_keypair.public_key,
            bank_authority=liquidity_vault_authority,
            insurance_vault=insurance_vault_keypair.public_key,
            insurance_vault_authority=insurance_vault_authority,
            fee_vault=fee_vault_keypair.public_key,
            fee_vault_authority=fee_vault_authority,
        ),
        dummy_config.program_id
    )
    tx = Transaction().add(create_marginfi_group_account_ix, *liquidity_vault_ixs, *insurance_vault_ixs, *fee_vault_ixs,
                           create_marginfi_group_ix)
    await program.provider.send(tx, signers=[group_keypair, liquidity_vault_keypair, insurance_vault_keypair,
                                             fee_vault_keypair])
    config = MarginfiConfig(Environment.LOCALNET, overrides={"group_pk": group_pk, "collateral_mint_pk": mint_pk})
    await MarginfiGroup.fetch(config, program)
