from solana.publickey import PublicKey
from marginpy.config import Environment
from marginpy.types import UtpConfig


class ZoConfig(UtpConfig):
    """
    [Internal]
    Define Zo-specific config per profile
    """

    state_pk: PublicKey
    dex_program: PublicKey

    def __init__(self, environment, overrides=None) -> None:
        def handle_override(override_key: str, default):
            return overrides[override_key] if override_key in overrides else default

        if environment == Environment.MAINNET:
            self.utp_index = handle_override("utp_index", 1)
            self.program_id = handle_override(
                "program_id", PublicKey("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk")
            )
            self.state_pk = handle_override(
                "state_pk", PublicKey("71yykwxq1zQqy99PgRsgZJXi2HHK2UDx9G4va7pH6qRv")
            )
            self.dex_program = handle_override(
                "dex_program", PublicKey("ZDx8a8jBqGmJyxi1whFxxCo5vG6Q9t4hTzW2GSixMKK")
            )
        elif environment == Environment.DEVNET:
            self.utp_index = handle_override("utp_index", 1)
            self.program_id = handle_override(
                "program_id", PublicKey("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ")
            )
            self.state_pk = handle_override(
                "state_pk", PublicKey("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F")
            )
            self.dex_program = handle_override(
                "dex_program", PublicKey("ZDxUi178LkcuwdxcEqsSo2E7KATH99LAAXN5LcSVMBC")
            )
        else:
            raise Exception(f"Unknown environment for Zo UTP config {environment}")
