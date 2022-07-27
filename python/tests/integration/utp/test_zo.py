from pytest import mark, raises
from marginpy.utp.zo.utils.copy_pasta.zo import Zo
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

    async def test_zo_place_cancel_perp_order(
        self,
        zo_bench: ZoBench,
    ) -> None:
        marginfi_account = zo_bench.account

        await marginfi_account.zo.activate()
        await marginfi_account.zo.deposit(100)

        zo_client = await Zo.new(
            conn=zo_bench.basics.rpc_client,
            cluster="devnet",
            margin_pk=marginfi_account.zo.address,
            tx_opts=zo_bench.basics.provider.opts,
        )

        await marginfi_account.zo.create_perp_open_orders("SOL-PERP")
        await marginfi_account.zo.place_perp_order(
            market_symbol="SOL-PERP",
            order_type="PostOnly",
            is_long=True,
            price=33,
            size=0.1,
            client_id=888,
        )

        await zo_client.refresh(
            commitment=zo_bench.basics.provider.opts.preflight_commitment
        )
        assert len(zo_client.orders["SOL-PERP"]) == 1

        await marginfi_account.zo.cancel_perp_order(
            market_symbol="SOL-PERP",
            client_id=888,
        )

        await zo_client.refresh(
            commitment=zo_bench.basics.provider.opts.preflight_commitment
        )
        assert len(zo_client.orders["SOL-PERP"]) == 0

        with raises(BaseException):
            await marginfi_account.zo.cancel_perp_order(
                market_symbol="SOL-PERP",
                client_id=888,
            )

    async def test_zo_settle(
        self,
        zo_bench: ZoBench,
    ) -> None:
        marginfi_account = zo_bench.account

        await marginfi_account.zo.activate()
        await marginfi_account.zo.create_perp_open_orders("SOL-PERP")
        await marginfi_account.zo.settle_funds(market_symbol="SOL-PERP")
