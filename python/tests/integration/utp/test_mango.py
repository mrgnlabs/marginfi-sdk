from pytest import mark
from tests.config import DEVNET_URL
from os import path
from pathlib import Path
from tests.fixtures import basics_fixture, MangoBench, mango_bench
from marginpy import Environment, MarginfiAccount
from marginpy.utp.mango import UtpMangoAccount, MangoConfig
from marginpy.types import UtpData

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
basics_fixture = basics_fixture(environment=Environment.DEVNET, rpc_url=DEVNET_URL)
mango_bench = mango_bench()


# @dataclass
# class MangoBench:
#     basics: Basics
#     config: MarginfiConfig
#     group: MarginfiGroup
#     client: MarginfiClient


@mark.asyncio
@mark.integration
@mark.devnet
class TestMangoAccount:
    async def test_activate_deactivate(self, mango_bench: MangoBench):
        utp_data = UtpData(is_active=False, account_config=mango_bench.config.mango)

        marginfi_account, _ = await mango_bench.client.create_marginfi_account()

        sig = await marginfi_account.mango.activate()
        await marginfi_account.reload()
        sig = await marginfi_account.mango.deactivate()
        print(sig)

    # async def test_deposit_withdraw(self, mango_bench: MangoBench):
    #     utp_data = UtpData(
    #         is_active = False,
    #         account_config = mango_bench.config.mango
    #     )

    #     marginfi_account, _ = await mango_bench.client.create_marginfi_account()

    #     mango_account = UtpMangoAccount(
    #         mango_bench.client,
    #         marginfi_account,
    #         utp_data
    #     )

    #     await mango_account.activate()
    #     await mango_account.deposit(1)
    #     await mango_account.withdraw(1)
