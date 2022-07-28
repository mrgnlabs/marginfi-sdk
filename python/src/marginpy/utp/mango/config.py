from typing import Any, Dict, Literal

from solana.publickey import PublicKey

from marginpy.config import Environment
from marginpy.types import UtpConfig, UtpIndex
from marginpy.utils import handle_override


class MangoConfig(UtpConfig):
    """
    [Internal]
    Define Mango-specific config per profile
    """

    cluster: Literal["devnet", "mainnet", "localnet"]
    group_pk: PublicKey

    def __init__(  # pylint: disable=dangerous-default-value
        self,
        environment: Environment,
        overrides: Dict[str, Any] = {},
    ) -> None:
        utp_index = handle_override(
            overrides=overrides, override_key="utp_index", default=UtpIndex.MANGOP
        )
        if environment == Environment.MAINNET:
            program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68"),
            )
        elif environment in (Environment.DEVNET, Environment.LOCALNET):
            program_id = handle_override(
                overrides=overrides,
                override_key="program_id",
                default=PublicKey("4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA"),
            )
        else:
            raise Exception(f"Unknown environment for Mango UTP config {environment}")

        super().__init__(utp_index, program_id)

        if environment == Environment.MAINNET:
            self.cluster = "mainnet"
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue"),
            )
        elif environment in (Environment.DEVNET, Environment.LOCALNET):
            self.cluster = "devnet"
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("Ec2enZyoC4nGpEfu2sUNAa2nUGJHWxoUWYSEJ2hNTWTA"),
            )
        else:
            raise Exception(f"Unknown environment for Mango UTP config {environment}")
