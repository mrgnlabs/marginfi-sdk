# from NEED_MANGO_LIBRARY import Config, GroupConfig, IDS
# Config: https://github.com/blockworks-foundation/mango-client-v3/blob/main/src/config.ts#L276-L312
# GroupConfig: https://github.com/blockworks-foundation/mango-client-v3/blob/main/src/config.ts#L129-L140
# IDS: https://github.com/blockworks-foundation/mango-client-v3/blob/main/src/ids.json
# ^ these are just starters

from dataclasses import dataclass
from typing import List

from solana.publickey import PublicKey
from marginpy.config import Environment
from marginpy.generated_client.types.utp_config import UTPConfig
from marginpy.utils import load_idl

IDS = load_idl('./ids.json')


@dataclass
class OracleConfig:
    symbol: str
    publicKey: PublicKey


@dataclass
class PerpMarketConfig:
    name: str
    public_key: PublicKey
    base_symbol: str
    base_decimals: float
    quote_decimals: float
    market_index: float
    bids_key: PublicKey
    asks_key: PublicKey
    events_key: PublicKey


@dataclass
class SpotMarketConfig:
    name: str
    public_key: PublicKey
    base_symbol: str
    base_decimals: float
    quote_decimals: float
    market_index: float
    bids_key: PublicKey
    asks_key: PublicKey
    events_key: PublicKey


@dataclass
class TokenConfig:
    symbol: str
    mint_key: PublicKey
    decimals: float
    root_key: PublicKey
    node_keys: List[PublicKey]


@dataclass
class GroupConfig:
    cluster: str #@todo 'devnet' | 'mainnet' | 'localnet' | 'testnet'
    name: str
    quote_symbol: str
    public_key: PublicKey
    mango_program_id: PublicKey
    serum_program_id: PublicKey
    oracles: List[OracleConfig]
    perp_markets: List[PerpMarketConfig]
    spot_markets: List[SpotMarketConfig]
    tokens: List[TokenConfig]


class Config:
    cluster_urls #@todo add Record<Cluster, string> type
    groups: List[GroupConfig]

    def __init__(self, json):
        self.cluster_urls = json.cluster_urls
        self.groups = [group_config_from_json(g) for g in json.groups]

    @property
    @staticmethod
    def ids():
        return static_config
    
    def to_json():
        pass

    def get_group(
        self, 
        cluster: str, #@todo Cluster type
        name: str
    ):
        return [
            g for g in self.groups if g.cluster == cluster and g.name == name
        ]
    
    def get_group_with_name(
        self,
        name: str,
    ):
        # return this.groups.find((g) => g.cluster === cluster && g.name === name);
        pass

    def store_group(
        self,
        group: GroupConfig
    ):
        # const _group = this.getGroup(group.cluster, group.name);
        #     if (_group) {
        #     Object.assign(_group, group);
        #     } else {
        #     this.groups.unshift(group);
        #     }
        # }
        pass

static_config = Config(IDS);

class MangoConfig(UTPConfig):
    """
    [Internal]Define Mango-specific config per profile
    """

    utp_index: int
    program_id: PublicKey
    group_config: GroupConfig
    overrides: dict
    
    def __init__(self, environment, overrides=None) -> None:

        if environment == Environment.MAINNET:
            mango_config = Config(IDS)
            group_config = mango_config.get_group("mainnet", "mainnet.1")
            program_id = group_config.mango_program_id
            
            self.utp_index = 0
            self.program_id = program_id
            self.group_config = group_config
            self.overrides = overrides

        elif environment == Environment.DEVNET:
            mango_config = Config(IDS)
            group_config = mango_config.get_group("devnet", "devnet.1")
            program_id = group_config.mango_program_id
            
            self.utp_index = 0
            self.program_id = program_id
            self.group_config = group_config
            self.overrides = overrides

        else:
            raise Exception(
                "Unknown environment for Mango UTP config {}".format(environment)
            )


async def get_mango_config(
    environment: Environment,
    overrides=None
) -> MangoConfig:
    return MangoConfig(
        environment, overrides
    )
