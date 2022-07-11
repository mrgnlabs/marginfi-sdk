import asyncio

from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet

from marginpy import MarginfiConfig, Environment, MarginfiClient, MarginfiAccount


async def main():
    try:
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)
        print(account)
    finally:
        await client.terminate()  # Required for clean process exit

asyncio.run(main())
