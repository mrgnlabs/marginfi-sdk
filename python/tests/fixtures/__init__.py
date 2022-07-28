from dataclasses import dataclass
from time import sleep
from typing import Callable, Optional, cast

from anchorpy import Program, Provider, Wallet
from pytest import fixture
from pytest_asyncio import fixture as async_fixture
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment, Processed
from solana.rpc.types import TxOpts
from spl.token.async_client import AsyncToken
from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.core import _TokenCore
from spl.token.instructions import get_associated_token_address

from marginpy import (
    Bank,
    Environment,
    MarginfiAccount,
    MarginfiClient,
    MarginfiConfig,
    MarginfiGroup,
)
from marginpy.generated_client.types import Bank as BankDecoded
from marginpy.generated_client.types import MDecimal as DecimalData
from marginpy.types import BankConfig, GroupConfig
from marginpy.utils import load_idl
from tests.config import LOCALNET_URL
from tests.utils import (
    airdrop_collateral,
    configure_marginfi_group,
    create_marginfi_group,
    get_ata_or_create,
)

REAL_ACCOUNT_PUBKEY_1 = PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
REAL_ACCOUNT_PUBKEY_2 = PublicKey("7bCwUANGE8YLWVde1eqDf8zhrwaJJeCUVLGDuPABdNTe")

SAMPLE_ACCOUNT_PUBKEY_1 = PublicKey("4HMfMtGPdbWEnTvDSWqa9c9TxgjdfsTKM2EX5GzTLKEe")
SAMPLE_ACCOUNT_PUBKEY_2 = PublicKey("Bt9DiJbRZXuSKhmxdSdn4jcApTs9xYqJhr5squkwo9H4")

MDECIMAL_ZERO = DecimalData(
    0,
    0,
    0,
    0,
)

SAMPLE_BANK = Bank(
    BankDecoded(
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
        [],
    )
)


VALIDATOR_WARMUP_DURATION = 5.0


@dataclass
class Basics:
    default_config: MarginfiConfig
    wallet: Wallet
    rpc_client: AsyncClient
    provider: Provider
    program: Program


def basics_fixture(
    environment: Environment = Environment.LOCALNET,
    rpc_url: str = LOCALNET_URL,
    idl_path: Optional[str] = None,
    commitment: Commitment = Processed,
) -> Callable:
    @fixture()
    def _basics_fixture() -> Basics:
        sleep(VALIDATOR_WARMUP_DURATION)

        default_config = MarginfiConfig(environment)
        wallet = Wallet.local()
        rpc_client = AsyncClient(rpc_url, commitment=commitment)
        provider = Provider(
            rpc_client,
            wallet,
            opts=TxOpts(
                skip_preflight=False,
                preflight_commitment=commitment,
                skip_confirmation=False,
            ),
        )
        program = Program(
            load_idl(idl_path), default_config.program_id, provider=provider
        )

        return Basics(
            default_config=default_config,
            wallet=wallet,
            rpc_client=rpc_client,
            provider=provider,
            program=program,
        )

    return _basics_fixture


def mint_fixture() -> Callable:
    @async_fixture
    async def _mint_fixture(basics_fixture: Basics, decimals: int = 6) -> AsyncToken:
        # Allocate memory for the account
        balance_needed = await AsyncToken.get_min_balance_rent_for_exempt_for_mint(
            basics_fixture.provider.connection
        )
        # Construct transaction
        (
            token,
            txn,
            _,
            mint_account,
            _,
        ) = _TokenCore._create_mint_args(  # pylint: disable=protected-access
            basics_fixture.provider.connection,
            basics_fixture.wallet.payer,
            basics_fixture.wallet.public_key,
            decimals,
            TOKEN_PROGRAM_ID,
            basics_fixture.wallet.public_key,
            False,
            balance_needed,
            AsyncToken,
            basics_fixture.provider.connection.commitment,
        )
        # Send the two instructionsÎ
        await basics_fixture.provider.send(
            txn, [basics_fixture.wallet.payer, mint_account]
        )
        return cast(AsyncToken, token)

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
    async def _bench_fixture(basics_fixture: Basics, mint_fixture: AsyncToken) -> Bench:
        # Create / configure marginfi group used in the test
        group_pk, _ = await create_marginfi_group(
            mint_fixture.pubkey, basics_fixture.wallet, basics_fixture.program
        )
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
        await configure_marginfi_group(
            group_pk, new_group_config, basics_fixture.wallet, basics_fixture.program
        )

        # Update marginfi config with newly-created group and mint
        config = MarginfiConfig(
            basics_fixture.default_config.environment,
            overrides={
                "group_pk": group_pk,
                "collateral_mint_pk": mint_fixture.pubkey,
                "program_id": basics_fixture.default_config.program_id,
            },
        )

        # Fetch newly-created marginfi group
        group = await MarginfiGroup.fetch(config, basics_fixture.program)

        # Instantiate marginfi client to use during tests
        client = await MarginfiClient.fetch(
            config,
            basics_fixture.wallet,
            basics_fixture.rpc_client,
            opts=basics_fixture.provider.opts,
        )

        # Fund the liquidity vault through an ephemeral marginfi account
        # (minting to vault directly does not appear on books)
        funding_account, _ = await client.create_marginfi_account()
        funding_ata = await mint_fixture.create_associated_token_account(
            basics_fixture.wallet.public_key
        )
        await mint_fixture.mint_to(
            funding_ata,
            basics_fixture.wallet.public_key,
            1_000_000_000_000_000,
            [basics_fixture.wallet.payer],
            opts=basics_fixture.provider.opts,
        )
        await funding_account.deposit(1_000_000_000)

        return Bench(
            basics=basics_fixture,
            config=config,
            group=group,
            mint=mint_fixture,
            client=client,
        )

    return _bench_fixture


