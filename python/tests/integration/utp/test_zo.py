from pytest import mark
from tests.config import DEVNET_URL
from tests.fixtures import (
    ZoBench,
    basics_fixture,
    zo_bench,
)
from marginpy import Environment


basics_fixture = basics_fixture(environment=Environment.DEVNET, rpc_url=DEVNET_URL)
zo_bench = zo_bench()


@mark.asyncio
@mark.integration
@mark.devnet
class TestZoAccount:
    async def test_zo_activate_deactivate(self, zo_bench: ZoBench) -> None:

        marginfi_account, _ = await zo_bench.client.create_marginfi_account()

        await marginfi_account.zo.activate()
        assert marginfi_account.zo.is_active
        await marginfi_account.zo.deactivate()
        assert marginfi_account.zo.is_active == False

    async def test_zo_deposit_withdraw(
        self,
        zo_bench: ZoBench,
    ) -> None:

        marginfi_account = zo_bench.account
        await marginfi_account.zo.activate()

        await marginfi_account.zo.deposit(1)
        await marginfi_account.zo.withdraw(1)

    async def test_zo_create_open_orders_account(
        self,
        zo_bench: ZoBench,
    ) -> None:

        marginfi_account = zo_bench.account
        await marginfi_account.zo.activate()

        await marginfi_account.zo.create_perp_open_orders("SOL-PERP")

    # async def test_place_perp_order(
    #     self,
    #     mango_bench: MangoBench,
    # ) -> None:
    #     marginfi_account = mango_bench.account

    #     await marginfi_account.mango.activate()
    #     await marginfi_account.reload()

    #     await marginfi_account.mango.deposit(100)

    #     with mango.ContextBuilder.build(
    #         cluster_name=mango_bench.config.mango.cluster, group_name="devnet.2"
    #     ) as context:
    #         market = mango.market(context, "SOL-PERP")

    #     await marginfi_account.mango.place_perp_order(
    #         perp_market=market,
    #         side=mango_side.Bid,
    #         price=50,
    #         quantity=1,
    #     )

    # async def test_cancel_perp_order(
    #     self,
    #     mango_bench: MangoBench,
    # ) -> None:
    #     marginfi_account = mango_bench.account

    #     await marginfi_account.mango.activate()
    #     await marginfi_account.reload()

    #     await marginfi_account.mango.deposit(100)

    #     with mango.ContextBuilder.build(
    #         cluster_name=mango_bench.config.mango.cluster, group_name="devnet.2"
    #     ) as context:
    #         market = mango.market(context, "SOL-PERP")

    #     # accept invalid ID
    #     await marginfi_account.mango.place_perp_order(
    #         perp_market=market,
    #         side=mango_side.Bid,
    #         price=50,
    #         quantity=1,
    #         options=UtpMangoPlacePerpOrderOptions(order_type=PostOnlySlide()),
    #     )

    #     with mango.ContextBuilder.build(
    #         cluster_name=mango_bench.config.mango.cluster, group_name="devnet.2"
    #     ) as context:
    #         mango_group = mango.Group.load(context)
    #         mango_account = mango.Account.load(
    #             context, marginfi_account.mango.address, mango_group
    #         )

    #         market_operations = mango.operations(
    #             context,
    #             mango_bench.basics.wallet,
    #             mango_account,
    #             "SOL-PERP",
    #             dry_run=False,
    #         )
    #         orders = market_operations.load_my_orders()

    #     assert len(orders) == 1
    #     order = orders[0]

    #     await marginfi_account.mango.cancel_perp_order(
    #         perp_market=market,
    #         order_id=order.id,
    #         invalid_id_ok=False,
    #     )

    #     with raises(BaseException) as e:
    #         await marginfi_account.mango.cancel_perp_order(
    #             perp_market=market,
    #             order_id=order.id,
    #             invalid_id_ok=False,
    #         )

    #     await marginfi_account.mango.cancel_perp_order(
    #         perp_market=market,
    #         order_id=order.id,
    #         invalid_id_ok=True,
    #     )
