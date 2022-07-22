from dataclasses import dataclass
from solana.publickey import PublicKey
import marginpy.generated_client.types as gen_types
from marginpy.utils import UtpIndex
import enum


class AccountType(enum.Enum):
    MarginfiGroup = "MarginfiGroup"
    MarginfiAccount = "MarginfiAccount"


class BankVaultType(enum.Enum):
    LiquidityVault = "LiquidityVault"
    InsuranceVault = "InsuranceVault"
    FeeVault = "FeeVault"

    def __index__(self):
        return self.value


class UtpIndex(enum.Enum):
    Mango = 0
    Zo = 1

    def __index__(self):
        return self.value


UTP_NAME = {f"{UtpIndex.Mango}": "Mango", f"{UtpIndex.Zo}": "01"}


class GroupConfig(gen_types.GroupConfig):
    pass


# @todo confirm
class BankConfig(gen_types.BankConfig):
    pass


@dataclass
class LiquidationPrices:
    final_price: float
    discounted_liquidator_price: float
    insurance_vault_fee: float


@dataclass
class UTPAccountConfig:
    address: PublicKey
    authority_seed: PublicKey
    authority_bump: int


@dataclass
class UtpData:
    is_active: bool
    account_config: UTPAccountConfig


@dataclass
class UtpData:
    is_active: bool
    account_config: UTPAccountConfig


@dataclass
class UtpConfig:
    utp_index: UtpIndex
    program_id: PublicKey
