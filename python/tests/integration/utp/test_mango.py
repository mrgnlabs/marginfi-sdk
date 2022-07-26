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
from marginpy import Environment
import mango
import marginpy.generated_client.types.mango_side as mango_side


PATH = Path(path.abspath(path.join(__file__, "../../../../")))
basics_fixture = (
    basics_fixture(environment=Environment.DEVNET, rpc_url=DEVNET_URL)
)
mango_bench = mango_bench()


@mark.asyncio
@mark.integration
@mark.devnet
class TestMangoAccount:
    async def test_mango_activate_deactivate(self, mango_bench: MangoBench) -> None:

        marginfi_account, _ = await mango_bench.client.create_marginfi_account()

        sig = await marginfi_account.mango.activate()
        await marginfi_account.reload()
        assert marginfi_account.mango.is_active
        sig = await marginfi_account.mango.deactivate()
        await marginfi_account.reload()
        assert marginfi_account.mango.is_active == False
        print(sig)

    async def test_mango_deposit_withdraw(
        self, 
        mango_bench: MangoBench,
    ) -> None:

        marginfi_account = mango_bench.account
        
        await marginfi_account.mango.activate()
        await marginfi_account.reload()

        await marginfi_account.mango.deposit(1)
        sig = await marginfi_account.mango.withdraw(1)
        print(sig)

    async def test_place_perp_order(
        self,
        mango_bench: MangoBench,
    ) -> None:
        marginfi_account = mango_bench.account

        await marginfi_account.mango.activate()
        await marginfi_account.reload()

        await marginfi_account.mango.deposit(100)

        with mango.ContextBuilder.build(cluster_name="devnet") as context:
            market = mango.market(context, "SOL-PERP")
        
        sig = await marginfi_account.mango.place_perp_order(
            perp_market=market,
            side=mango_side.Bid,
            price=50,
            quantity=1,
        )
        print(sig)

    async def test_cancel_perp_order(
        self,
        mango_bench: MangoBench,
    ) -> None:
        marginfi_account = mango_bench.account

        await marginfi_account.mango.activate()
        await marginfi_account.reload()

        await marginfi_account.mango.deposit(100)

        with mango.ContextBuilder.build(cluster_name="devnet") as context:
            market = mango.market(context, "SOL-PERP")
        
        # accept invalid ID
        await marginfi_account.mango.place_perp_order(
            perp_market=market,
            side=mango_side.Bid,
            price=50,
            quantity=1,
        )

        sig = await marginfi_account.mango.cancel_perp_order(
            perp_market=market,
            order_id=0,
            invalid_id_ok=True,
        )

        # do NOT accept invalid ID
        # await marginfi_account.mango.place_perp_order(
        #     perp_market=market,
        #     side=mango_side.Bid,
        #     price=50,
        #     quantity=1,
        # )

        # TODO ADD CLEAN ORDER_ID
        # sig = await marginfi_account.mango.cancel_perp_order(
        #     perp_market=market,
        #     order_id=0,
        #     invalid_id_ok=False,
        # )

        print(sig)
