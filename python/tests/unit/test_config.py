import pytest
from testfixtures import compare

from solana.publickey import PublicKey
from marginpy import MarginfiConfig, Environment

class TestEnvironment():
    
    def test_mainnet(self):
        assert Environment.MAINNET.value == "mainnet"

    def test_devnet(self):
        assert Environment.DEVNET.value == "devnet"

class TestMarginfiConfig():

    def test___init__(self):
        config_mainnet = MarginfiConfig(Environment.MAINNET)
        config_devnet = MarginfiConfig(Environment.DEVNET)
        config_localnet = MarginfiConfig(Environment.LOCALNET)

        assert isinstance(config_mainnet, MarginfiConfig)
        assert isinstance(config_devnet, MarginfiConfig)
        assert isinstance(config_localnet, MarginfiConfig)

    def test_handle_override(self):
        overrides = {
            "program_id": PublicKey("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK")
        }
        config_mainnet = MarginfiConfig(Environment.MAINNET, overrides)

        compare(
            config_mainnet.program_id,
            PublicKey("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK")
        )
