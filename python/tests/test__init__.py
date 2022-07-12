"""Test basic imports."""
import unittest

import pytest
import asyncio

from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet, Program, Provider, Idl
from anchorpy.provider import DEFAULT_OPTIONS

from marginpy import MarginfiConfig, Environment, MarginfiClient, MarginfiAccount, MarginfiGroup

class TestInitializations(unittest.TestCase):

    def test_marginfi_config(self):
        """Test that MarginfiConfig is instantiated correctly."""
        config = MarginfiConfig(Environment.MAINNET)
        
        self.assertIsInstance(
            config,
            MarginfiConfig
        )

    def test_marginfi_client(self):
        """Test that MarginfiClient is instantiated correctly."""
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)

        self.assertIsInstance(
            client,
            MarginfiClient
        )

    # @todo just need to add bank
    # def test_marginfi_group(self):
    #     """Test that MarginfiGroup is instantiated correctly."""
    #     config = MarginfiConfig(Environment.MAINNET)

    #     idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
    #     with open(idl_path) as f:
    #         raw_idl = json.load(f)
    #     idl = Idl.from_json(raw_idl)

    #     rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
    #     wallet = Wallet.local()
    #     opts = DEFAULT_OPTIONS
    #     provider = Provider(rpc_client, wallet, opts)

    #     program = Program(idl, config.program_id, provider=provider)

    #     admin = wallet
    #     bank = #@todo
    #     group = MarginfiGroup(config, program, admin, bank)

    #     self.assertIsInstance(
    #         group,
    #         MarginfiGroup
    #     )
