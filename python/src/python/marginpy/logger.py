import logging

import coloredlogs  # type: ignore


def get_logger(name: str):
    logger = logging.getLogger(name)
    coloredlogs.install(logger=logger)
    return logger
