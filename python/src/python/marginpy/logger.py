import logging
import sys
from typing import Any

import coloredlogs  # type: ignore


def setup_logging(level: Any = logging.INFO):
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


def get_logger(name: str):
    logger = logging.getLogger(name)
    coloredlogs.install(
        logger=logger,
        level=logger.getEffectiveLevel(),
        milliseconds=True,
        fmt="[%(asctime)s] %(name)s %(levelname)s %(message)s",
    )
    return logger
