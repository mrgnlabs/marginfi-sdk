from os import path
from pathlib import Path
from time import sleep

from anchorpy import Program, Provider, Wallet, localnet_fixture
from marginpy import Environment, MarginfiClient, MarginfiConfig
from marginpy.types import AccountType, BankConfig, GroupConfig
from marginpy.utils.misc import load_idl
from pytest import mark
from solana.rpc.async_api import AsyncClient

from tests.config import DEVNET_URL
from tests.fixtures import REAL_ACCOUNT_PUBKEY_2, Basics, basics_fixture
from tests.utils import (
    configure_marginfi_group,
    create_collateral_mint,
    create_marginfi_group,
    load_client,
    load_marginfi_group,
)

PATH = Path(path.abspath(path.join(__file__, "../../../../../")))
localnet = localnet_fixture(path=PATH, timeout_seconds=5, scope="function")
basics = basics_fixture()


@mark.asyncio
@mark.integration
@mark.localnet
class TestMarginfiClientLocalnet:
    async def test_create_marginfi_account(self, localnet, basics: Basics) -> None:
        sleep(5.0)

        # config_base = MarginfiConfig(Environment.LOCALNET)
        # wallet = Wallet.local()
        # rpc_client = AsyncClient(LOCALNET_URL, commitment=Confirmed)
        # provider = Provider(rpc_client, wallet, opts=TxOpts(skip_preflight=True))
        # program = Program(load_idl(), config_base.program_id, provider=provider)

        mint_pk, _ = await create_collateral_mint(basics.wallet, basics.program)
        group_pk, _ = await create_marginfi_group(
            mint_pk, basics.wallet, basics.program
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
            group_pk, new_group_config, basics.wallet, basics.program
        )

        basics.default_config.group_pk = group_pk
        basics.default_config.collateral_mint_pk = mint_pk

        client = await MarginfiClient.fetch(
            basics.default_config, basics.wallet, basics.rpc_client, basics.tx_opts
        )

        marginfi_account, _ = await client.create_marginfi_account()

        assert marginfi_account.group.pubkey == group_pk
        assert marginfi_account.deposits == 0
        assert marginfi_account.borrows == 0


@mark.integration
@mark.devnet
class TestMarginfiClient:
    def test_constructor(self):
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient(DEVNET_URL)
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        _, group = load_marginfi_group("marginfi_group_2")
        client = MarginfiClient(config, program, group)

        assert isinstance(client, MarginfiClient)

    # /!\ more test setup required to allow for more stringent tests /!\

    @mark.asyncio
    async def test_load_own_marginfi_accounts(self):
        client = load_client()
        await client.load_own_marginfi_accounts()

    @mark.asyncio
    async def test_load_all_marginfi_account_addresses(self):
        client = load_client()
        await client.load_all_marginfi_account_addresses()

    @mark.asyncio
    async def test_load_all_marginfi_accounts(self):
        client = load_client()
        await client.load_all_marginfi_accounts()

    @mark.asyncio
    async def test_load_marginfi_account(self):
        client = load_client()
        account = await client.load_marginfi_account(REAL_ACCOUNT_PUBKEY_2)

        config = MarginfiConfig(Environment.DEVNET)
        assert account.group.pubkey == config.group_pk
        assert account.pubkey == REAL_ACCOUNT_PUBKEY_2
        assert account.client == client

    @mark.asyncio
    async def test_load_all_program_account_addresses(self):
        client = load_client()
        await client.load_all_program_account_addresses(AccountType.MARGINFI_GROUP)

    @mark.asyncio
    async def test_create_marginfi_account(self):
        client = load_client(group_name="marginfi_group_2")
        config = MarginfiConfig(Environment.DEVNET)

        account_address, _ = await client.create_marginfi_account()
        account = await client.load_marginfi_account(account_address.pubkey)
        assert account.group.pubkey == config.group_pk
