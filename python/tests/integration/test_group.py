from time import sleep
from os import path
from pathlib import Path

from anchorpy import localnet_fixture, Wallet, Provider, Program
from pytest import mark
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
from solana.publickey import PublicKey

from marginpy import MarginfiConfig, Environment, load_idl, MarginfiGroup
from marginpy.utils import b64str_to_bytes
from tests.utils import create_collateral_mint, create_marginfi_group, load_sample_account_info, load_marginfi_group_data, \
    configure_marginfi_group
from marginpy.types import BankConfig, GroupConfig
from tests.config import LOCALNET_URL, DEVNET_URL
from tests.fixtures import User, user_fixture, bench_fixture, mint_fixture, basics_fixture


PATH = Path(path.abspath(path.join(__file__, "../../../../")))
_localnet = localnet_fixture(path=PATH, timeout_seconds=5, scope='function')
user1 = user_fixture()
bench_fixture = bench_fixture()  # needs to be called that way to be found by `user_fixture`
mint_fixture = mint_fixture()  # needs to be called that way to be found by `user_fixture`
basics_fixture = basics_fixture()  # needs to be called that way to be found by `user_fixture`


@mark.asyncio
@mark.integration
@mark.localnet
class TestMarginfiGroupLocalnet:

    async def test_create_group(self, _localnet, basics_fixture) -> None:
        sleep(5.)

        wallet = basics_fixture.wallet
        rpc_client = basics_fixture.rpc_client
        program = basics_fixture.program

        mint_pk, _ = await create_collateral_mint(wallet, program)
        group_pk, sig = await create_marginfi_group(mint_pk, wallet, program)

        config = MarginfiConfig(Environment.LOCALNET, overrides={"group_pk": group_pk, "collateral_mint_pk": mint_pk})

        await rpc_client.confirm_transaction(sig)
        group = await MarginfiGroup.fetch(config, program)

        assert group.pubkey == group_pk
        assert group.admin == wallet.public_key
        assert group.bank.mint == mint_pk
        assert group.bank.scaling_factor_c == 0
        assert group.bank.init_margin_ratio == 1
        assert group.bank.maint_margin_ratio == 1
        assert group.bank.fixed_fee == 0
        assert group.bank.interest_fee == 0
        assert group.bank.native_borrow_balance == 0
        assert group.bank.native_deposit_balance == 0

    async def test_configure_group(self, _localnet, bench_fixture) -> None:
        sleep(5.)
        new_group_config = GroupConfig(bank=BankConfig(init_margin_ratio=int(1.15 * 10 ** 6),
                                                   maint_margin_ratio=int(1.05 * 10 ** 6),
                                                   account_deposit_limit=None,
                                                   fixed_fee=None,
                                                   interest_fee=None,
                                                   lp_deposit_limit=None,
                                                   scaling_factor_c=None),
                                   paused=False,
                                   admin=bench_fixture.basics.wallet.public_key)

        sig = await configure_marginfi_group(
            bench_fixture.group.pubkey,
            new_group_config,
            bench_fixture.basics.wallet,
            bench_fixture.basics.program
        )

        await bench_fixture.basics.rpc_client.confirm_transaction(sig)
        sleep(30.)
        group = await MarginfiGroup.fetch(bench_fixture.config, bench_fixture.basics.program)

        assert group.pubkey == bench_fixture.group.pubkey
        assert group.admin == bench_fixture.basics.wallet.public_key
        assert group.bank.mint == bench_fixture.mint.pubkey
        assert group.bank.scaling_factor_c == 0
        assert group.bank.init_margin_ratio == 1.15
        assert group.bank.maint_margin_ratio == 1.05
        assert group.bank.fixed_fee == 0
        assert group.bank.interest_fee == 0
        assert group.bank.native_borrow_balance == 0
        assert group.bank.native_deposit_balance == 999_999_999

    # @todo this test needs to be more robust
    async def test_update_interest_accumulator(self, _localnet, user1: User) -> None:
        marginfi_account = user1.account
        await marginfi_account.deposit(1)
        await marginfi_account.group.update_interest_accumulator()


@mark.asyncio
@mark.integration
@mark.devnet
class TestMarginfiGroupDevnet:

    def test_from_account_data_raw_factory(self):
        account_address, account_info = load_sample_account_info("marginfi_group_2")
        account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient(DEVNET_URL)
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        account = MarginfiGroup.from_account_data_raw(config, program, account_data)
        assert isinstance(account, MarginfiGroup)
        assert account.admin == PublicKey("E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog")
        assert account.pubkey == account_address

    def test_from_account_data_factory(self):
        account_address, account_data = load_marginfi_group_data("marginfi_group_2")
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient(DEVNET_URL)
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        account = MarginfiGroup.from_account_data(config, program, account_data)
        assert isinstance(account, MarginfiGroup)
        assert account.admin == PublicKey("E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog")
        assert account.pubkey == account_address
