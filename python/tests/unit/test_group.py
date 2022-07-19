from anchorpy import Wallet, Provider, Program
from pytest import mark
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient

from marginpy import MarginfiGroup, Environment, MarginfiConfig, load_idl
from marginpy.utils import b64str_to_bytes
from tests.utils import load_sample_account_info, load_marginfi_group_data


@mark.unit
class TestMarginfiGroupUnit:
    def test_decode(self):
        account_address, account_info = load_sample_account_info("marginfi_group_2")
        account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
        marginfi_group_data = MarginfiGroup.decode(account_data)
        assert marginfi_group_data.admin == PublicKey(
            "E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog"
        )
