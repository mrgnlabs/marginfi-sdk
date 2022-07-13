import pytest
from testfixtures import compare

import os
import json

from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet, Program, Provider, Idl
from anchorpy.provider import DEFAULT_OPTIONS

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
        res_actual = account.all_utps

        assert res_exp == res_actual
    
    async def test_active_utps(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = []
        res_actual = account.active_utps

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
    # @todo incomplete
    async def test_fetch(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        res_exp = account
        res_actual = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        compare(res_exp._borrow_record, res_actual._borrow_record)
        compare(res_exp._deposit_record, res_actual._deposit_record)
        compare(res_exp.authority, res_actual.authority)
        compare(res_exp.client, res_actual.client)
        compare(res_exp.public_key, res_actual.public_key)
    
    # @todo incomplete
    async def test__program(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        config = MarginfiConfig(Environment.MAINNET)
        idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)
        idl = Idl.from_json(raw_idl)
        opts = DEFAULT_OPTIONS
        provider = Provider(rpc_client, wallet, opts)
        program = Program(idl, config.program_id, provider=provider)

        res_exp = program
        res_actual = account._program
        
        compare(res_exp.idl, res_actual.idl)
        compare(res_exp.program_id, res_actual.program_id)
        compare(res_exp.provider, res_actual.provider)
        compare(res_exp.type, res_actual.type)

    ###
    # MarginfiAccount local factory (decoded)
    #
    # Instantiate a MarginfiAccount according to the provided decoded data.
    # Check sanity against provided config.
    #
    # @param marginfiAccountPk Address of the target account
    # @param client marginfi client
    # @param accountData Decoded marginfi marginfi account data
    # @param marginfiGroup MarginfiGroup instance
    # @returns MarginfiAccount instance
    ###
    # def test_from_account_data(self):
    #     # get client
    #     config = MarginfiConfig(Environment.MAINNET)
    #     wallet = Wallet.local()
    #     rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
    #     client = MarginfiClient(config, wallet, rpc_client)

    #     # @todo ...

    #     account = MarginfiAccount.from_account_data(
    #         PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"),
    #         client,
    #         account_data,
    #         marginfi_group
    #     )

    # def test_from_account_data_raw(self):
    #     pass

    # --- Getters and setters

    ###
    # Marginfi account deposit
    ###
    async def test_deposit_record(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        account_data = await MarginfiAccount._fetch_account_data(
            account.public_key,
            client.config,
            client.program.provider.connection
        )

        res_exp = account.deposit_record
        res_actual = account_data.deposit_record

        assert res_exp == res_actual

    ###
    # Marginfi account debt
    ###
    async def test_borrow_record(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        account_data = await MarginfiAccount._fetch_account_data(
            account.public_key,
            client.config,
            client.program.provider.connection
        )

        res_exp = account.borrow_record
        res_actual = account_data.borrow_record

        assert res_exp == res_actual
    
    # --- Others

    ###
    # Fetch marginfi account data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @returns Decoded marginfi account data struct
    ###
    # @todo may be incomplete
    async def test__fetch_account_data(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        account = await MarginfiAccount.fetch(PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9"), client)

        account_data = await MarginfiAccount._fetch_account_data(
            account.public_key,
            client.config,
            client.program.provider.connection
        )

        assert account.authority == account_data.authority
        # @todo double-check group output is correct
        assert account.group.public_key == account_data.marginfi_group
        assert account.deposit_record == account_data.deposit_record
        assert account.borrow_record == account_data.borrow_record
        # @todo active_utps are an interesting misalignment right now
        # assert account.active_utps == account_data.active_utps

    ###
    # Pack data from the on-chain, vector format into a coherent unit.
    #
    # @param data Marginfi account data
    # @param utpIndex Index of the target UTP
    # @returns UTP data struct
    ###
    # async def test__pack_utp_data(self):
    #     pass

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param encoded Raw data buffer
    # @returns Decoded marginfi account data struct
    ###
    # def test_decode(self):
    #     pass

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param decoded Marginfi account data struct
    # @returns Raw data buffer
    ###
    # async def test_encode(self):
    #     pass

    ###
    # Update instance data by fetching and storing the latest on-chain state.
    ###
    # async def test_reload(self):
    #     pass
