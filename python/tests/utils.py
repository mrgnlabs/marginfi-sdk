import json
import os
from typing import List, Tuple

import spl.token.instructions as spl_token_ixs
from anchorpy import Program, Provider, Wallet
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.responses import AccountInfo
from solana.rpc.types import TxOpts
from solana.system_program import CreateAccountParams, create_account
from solana.transaction import (
    AccountMeta,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
)
from spl.token.async_client import AsyncToken
from spl.token.constants import ACCOUNT_LEN, MINT_LEN, TOKEN_PROGRAM_ID
from spl.token.instructions import (
    create_associated_token_account,
    get_associated_token_address,
)

from marginpy import (
    Environment,
    MarginfiAccount,
    MarginfiClient,
    MarginfiConfig,
    MarginfiGroup,
)
from marginpy.generated_client.accounts import MarginfiAccount as MarginfiAccountData
from marginpy.generated_client.accounts import MarginfiGroup as MarginfiGroupData

# --- Marginfi group
from marginpy.instructions import (
    ConfigureMarginfiGroupAccounts,
    ConfigureMarginfiGroupArgs,
    InitMarginfiGroupAccounts,
    InitMarginfiGroupArgs,
    make_configure_marginfi_group_ix,
    make_init_marginfi_group_ix,
)
from marginpy.types import BankConfig, BankVaultType, GroupConfig
from marginpy.utils import (
    b64str_to_bytes,
    get_bank_authority,
    json_to_account_info,
    load_idl,
)
from tests.config import DEVNET_URL, LOCALNET_URL


async def create_collateral_mint(
    wallet: Wallet, program: Program
) -> Tuple[PublicKey, TransactionSignature]:
    mint_keypair = Keypair()
    mint_pubkey = mint_keypair.public_key
    create_mint_account_ix = create_account(
        CreateAccountParams(
            program_id=TOKEN_PROGRAM_ID,
            from_pubkey=wallet.public_key,
            lamports=int(
                (
                    await program.provider.connection.get_minimum_balance_for_rent_exemption(
                        MINT_LEN
                    )
                )["result"]
            ),
            new_account_pubkey=mint_pubkey,
            space=MINT_LEN,
        )
    )
    init_mint_ix = spl_token_ixs.initialize_mint(
        spl_token_ixs.InitializeMintParams(
            program_id=TOKEN_PROGRAM_ID,
            mint=mint_pubkey,
            mint_authority=wallet.public_key,
            decimals=6,
        )
    )
    tx = Transaction().add(create_mint_account_ix, init_mint_ix)
    sig = await program.provider.send(tx, signers=[mint_keypair])
    return mint_pubkey, sig


async def get_ata_or_create(
    rpc_client: AsyncClient, payer_keypair: Keypair, mint_pk: PublicKey
) -> PublicKey:
    ata = get_associated_token_address(payer_keypair.public_key, mint_pk)

    resp = await rpc_client.get_account_info(ata)
    ata_account_info = resp["result"]["value"]
    if ata_account_info is None:
        create_ata_ix = create_associated_token_account(
            payer_keypair.public_key, payer_keypair.public_key, mint_pk
        )
        tx = Transaction().add(create_ata_ix)
        resp = await rpc_client.send_transaction(tx, payer_keypair)
        await rpc_client.confirm_transaction(resp["result"])

    return ata


# @todo fix
FAUCET_PROGRAM_ID = PublicKey("4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt")


