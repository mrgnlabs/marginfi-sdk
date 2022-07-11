"""The Marginfi python SDK."""
from marginpy.config import MarginfiConfig, Environment
from marginpy.client import MarginfiClient
from marginpy.group import MarginfiGroup
from marginpy.account import MarginfiAccount

__all__ = [
    "MarginfiConfig",
    "Environment",
    "MarginfiClient",
    "MarginfiGroup",
    "MarginfiAccount",
]

__version__ = "0.1.0"
