from typing import *
import asyncio
import os
import json
from datetime import datetime, timezone as tz
from typing_extensions import Self
from anchorpy import Idl, Program, Provider, Wallet
from solana.publickey import PublicKey
from solana.keypair import Keypair
from solana.rpc.commitment import Commitment, Processed
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import TxOpts

from . import util, types
from .config import configs, Config
from .types import (
    CollateralInfo,
    FundingInfo,
    MarketInfo,
    PositionInfo,
)
from .dex import Market, Orderbook, Order

T = TypeVar("T")


class ZoIndexer(Generic[T]):
    def __init__(self, d: dict[str, T], m: Callable[[str | int | PublicKey], str]):
        self.d = d
        self.m = m

    def __repr__(self):
        return self.d.__repr__()

    def __iter__(self):
        return self.d.items().__iter__()

    def __len__(self):
        return len(self.d)

    def __getitem__(self, i: str | int | PublicKey) -> T:
        return self.d[self.m(i)]


class Zo:
    _program: Program
    config: Config

    _markets: dict[str, MarketInfo]
    _collaterals: dict[str, CollateralInfo]
    _orderbook: dict[str, Orderbook]
    _balance: dict[str, float]
    _position: dict[str, float]

    dex_markets: dict[str, Market]
    _orders: dict[str, list[Order]]

    markets_map: dict[str | int, str]
    collaterals_map: dict[str | int, str]

    state: Any
    state_signer: PublicKey
    cache: Any
    margin: Any
    margin_key: PublicKey
    control: Any

    def __init__(
        self,
        program,
        config,
        state,
        state_signer,
        margin,
        margin_key,
    ):
        self._program = program
        self.config = config
        self.state = state
        self.state_signer = state_signer
        self.margin = margin
        self.margin_key = margin_key

    @staticmethod
    async def new(
        conn: AsyncClient,
        cluster: Literal["devnet", "mainnet"],
        payer: Keypair | None = None,
        url: str | None = None,
        margin_pk: PublicKey | None = None,
        tx_opts: TxOpts = TxOpts(
            max_retries=None,
            preflight_commitment=Processed,
            skip_confirmation=False,
            skip_preflight=False,
        ),
    ) -> Self:
        """Create a new client instance.

        Args:
            cluster: Which cluster to connect to.
            payer: The transaction payer and margin owner. Defaults to
                the local transaction payer.
            url: URL for the RPC endpoint.
            load_margin: Whether to load the associated margin account.
                If `False`, any transaction requiring a margin will fail.
            create_margin: Whether to create the associated margin
                account if it doesn't already exist.
            tx_opts: The transaction options.
        """

        if cluster not in configs.keys():
            raise TypeError(f"`cluster` must be one of: {configs.keys()}")

        config = configs[cluster]

        if url is None:
            url = config.CLUSTER_URL

        idl_path = os.path.join(os.path.dirname(__file__), "../idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)

        idl = Idl.from_json(raw_idl)
        wallet = Wallet(payer) if payer is not None else Wallet.local()
        provider = Provider(conn, wallet, opts=tx_opts)
        program = Program(idl, config.ZO_PROGRAM_ID, provider=provider)

        state = await program.account["State"].fetch(config.ZO_STATE_ID)
        state_signer, state_signer_nonce = util.state_signer_pda(
            state=config.ZO_STATE_ID, program_id=config.ZO_PROGRAM_ID
        )

        if state.signer_nonce != state_signer_nonce:
            raise ValueError(
                f"Invalid state key ({config.ZO_STATE_ID}) for program id"
                f" ({config.ZO_PROGRAM_ID})"
            )

        margin = None

        if margin_pk is not None:
            margin = await program.account["Margin"].fetch(margin_pk)

        zo = Zo(
            program,
            config,
            state,
            state_signer,
            margin,
            margin_pk,
        )
        await zo.refresh(commitment=tx_opts.preflight_commitment)
        return zo

    @property
    def program(self) -> Program:
        return self._program

    @property
    def provider(self) -> Provider:
        return self._program.provider

    @property
    def connection(self) -> AsyncClient:
        return self.provider.connection

    @property
    def wallet(self) -> Wallet:
        return self.provider.wallet

    @property
    def collaterals(self):
        """List of collaterals and their metadata."""
        return ZoIndexer(self._collaterals, lambda k: self.collaterals_map(k))

    @property
    def markets(self):
        """List of collaterals and markets metadata."""
        return ZoIndexer(self._markets, lambda k: self.markets_map(k))

    @property
    def orderbook(self):
        """Current state of the orderbook."""
        return ZoIndexer(self._orderbook, lambda k: self.markets_map(k))

    @property
    def balance(self):
        """Current account balance."""
        return ZoIndexer(self._balance, lambda k: self.collaterals_map(k))

    @property
    def position(self):
        """Current position."""
        return ZoIndexer(self._position, lambda k: self.markets_map(k))

    @property
    def orders(self):
        """Currently active orders."""
        return ZoIndexer(self._orders, lambda k: self.markets_map(k))

    async def refresh(self, *, commitment: Commitment = Processed):
        """Refresh the loaded accounts to see updates."""
        self.state, self.cache, _ = await asyncio.gather(
            self._program.account["State"].fetch(self.config.ZO_STATE_ID, commitment),
            self._program.account["Cache"].fetch(self.state.cache, commitment),
            self.__refresh_margin(),
        )

        self.__reload_collaterals()
        self.__reload_markets()
        self.__reload_balances()
        self.__reload_positions()
        await self.__reload_dex_markets(commitment=commitment)
        await self.__reload_orders(commitment=commitment)

    def collaterals_map(self, k: str | int | PublicKey) -> str:
        if isinstance(k, PublicKey):
            for i, c in enumerate(self.state.collaterals):
                if c.mint == k:
                    return self._collaterals_map[i]
            raise ValueError("")
        else:
            return self._collaterals_map[k]

    def markets_map(self, k: str | int | PublicKey) -> str:
        if isinstance(k, PublicKey):
            for i, m in enumerate(self.state.perp_markets):
                if m.dex_market == k:
                    return self._markets_map[i]
            raise ValueError("")
        else:
            return self._markets_map[k]

    def _get_open_orders_info(self, key: int | str, /):
        if isinstance(key, str):
            for k, v in self._markets_map.items():
                if v == key and isinstance(k, int):
                    key = k
                    break
            else:
                ValueError("")
        o = self.control.open_orders_agg[key]
        return o if o.key != PublicKey(0) else None

    def __reload_collaterals(self):
        map = {}
        collaterals = {}

        for i, c in enumerate(self.state.collaterals):
            if c.mint == PublicKey(0):
                break

            symbol = util.decode_symbol(c.oracle_symbol)
            map[symbol] = symbol
            map[i] = symbol

            collaterals[symbol] = CollateralInfo(
                mint=c.mint,
                oracle_symbol=symbol,
                decimals=c.decimals,
                weight=c.weight,
                liq_fee=c.liq_fee,
                is_borrowable=c.is_borrowable,
                optimal_util=c.optimal_util,
                optimal_rate=c.optimal_rate,
                max_rate=c.max_rate,
                og_fee=c.og_fee,
                is_swappable=c.is_swappable,
                serum_open_orders=c.serum_open_orders,
                max_deposit=c.max_deposit,
                dust_threshold=c.dust_threshold,
                vault=self.state.vaults[i],
            )

        self._collaterals_map = map
        self._collaterals = collaterals

    def __reload_markets(self):
        map = {}
        markets = {}

        for i, m in enumerate(self.state.perp_markets):
            if m.dex_market == PublicKey(0):
                break

            symbol = util.decode_symbol(m.symbol)
            map[symbol] = symbol
            map[i] = symbol

            oracle = None
            for o in reversed(self.cache.oracles):
                if util.decode_symbol(m.oracle_symbol) == util.decode_symbol(o.symbol):
                    oracle = o
                    break
            else:
                raise IndexError(f"oracle for market {symbol} not found")

            mark = self.cache.marks[i]

            price_adj = 10 ** (m.asset_decimals - 6)
            index_price = util.decode_wrapped_i80f48(oracle.price) * price_adj
            mark_price = util.decode_wrapped_i80f48(mark.price) * price_adj

            if types.perp_type_to_str(m.perp_type, program=self._program) == "square":
                index_price = index_price**2 / m.strike

            funding_sample_start = datetime.fromtimestamp(
                mark.twap.last_sample_start_time, tz=tz.utc
            )
            cumul_avg = util.decode_wrapped_i80f48(mark.twap.cumul_avg)
            if abs(cumul_avg) == 0 or funding_sample_start.minute == 0:
                funding_info = None
            else:
                daily_funding = cumul_avg / funding_sample_start.minute
                funding_info = FundingInfo(
                    daily=daily_funding,
                    hourly=daily_funding / 24,
                    apr=daily_funding * 100 * 365,
                )

            markets[symbol] = MarketInfo(
                address=m.dex_market,
                symbol=symbol,
                oracle_symbol=util.decode_symbol(m.oracle_symbol),
                perp_type=types.perp_type_to_str(m.perp_type, program=self._program),
                base_decimals=m.asset_decimals,
                base_lot_size=m.asset_lot_size,
                quote_decimals=6,
                quote_lot_size=m.quote_lot_size,
                strike=m.strike,
                base_imf=m.base_imf,
                liq_fee=m.liq_fee,
                index_price=index_price,
                mark_price=mark_price,
                funding_sample_start_time=funding_sample_start,
                funding_info=funding_info,
            )

        self._markets_map = map
        self._markets = markets

    def __reload_balances(self):
        if self.margin is None:
            return

        balances = {}
        for i, c in enumerate(self.margin.collateral):
            if i not in self._collaterals_map:
                break

            decimals = self.collaterals[i].decimals
            c = util.decode_wrapped_i80f48(c)
            m = self.cache.borrow_cache[i]
            m = m.supply_multiplier if c >= 0 else m.borrow_multiplier
            m = util.decode_wrapped_i80f48(m)

            balances[self._collaterals_map[i]] = util.small_to_big_amount(
                c * m, decimals=decimals
            )

        self._balance = balances

    def __reload_positions(self):
        if self.margin is None:
            return

        positions = {}
        for s, m in self.markets:
            if (oo := self._get_open_orders_info(s)) is not None:
                positions[s] = PositionInfo(
                    size=util.small_to_big_amount(
                        abs(oo.pos_size), decimals=m.base_decimals
                    ),
                    value=util.small_to_big_amount(
                        abs(oo.native_pc_total), decimals=m.quote_decimals
                    ),
                    realized_pnl=util.small_to_big_amount(
                        oo.realized_pnl, decimals=m.base_decimals
                    ),
                    funding_index=util.small_to_big_amount(
                        oo.funding_index, decimals=m.quote_decimals
                    ),
                    side="long" if oo.pos_size >= 0 else "short",
                )
            else:
                positions[s] = PositionInfo(
                    size=0, value=0, realized_pnl=0, funding_index=1, side="long"
                )

        self._position = positions
        pass

    async def __reload_dex_markets(self, *, commitment: None | Commitment = None):
        ks = [
            m.dex_market
            for m in self.state.perp_markets
            if m.dex_market != PublicKey(0)
        ]
        res: Any = await self.connection.get_multiple_accounts(
            ks, encoding="base64", commitment=commitment
        )
        res = res["result"]["value"]
        self.dex_markets = {
            self._markets_map[i]: Market.from_base64(res[i]["data"][0])
            for i in range(len(self._markets))
        }

    async def __reload_orders(self, *, commitment: None | Commitment = None):
        ks = []
        for i in range(len(self._markets)):
            mkt = self.dex_markets[self._markets_map[i]]
            ks.extend((mkt.bids, mkt.asks))

        res: Any = await self.connection.get_multiple_accounts(
            ks, encoding="base64", commitment=commitment
        )
        res = res["result"]["value"]
        orders = self.margin and {}
        orderbook = {}

        for i in range(len(self._markets)):
            mkt = self.dex_markets[self._markets_map[i]]
            ob = mkt._decode_orderbook_from_base64(
                res[2 * i]["data"][0], res[2 * i + 1]["data"][0]
            )
            orderbook[self._markets_map[i]] = ob

            if self.margin is not None:
                os = []
                for slab in [ob.bids, ob.asks]:
                    for o in slab:
                        if o.control == self.margin.control:
                            os.append(o)
                orders[self._markets_map[i]] = os

        self._orderbook = orderbook
        self._orders = orders

    async def __refresh_margin(self, *, commitment: None | Commitment = None):
        if self.margin_key is not None:
            self.margin, self.control = await asyncio.gather(
                self._program.account["Margin"].fetch(self.margin_key, commitment),
                self._program.account["Control"].fetch(self.margin.control, commitment),
            )

    # async def deposit(
    #     self,
    #     amount: float,
    #     /,
    #     *,
    #     mint: PublicKey,
    #     repay_only: bool = False,
    #     token_account: None | PublicKey = None,
    # ) -> str:
    #     """Deposit collateral into the margin account.

    #     Args:
    #         amount: The amount to deposit, in big units (e.g.: 1.5 SOL, 0.5 BTC).
    #         mint: Mint of the collateral being deposited.
    #         repay_only: If true, will only deposit up to the amount borrowed.
    #         token_account: The token account to deposit from, defaulting to
    #             the associated token account.

    #     Returns:
    #         The transaction signature.
    #     """
    #     if token_account is None:
    #         token_account = get_associated_token_address(self.wallet.public_key, mint)

    #     decimals = self._collaterals[mint].decimals
    #     amount = util.big_to_small_amount(amount, decimals=decimals)

    #     return await self.program.rpc["deposit"](
    #         repay_only,
    #         amount,
    #         ctx=Context(
    #             accounts={
    #                 "state": self.config.ZO_STATE_ID,
    #                 "state_signer": self.state_signer,
    #                 "cache": self.state.cache,
    #                 "authority": self.wallet.public_key,
    #                 "margin": self.margin_key,
    #                 "token_account": token_account,
    #                 "vault": self._collaterals[mint].vault,
    #                 "token_program": TOKEN_PROGRAM_ID,
    #             }
    #         ),
    #     )

    # async def withdraw(
    #     self,
    #     amount: float,
    #     /,
    #     *,
    #     mint: PublicKey,
    #     allow_borrow: bool = False,
    #     token_account: None | PublicKey = None,
    # ) -> str:
    #     """Withdraw collateral from the margin account.

    #     Args:
    #         amount: The amount to withdraw, in big units (e.g.: 1.5 SOL, 0.5 BTC).
    #         mint: The mint of the collateral.
    #         allow_borrow: If true, will allow borrowing.
    #         token_account: If false, will only be able to withdraw up to
    #             the amount deposited. If false, amount parameter can be
    #             set to an arbitrarily large number to ensure that all
    #             deposits are fully withdrawn.

    #     Returns:
    #         The transaction signature.
    #     """

    #     if token_account is None:
    #         token_account = get_associated_token_address(self.wallet.public_key, mint)

    #     decimals = self._collaterals[mint].decimals
    #     amount = util.big_to_small_amount(amount, decimals=decimals)

    #     return await self.program.rpc["withdraw"](
    #         allow_borrow,
    #         amount,
    #         ctx=Context(
    #             accounts={
    #                 "state": self.config.ZO_STATE_ID,
    #                 "state_signer": self.state_signer,
    #                 "cache": self.state.cache,
    #                 "authority": self.wallet.public_key,
    #                 "margin": self.margin_key,
    #                 "control": self.margin.control,
    #                 "token_account": token_account,
    #                 "vault": self._collaterals[mint].vault,
    #                 "token_program": TOKEN_PROGRAM_ID,
    #             }
    #         ),
    #     )

    # async def place_order(
    #     self,
    #     size: float,
    #     price: float,
    #     side: Side,
    #     *,
    #     symbol: str,
    #     order_type: OrderType,
    #     limit: int = 10,
    #     client_id: int = 0,
    #     max_ts: None | int = None,
    # ) -> str:
    #     """Place an order on the orderbook.

    #     Args:
    #         size: The maximum amount of big base units to buy or sell.
    #         price: The limit price in big quote units per big base
    #             units, e.g. 50000 USD/SOL.
    #         side: Whether to place a bid or an ask.
    #         symbol: The market symbol, e.g. "BTC-PERP".
    #         order_type: The order type.
    #         limit: If this order is taking, the limit sets the number of
    #             maker orders the fill will go through, until stopping and
    #             posting. If running into compute unit issues, then set
    #             this number lower.
    #         client_id: Used to tag an order with a unique id, which can
    #             be used to cancel this order through
    #             cancelPerpOrderByClientId. For optimal use, make sure
    #             all ids for every order is unique.
    #         max_ts: If the current on-chain Unix timestamp exceeds this
    #             value, then the order will not go through.

    #     Returns:
    #         The transaction signature.
    #     """

    #     mkt = self.dex_markets[symbol]
    #     info = self._markets[symbol]
    #     is_long = side == "bid"
    #     price = util.price_to_lots(
    #         price,
    #         base_decimals=info.base_decimals,
    #         quote_decimals=info.quote_decimals,
    #         base_lot_size=info.base_lot_size,
    #         quote_lot_size=info.quote_lot_size,
    #     )
    #     order_type_: Any = types.order_type_from_str(order_type, program=self.program)
    #     taker_fee = config.taker_fee(info.perp_type)
    #     fee_multiplier = 1 + taker_fee if is_long else 1 - taker_fee
    #     base_qty = util.size_to_lots(
    #         size, decimals=info.base_decimals, lot_size=info.base_lot_size
    #     )
    #     quote_qty = round(price * fee_multiplier * base_qty * info.quote_lot_size)

    #     pre_ixs = []
    #     oo_key = None
    #     oo_info = self._get_open_orders_info(symbol)

    #     if oo_info is not None:
    #         oo_key = oo_info.key
    #     else:
    #         oo_key, _ = util.open_orders_pda(
    #             control=self.margin.control,
    #             dex_market=info.address,
    #             program_id=self.program.program_id,
    #         )
    #         pre_ixs = [
    #             self.program.instruction["create_perp_open_orders"](
    #                 ctx=Context(
    #                     accounts={
    #                         "state": self.config.ZO_STATE_ID,
    #                         "state_signer": self.state_signer,
    #                         "authority": self.wallet.public_key,
    #                         "payer": self.wallet.public_key,
    #                         "margin": self.margin_key,
    #                         "control": self.margin.control,
    #                         "open_orders": oo_key,
    #                         "dex_market": info.address,
    #                         "dex_program": self.config.ZO_DEX_ID,
    #                         "rent": SYSVAR_RENT_PUBKEY,
    #                         "system_program": SYS_PROGRAM_ID,
    #                     },
    #                     pre_instructions=pre_ixs,
    #                 )
    #             )
    #         ]

    #     return await self.program.rpc["place_perp_order_with_max_ts"](
    #         is_long,
    #         price,
    #         base_qty,
    #         quote_qty,
    #         order_type_,
    #         limit,
    #         client_id,
    #         max_ts if max_ts is not None else 2**63 - 1,
    #         ctx=Context(
    #             accounts={
    #                 "state": self.config.ZO_STATE_ID,
    #                 "state_signer": self.state_signer,
    #                 "cache": self.state.cache,
    #                 "authority": self.wallet.public_key,
    #                 "margin": self.margin_key,
    #                 "control": self.margin.control,
    #                 "open_orders": oo_key,
    #                 "dex_market": info.address,
    #                 "req_q": mkt.req_q,
    #                 "event_q": mkt.event_q,
    #                 "market_bids": mkt.bids,
    #                 "market_asks": mkt.asks,
    #                 "dex_program": self.config.ZO_DEX_ID,
    #                 "rent": SYSVAR_RENT_PUBKEY,
    #             }
    #         ),
    #     )

    # async def __cancel_order(
    #     self,
    #     *,
    #     symbol: str,
    #     side: None | Side = None,
    #     order_id: None | int = None,
    #     client_id: None | int = None,
    # ):
    #     mkt = self.dex_markets[symbol]
    #     oo = self._get_open_orders_info(symbol)

    #     if oo is None:
    #         raise ValueError("open orders account is uninitialized")

    #     return await self.program.rpc["cancel_perp_order"](
    #         order_id,
    #         side == "bid",
    #         client_id,
    #         ctx=Context(
    #             accounts={
    #                 "state": self.config.ZO_STATE_ID,
    #                 "cache": self.state.cache,
    #                 "authority": self.wallet.public_key,
    #                 "margin": self.margin_key,
    #                 "control": self.margin.control,
    #                 "open_orders": oo.key,
    #                 "dex_market": mkt.own_address,
    #                 "market_bids": mkt.bids,
    #                 "market_asks": mkt.asks,
    #                 "event_q": mkt.event_q,
    #                 "dex_program": self.config.ZO_DEX_ID,
    #             }
    #         ),
    #     )

    # async def cancel_order_by_order_id(
    #     self, order_id: int, side: Side, *, symbol: str
    # ) -> str:
    #     """Cancel an order on the orderbook using the `order_id`.

    #     Args:
    #         order_id: The order id of the order to cancel. To get the
    #             order_id, see the `orders` field.
    #         side: Whether the order is a bid or an ask.
    #         symbol: The market symbol, e.g. "BTC-PERP".

    #     Returns:
    #         The transaction signature.
    #     """
    #     return await self.__cancel_order(symbol=symbol, order_id=order_id, side=side)

    # async def cancel_order_by_client_id(self, client_id: int, *, symbol: str) -> str:
    #     """Cancel an order on the orderbook using the `client_id`.

    #     Args:
    #         client_id: The client id that was assigned to the order
    #             when it was placed..
    #         symbol: The market symbol, e.g. "BTC-PERP".

    #     Returns:
    #         The transaction signature.
    #     """
    #     return await self.__cancel_order(symbol=symbol, client_id=client_id)
