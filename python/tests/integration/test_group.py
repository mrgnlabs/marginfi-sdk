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
from tests.utils import create_collateral_mint, create_marginfi_group, load_sample_account_info, load_marginfi_group_data

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
_localnet = localnet_fixture(path=PATH, timeout_seconds=5)


@mark.asyncio
@mark.integration
@mark.localnet
class TestMarginfiGroupLocalnet:

    async def test_create_group(self, _localnet) -> None:
        sleep(5.)

        config_base = MarginfiConfig(Environment.LOCALNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("http://127.0.0.1:8899", commitment=Confirmed)
        provider = Provider(rpc_client, wallet, opts=TxOpts(skip_preflight=True))
        program = Program(load_idl(), config_base.program_id, provider=provider)

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

@mark.asyncio
@mark.integration
@mark.devnet
class TestMarginfiGroupDevnet:

    def test_from_account_data_raw_factory(self):
        account_address, account_info = load_sample_account_info("marginfi_group_2")
        account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
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
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        account = MarginfiGroup.from_account_data(config, program, account_data)
        assert isinstance(account, MarginfiGroup)
        assert account.admin == PublicKey("E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog")
        assert account.pubkey == account_address
