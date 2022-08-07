from dataclasses import dataclass
from enum import Enum
from typing import Dict, List

import marginpy.generated_client.types as gen_types
from marginpy.generated_client.accounts import MarginfiAccount, MarginfiGroup
from marginpy.generated_client.types import Bank
from marginpy.generated_client.types.utp_account_config import UTPAccountConfig
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction


class Environment(Enum):
    LOCALNET = "localnet"
    DEVNET = "devnet"
    MAINNET = "mainnet"


class AccountType(Enum):
    MARGINFI_GROUP = "MarginfiGroup"
    MARGINFI_ACCOUNT = "MarginfiAccount"


class BankVaultType(Enum):
    LIQUIDITY_VAULT = "LiquidityVault"
    INSURANCE_VAULT = "InsuranceVault"
    FEE_VAULT = "FeeVault"

    def __index__(self):
        return self.value


class UtpIndex(Enum):
    MANGO = 0
    ZO = 1

    def __index__(self):
        return self.value


UTP_NAME: Dict[UtpIndex, str] = {UtpIndex.MANGO: "Mango", UtpIndex.ZO: "01"}


@dataclass
class GroupConfig(gen_types.GroupConfig):
    pass


@dataclass
class BankConfig(gen_types.BankConfig):
    pass


@dataclass
class LiquidationPrices:
    final_price: float
    discounted_liquidator_price: float
    insurance_vault_fee: float


@dataclass
class UtpData:
    is_active: bool
    account_config: UTPAccountConfig


@dataclass
class UtpConfig:
    utp_index: UtpIndex
    program_id: PublicKey


@dataclass
class InstructionsWrapper:
    instructions: List[TransactionInstruction]
    signers: List[Keypair]


class EquityType(Enum):
    INIT_REQ_ADJUSTED = "INIT_REQ_ADJUSTED"
    TOTAL = "TOTAL"


@dataclass
class AccountBalances:
    equity: float
    assets: float
    liabilities: float


class MarginRequirement(Enum):
    INITIAL = "INITIAL"
    PARTIAL_LIQUIDATION = "PARTIAL_LIQUIDATION"
    MAINTENANCE = "MAINTENANCE"


class LendingSide(Enum):
    BORROW = "BORROW"
    DEPOSIT = "DEPOSIT"


@dataclass
class BankData(Bank):
    pass


@dataclass
class MarginfiAccountData(MarginfiAccount):
    pass


@dataclass
class MarginfiGroupData(MarginfiGroup):
    pass
