from typing import Any, Dict, Literal, Optional
from solana.publickey import PublicKey
from marginpy.config import Environment
from marginpy.utils import handle_override
from marginpy.generated_client.types.utp_config import UTPConfig
from marginpy.types import UtpIndex


class MangoConfig(UTPConfig):
    """
    [Internal]
    Define Mango-specific config per profile
    """

    cluster: Optional[Literal["devnet", "mainnet"]]
    group_pk: Optional[PublicKey]

    def __init__(
        self, environment: Environment, overrides: Dict[str, Any] = {}
    ) -> None:
        self.utp_index = handle_override(
            overrides=overrides, override_key="utp_index", default=UtpIndex.Mango
        )

        if environment == Environment.MAINNET:
            self.cluster = "mainnet"
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue"),
            )
        elif environment == Environment.DEVNET:
            self.cluster = "devnet"
            self.program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA"),
            )
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("Ec2enZyoC4nGpEfu2sUNAa2nUGJHWxoUWYSEJ2hNTWTA"),
            )
        elif environment == Environment.LOCALNET:
            self.cluster = None
            self.program_id = None
            self.group_pk = None
        else:
            raise Exception(f"Unknown environment for Mango UTP config {environment}")
