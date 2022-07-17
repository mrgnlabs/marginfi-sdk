from time import sleep
from os import path
from pathlib import Path

from anchorpy import localnet_fixture, Wallet, Provider, Program
from pytest import mark
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts

from marginpy import MarginfiConfig, Environment, load_idl, MarginfiGroup
from tests.utils import create_collateral_mint, create_marginfi_group

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
_localnet = localnet_fixture(path=PATH, timeout_seconds=5)


@mark.asyncio
@mark.integration
async def test_create_group(_localnet) -> None:
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
