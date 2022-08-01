from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from marginpy.types import ObservationRaw

def get_observation(
    mango_group_data: bytes, mango_account_data: bytes, mango_cache_data: bytes
) -> ObservationRaw: ...
