from dataclasses import dataclass
from typing import Any, Dict

from anchorpy.provider import DEFAULT_OPTIONS
from marginpy.types import Environment
from marginpy.utils.misc import handle_override
from marginpy.utp.mango import MangoConfig
from marginpy.utp.zo import ZoConfig
from solana.publickey import PublicKey
from solana.rpc.types import TxOpts

# empty dictionnary default safe here because we do use `overrides` read-only
# ref: https://stackoverflow.com/questions/26320899/ \
#        why-is-the-empty-dictionary-a-dangerous-default-value-in-python/26320917#26320917)
# pylint: disable=dangerous-default-value


@dataclass
class MarginfiDedicatedConfig:
    """
    marginfi-specific config.
    """

    environment: Environment
    program_id: PublicKey
    group_pk: PublicKey
    collateral_mint_pk: PublicKey

    def __init__(self, environment: Environment, overrides: Dict[str, Any] = {}):
        """
        Constructor.

        Args:
            environment (Environment): target environment
            overrides (Dict[str, Any], optional): override for any config field. Defaults to {}.

        Raises:
            Exception: unknown environment
        """

        self.environment = environment
        if environment == Environment.MAINNET:
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("MRGNWSHaWmz3CPFcYt9Fyh8VDcvLJyy2SCURnMco2bC"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("2FdddfNp6knT5tDjKjFREKUjsFKvAppc61bCyuCrTnj2"),
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
                default=PublicKey("AiAL3aGuXErgGrkbmiJvnYhKSgQG41KpadLzm2k4CEJC"),
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
    """
    marginfi config.
    """

    tx_opts: TxOpts
    mango: MangoConfig
    zo: ZoConfig

    def __init__(self, environment: Environment, overrides: Dict[str, Any] = {}):
        """
        Constructor.

        Args:
            environment (Environment): target environment
            overrides (Dict[str, Any], optional): override for any config field. Defaults to {}.
        """

        super().__init__(environment, overrides)

        if overrides is None:
            overrides = {}

        self.tx_opts = (
            overrides["tx_opts"] if "tx_opts" in overrides.keys() else DEFAULT_OPTIONS
        )

        self.mango = MangoConfig(
            environment, overrides["mango"] if "mango" in overrides.keys() else None
        )
        self.zo = ZoConfig(
            environment, overrides["zo"] if "zo" in overrides.keys() else None
        )
