import pytest

from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet
from marginpy import MarginfiConfig, Environment, MarginfiClient

@pytest.mark.asyncio
class TestMarginfiClient():
    def test___init__(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)

        assert isinstance(client, MarginfiClient)
    
    # async def test_create_marginfi_account(self):
    #     pass

    # async def test_terminate(self):
    #     pass
