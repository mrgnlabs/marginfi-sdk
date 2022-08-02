import logging

import coloredlogs  # type: ignore


def get_logger(name: str):
    logger = logging.getLogger(name)
    coloredlogs.install(
        logger=logger,
        milliseconds=True,
        fmt="[%(asctime)s] %(name)s %(levelname)s %(message)s",
    )
    return logger
