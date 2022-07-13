import pytest
from testfixtures import compare

from marginpy import MarginfiConfig, Environment

class TestEnvironment():
    
    def test_mainnet(self):
        assert Environment.MAINNET.value == "mainnet"

    def test_devnet(self):
        assert Environment.DEVNET.value == "devnet"

class TestMarginfiConfig():

    def test___init__(self):
        config = MarginfiConfig(Environment.MAINNET)

        assert isinstance(config, MarginfiConfig)
