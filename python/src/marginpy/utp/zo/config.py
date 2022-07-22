from solana.publickey import PublicKey

from marginpy.config import Environment
from marginpy.generated_client.types.utp_config import UTPConfig

class ZoConfig(UTPConfig):
    state_pk: PublicKey
    cluster: #@todo add ZoClient.Cluster type
    dex_program: PublicKey

    """
    [Internal]
    Define Zo-specific config per profile
    """
    def __init__(self, environment, overrides=None):
        if environment == Environment.MAINNET:
            # return {
            #     utpIndex: 1,
            #     programId: ZoClient.ZERO_ONE_MAINNET_PROGRAM_ID,
            #     statePk: ZO_MAINNET_STATE_KEY,
            #     cluster: ZoClient.Cluster.Mainnet,
            #     dexProgram: ZO_DEX_MAINNET_PROGRAM_ID,
            #     ...overrides,
            # };
            pass
    
        elif environment == Environment.DEVNET:
            # return {
            #     utpIndex: 1,
            #     programId: ZoClient.ZERO_ONE_DEVNET_PROGRAM_ID,
            #     statePk: ZO_DEVNET_STATE_KEY,
            #     cluster: ZoClient.Cluster.Devnet,
            #     dexProgram: ZO_DEX_DEVNET_PROGRAM_ID,
            #     ...overrides,
            # };
            pass

        else:
            raise Exception(
                "Unknown environment for Zo UTP config {}".format(environment)
            )
        
async def get_zo_config(
    environment: Environment,
    overrides=None
):
    return ZoConfig(
        environment, overrides
    )
