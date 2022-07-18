from dataclasses import dataclass
from time import sleep
from typing import Optional, Callable

from anchorpy import Provider, Wallet, Program
from pytest import fixture
from pytest_asyncio import fixture as async_fixture
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment, Confirmed
from solana.rpc.types import TxOpts
from spl.token.async_client import AsyncToken
from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.instructions import get_associated_token_address

from marginpy import Bank, MarginfiGroup, MarginfiConfig, Environment, load_idl, MarginfiClient, MarginfiAccount
from marginpy.generated_client.types import MDecimal as DecimalData, Bank as BankDecoded
from marginpy.types import BankConfig, GroupConfig
from tests.config import LOCALNET_URL
from tests.utils import create_marginfi_group, configure_marginfi_group

REAL_ACCOUNT_PUBKEY_1 = PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
REAL_ACCOUNT_PUBKEY_2 = PublicKey("7bCwUANGE8YLWVde1eqDf8zhrwaJJeCUVLGDuPABdNTe")
7
SAMPLE_ACCOUNT_PUBKEY_1 = PublicKey("4HMfMtGPdbWEnTvDSWqa9c9TxgjdfsTKM2EX5GzTLKEe")
SAMPLE_ACCOUNT_PUBKEY_2 = PublicKey("Bt9DiJbRZXuSKhmxdSdn4jcApTs9xYqJhr5squkwo9H4")

MDECIMAL_ZERO = DecimalData(0, 0, 0, 0, )

SAMPLE_BANK = Bank(BankDecoded(
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    0,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    SAMPLE_ACCOUNT_PUBKEY_1,
    SAMPLE_ACCOUNT_PUBKEY_1,
    0,
    SAMPLE_ACCOUNT_PUBKEY_1,
    0,
    MDECIMAL_ZERO,
    SAMPLE_ACCOUNT_PUBKEY_1,
    0,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    []
))


@dataclass
class Basics:
    default_config: MarginfiConfig
    wallet: Wallet
    rpc_client: AsyncClient
    provider: Provider
    program: Program


def basics_fixture() -> Callable:
    @fixture()
    def _basics_fixture(environment: Environment = Environment.LOCALNET, rpc_url: str = LOCALNET_URL,
                        idl_path: Optional[str] = None,
                        commitment: Commitment = Confirmed) -> Basics:
        print(">>>>> BASICS FIXTURE STARTIN'")
        sleep(10.)

        default_config = MarginfiConfig(environment)
        wallet = Wallet.local()
        rpc_client = AsyncClient(rpc_url, commitment=commitment)
        provider = Provider(rpc_client, wallet, opts=TxOpts(skip_preflight=True))
        program = Program(load_idl(idl_path), default_config.program_id, provider=provider)

        return Basics(
            default_config=default_config,
            wallet=wallet,
            rpc_client=rpc_client,
            provider=provider,
            program=program
        )

    return _basics_fixture


def mint_fixture() -> Callable:
    @async_fixture
    async def _mint_fixture(basics_fixture, decimals: int = 6) -> AsyncToken:
        print(">>>>> MINT FIXTURE STARTIN'")
        return await AsyncToken.create_mint(
            basics_fixture.provider.connection,
            basics_fixture.wallet.payer,
            basics_fixture.wallet.public_key,
            decimals,
            TOKEN_PROGRAM_ID,
            skip_confirmation=True
        )

    return _mint_fixture


@dataclass
class Bench:
    basics: Basics
    config: MarginfiConfig
    group: MarginfiGroup
    mint: AsyncToken
    client: MarginfiClient


def bench_fixture() -> Callable:
    @async_fixture
    async def _bench_fixture(basics_fixture, mint_fixture) -> Bench:
        print(">>>>> BENCH FIXTURE STARTIN'")

        # Create / configure marginfi group used in the test
        group_pk, sig = await create_marginfi_group(mint_fixture.pubkey, basics_fixture.wallet, basics_fixture.program)
        new_group_config = GroupConfig(bank=BankConfig(init_margin_ratio=int(1.05 * 10 ** 6),
                                                       maint_margin_ratio=int(1.15 * 10 ** 6),
                                                       account_deposit_limit=None,
                                                       fixed_fee=None,
                                                       interest_fee=None,
                                                       lp_deposit_limit=None,
                                                       scaling_factor_c=None),
                                       paused=False,
                                       admin=None)
        sig = await configure_marginfi_group(group_pk, new_group_config, basics_fixture.wallet, basics_fixture.program)

        # Update marginfi config with newly-created group and mint
        config = MarginfiConfig(
            basics_fixture.default_config.environment,
            overrides={"group_pk": group_pk, "collateral_mint_pk": mint_fixture.pubkey,
                       "program_id": basics_fixture.default_config.program_id}
        )
        await basics_fixture.rpc_client.confirm_transaction(sig)

        # Fetch newly-created marginfi group
        group = await MarginfiGroup.fetch(config, basics_fixture.program)

        # Instantiate marginfi client to use during tests
        client = await MarginfiClient.fetch(config, basics_fixture.wallet, basics_fixture.rpc_client)

        # Fund the liquidity vault through an ephemeral marginfi account
        # (minting to vault directly does not appear on books)
        funding_account, account_sig = await client.create_marginfi_account()
        await basics_fixture.rpc_client.confirm_transaction(account_sig)
        funding_ata = await mint_fixture.create_associated_token_account(basics_fixture.wallet.public_key)
        mint_sig = await mint_fixture.mint_to(
            funding_ata,
            basics_fixture.wallet.public_key,
            1_000_000_000_000_000,
            [basics_fixture.wallet.payer],
        )
        await basics_fixture.rpc_client.confirm_transaction(mint_sig['result'])
        await funding_account.deposit(999_999_999)

        return Bench(
            basics=basics_fixture,
            config=config,
            group=group,
            mint=mint_fixture,
            client=client
        )

    return _bench_fixture


@dataclass
class User:
    account: MarginfiAccount


def user_fixture(deposits: float = 1_000) -> Callable:
    @async_fixture
    async def _user_fixture(bench_fixture: Bench) -> User:
        print(">>>>> USER FIXTURE STARTIN'")

        # Instantiate marginfi client to use during tests
        marginfi_account, account_sig = await bench_fixture.client.create_marginfi_account()
        await bench_fixture.basics.rpc_client.confirm_transaction(account_sig)

        ata = get_associated_token_address(
            bench_fixture.basics.wallet.public_key,
            bench_fixture.mint.pubkey
        )
        resp = await bench_fixture.mint.get_balance(ata)
        ata_account_info = resp["result"]["value"]

        amount_to_mint = int(deposits * 10 ** 6)
        if ata_account_info is None:
            ata = await bench_fixture.mint.create_associated_token_account(
                bench_fixture.basics.wallet.public_key,
                recent_blockhash=(
                    await bench_fixture.basics.rpc_client.get_recent_blockhash())['result']['value']['blockhash']
            )
        else:
            amount_to_mint = max(amount_to_mint - int(ata_account_info['amount']), 0)

        mint_sig = await bench_fixture.mint.mint_to(
            ata,
            bench_fixture.basics.wallet.public_key,
            amount_to_mint,
            [bench_fixture.basics.wallet.payer],
        )
        await bench_fixture.basics.rpc_client.confirm_transaction(mint_sig['result'])

        return User(account=marginfi_account)

    return _user_fixture
