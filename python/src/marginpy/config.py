from dataclasses import dataclass
from typing import Any, Dict

from solana.publickey import PublicKey

from marginpy.types import Environment
from marginpy.utils import handle_override
from marginpy.utp.mango.config import MangoConfig
from marginpy.utp.zo.config import ZoConfig

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
                default=PublicKey("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg"),
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
                default=PublicKey("DzEv7WuxdzRJ9iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
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
