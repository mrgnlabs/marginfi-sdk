from decimal import Decimal

import mango
from solana.publickey import PublicKey

USDC_TOKEN_MAINNET = mango.Token(
    "USDC",
    "USD Coin",
    Decimal(6),
    PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
)

USDC_TOKEN_DEVNET = mango.Token(
    "USDC",
    "USD Coin",
    Decimal(6),
    PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
)

USDC_TOKEN_DICT = {"mainnet": USDC_TOKEN_MAINNET, "devnet": USDC_TOKEN_DEVNET}