@dataclass
class User:
    account: MarginfiAccount


def user_fixture(deposits: float = 1_000) -> Callable:
    @async_fixture
    async def _user_fixture(bench_fixture: Bench) -> User:
        # Instantiate marginfi client to use during tests
        marginfi_account, _ = await bench_fixture.client.create_marginfi_account()

        ata = get_associated_token_address(
            bench_fixture.basics.wallet.public_key, bench_fixture.mint.pubkey
        )
        resp = await bench_fixture.mint.get_balance(ata)
        ata_account_info = resp["result"]["value"]

        amount_to_mint = int(deposits * 10**6)
        if ata_account_info is None:
            ata = await bench_fixture.mint.create_associated_token_account(
                bench_fixture.basics.wallet.public_key,
                recent_blockhash=(
                    await bench_fixture.basics.rpc_client.get_recent_blockhash()
                )["result"]["value"]["blockhash"],
            )
        else:
            amount_to_mint = max(amount_to_mint - int(ata_account_info["amount"]), 0)

        await bench_fixture.mint.mint_to(
            ata,
            bench_fixture.basics.wallet.public_key,
            amount_to_mint,
            [bench_fixture.basics.wallet.payer],
            opts=bench_fixture.basics.provider.opts,
        )

        return User(account=marginfi_account)

    return _user_fixture


# ================================
# MANGO
# ================================


@dataclass
class MangoBench:
    basics: Basics
    config: MarginfiConfig
    group: MarginfiGroup
    client: MarginfiClient
    account: MarginfiAccount


def mango_bench() -> Callable:
    @async_fixture
    async def _bench_fixture(basics_fixture: Basics) -> MangoBench:
        # Fetch existing marginfi group
        group = await MarginfiGroup.fetch(
            basics_fixture.default_config, basics_fixture.program
        )

        # Instantiate marginfi client to use during tests
        client = await MarginfiClient.fetch(
            basics_fixture.default_config,
            basics_fixture.wallet,
            basics_fixture.rpc_client,
            opts=basics_fixture.provider.opts,
        )

        # Fund the liquidity vault through an ephemeral marginfi account
        # (airdropping to vault directly does not appear on books)
        marginfi_account, _ = await client.create_marginfi_account()
        funding_ata = await get_ata_or_create(
            basics_fixture.rpc_client,
            basics_fixture.wallet.payer,
            basics_fixture.default_config.collateral_mint_pk,
        )

        DEVNET_USDC_FAUCET = PublicKey("B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN")
        await airdrop_collateral(
            basics_fixture.provider,
            1_000_000_000,
            basics_fixture.default_config.collateral_mint_pk,
            funding_ata,
            DEVNET_USDC_FAUCET,
        )

        await marginfi_account.deposit(1_000)
        await marginfi_account.reload()

        return MangoBench(
            basics=basics_fixture,
            config=basics_fixture.default_config,
            group=group,
            client=client,
            account=marginfi_account,
        )

    return _bench_fixture


# ================================
# 01
# ================================


@dataclass
class ZoBench:
    basics: Basics
    config: MarginfiConfig
    group: MarginfiGroup
    client: MarginfiClient
    account: MarginfiAccount


def zo_bench() -> Callable:
    @async_fixture
    async def _bench_fixture(basics_fixture: Basics) -> ZoBench:
        # Fetch existing marginfi group
        group = await MarginfiGroup.fetch(
            basics_fixture.default_config, basics_fixture.program
        )

        # Instantiate marginfi client to use during tests
        client = await MarginfiClient.fetch(
            basics_fixture.default_config,
            basics_fixture.wallet,
            basics_fixture.rpc_client,
            opts=basics_fixture.provider.opts,
        )

        # Fund the liquidity vault through an ephemeral marginfi account
        # (airdropping to vault directly does not appear on books)
        marginfi_account, _ = await client.create_marginfi_account()
        funding_ata = await get_ata_or_create(
            basics_fixture.rpc_client,
            basics_fixture.wallet.payer,
            basics_fixture.default_config.collateral_mint_pk,
        )

        DEVNET_USDC_FAUCET = PublicKey("B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN")
        await airdrop_collateral(
            basics_fixture.provider,
            1_000_000_000,
            basics_fixture.default_config.collateral_mint_pk,
            funding_ata,
            DEVNET_USDC_FAUCET,
        )

        await marginfi_account.deposit(1_000)
        await marginfi_account.reload()

        return MangoBench(
            basics=basics_fixture,
            config=basics_fixture.default_config,
            group=group,
            client=client,
            account=marginfi_account,
        )

    return _bench_fixture
