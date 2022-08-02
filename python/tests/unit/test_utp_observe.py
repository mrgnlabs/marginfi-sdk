from marginpy import utp_observation
from marginpy.utils.data_conversion import b64str_to_bytes
from pytest import mark, raises

from tests.utils import load_sample_account_info


@mark.unit
class TestMarginfiAccountUnit:
    def test_observe_mango_success(self):
        mango_group = b64str_to_bytes(
            load_sample_account_info("mango_group")[1].data[0]
        )
        mango_account = b64str_to_bytes(
            load_sample_account_info("mango_account")[1].data[0]
        )
        mango_cache = b64str_to_bytes(
            load_sample_account_info("mango_cache")[1].data[0]
        )
        assert (
            utp_observation.mango.get_observation(
                mango_group, mango_account, mango_cache
            ).free_collateral
            == 197962693
        )

    def test_observe_mango_throw(self):
        with raises(BaseException, match="SizeMismatch"):
            utp_observation.mango.get_observation(b"", b"", b"")

    def test_observe_zo_success(self):
        zo_margin = b64str_to_bytes(load_sample_account_info("zo_margin")[1].data[0])
        zo_control = b64str_to_bytes(load_sample_account_info("zo_control")[1].data[0])
        zo_state = b64str_to_bytes(load_sample_account_info("zo_state")[1].data[0])
        zo_cache = b64str_to_bytes(load_sample_account_info("zo_cache")[1].data[0])
        assert (
            utp_observation.zo.get_observation(
                zo_margin, zo_control, zo_state, zo_cache
            ).free_collateral
            == 85091195
        )

    def test_observe_zo_throw(self):
        with raises(BaseException, match="SizeMismatch"):
            utp_observation.zo.get_observation(
                b"00000000", b"00000000", b"00000000", b"00000000"
            )
