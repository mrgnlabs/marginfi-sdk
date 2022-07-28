from typing import Any, Dict, Literal
from solana.publickey import PublicKey
from marginpy.config import Environment
from marginpy.types import UtpConfig, UtpIndex
from marginpy.utils import handle_override


class ZoConfig(UtpConfig):
    """
    [Internal]
    Define Zo-specific config per profile
    """

    cluster: Literal["devnet", "mainnet"]
    state_pk: PublicKey
    dex_program: PublicKey
    group_pk: PublicKey

    def __init__(
        self, environment: Environment, overrides: Dict[str, Any] = {}
    ) -> None:
        self.utp_index = handle_override(
            overrides=overrides, override_key="utp_index", default=UtpIndex.ZO
        )
        if environment == Environment.MAINNET:
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk"),
            )
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
        elif environment == Environment.DEVNET:
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ"),
            )
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
        elif environment == Environment.LOCALNET:
            pass
        else:
            raise Exception(f"Unknown environment for Zo UTP config {environment}")