async def airdrop_collateral(
    provider: Provider,
    amount: int,
    mint_pk: PublicKey,
    token_account: PublicKey,
    faucet: PublicKey,
) -> TransactionSignature:
    faucet_pda, _ = PublicKey.find_program_address([b"faucet"], FAUCET_PROGRAM_ID)
    keys = [
        AccountMeta(pubkey=faucet_pda, is_signer=False, is_writable=False),
        AccountMeta(pubkey=mint_pk, is_signer=False, is_writable=True),
        AccountMeta(pubkey=token_account, is_signer=False, is_writable=True),
        AccountMeta(pubkey=TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
        AccountMeta(pubkey=faucet, is_signer=False, is_writable=False),
    ]
    data = b"\x01" + amount.to_bytes(8, "little")
    airdrop_ix = TransactionInstruction(keys, FAUCET_PROGRAM_ID, data)
    tx = Transaction().add(airdrop_ix)
    sig = await provider.send(tx)
    return sig


async def make_create_vault_account_ixs(
    mint_pk: PublicKey, owner: PublicKey, wallet: Wallet, rpc_client: AsyncClient
) -> Tuple[Keypair, List[TransactionInstruction]]:
    vault_keypair = Keypair()
    vault_pubkey = vault_keypair.public_key
    create_mint_account_ix = create_account(
        CreateAccountParams(
            program_id=TOKEN_PROGRAM_ID,
            from_pubkey=wallet.public_key,
            lamports=int(
                (await rpc_client.get_minimum_balance_for_rent_exemption(ACCOUNT_LEN))[
                    "result"
                ]
            ),
            new_account_pubkey=vault_pubkey,
            space=ACCOUNT_LEN,
        )
    )
    init_mint_ix = spl_token_ixs.initialize_account(
        spl_token_ixs.InitializeAccountParams(
            program_id=TOKEN_PROGRAM_ID, mint=mint_pk, account=vault_pubkey, owner=owner
        )
    )
    return vault_keypair, [create_mint_account_ix, init_mint_ix]


async def create_marginfi_group(
    mint_pk: PublicKey, wallet: Wallet, program: Program
) -> Tuple[PublicKey, TransactionSignature]:
    group_keypair = Keypair()
    group_pk = group_keypair.public_key

    create_marginfi_group_account_ix = await program.account[
        "MarginfiGroup"
    ].create_instruction(group_keypair)

    liquidity_vault_authority, liquidity_vault_bump = get_bank_authority(
        group_pk, program.program_id, BankVaultType.LIQUIDITY_VAULT
    )
    insurance_vault_authority, insurance_vault_bump = get_bank_authority(
        group_pk, program.program_id, BankVaultType.INSURANCE_VAULT
    )
    fee_vault_authority, fee_vault_bump = get_bank_authority(
        group_pk, program.program_id, BankVaultType.FEE_VAULT
    )

    liquidity_vault_keypair, liquidity_vault_ixs = await make_create_vault_account_ixs(
        mint_pk, liquidity_vault_authority, wallet, program.provider.connection
    )
    insurance_vault_keypair, insurance_vault_ixs = await make_create_vault_account_ixs(
        mint_pk, insurance_vault_authority, wallet, program.provider.connection
    )
    fee_vault_keypair, fee_vault_ixs = await make_create_vault_account_ixs(
        mint_pk, fee_vault_authority, wallet, program.provider.connection
    )

    create_marginfi_group_ix = make_init_marginfi_group_ix(
        InitMarginfiGroupArgs(
            bank_authority_pda_bump=liquidity_vault_bump,
            insurance_vault_authority_pda_bump=insurance_vault_bump,
            fee_vault_authority_pda_bump=fee_vault_bump,
        ),
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
        program.program_id,
    )
    tx = Transaction().add(
        create_marginfi_group_account_ix,
        *liquidity_vault_ixs,
        *insurance_vault_ixs,
        *fee_vault_ixs,
        create_marginfi_group_ix,
    )
    sig = await program.provider.send(
        tx,
        signers=[
            group_keypair,
            liquidity_vault_keypair,
            insurance_vault_keypair,
            fee_vault_keypair,
        ],
    )
    return group_pk, sig


async def configure_marginfi_group(
    group_pk: PublicKey, new_group_config: GroupConfig, wallet: Wallet, program: Program
) -> TransactionSignature:
    configure_marginfi_group_ix = make_configure_marginfi_group_ix(
        ConfigureMarginfiGroupArgs(config_arg=new_group_config),
        ConfigureMarginfiGroupAccounts(
            marginfi_group=group_pk, admin=wallet.public_key
        ),
        program.program_id,
    )
    tx = Transaction().add(configure_marginfi_group_ix)
    return await program.provider.send(tx)


def load_client(group_name: str = "marginfi_group_2") -> MarginfiClient:
    config = MarginfiConfig(Environment.DEVNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient(DEVNET_URL, commitment=Confirmed)
    provider = Provider(rpc_client, wallet)
    program = Program(load_idl(), config.program_id, provider=provider)
    _, group = load_marginfi_group(group_name)
    return MarginfiClient(config, program, group)


def load_marginfi_group_data(
    name: str = "marginfi_group_2",
) -> Tuple[PublicKey, MarginfiGroupData]:
    account_address, account_info = load_sample_account_info(name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    marginfi_group_data = MarginfiGroup.decode(account_data)
    return account_address, marginfi_group_data


def load_marginfi_group(
    name: str = "marginfi_group_2",
) -> Tuple[PublicKey, MarginfiGroup]:
    account_address, account_info = load_sample_account_info(name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    config = MarginfiConfig(Environment.DEVNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient(DEVNET_URL)
    provider = Provider(rpc_client, wallet)
    program = Program(load_idl(), config.program_id, provider=provider)
    marginfi_group = MarginfiGroup.from_account_data_raw(config, program, account_data)
    return account_address, marginfi_group


# --- Marginfi account


async def create_marginfi_account():
    config_base = MarginfiConfig(Environment.LOCALNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient(LOCALNET_URL, commitment=Confirmed)
    provider = Provider(rpc_client, wallet, opts=TxOpts(skip_preflight=True))
    program = Program(load_idl(), config_base.program_id, provider=provider)

    mint = await AsyncToken.create_mint(
        provider.connection,
        wallet.payer,
        wallet.public_key,
        6,
        TOKEN_PROGRAM_ID,
        skip_confirmation=True,
    )

    group_pk, sig = await create_marginfi_group(mint.pubkey, wallet, program)

    new_group_config = GroupConfig(
        bank=BankConfig(
            init_margin_ratio=int(1.15 * 10**6),
            maint_margin_ratio=int(1.05 * 10**6),
            account_deposit_limit=None,
            fixed_fee=None,
            interest_fee=None,
            lp_deposit_limit=None,
            scaling_factor_c=None,
        ),
        paused=False,
        admin=None,
    )
    await configure_marginfi_group(group_pk, new_group_config, wallet, program)

    config = MarginfiConfig(
        Environment.LOCALNET,
        overrides={
            "group_pk": group_pk,
            "collateral_mint_pk": mint.pubkey,
            "program_id": config_base.program_id,
        },
    )

    await rpc_client.confirm_transaction(sig)
    client = await MarginfiClient.fetch(config, wallet, rpc_client)

    marginfi_account, account_sig = await client.create_marginfi_account()
    await rpc_client.confirm_transaction(account_sig)

    ata = await mint.create_associated_token_account(wallet.public_key)
    mint_sig = await mint.mint_to(
        ata,
        wallet.public_key,
        1_000_000_000,
        [wallet.payer],
    )
    await rpc_client.confirm_transaction(mint_sig["result"])

    return marginfi_account


def load_marginfi_account_data(
    name: str = "marginfi_account_2",
) -> Tuple[PublicKey, MarginfiAccountData]:
    account_address, account_info = load_sample_account_info(name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    marginfi_account = MarginfiAccount.decode(account_data)
    return account_address, marginfi_account


def load_marginfi_account(
    account_name: str = "marginfi_account_2", group_name: str = "marginfi_group_2"
) -> Tuple[PublicKey, MarginfiAccount]:
    account_address, account_info = load_sample_account_info(account_name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    config = MarginfiConfig(Environment.DEVNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient(DEVNET_URL)
    provider = Provider(rpc_client, wallet)
    program = Program(load_idl(), config.program_id, provider=provider)
    _, group = load_marginfi_group(group_name)
    client = MarginfiClient(config, program, group)
    marginfi_account = MarginfiAccount.from_account_data_raw(
        account_address, client, account_data, group
    )
    return account_address, marginfi_account


# --- Misc


def load_sample_account_info(
    name: str = "marginfi_account_2",
) -> Tuple[PublicKey, AccountInfo]:
    account_data_path = os.path.join(
        os.path.dirname(__file__), f"fixtures/accounts/{name}.json"
    )
    with open(account_data_path) as f:
        account_info_raw = json.load(f)
    account_address = PublicKey(account_info_raw["pubkey"])
    account_info = json_to_account_info(account_info_raw["account"])
    return account_address, account_info
