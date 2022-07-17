from time import sleep
from os import path
from pathlib import Path
from anchorpy import localnet_fixture, Wallet, Provider, Program
from pytest import mark
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
from marginpy import MarginfiConfig, Environment, load_idl, MarginfiClient, MarginfiAccount
from marginpy.types import GroupConfig, BankConfig
from tests.utils import create_collateral_mint, create_marginfi_group, configure_marginfi_group
from tests.fixtures import REAL_ACCOUNT_PUBKEY_2
from tests.utils import load_marginfi_group, load_marginfi_account

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
_localnet = localnet_fixture(path=PATH, timeout_seconds=5)

@mark.asyncio
@mark.integration
@mark.localnet
class TestMarginfiAccountLocalnet:
    
    async def test_create_account(self, _localnet) -> None:
        sleep(5.)

        config_base = MarginfiConfig(Environment.LOCALNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("http://127.0.0.1:8899", commitment=Confirmed)
        provider = Provider(rpc_client, wallet, opts=TxOpts(skip_preflight=True))
        program = Program(load_idl(), config_base.program_id, provider=provider)

        mint_pk, _ = await create_collateral_mint(wallet, program)
        group_pk, sig = await create_marginfi_group(mint_pk, wallet, program)

        new_group_config = GroupConfig(bank=BankConfig(init_margin_ratio=int(1.05 * 10 ** 6),
                                                    maint_margin_ratio=int(1.15 * 10 ** 6),
                                                    account_deposit_limit=None,
                                                    fixed_fee=None,
                                                    interest_fee=None,
                                                    lp_deposit_limit=None,
                                                    scaling_factor_c=None),
                                    paused=False,
                                    admin=None)
        await configure_marginfi_group(group_pk, new_group_config, wallet, program)
        config = MarginfiConfig(Environment.LOCALNET, overrides={"group_pk": group_pk, "collateral_mint_pk": mint_pk})

        await rpc_client.confirm_transaction(sig)
        client = await MarginfiClient.fetch(config, wallet, rpc_client)

        marginfi_account, _ = await client.create_marginfi_account()

        assert marginfi_account.group.pubkey == group_pk
        assert marginfi_account.deposits == 0
        assert marginfi_account.borrows == 0

@mark.asyncio
@mark.integration
@mark.devnet
class TestMarginfiAccountDevnet:

    async def test_fetch(self):
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        _, group = load_marginfi_group("marginfi_group_2")
        client = MarginfiClient(config, program, group)
        marginfi_account_pk = REAL_ACCOUNT_PUBKEY_2
        await MarginfiAccount.fetch(marginfi_account_pk, client)

    async def test_reload(self):
        _, account = load_marginfi_account("marginfi_account_2")
        await account.reload()
