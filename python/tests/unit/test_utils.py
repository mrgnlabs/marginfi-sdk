import os
import json
from pytest import mark
from testfixtures import compare
from anchorpy import Idl
from marginpy.types import BankVaultType
from marginpy.utils import get_bank_authority, get_utp_authority, load_idl
from solana.publickey import PublicKey

from marginpy.utp.mango.account import get_mango_account_pda


@mark.unit
class TestUtils:
    def test_get_idl(self):
        idl_actual = load_idl()

        idl_path = os.path.join(os.path.dirname(__file__), "../fixtures/idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)
        idl_exp = Idl.from_json(raw_idl)

        assert isinstance(idl_actual, Idl)
        assert idl_exp == idl_actual
        compare(idl_exp, idl_actual)

    def test_utp_authority(self):
        authority, bump = get_utp_authority(
            PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
            PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
            PublicKey("5yg2EnX2Vn14SKdEvYooyaj5KmE4xGgHviQKGB5Y9oFQ"),
        )
        assert authority == PublicKey("2zbmcZ82RL65hZH9Wqaqon315QjVY7ALEejTbCK6CC9b")
        assert bump == 255

    def test_bank_authority(self):
        authority, bump = get_bank_authority(
            PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
            PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
            BankVaultType.LIQUIDITY_VAULT,
        )
        assert authority == PublicKey("Ah2FBNwdgTxrY4HgJqzr2B3H4XZ6wQ5dYPBvPtQeACM8")
        assert bump == 255

    def test_mango_account_pda(self):
        pda, bump = get_mango_account_pda(
            PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
            PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
            88,
            PublicKey("5yg2EnX2Vn14SKdEvYooyaj5KmE4xGgHviQKGB5Y9oFQ"),
        )
        assert pda == PublicKey("F8H1zRowNeJ8mbxMLDYzL9Kejd24wu7yEAz65f87UMSa")
        assert bump == 255

    def test_mango_account_pda_2(self):
        pda, bump = PublicKey.find_program_address(
            [
                bytes(PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR")),
                bytes(PublicKey("5yg2EnX2Vn14SKdEvYooyaj5KmE4xGgHviQKGB5Y9oFQ")),
            ],
            PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
        )
