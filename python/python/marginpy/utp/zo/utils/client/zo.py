import asyncio
import json
import os
from datetime import datetime
from datetime import timezone as tz
from typing import Any, Callable, Generic, List, Literal, TypeVar, Union

from anchorpy import Idl, Program, Provider, Wallet
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment, Processed
from solana.rpc.types import TxOpts

from . import types, util
from .config import Config, configs
from .dex import Market, Order, Orderbook
from .types import CollateralInfo, FundingInfo, MarketInfo, PositionInfo

T = TypeVar("T")


class ZoIndexer(Generic[T]):
    def __init__(self, d: dict[str, T], m: Callable[[str or int or PublicKey], str]):
        self.d = d
        self.m = m

    def __repr__(self):
        return self.d.__repr__()

    def __iter__(self):
        return self.d.items().__iter__()

    def __len__(self):
        return len(self.d)

    def __getitem__(self, i: str or int or PublicKey) -> T:
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

    _markets_map: dict[str or int, str]
    _collaterals_map: dict[str or int, str]

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
        payer: Keypair or None = None,
        url: str or None = None,
        margin_pk: PublicKey or None = None,
        tx_opts: TxOpts = TxOpts(
            max_retries=None,
            preflight_commitment=Processed,
            skip_confirmation=False,
            skip_preflight=False,
        ),
    ):
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
            url = config.cluster_url

        idl_path = os.path.join(os.path.dirname(__file__), "../idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)

        idl = Idl.from_json(raw_idl)
        wallet = Wallet(payer) if payer is not None else Wallet.local()
        provider = Provider(conn, wallet, opts=tx_opts)
        program = Program(idl, config.zo_program_id, provider=provider)

        state = await program.account["State"].fetch(config.zo_state_id)
        state_signer, state_signer_nonce = util.state_signer_pda(
            state=config.zo_state_id, program_id=config.zo_program_id
        )

        if state.signer_nonce != state_signer_nonce:
            raise ValueError(
                f"Invalid state key ({config.zo_state_id}) for program id"
                f" ({config.zo_program_id})"
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
            self._program.account["State"].fetch(self.config.zo_state_id, commitment),
            self._program.account["Cache"].fetch(self.state.cache, commitment),
            self.__refresh_margin(),
        )

        self.__reload_collaterals()
        self.__reload_markets()
        self.__reload_balances()
        self.__reload_positions()
        await self.__reload_dex_markets(commitment=commitment)
        await self.__reload_orders(commitment=commitment)

    def collaterals_map(self, k: str or int or PublicKey) -> str:
        if isinstance(k, PublicKey):
            for i, c in enumerate(self.state.collaterals):
                if c.mint == k:
                    return self._collaterals_map[i]
            raise ValueError("")
        else:
            return self._collaterals_map[k]

    def markets_map(self, k: str or int or PublicKey) -> str:
        if isinstance(k, PublicKey):
            for i, m in enumerate(self.state.perp_markets):
                if m.dex_market == k:
                    return self._markets_map[i]
            raise ValueError("")
        else:
            return self._markets_map[k]

    def _get_open_orders_info(self, key: int or str, /):
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

    async def __reload_dex_markets(self, *, commitment: None or Commitment = None):
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

    async def __reload_orders(self, *, commitment: None or Commitment = None):
        ks: List[Union[PublicKey, str]] = []
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

    async def __refresh_margin(self, *, commitment: None or Commitment = None):
        if self.margin_key is not None:
            self.margin, self.control = await asyncio.gather(
                self._program.account["Margin"].fetch(self.margin_key, commitment),
                self._program.account["Control"].fetch(self.margin.control, commitment),
            )
