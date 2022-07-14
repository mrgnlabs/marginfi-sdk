import json
import os

from anchorpy import Idl


def load_idl() -> Idl:
    idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
    with open(idl_path) as f:
        raw_idl = json.load(f)
    idl = Idl.from_json(raw_idl)
    return idl
