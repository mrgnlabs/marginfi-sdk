import base64
import enum
import struct
from typing import Generator, Literal, NamedTuple, NewType

from solana.publickey import PublicKey

from . import util

i128 = NewType("i128", int)
u128 = NewType("u128", int)


def decode_field(ty, v):
    if ty == i128:
        return ty(int.from_bytes(v, "little", signed=True))
    elif ty == u128:
        return ty(int.from_bytes(v, "little", signed=False))
    else:
        return ty(v)


def strip_padding(b: bytes) -> bytes:
    if len(b) < 12 or b[:5] != b"serum" or b[-7:] != b"padding":
        raise ValueError("invalid buffer for dex struct")
    else:
        return b[5:-7]


def decode_namedtuple(cls, fmt: str, b: bytes):
    return cls._make(
        [
            decode_field(cls.__annotations__[f], g)
            for f, g in zip(cls._fields, struct.unpack(fmt, b))
        ]
    )


class AccountFlag(enum.IntFlag):
    INITIALIZED = 1 << 0
    MARKET = 1 << 1
    OPEN_ORDERS = 1 << 2
    REQUEST_QUEUE = 1 << 3
    EVENT_QUEUE = 1 << 4
    BIDS = 1 << 5
    ASKS = 1 << 6
    DISABLED = 1 << 7
    CLOSED = 1 << 8
    PERMISSIONED = 1 << 9


class Market(NamedTuple):
    account_flags: AccountFlag
    own_address: PublicKey
    quote_fees_accrued: int
    req_q: PublicKey
    event_q: PublicKey
    bids: PublicKey
    asks: PublicKey
    base_lot_size: int
    quote_lot_size: int
    fee_rate_bps: int
    referrer_rebates_accrued: int
    funding_index: i128
    last_updated: int
    strike: int
    perp_type: int
    base_decimals: int
    open_interest: int
    open_orders_authority: PublicKey
    prune_authority: PublicKey

    @property
    def quote_decimals(self):
        return 6

    @classmethod
    def from_bytes(cls, b: bytes):
        b = strip_padding(b)
        r = decode_namedtuple(cls, "<Q32sQ32s32s32s32s4Q16s5Q32s32s1032x", b)
        if (
            r.account_flags
            != AccountFlag.INITIALIZED | AccountFlag.MARKET | AccountFlag.PERMISSIONED
        ):
            raise ValueError("invalid account_flags for market")
        return r

    @classmethod
    def from_base64(cls, b: str):
        return cls.from_bytes(base64.b64decode(b))

    def _decode_orderbook_from_base64(self, bids: str, asks: str):
        return Orderbook(Slab.from_base64(bids), Slab.from_base64(asks), self)


class SlabNode:
    class Uninitialized(NamedTuple):
        pass

    class Inner(NamedTuple):
        prefix_len: int
        key: u128
        l: int
        r: int

    class Leaf(NamedTuple):
        owner_slot: int
        fee_tier: int
        key: u128
        control: PublicKey
        quantity: int
        client_order_id: int

    class Free(NamedTuple):
        next: int

    class LastFree(NamedTuple):
        pass

    @classmethod
    def _from_bytes(cls, b: bytes):
        tag, body = int.from_bytes(b[:4], "little", signed=False), b[4:]

        if tag < 0 or tag > 4:
            raise ValueError(f"invalid tag type '{tag}' for slab node")

        fmt, cons = [
            ("<68x", cls.Uninitialized),
            ("<I16sII40x", cls.Inner),
            ("<BBxx16s32sQQ", cls.Leaf),
            ("<I64x", cls.Free),
            ("<68x", cls.LastFree),
        ][tag]

        return decode_namedtuple(cons, fmt, body)


class Order(NamedTuple):
    owner_slot: int
    fee_tier: int
    order_id: u128
    control: PublicKey
    size_lots: int
    client_order_id: int
    price: float
    size: float
    side: Literal["bid", "ask"]


class Slab(NamedTuple):
    account_flags: AccountFlag
    bump_index: int
    free_list_len: int
    free_list_head: int
    root: int
    leaf_count: int
    nodes: list[SlabNode]

    @property
    def side(self) -> Literal["bid", "ask"]:
        return "bid" if AccountFlag.BIDS in self.account_flags else "ask"

    def __iter(self, *, ascending: bool) -> Generator[SlabNode.Leaf, None, None]:
        if self.leaf_count <= 0:
            return

        stack = [self.root]
        while len(stack) > 0:
            node = self.nodes[stack.pop()]
            if isinstance(node, SlabNode.Leaf):
                yield node
            elif isinstance(node, SlabNode.Inner):
                if ascending:
                    stack.extend((node.r, node.l))
                else:
                    stack.extend((node.l, node.r))

    def __iter__(self):
        return self.__iter(ascending=True)

    def __reversed__(self):
        return self.__iter(ascending=False)

    def min(self):
        return next(self.__iter(ascending=True))

    def max(self):
        return next(self.__iter(ascending=False))

    @classmethod
    def from_bytes(cls, b: bytes):
        b = strip_padding(b)
        head, tail = b[:40], b[40:]

        fs = list(struct.unpack("<QQQIIQ", head))
        fs[0] = decode_field(AccountFlag, fs[0])

        nodes = []
        for i in range(0, len(tail), 72):
            x = SlabNode._from_bytes(tail[i : i + 72])  # noqa: E203
            if isinstance(x, SlabNode.Uninitialized):
                break
            nodes.append(x)

        r = cls._make([*fs, list(nodes)])

        if not (AccountFlag.INITIALIZED in r.account_flags) or (
            AccountFlag.BIDS in r.account_flags == AccountFlag.ASKS in r.account_flags
        ):
            raise ValueError("invalid account_flags for slab")

        return r

    @classmethod
    def from_base64(cls, b: str):
        return cls.from_bytes(base64.b64decode(b))


class Orderbook:
    bids: list[Order]
    asks: list[Order]

    def __init__(self, bids: Slab, asks: Slab, mkt: Market):
        kw = {
            "base_decimals": mkt.base_decimals,
            "quote_decimals": mkt.quote_decimals,
            "base_lot_size": mkt.base_lot_size,
            "quote_lot_size": mkt.quote_lot_size,
        }
        self.bids = [
            Order._make(
                [
                    *o,
                    util.lots_to_price(o.key >> 64, **kw),
                    util.lots_to_size(
                        o.quantity,
                        decimals=mkt.base_decimals,
                        lot_size=mkt.base_lot_size,
                    ),
                    "bid",
                ]
            )
            for o in bids.__reversed__()
        ]

        self.asks = [
            Order._make(
                (
                    *o,
                    util.lots_to_price(o.key >> 64, **kw),  # type: ignore
                    util.lots_to_size(
                        o.quantity,  # type: ignore
                        decimals=mkt.base_decimals,
                        lot_size=mkt.base_lot_size,
                    ),
                    "ask",
                )  # type: ignore
            )
            for o in asks
        ]
