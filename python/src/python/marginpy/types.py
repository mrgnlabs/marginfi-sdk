from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional

import marginpy.generated_client.types as gen_types
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


# @todo confirm
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
class UtpMangoPlacePerpOrderOptions:
    max_quote_quantity: Optional[float] = None
    limit: Optional[int] = None
    order_type: Optional[gen_types.MangoOrderTypeKind] = None
    client_order_id: Optional[int] = None
    reduce_only: Optional[bool] = None
    expiry_timestamp: Optional[int] = None
    expiry_type: Optional[gen_types.MangoExpiryTypeKind] = None


@dataclass
class InstructionsWrapper:
    instructions: List[TransactionInstruction]
    signers: List[Keypair]
