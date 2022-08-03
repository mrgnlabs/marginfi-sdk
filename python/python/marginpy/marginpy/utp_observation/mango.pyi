from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from marginpy.utp.observation import ObservationRaw

def get_observation(
    mango_group_data: bytes, mango_account_data: bytes, mango_cache_data: bytes
) -> ObservationRaw: ...
