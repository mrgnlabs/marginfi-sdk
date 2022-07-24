from dataclasses import dataclass
from typing import Dict, Optional
from solana.publickey import PublicKey
import marginpy.generated_client.types as gen_types
from marginpy.generated_client.types.utp_account_config import UTPAccountConfig
from enum import Enum


class Environment(Enum):
    LOCALNET = "localnet"
    DEVNET = "devnet"
    MAINNET = "mainnet"


class AccountType(Enum):
    MarginfiGroup = "MarginfiGroup"
    MarginfiAccount = "MarginfiAccount"


class BankVaultType(Enum):
    LiquidityVault = "LiquidityVault"
    InsuranceVault = "InsuranceVault"
    FeeVault = "FeeVault"

    def __index__(self):
        return self.value


class UtpIndex(Enum):
    Mango = 0
    Zo = 1

    def __index__(self):
        return self.value


UTP_NAME: Dict[UtpIndex, str] = {UtpIndex.Mango: "Mango", UtpIndex.Zo: "01"}


@dataclass
class GroupConfig(gen_types.GroupConfig):
    pass


# @todo confirm
@dataclass
class BankConfig(gen_types.BankConfig):
    pass


@dataclass
class LiquidationPrices:
    final_price: float
    discounted_liquidator_price: float
    insurance_vault_fee: float


# @dataclass
# class UTPAccountConfig:
#     address: PublicKey
#     authority_seed: PublicKey
#     authority_bump: int


@dataclass
class UtpData:
    is_active: bool
    account_config: UTPAccountConfig


@dataclass
class UtpConfig:
    utp_index: UtpIndex
    program_id: PublicKey


@dataclass
class UtpMangoPlacePerpOrderOptions:
    max_quote_quantity: Optional[float] = None
    limit: Optional[int] = None
    order_type: Optional[gen_types.MangoOrderTypeKind] = None
    client_order_id: Optional[int] = None
    reduce_only: Optional[bool] = False
    expiry_timestamp: Optional[int] = None
    expiry_type: Optional[gen_types.MangoExpiryTypeKind] = None
