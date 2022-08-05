import logging
import sys
from typing import Any

import coloredlogs  # type: ignore


def setup_logging(level: Any = logging.WARN) -> None:
    """
    Sets up loggers to provide the specified verbose level, and only let through marginpy logs.

    Args:
        level (Any, optional): verbose level. Defaults to logging.INFO.
    """

    class MfiFilter(logging.Filter):
        def filter(self, record):
            return record.name.startswith("marginpy")

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(level)
    stdout_handler.addFilter(MfiFilter())

    logging.basicConfig(
        level=level,
        handlers=[stdout_handler],
    )


def get_logger(name: str) -> logging.Logger:
    """
    Fetches or creates named logger.

    Args:
        name (str): logger name

    Returns:
        logging.Logger: logger
    """

    logger = logging.getLogger(name)
    coloredlogs.install(
        logger=logger,
        level=logger.getEffectiveLevel(),
        milliseconds=True,
        fmt="[%(asctime)s] %(name)s %(levelname)s %(message)s",
    )
    return logger
