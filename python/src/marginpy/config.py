from enum import Enum
from solana.publickey import PublicKey

class Environment(Enum):
    DEVNET = "devnet"
    MAINNET = "mainnet"

# @todo right now MarginfiConfig
# has no `get` like in js, just `init`
# but e.g. MarginfiGroup is written with a `get`
# see if we can just init
class MarginfiConfig:

    def __init__(
        self,
        environment,
        overrides,
    ) -> None:

        def handle_override(override, default):
            return override if override != None else default

        if (environment == Environment.MAINNET):
            self.environment = environment
            self.program_id = handle_override(overrides.program_id, PublicKey.from_string("mrgnfD8pJKsw4AxCDquyUBjgABNEaZ79iTLgtov2Yff"))
            self.group_pk = handle_override(overrides.group_pk, PublicKey.from_string("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba"))
            self.collateral_mint_pk = handle_override(overrides.collateral_mint_pk, PublicKey.from_string("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"))
        elif (environment == Environment.DEVNET):
            self.environment = environment
            self.program_id = handle_override(overrides.program_id, PublicKey.from_string("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK"))
            self.group_pk = handle_override(overrides.group_pk, PublicKey.from_string("7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg"))
            self.collateral_mint_pk = handle_override(overrides.collateral_mint_pk, PublicKey.from_string("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"))
        elif (environment == Environment.LOCALNET):
            if ((overrides.program_id and overrides.group_pk and overrides.collateral_mint_pk) == None):
                raise Exception(
                    "program_id, group_pk, and collateral_mint_pk need to be explicitly input for localnet."
                )
            self.environment = environment
            self.program_id = overrides.program_id
            self.group_pk = overrides.group_pk
            self.collateral_mint_pk = overrides.collateral_mint_pk
        else:
            raise Exception(
                "Unknown environment {}".format(environment)
            )

# @todo: Add Config
# JS:
# export async function getConfig(
#   environment: Environment,
#   _connection: Connection,
#   overrides?: Partial<Omit<MarginfiConfig, "environment">>
# ): Promise<MarginfiConfig> {
#   return {
#     ...getMarginfiConfig(environment, overrides),
#     mango: await getMangoConfig(environment, overrides?.mango),
#     zo: await getZoConfig(environment, overrides?.zo),
#   };
# }
