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
class MangoConfig(UtpConfig):
    """
    [internal] Mango-specific config
    """

    cluster: Literal["devnet", "mainnet", "localnet"]
    group_pk: PublicKey
    group_name: str

    def __init__(
        self,
        environment: Environment,
        overrides: Dict[str, Any] = {},
    ) -> None:
        utp_index = handle_override(
            overrides=overrides, override_key="utp_index", default=UtpIndex.MANGO
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
            self.group_name = handle_override(
                overrides=overrides,
                override_key="group_name",
                default="mainnet.1",
            )
        elif environment in (Environment.DEVNET, Environment.LOCALNET):
            self.cluster = "devnet"
            self.group_pk = handle_override(
                overrides=overrides,
                override_key="group_pk",
                default=PublicKey("Ec2enZyoC4nGpEfu2sUNAa2nUGJHWxoUWYSEJ2hNTWTA"),
            )
            self.group_name = handle_override(
                overrides=overrides,
                override_key="group_name",
                default="devnet.2",
            )
        else:
            raise Exception(f"Unknown environment for Mango UTP config {environment}")
