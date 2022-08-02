import asyncio
import logging
import os

from anchorpy import Wallet
from dotenv import find_dotenv, load_dotenv
from marginpy import Environment, MarginfiClient, MarginfiConfig
from solana.rpc.async_api import AsyncClient

load_dotenv(find_dotenv())

rpc_endpoint = os.getenv("RPC_ENDPOINT")
environment = os.getenv("ENV")

DEPOSIT_AMOUNT = 10

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
