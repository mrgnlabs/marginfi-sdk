import pytest

from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet

from marginpy import MarginfiConfig, Environment, MarginfiClient, MarginfiAccount

@pytest.mark.asyncio
class TestMarginfiAccount():
    
    ###
    # @internal
    ###
    async def test__init__(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)
        
        assert isinstance(account, MarginfiAccount)

    async def test__str__(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = f"Address: {account.public_key.to_base58()}\n" \
               f"Group: {account.group.public_key.to_base58()}\n" \
               f"Authority: {account.authority.to_base58()}"

        res_actual = account.__str__()

        assert res_exp == res_actual

    async def test_all_utps(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = []
        res_actual = account.all_utps()

        assert res_exp == res_actual
    
    async def test_active_utps(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = []
        res_actual = account.active_utps()

        assert res_exp == res_actual

    # --- Factories

    ###
    # MarginfiAccount network factory
    #
    # Fetch account data according to the config and instantiate the corresponding MarginfiAccount.
    #
    # @param marginfiAccountPk Address of the target account
    # @param client marginfi client
    # @returns MarginfiAccount instance
    ###
    # @todo this one could probably be better
    async def test_fetch(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = account
        res_actual = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        assert res_exp == res_actual
    
    async def test__program(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
        res_actual = account._program()
        
        assert res_exp == res_actual