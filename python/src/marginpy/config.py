from dataclasses import dataclass
from typing import Any, Dict

from solana.publickey import PublicKey

from marginpy.types import Environment
from marginpy.utils import handle_override
from marginpy.utp.mango import MangoConfig
from marginpy.utp.zo import ZoConfig

# empty dictionnary default safe here because we do use `overrides` read-only
# ref: https://stackoverflow.com/questions/26320899/ \
#        why-is-the-empty-dictionary-a-dangerous-default-value-in-python/26320917#26320917)
# pylint: disable=dangerous-default-value


@dataclass
class MarginfiDedicatedConfig:
    environment: Environment
    program_id: PublicKey
    group_pk: PublicKey
    collateral_mint_pk: PublicKey

    def __init__(self, environment: Environment, overrides: Dict[str, Any] = {}):
        self.environment = environment
        if environment == Environment.MAINNET:
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("mrgnfD8pJKsw4AxCDquyUBjgABNEaZ79iTLgtov2Yff"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba"),
            )
            self.collateral_mint_pk = handle_override(
                overrides=overrides,
                override_key="collateral_mint_pk",
                default=PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
            )
        elif environment == Environment.DEVNET:
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("mf2tjVmwcxgNfscvVNdN9t2LZ8YwPkNQabeTzyYw2Hn"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("GoAzFyYE1xRsbT4C5MHJh8hBd5s6Jks9j4hLrtWR3pba"),
            )
            self.collateral_mint_pk = handle_override(
                overrides=overrides,
                override_key="collateral_mint_pk",
                default=PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
            )
        elif environment == Environment.LOCALNET:
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("Ghv4WbkASX6mVjeGiRfqRMLuh4CzgLtsPSLz8YaKHqxc"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba"),
            )
            self.collateral_mint_pk = handle_override(
                overrides=overrides,
                override_key="collateral_mint_pk",
                default=PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
            )
        else:
            raise Exception(f"Unknown environment {environment}")


@dataclass
class MarginfiConfig(MarginfiDedicatedConfig):
    mango: MangoConfig
    zo: ZoConfig

    def __init__(self, environment: Environment, overrides: Dict[str, Any] = {}):
        super().__init__(environment, overrides)

        if overrides is None:
            overrides = {}

        self.mango = MangoConfig(
            environment, overrides["mango"] if "mango" in overrides.keys() else None
        )
        self.zo = ZoConfig(
            environment, overrides["zo"] if "zo" in overrides.keys() else None
        )
