from pytest import mark
from time import sleep
from tests.config import DEVNET_URL
from os import path
from pathlib import Path
from tests.fixtures import (
    user_fixture,
    User,
    bench_fixture,
    basics_fixture, 
    mint_fixture,
    basics_fixture,
    MangoBench, 
    mango_bench
)
from marginpy import Environment, MarginfiAccount
from marginpy.utp.mango import UtpMangoAccount, MangoConfig
from marginpy.types import UtpData

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
user = user_fixture()
bench_fixture = (
    bench_fixture()
)  # needs to be called that way to be found by `user_fixture`
mint_fixture = (
    mint_fixture()
)  # needs to be called that way to be found by `user_fixture`
basics_fixture = (
    basics_fixture(environment=Environment.DEVNET, rpc_url=DEVNET_URL)
)
mango_bench = mango_bench()


@mark.asyncio
@mark.integration
@mark.devnet
class TestMangoAccount:
    # async def test_mango_activate_deactivate(self, mango_bench: MangoBench):
    #     utp_data = UtpData(is_active=False, account_config=mango_bench.config.mango)

    #     marginfi_account, _ = await mango_bench.client.create_marginfi_account()

    #     sig = await marginfi_account.mango.activate()
    #     await marginfi_account.reload()
    #     assert marginfi_account.mango.is_active
    #     sig = await marginfi_account.mango.deactivate()
    #     await marginfi_account.reload()
    #     assert marginfi_account.mango.is_active == False
    #     print(sig)

    async def test_mango_deposit_withdraw(
        self, 
        mango_bench: MangoBench,
        user: User
    ) -> None:
        utp_data = UtpData(is_active=False, account_config=mango_bench.config.mango)

        marginfi_account = user.account

        await marginfi_account.deposit(1)
        await marginfi_account.reload()
        
        sig = await marginfi_account.mango.activate()
        await marginfi_account.reload()

        sig = await marginfi_account.mango.deposit(1)        
        print(sig)

        # await marginfi_account.reload()
        # sig = await marginfi_account.mango.withdraw(0.5)
        # print(sig)
