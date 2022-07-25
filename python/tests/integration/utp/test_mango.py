from pytest import mark
from tests.config import DEVNET_URL
from os import path
from pathlib import Path
from tests.fixtures import basics_fixture, MangoBench, mango_bench
from marginpy import Environment
from marginpy.utp.mango import UtpMangoAccount, MangoConfig

PATH = Path(path.abspath(path.join(__file__, "../../../../")))
basics_fixture = basics_fixture(environment=Environment.DEVNET, rpc_url=DEVNET_URL)
mango_bench = mango_bench()


@mark.integration
@mark.devnet
class TestMangoAccount:
    def test_activation(self, mango_bench: MangoBench):
        pass
