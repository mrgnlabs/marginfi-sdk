from dataclasses import dataclass
from typing import Any, Dict, Literal

from marginpy.types import Environment, UtpConfig, UtpIndex
from marginpy.utils.misc import handle_override
from solana.publickey import PublicKey

# empty dictionnary default safe here because we do use `overrides` read-only
# ref: https://stackoverflow.com/questions/26320899/ \
#        why-is-the-empty-dictionary-a-dangerous-default-value-in-python/26320917#26320917)
# pylint: disable=dangerous-default-value


@dataclass
class ZoConfig(UtpConfig):
    """
    [internal] Zo-specific config.
    """

    cluster: Literal["devnet", "mainnet"]
    state_pk: PublicKey
    dex_program: PublicKey
    heimdall: PublicKey

    def __init__(
        self,
        environment: Environment,
        overrides: Dict[str, Any] = {},
    ) -> None:
        utp_index = handle_override(
            overrides=overrides, override_key="utp_index", default=UtpIndex.ZO
        )

        if environment == Environment.MAINNET:
            program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk"),
            )
        elif environment in (Environment.DEVNET, Environment.LOCALNET):
            program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ"),
            )
        else:
            raise Exception(f"Unknown environment for 01 UTP config {environment}")

        super().__init__(utp_index, program_id)

        if environment == Environment.MAINNET:
            self.cluster = "mainnet"
            self.state_pk = handle_override(
                overrides=overrides,
                override_key="state_pk",
                default=PublicKey("71yykwxq1zQqy99PgRsgZJXi2HHK2UDx9G4va7pH6qRv"),
            )
            self.dex_program = handle_override(
                overrides=overrides,
                override_key="dex_program",
                default=PublicKey("ZDx8a8jBqGmJyxi1whFxxCo5vG6Q9t4hTzW2GSixMKK"),
            )
            self.heimdall = handle_override(
                overrides=overrides,
                override_key="heimdall",
                default=PublicKey("Cyvjas5Hg6nb6RNsuCi8sK3kcjbWzTgdJcHxmSYS8mkY"),
            )
        elif environment in (Environment.DEVNET, Environment.LOCALNET):
            self.cluster = "devnet"
            self.state_pk = handle_override(
                overrides=overrides,
                override_key="state_pk",
                default=PublicKey("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F"),
            )
            self.dex_program = handle_override(
                overrides=overrides,
                override_key="dex_program",
                default=PublicKey("ZDxUi178LkcuwdxcEqsSo2E7KATH99LAAXN5LcSVMBC"),
            )
            self.heimdall = handle_override(
                overrides=overrides,
                override_key="heimdall",
                default=PublicKey("Aoi3SGj4zLiMQSHrJ4yEDFwMQnGjVQCeKSYD6ygi6WLr"),
            )
        else:
            raise Exception(f"Unknown environment for 01 UTP config {environment}")
