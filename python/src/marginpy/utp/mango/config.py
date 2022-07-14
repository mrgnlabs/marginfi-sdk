# from NEED_MANGO_LIBRARY import Config, GroupConfig, IDS
# Config: https://github.com/blockworks-foundation/mango-client-v3/blob/main/src/config.ts#L276-L312
# GroupConfig: https://github.com/blockworks-foundation/mango-client-v3/blob/main/src/config.ts#L129-L140
# IDS: https://github.com/blockworks-foundation/mango-client-v3/blob/main/src/ids.json
# ^ these are just starters

from marginpy.config import Environment


class MangoConfig:

    def __init__(
        self,
        environment,
        overrides=None
    ):
        if environment == Environment.MAINNET:
            # mango_config = Config(IDS)
            # group_config = mango_config.get_group("mainnet", "mainnet.1")
            # program_id = group_config.mango_program_id
            # return {
            #     "utp_index": 0,
            #     "program_id": program_id,
            #     "group_config": group_config,
            #     "overrides": overrides,
            # }
            pass

        elif environment == Environment.DEVNET:
            # mango_config = Config(IDS)
            # group_config = mango_config.get_group("devnet", "devnet.1")
            # program_id = group_config.mango_program_id
            # return {
            #     "utp_index": 0,
            #     "program_id": program_id,
            #     "group_config": group_config,
            #     "overrides": overrides,
            # }
            pass

        else:
            raise Exception(
                "Unknown environment for Mango UTP config {}".format(environment)
            )
