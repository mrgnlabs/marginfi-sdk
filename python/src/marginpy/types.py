from dataclasses import dataclass
from solana.publickey import PublicKey
import marginpy.generated_client.types as gen_types


class GroupConfig(gen_types.GroupConfig):
    pass

#@todo confirm
class BankConfig(gen_types.BankConfig):
    pass

@dataclass
class UTPAccountConfig:
    address: PublicKey
    authority_seed: PublicKey
    authority_bump: int

@dataclass
class UtpData:
    is_active: bool
    account_config: UTPAccountConfig
