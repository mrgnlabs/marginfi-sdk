from dataclasses import dataclass
from solana.publickey import PublicKey

from .types import PerpType


@dataclass(kw_only=True)
class Config:
    CLUSTER_URL: str
    ZO_PROGRAM_ID: PublicKey
    ZO_DEX_ID: PublicKey
    ZO_STATE_ID: PublicKey
    SERUM_DEX_ID: PublicKey


configs = {
    "devnet": Config(
        CLUSTER_URL="https://api.devnet.solana.com",
        ZO_PROGRAM_ID=PublicKey("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ"),
        ZO_DEX_ID=PublicKey("ZDxUi178LkcuwdxcEqsSo2E7KATH99LAAXN5LcSVMBC"),
        ZO_STATE_ID=PublicKey("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F"),
        SERUM_DEX_ID=PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY"),
    ),
    "mainnet": Config(
        CLUSTER_URL="https://api.mainnet-beta.solana.com",
        ZO_PROGRAM_ID=PublicKey("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk"),
        ZO_DEX_ID=PublicKey("ZDx8a8jBqGmJyxi1whFxxCo5vG6Q9t4hTzW2GSixMKK"),
        ZO_STATE_ID=PublicKey("71yykwxq1zQqy99PgRsgZJXi2HHK2UDx9G4va7pH6qRv"),
        SERUM_DEX_ID=PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"),
    ),
}


def taker_fee(t: PerpType, /) -> float:
    if t == "future":
        return 10 / 10000
    if t == "calloption" or t == "putoption":
        return 10 / 10000
    if t == "square":
        return 15 / 10000
    raise LookupError(f"invalid perp type {t}")
