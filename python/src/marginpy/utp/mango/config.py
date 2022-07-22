from solana.publickey import PublicKey
from marginpy.config import Environment
from marginpy.generated_client.types.utp_config import UTPConfig


class MangoConfig(UTPConfig):
    """
    [Internal]
    Define Mango-specific config per profile
    """

    group_pk: PublicKey

    def __init__(self, environment, overrides=None) -> None:
        def handle_override(override_key: str, default):
            return overrides[override_key] if override_key in overrides else default

        if environment == Environment.MAINNET:
            self.utp_index = handle_override("utp_index", 0)
            self.program_id = handle_override(
                "program_id", PublicKey("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68")
            )
            self.group_pk = handle_override(
                "group_pk", PublicKey("98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue")
            )
        elif environment == Environment.DEVNET:
            self.utp_index = handle_override("utp_index", 0)
            self.program_id = handle_override(
                "program_id", PublicKey("4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA")
            )
            self.group_pk = handle_override(
                "group_pk", PublicKey("Ec2enZyoC4nGpEfu2sUNAa2nUGJHWxoUWYSEJ2hNTWTA")
            )
        else:
            raise Exception(f"Unknown environment for Mango UTP config {environment}")
