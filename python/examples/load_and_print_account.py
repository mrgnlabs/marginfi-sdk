import asyncio
import logging
import os
from anchorpy import Wallet
from marginpy import MarginfiClient
from marginpy import MarginfiConfig
from marginpy import Environment
from marginpy.utils.data_conversion import ui_to_native
from marginpy.utils.instructions import airdrop_collateral
from marginpy.utils.misc import get_or_create_ata
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

rpc_endpoint = os.getenv("RPC_ENDPOINT")
environment = os.getenv("ENV")

deposit_amount = 10

logging.basicConfig(
    level=logging.INFO,
)


async def main():
    config = MarginfiConfig(Environment[environment])
    rpc_client = AsyncClient(rpc_endpoint, config.tx_opts.preflight_commitment)
    wallet = Wallet.local()
    client = await MarginfiClient.fetch(config, wallet, rpc_client)
    account = await client.get_marginfi_account(
        "EBcgEtCHTMCv4TfLHv7NxuAz4rzksBrqVYWGyGn9R7Gb"
    )
    await account.observe_utps()
    print(account)


if __name__ == "__main__":
    asyncio.run(main())
