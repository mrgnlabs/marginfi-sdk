from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from marginpy.types import ObservationRaw

def get_observation(
    zo_margin: bytes, zo_control: bytes, zo_state: bytes, zo_cache: bytes
) -> ObservationRaw: ...
