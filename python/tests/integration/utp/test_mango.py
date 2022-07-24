from dataclasses import dataclass
from typing import Callable
from pytest import mark
from pytest_asyncio import fixture as async_fixture
from marginpy.group import MarginfiGroup
from tests.fixtures import Basics
from tests.config import DEVNET_URL
from solana.publickey import PublicKey
from os import path
from pathlib import Path
from marginpy import MarginfiConfig, Environment, MarginfiClient
from marginpy.types import BankConfig, GroupConfig
from tests.utils import (
    airdrop_collateral,
    configure_marginfi_group,
    create_marginfi_group,
    get_ata_or_create,
)
from tests.fixtures import basics_fixture


PATH = Path(path.abspath(path.join(__file__, "../../../../")))
basics_fixture = basics_fixture(environment=Environment.DEVNET, rpc_url=DEVNET_URL)


@dataclass
class MangoBench:
    basics: Basics
    config: MarginfiConfig
    group: MarginfiGroup
    client: MarginfiClient


def mango_bench() -> Callable:
    @async_fixture
    async def _bench_fixture(basics_fixture: Basics) -> MangoBench:
        # Create / configure marginfi group used in the test
        group_pk, _ = await create_marginfi_group(
            basics_fixture.default_config.collateral_mint_pk,
            basics_fixture.wallet,
            basics_fixture.program,
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
        # (airdropping to vault directly does not appear on books)
        funding_account, _ = await client.create_marginfi_account()
        funding_ata = await get_ata_or_create(
            basics_fixture.rpc_client,
            basics_fixture.wallet.payer,
            config.collateral_mint_pk,
        )

        DEVNET_USDC_FAUCET = PublicKey("B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN")
        await airdrop_collateral(
            basics_fixture.provider,
            1_000_000_000,
            config.collateral_mint_pk,
            funding_ata,
            DEVNET_USDC_FAUCET,
        )

        await funding_account.deposit(1_000)

        return MangoBench(
            basics=basics_fixture,
            config=config,
            group=group,
            client=client,
        )

    return _bench_fixture


@mark.integration
@mark.devnet
class TestMMangoAccount:
    def test_activation(self, mango_bench: MangoBench):
        pass
