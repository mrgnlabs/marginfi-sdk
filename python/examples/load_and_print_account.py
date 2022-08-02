import asyncio
import logging
import os

from dotenv import find_dotenv, load_dotenv
from marginpy import MarginfiClient
from marginpy.logger import setup_logging

load_dotenv(find_dotenv())
setup_logging(logging.DEBUG)

rpc_endpoint = os.getenv("RPC_ENDPOINT")
environment = os.getenv("ENV")

DEPOSIT_AMOUNT = 10

logging.basicConfig(
    level=logging.INFO,
)


async def main():
    client = await MarginfiClient.from_env()
    account = await client.get_marginfi_account(
        "EBcgEtCHTMCv4TfLHv7NxuAz4rzksBrqVYWGyGn9R7Gb"
    )
    await account.observe_utps()


if __name__ == "__main__":
    asyncio.run(main())
