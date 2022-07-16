import os
import json
from pytest import mark
from testfixtures import compare
from anchorpy import Idl
from marginpy.utils import load_idl


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
