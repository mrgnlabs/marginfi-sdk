from dataclasses import dataclass

from solana.publickey import PublicKey


@dataclass
class Config:
    cluster_url: str
    zo_program_id: PublicKey
    zo_dex_id: PublicKey
    zo_state_id: PublicKey
    serum_dex_id: PublicKey


configs = {
    "devnet": Config(
        cluster_url="https://api.devnet.solana.com",
        zo_program_id=PublicKey("Zo1ThtSHMh9tZGECwBDL81WJRL6s3QTHf733Tyko7KQ"),
        zo_dex_id=PublicKey("ZDxUi178LkcuwdxcEqsSo2E7KATH99LAAXN5LcSVMBC"),
        zo_state_id=PublicKey("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F"),
        serum_dex_id=PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY"),
    ),
    "mainnet": Config(
        cluster_url="https://api.mainnet-beta.solana.com",
        zo_program_id=PublicKey("Zo1ggzTUKMY5bYnDvT5mtVeZxzf2FaLTbKkmvGUhUQk"),
        zo_dex_id=PublicKey("ZDx8a8jBqGmJyxi1whFxxCo5vG6Q9t4hTzW2GSixMKK"),
        zo_state_id=PublicKey("71yykwxq1zQqy99PgRsgZJXi2HHK2UDx9G4va7pH6qRv"),
        serum_dex_id=PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"),
    ),
}
