from os import path
from pathlib import Path
from anchorpy import localnet_fixture, Wallet, Provider, Program
from pytest import mark
from solana.rpc.async_api import AsyncClient

from marginpy import MarginfiConfig, Environment, load_idl, MarginfiClient, MarginfiAccount
from tests.fixtures import REAL_ACCOUNT_PUBKEY_2, User, user_fixture, bench_fixture, mint_fixture, basics_fixture
from tests.utils import load_marginfi_account
from tests.config import DEVNET_URL
from tests.utils import load_marginfi_group

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
_localnet = localnet_fixture(path=PATH, timeout_seconds=5, scope='function')
user = user_fixture()
bench_fixture = bench_fixture()  # needs to be called that way to be found by `user_fixture`
mint_fixture = mint_fixture()  # needs to be called that way to be found by `user_fixture`
basics_fixture = basics_fixture()  # needs to be called that way to be found by `user_fixture`


@mark.asyncio
@mark.integration
@mark.localnet
class TestMarginfiAccountLocalnet:

    async def test_deposit(self, _localnet, user: User) -> None:
        marginfi_account = user.account

        await marginfi_account.deposit(1)
        await marginfi_account.reload()
        assert marginfi_account.deposits == 1

        await marginfi_account.withdraw(1)
        await marginfi_account.reload()
        assert marginfi_account.deposits == 0


@mark.asyncio
@mark.integration
@mark.devnet
class TestMarginfiAccountDevnet:

    async def test_fetch(self):
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient(DEVNET_URL)
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        _, group = load_marginfi_group("marginfi_group_2")
        client = MarginfiClient(config, program, group)
        marginfi_account_pk = REAL_ACCOUNT_PUBKEY_2
        await MarginfiAccount.fetch(marginfi_account_pk, client)

    async def test_reload(self):
        _, account = load_marginfi_account("marginfi_account_2")
        await account.reload()
