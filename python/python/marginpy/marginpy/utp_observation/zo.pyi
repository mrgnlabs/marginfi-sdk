from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from marginpy.utp.observation import ObservationRaw

def get_observation(
    zo_margin_data: bytes,
    zo_control_data: bytes,
    zo_state_data: bytes,
    zo_cache_data: bytes,
) -> ObservationRaw: ...
