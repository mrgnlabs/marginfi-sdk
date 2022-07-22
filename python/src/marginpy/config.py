from dataclasses import dataclass
from typing import Any, Dict
from solana.publickey import PublicKey

from marginpy.types import Environment, MarginfiDedicatedConfig
from marginpy.utp.mango.config import MangoConfig
from marginpy.utp.zo.config import ZoConfig


@dataclass
class MarginfiDedicatedConfig:
    environment: Environment
    program_id: PublicKey
    group_pk: PublicKey
    collateral_mint_pk: PublicKey

    def __init__(self, environment: Environment, overrides: Any = None):
        if overrides is None:
            overrides = {}

        def handle_override(override_key: str, default):
            return overrides[override_key] if override_key in overrides else default

        if environment == Environment.MAINNET:
            self.environment = environment
            self.program_id = handle_override(
                "program_id", PublicKey("mrgnfD8pJKsw4AxCDquyUBjgABNEaZ79iTLgtov2Yff")
            )
            self.group_pk = handle_override(
                "group_pk", PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba")
            )
            self.collateral_mint_pk = handle_override(
                "collateral_mint_pk",
                PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
            )
        elif environment == Environment.DEVNET:
            self.environment = environment
            self.program_id = handle_override(
                "program_id", PublicKey("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK")
            )
            self.group_pk = handle_override(
                "group_pk", PublicKey("7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg")
            )
            self.collateral_mint_pk = handle_override(
                "collateral_mint_pk",
                PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
            )
        elif environment == Environment.LOCALNET:
            self.environment = environment
            self.program_id = handle_override(
                "program_id", PublicKey("DzEv7WuxdzRJ9iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ")
            )
            self.group_pk = handle_override(
                "group_pk", PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba")
            )
            self.collateral_mint_pk = handle_override(
                "collateral_mint_pk",
                PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
            )
        else:
            raise Exception(f"Unknown environment {environment}")


@dataclass
class MarginfiConfig(MarginfiDedicatedConfig):
    mango: MangoConfig
    zo: ZoConfig

    def __init__(self, environment: Environment, overrides: Dict[str, Any] = None):
        marginfi_dedicated_config = MarginfiDedicatedConfig(environment, overrides)
        self.environment = marginfi_dedicated_config.environment
        self.program_id = marginfi_dedicated_config.program_id
        self.group_pk = marginfi_dedicated_config.group_pk
        self.collateral_mint_pk = marginfi_dedicated_config.collateral_mint_pk

        if overrides is None:
            overrides = {}

        self.mango = MangoConfig(
            environment, overrides["mango"] if "mango" in overrides.keys() else None
        )
        self.zo = ZoConfig(
            environment, overrides["zo"] if "zo" in overrides.keys() else None
        )
