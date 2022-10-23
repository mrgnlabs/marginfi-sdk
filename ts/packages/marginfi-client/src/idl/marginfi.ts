export type Marginfi = {
  "version": "0.1.0",
  "name": "marginfi",
  "instructions": [
    {
      "name": "initMarginfiGroup",
      "docs": [
        "Creates a marginfi group, which acts as a global liquidity pool between",
        "marginfi accounts in the marginfi group and a set of whitelisted underlying",
        "trading protocols (UTPs)."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer that creates the marginfi group becomes",
            "its admin, and in creating the group specifies",
            "the UTPs that will be whitelisted in this marginfi group."
          ]
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The collateral token mint, which speifies the collateral type",
            "supported in this marginfi group. Currently, marginfi architecture",
            "supports one collateral type per marginfi group, specified",
            "here via the token mint."
          ]
        },
        {
          "name": "bankVault",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The marginfi group bank vault stores funds deposited by users",
            "available for lending to other users. In other words, this is",
            "the liquidity available at the marginfi group level for marginfi accounts",
            "in this marginfi group to borrow from."
          ]
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "insuranceVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "insuranceVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bankAuthorityPdaBump",
          "type": "u8"
        },
        {
          "name": "insuranceVaultAuthorityPdaBump",
          "type": "u8"
        },
        {
          "name": "feeVaultAuthorityPdaBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "configureMarginfiGroup",
      "docs": [
        "Updates configurations for an existing marginfi group."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "configArg",
          "type": {
            "defined": "GroupConfig"
          }
        }
      ]
    },
    {
      "name": "bankFeeVaultWithdraw",
      "docs": [
        "Allows a marginfi group admin to withdraw accrued protocol fees for the",
        "relevant marginfi group from the protocol to an arbitrary wallet."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "bankFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankFeeVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recipientTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "- an honest admin will provide the correct one",
            "- incorrect mints will fail tx"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initMarginfiAccount",
      "docs": [
        "Creates a new marginfi account with a given authority."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority that owns the marginfi account, ie the 'trader'.",
            "Also the one signer that has authority to deposit/withdraw",
            "collateral from the marginfi account, as well as take action",
            "on UTPs."
          ]
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The marginfi group this marginfi account belongs to,",
            "which determins the UTPs this marginfi account can access.",
            "",
            "TODO: Should we limit the number of marginfi accounts?"
          ]
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initMarginfiAccountWithType",
      "docs": [
        "Creates a new marginfi account with a given authority and account flags."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority that owns the marginfi account, ie the 'trader'.",
            "Also the one signer that has authority to deposit/withdraw",
            "collateral from the marginfi account, as well as take action",
            "on UTPs."
          ]
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The marginfi group this marginfi account belongs to,",
            "which determins the UTPs this marginfi account can access.",
            "",
            "TODO: Should we limit the number of marginfi accounts?"
          ]
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marginfiAccountType",
          "type": {
            "defined": "AccountType"
          }
        }
      ]
    },
    {
      "name": "bankInsuranceVaultWithdraw",
      "docs": [
        "Allows an admin of a given marginfi group to withdraw funds from that",
        "marginfi group's bank's insurance vault. While requiring signing from the",
        "admin for the transaction, this method allows the admin to withdraw",
        "funds to an arbitrary `recipient_token_account`, thereby assuming an",
        "honest admin."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "insuranceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insuranceVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recipientTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "- an honest admin will provide the correct one",
            "- incorrect mints will fail tx"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marginDepositCollateral",
      "docs": [
        "Allows the owner of a marginfi account to deposit collateral into it."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "fundingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marginWithdrawCollateral",
      "docs": [
        "Allows the owner of a marginfi account to withdraw available collateral",
        "from that marginfi account."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marginCollateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginBankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "receivingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "liquidate",
      "docs": [
        "Allows a liquidator to liquidate marginfi accounts that have fallen below",
        "margin requirements. marginfi liquidations occur at the UTP account",
        "level. In other words, when marginfi marginfi accounts fall below margin",
        "requirements, liquidators pay marginfi accounts a discounted rate to take",
        "ownership of UTP accounts that those marginfi accounts own.",
        "The marginfi takes a fee on liquidations as well, and those funds are",
        "added to marginfi's insurance vault."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Manually verified for:",
            "- not same account as `marginfi_account_liquidatee` (c.f. `marginfi_account_liquidatee` checks)",
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marginfiAccountLiquidatee",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Manually verified for:",
            "- can be liquidated (in body)",
            "- has an active UTP (in body)",
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "bankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankInsuranceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "utpIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deactivateUtp",
      "docs": [
        "Allows the owner of a marginfi account to deactivate a UTP account when the",
        "UTP account is empty and no longer has collateral or positions in it."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "utpIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marginfiAccountConfigureAdmin",
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "config",
          "type": {
            "defined": "MarginfiAccountConfigArg"
          }
        }
      ]
    },
    {
      "name": "handleBankruptcy",
      "docs": [
        "For a marginfi account not meeting the maintenence margin requirements,",
        "outstanding debts, and no assets left to liquidate, this method",
        "manages repaying the debt for that marginfi account by",
        "using funds from the insurance vault",
        "or socializing losses among lenders in the related marginfi group's liquidity pool",
        "in case the insurance fund is empty."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insuranceVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "insuranceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liquidityVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateInterestAccumulator",
      "docs": [
        "Updates a central interest rate accumulator that tracks interest fees",
        "owed by all borrowers within the protocol, and collects related protocol fees.",
        "This method is executed by crankers."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "utpMangoReimburse",
      "accounts": [],
      "args": [
        {
          "name": "indexIntoTable",
          "type": "u64"
        }
      ]
    },
    {
      "name": "utpZoActivate",
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "utpAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoMargin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoControl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "authoritySeed",
          "type": "publicKey"
        },
        {
          "name": "authorityBump",
          "type": "u8"
        },
        {
          "name": "zoMarginNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "utpZoDeposit",
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Authority is verified in `check_rebalance_deposit_conditions`"
          ]
        },
        {
          "name": "marginCollateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tempCollateralAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "We are assuming that the ix will fail if the owner is anyone but the UTP pda.",
            "",
            "Because multiple marginfi accounts might share the same UTP PDA, there a possibility that an attacker might expose",
            "the token account of another marginfi account.",
            "I am not sure what they could do with it, as the collateral only enters these token accounts atomically in this ix and is later closed.",
            "But because I am superstitious, we are making sure here that the temp token account is empty."
          ]
        },
        {
          "name": "utpAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoStateSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoCache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoMargin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "utpZoWithdraw",
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Partially permission-less"
          ]
        },
        {
          "name": "marginCollateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "utpAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoMargin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoStateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoCache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoControl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "heimdall",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "utpZoCreatePerpOpenOrders",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "utpZoPlacePerpOrder",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reqQ",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eventQ",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketBids",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketAsks",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UtpZoPlacePerpOrderIxArgs"
          }
        }
      ]
    },
    {
      "name": "utpZoCancelPerpOrder",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "cache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketBids",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketAsks",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eventQ",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": {
            "option": "u128"
          }
        },
        {
          "name": "isLong",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "clientId",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "utpZoSettleFunds",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "marginfiAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "marginfiGroup",
            "type": "publicKey"
          },
          {
            "name": "depositRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "borrowRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "activeUtps",
            "type": {
              "array": [
                "bool",
                32
              ]
            }
          },
          {
            "name": "utpAccountConfig",
            "type": {
              "array": [
                {
                  "defined": "UTPAccountConfig"
                },
                32
              ]
            }
          },
          {
            "name": "depositLimit",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "flags",
            "type": {
              "defined": "AccountFlags"
            }
          },
          {
            "name": "reservedSpace",
            "docs": [
              "Reserved space for future fields.",
              "Reduce accordingly when adding new fields to the struct"
            ],
            "type": {
              "array": [
                "u128",
                254
              ]
            }
          },
          {
            "name": "reservedSpace2",
            "type": {
              "array": [
                "u8",
                14
              ]
            }
          }
        ]
      }
    },
    {
      "name": "marginfiGroup",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "bank",
            "type": {
              "defined": "Bank"
            }
          },
          {
            "name": "paused",
            "docs": [
              "Group operations paused flag."
            ],
            "type": "bool"
          },
          {
            "name": "reservedSpace",
            "docs": [
              "Reserved space for future fields.",
              "Reduce accordingly when adding new fields to the struct."
            ],
            "type": {
              "array": [
                "u128",
                384
              ]
            }
          }
        ]
      }
    },
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marginRequirementInit",
            "type": "u128"
          },
          {
            "name": "marginRequirementMaint",
            "type": "u128"
          },
          {
            "name": "equity",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "UtpZoPlacePerpOrderIxArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "limitPrice",
            "type": "u64"
          },
          {
            "name": "maxBaseQuantity",
            "type": "u64"
          },
          {
            "name": "maxQuoteQuantity",
            "type": "u64"
          },
          {
            "name": "orderType",
            "type": {
              "defined": "OrderType"
            }
          },
          {
            "name": "limit",
            "type": "u16"
          },
          {
            "name": "clientId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UtpZoCancelPerpOrderIxArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": {
              "option": "u128"
            }
          },
          {
            "name": "isLong",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "clientId",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "WrappedI80F48",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bits",
            "type": "i128"
          }
        ]
      }
    },
    {
      "name": "AccountFlags",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "flags",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "MarginfiAccountConfigArg",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "depositLimit",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "UTPAccountConfig",
      "docs": [
        "Data about a UTP account owned by a marginfi account.",
        "- `address` is the address of the UTP user account (mango account, drift user account)",
        "- `authority_seed, authority_bump` are used to derive the PDA that controls the UTP user account.",
        "",
        "#### Security assumption:",
        "We cannot generate PDAs unique to UTP user accounts, because some UTPs use the signer (PDA) address as a seed for the user account.",
        "We also cannot use the marginfi account address as a PDA seed, because the UTP might change owners through liquidations.",
        "Alternatively, using a random oracle increases complexity with diminishing returns.",
        "",
        "Because of this we pessimistically assume that two marginfi accounts might share a PDA for a given UTP,",
        "and our security relies on making sure that the UTP can only be accessed by their owners, by checking the `UTPAccountConfig` instead of relying",
        "on the uniqueness of the PDA."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "authoritySeed",
            "type": "publicKey"
          },
          {
            "name": "authorityBump",
            "type": "u8"
          },
          {
            "name": "utpAddressBook",
            "docs": [
              "A cache of UTP addresses used for local security verification"
            ],
            "type": {
              "array": [
                "publicKey",
                4
              ]
            }
          },
          {
            "name": "reservedSpace",
            "type": {
              "array": [
                "u32",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "UTPConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "utpProgramId",
            "type": "publicKey"
          },
          {
            "name": "marginRequirementDepositBuffer",
            "type": {
              "defined": "WrappedI80F48"
            }
          }
        ]
      }
    },
    {
      "name": "GroupConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "bank",
            "type": {
              "option": {
                "defined": "BankConfig"
              }
            }
          },
          {
            "name": "paused",
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    },
    {
      "name": "BankConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scalingFactorC",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "fixedFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "interestFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "initMarginRatio",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maintMarginRatio",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "accountDepositLimit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "lpDepositLimit",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "Bank",
      "docs": [
        "A bank is a subset of a marginfi group, and one bank",
        "exists for each marginfi group. The bank's job is to",
        "set parameters for the marginfi group related to borrowing",
        "and lending portfolio-level collateral, and to store",
        "collateral funds to lend to marginfi accounts in the marginfi group",
        "in the bank vault `bank.vault`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scalingFactorC",
            "docs": [
              "`scaling_factor_c`, `fixed_fee`, and `interest_fee`",
              "are parameters in marginfi's interest rate calculation",
              "for lending and borrowing. The interest rate calculation",
              "can be observed in the bank's `calculate_interest_rate` fn."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "fixedFee",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "interestFee",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "depositAccumulator",
            "docs": [
              "Accumulators are time-dependent compound interest rate multipliers.",
              "Accumulators are determined in functions part of impl `Bank` and",
              "are calculated based on the appropriate interest rate",
              "(lending or borrowing) and how much time has passed since the",
              "last interest calculation, herein denoted as `time_delta`."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "borrowAccumulator",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "lastUpdate",
            "type": "i64"
          },
          {
            "name": "totalDepositsRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "totalBorrowsRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "mint",
            "docs": [
              "The mint denotes the collateral type."
            ],
            "type": "publicKey"
          },
          {
            "name": "vault",
            "docs": [
              "The vault pubkey denotes the bank's vault,",
              "where liquidity is actually stored."
            ],
            "type": "publicKey"
          },
          {
            "name": "vaultAuthorityPdaBump",
            "docs": [
              "Bank authority pda bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "insuranceVault",
            "docs": [
              "Insurance vault address"
            ],
            "type": "publicKey"
          },
          {
            "name": "insuranceVaultAuthorityPdaBump",
            "type": "u8"
          },
          {
            "name": "insuranceVaultOutstandingTransfers",
            "docs": [
              "Outstanding balance to be transferred to the fee vault from the main liquidity vault."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "feeVault",
            "docs": [
              "Protocol fee vault address"
            ],
            "type": "publicKey"
          },
          {
            "name": "feeVaultAuthorityPdaBump",
            "type": "u8"
          },
          {
            "name": "feeVaultOutstandingTransfers",
            "docs": [
              "Outstanding balance to be transferred to the fee vault from the main liquidity vault."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "initMarginRatio",
            "docs": [
              "Today's marginfi groups in marginfi each have fixed",
              "initial and maintenance margin requirements, which",
              "are stored as attributes part of the Bank."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "maintMarginRatio",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "accountDepositLimit",
            "docs": [
              "Account equity above which deposits are not allowed.",
              "If Decimal::ZERO, no limit is applied."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "lpDepositLimit",
            "docs": [
              "Balance of liquidity pool (LP) deposits above which deposits are not allowed.",
              "If Decimal::ZERO, no limit is applied."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "reservedSpace",
            "docs": [
              "Reserved space for future fields.",
              "Reduce accordingly when adding new fields to the struct."
            ],
            "type": {
              "array": [
                "u128",
                31
              ]
            }
          }
        ]
      }
    },
    {
      "name": "AccountType",
      "docs": [
        "Type use when initializing a margin account.",
        "Type maps to specific account flags."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NormalAccount"
          },
          {
            "name": "LPAccount"
          }
        ]
      }
    },
    {
      "name": "MarginRequirement",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Init"
          },
          {
            "name": "PartialLiquidation"
          },
          {
            "name": "Maint"
          }
        ]
      }
    },
    {
      "name": "EquityType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitReqAdjusted"
          },
          {
            "name": "Total"
          }
        ]
      }
    },
    {
      "name": "BankVaultType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "LiquidityVault"
          },
          {
            "name": "InsuranceVault"
          },
          {
            "name": "ProtocolFeeVault"
          }
        ]
      }
    },
    {
      "name": "InternalTransferType",
      "docs": [
        "Possible internal transfers:",
        "- InsuranceFee - Fees collected and sent from the main liquidity vault to the insurance vault.",
        "- ProtocolFee - Fees collected and sent from the main liquidity vault to the protocol fee vault."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InsuranceFee"
          },
          {
            "name": "ProtocolFee"
          }
        ]
      }
    },
    {
      "name": "LendingSide",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Borrow"
          },
          {
            "name": "Deposit"
          }
        ]
      }
    },
    {
      "name": "OrderType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Limit"
          },
          {
            "name": "ImmediateOrCancel"
          },
          {
            "name": "PostOnly"
          },
          {
            "name": "ReduceOnlyIoc"
          },
          {
            "name": "ReduceOnlyLimit"
          },
          {
            "name": "FillOrKill"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "UpdateInterestAccumulatorEvent",
      "fields": [
        {
          "name": "currentTimestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "deltaCompoundingPeriods",
          "type": "u64",
          "index": false
        },
        {
          "name": "feesCollected",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        },
        {
          "name": "utilizationRate",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        },
        {
          "name": "interestRate",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "MarginRequirementCheck",
      "fields": [
        {
          "name": "init",
          "type": "bool",
          "index": false
        },
        {
          "name": "equity",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        },
        {
          "name": "marginRequirement",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "UptObservationFreeCollateral",
      "fields": [
        {
          "name": "utpIndex",
          "type": "u8",
          "index": false
        },
        {
          "name": "value",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "UptObservationNeedsRebalance",
      "fields": [
        {
          "name": "utpIndex",
          "type": "u8",
          "index": false
        },
        {
          "name": "netFreeCollateral",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "RiskEnginePermissionlessAction",
      "fields": []
    },
    {
      "name": "RiskEngineReduceOnly",
      "fields": []
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Signer not authorized to perform this action"
    },
    {
      "code": 6001,
      "name": "EmptyLendingPool",
      "msg": "Lending pool empty"
    },
    {
      "code": 6002,
      "name": "IllegalUtilizationRatio",
      "msg": "Illegal utilization ratio"
    },
    {
      "code": 6003,
      "name": "MathError",
      "msg": "very bad mafs"
    },
    {
      "code": 6004,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    },
    {
      "code": 6005,
      "name": "MarginRequirementsNotMet",
      "msg": "Initialization margin requirements not met"
    },
    {
      "code": 6006,
      "name": "OnlyReduceAllowed",
      "msg": "Only reducing trades are allowed when under init margin requirements"
    },
    {
      "code": 6007,
      "name": "UtpInactive",
      "msg": "Inactive UTP"
    },
    {
      "code": 6008,
      "name": "UtpAlreadyActive",
      "msg": "Utp is already active"
    },
    {
      "code": 6009,
      "name": "InvalidAccountData",
      "msg": "Invalid Account Data"
    },
    {
      "code": 6010,
      "name": "LiquidatorHasActiveUtps",
      "msg": "Liquidator has active utps"
    },
    {
      "code": 6011,
      "name": "AccountHasActiveUtps",
      "msg": "Account has active utps"
    },
    {
      "code": 6012,
      "name": "AccountNotLiquidatable",
      "msg": "Marginfi account not liquidatable"
    },
    {
      "code": 6013,
      "name": "AccountNotBankrupt",
      "msg": "Marginfi account not bankrupt"
    },
    {
      "code": 6014,
      "name": "IllegalUtpDeactivation",
      "msg": "Utp account cannot be deactivated"
    },
    {
      "code": 6015,
      "name": "IllegalRebalance",
      "msg": "Rebalance not legal"
    },
    {
      "code": 6016,
      "name": "BorrowNotAllowed",
      "msg": "Borrow not allowed"
    },
    {
      "code": 6017,
      "name": "IllegalConfig",
      "msg": "Config value not legal"
    },
    {
      "code": 6018,
      "name": "OperationsPaused",
      "msg": "Operations paused"
    },
    {
      "code": 6019,
      "name": "InsufficientVaultBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6020,
      "name": "Forbidden",
      "msg": "This operation is forbidden"
    },
    {
      "code": 6021,
      "name": "InvalidUTPAccount",
      "msg": "Invalid account key"
    },
    {
      "code": 6022,
      "name": "AccountDepositLimit",
      "msg": "Deposit exceeds account cap"
    },
    {
      "code": 6023,
      "name": "GroupDepositLimit",
      "msg": "Deposit exceeds group cap"
    },
    {
      "code": 6024,
      "name": "InvalidObserveAccounts",
      "msg": "Missing accounts for UTP observation"
    },
    {
      "code": 6025,
      "name": "MangoError",
      "msg": "Mango error"
    },
    {
      "code": 6026,
      "name": "OperationDisabled",
      "msg": "Operation no longer supported"
    }
  ]
};

export const IDL: Marginfi = {
  "version": "0.1.0",
  "name": "marginfi",
  "instructions": [
    {
      "name": "initMarginfiGroup",
      "docs": [
        "Creates a marginfi group, which acts as a global liquidity pool between",
        "marginfi accounts in the marginfi group and a set of whitelisted underlying",
        "trading protocols (UTPs)."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer that creates the marginfi group becomes",
            "its admin, and in creating the group specifies",
            "the UTPs that will be whitelisted in this marginfi group."
          ]
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The collateral token mint, which speifies the collateral type",
            "supported in this marginfi group. Currently, marginfi architecture",
            "supports one collateral type per marginfi group, specified",
            "here via the token mint."
          ]
        },
        {
          "name": "bankVault",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The marginfi group bank vault stores funds deposited by users",
            "available for lending to other users. In other words, this is",
            "the liquidity available at the marginfi group level for marginfi accounts",
            "in this marginfi group to borrow from."
          ]
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "insuranceVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "insuranceVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bankAuthorityPdaBump",
          "type": "u8"
        },
        {
          "name": "insuranceVaultAuthorityPdaBump",
          "type": "u8"
        },
        {
          "name": "feeVaultAuthorityPdaBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "configureMarginfiGroup",
      "docs": [
        "Updates configurations for an existing marginfi group."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "configArg",
          "type": {
            "defined": "GroupConfig"
          }
        }
      ]
    },
    {
      "name": "bankFeeVaultWithdraw",
      "docs": [
        "Allows a marginfi group admin to withdraw accrued protocol fees for the",
        "relevant marginfi group from the protocol to an arbitrary wallet."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "bankFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankFeeVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recipientTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "- an honest admin will provide the correct one",
            "- incorrect mints will fail tx"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initMarginfiAccount",
      "docs": [
        "Creates a new marginfi account with a given authority."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority that owns the marginfi account, ie the 'trader'.",
            "Also the one signer that has authority to deposit/withdraw",
            "collateral from the marginfi account, as well as take action",
            "on UTPs."
          ]
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The marginfi group this marginfi account belongs to,",
            "which determins the UTPs this marginfi account can access.",
            "",
            "TODO: Should we limit the number of marginfi accounts?"
          ]
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initMarginfiAccountWithType",
      "docs": [
        "Creates a new marginfi account with a given authority and account flags."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority that owns the marginfi account, ie the 'trader'.",
            "Also the one signer that has authority to deposit/withdraw",
            "collateral from the marginfi account, as well as take action",
            "on UTPs."
          ]
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The marginfi group this marginfi account belongs to,",
            "which determins the UTPs this marginfi account can access.",
            "",
            "TODO: Should we limit the number of marginfi accounts?"
          ]
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marginfiAccountType",
          "type": {
            "defined": "AccountType"
          }
        }
      ]
    },
    {
      "name": "bankInsuranceVaultWithdraw",
      "docs": [
        "Allows an admin of a given marginfi group to withdraw funds from that",
        "marginfi group's bank's insurance vault. While requiring signing from the",
        "admin for the transaction, this method allows the admin to withdraw",
        "funds to an arbitrary `recipient_token_account`, thereby assuming an",
        "honest admin."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "insuranceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insuranceVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recipientTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "- an honest admin will provide the correct one",
            "- incorrect mints will fail tx"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marginDepositCollateral",
      "docs": [
        "Allows the owner of a marginfi account to deposit collateral into it."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "fundingAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marginWithdrawCollateral",
      "docs": [
        "Allows the owner of a marginfi account to withdraw available collateral",
        "from that marginfi account."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marginCollateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginBankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "receivingTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "liquidate",
      "docs": [
        "Allows a liquidator to liquidate marginfi accounts that have fallen below",
        "margin requirements. marginfi liquidations occur at the UTP account",
        "level. In other words, when marginfi marginfi accounts fall below margin",
        "requirements, liquidators pay marginfi accounts a discounted rate to take",
        "ownership of UTP accounts that those marginfi accounts own.",
        "The marginfi takes a fee on liquidations as well, and those funds are",
        "added to marginfi's insurance vault."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Manually verified for:",
            "- not same account as `marginfi_account_liquidatee` (c.f. `marginfi_account_liquidatee` checks)",
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marginfiAccountLiquidatee",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Manually verified for:",
            "- can be liquidated (in body)",
            "- has an active UTP (in body)",
            "#[soteria(ignore)]"
          ]
        },
        {
          "name": "bankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankInsuranceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "utpIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deactivateUtp",
      "docs": [
        "Allows the owner of a marginfi account to deactivate a UTP account when the",
        "UTP account is empty and no longer has collateral or positions in it."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "utpIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marginfiAccountConfigureAdmin",
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "config",
          "type": {
            "defined": "MarginfiAccountConfigArg"
          }
        }
      ]
    },
    {
      "name": "handleBankruptcy",
      "docs": [
        "For a marginfi account not meeting the maintenence margin requirements,",
        "outstanding debts, and no assets left to liquidate, this method",
        "manages repaying the debt for that marginfi account by",
        "using funds from the insurance vault",
        "or socializing losses among lenders in the related marginfi group's liquidity pool",
        "in case the insurance fund is empty."
      ],
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insuranceVaultAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "insuranceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liquidityVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateInterestAccumulator",
      "docs": [
        "Updates a central interest rate accumulator that tracks interest fees",
        "owed by all borrowers within the protocol, and collects related protocol fees.",
        "This method is executed by crankers."
      ],
      "accounts": [
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bankFeeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "utpMangoReimburse",
      "accounts": [],
      "args": [
        {
          "name": "indexIntoTable",
          "type": "u64"
        }
      ]
    },
    {
      "name": "utpZoActivate",
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "utpAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoMargin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoControl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "authoritySeed",
          "type": "publicKey"
        },
        {
          "name": "authorityBump",
          "type": "u8"
        },
        {
          "name": "zoMarginNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "utpZoDeposit",
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Authority is verified in `check_rebalance_deposit_conditions`"
          ]
        },
        {
          "name": "marginCollateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tempCollateralAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "We are assuming that the ix will fail if the owner is anyone but the UTP pda.",
            "",
            "Because multiple marginfi accounts might share the same UTP PDA, there a possibility that an attacker might expose",
            "the token account of another marginfi account.",
            "I am not sure what they could do with it, as the collateral only enters these token accounts atomically in this ix and is later closed.",
            "But because I am superstitious, we are making sure here that the temp token account is empty."
          ]
        },
        {
          "name": "utpAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoStateSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoCache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoMargin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "utpZoWithdraw",
      "accounts": [
        {
          "name": "marginfiAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marginfiGroup",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Partially permission-less"
          ]
        },
        {
          "name": "marginCollateralVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "utpAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoMargin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "zoState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoStateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoCache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoControl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "zoVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "heimdall",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "utpZoCreatePerpOpenOrders",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "utpZoPlacePerpOrder",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reqQ",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eventQ",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketBids",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketAsks",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UtpZoPlacePerpOrderIxArgs"
          }
        }
      ]
    },
    {
      "name": "utpZoCancelPerpOrder",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "cache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketBids",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketAsks",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eventQ",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": {
            "option": "u128"
          }
        },
        {
          "name": "isLong",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "clientId",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "utpZoSettleFunds",
      "accounts": [
        {
          "name": "header",
          "accounts": [
            {
              "name": "marginfiAccount",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "marginfiGroup",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "signer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "utpAuthority",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "zoProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stateSigner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cache",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "margin",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "control",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "openOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dexProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "marginfiAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "marginfiGroup",
            "type": "publicKey"
          },
          {
            "name": "depositRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "borrowRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "activeUtps",
            "type": {
              "array": [
                "bool",
                32
              ]
            }
          },
          {
            "name": "utpAccountConfig",
            "type": {
              "array": [
                {
                  "defined": "UTPAccountConfig"
                },
                32
              ]
            }
          },
          {
            "name": "depositLimit",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "flags",
            "type": {
              "defined": "AccountFlags"
            }
          },
          {
            "name": "reservedSpace",
            "docs": [
              "Reserved space for future fields.",
              "Reduce accordingly when adding new fields to the struct"
            ],
            "type": {
              "array": [
                "u128",
                254
              ]
            }
          },
          {
            "name": "reservedSpace2",
            "type": {
              "array": [
                "u8",
                14
              ]
            }
          }
        ]
      }
    },
    {
      "name": "marginfiGroup",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "bank",
            "type": {
              "defined": "Bank"
            }
          },
          {
            "name": "paused",
            "docs": [
              "Group operations paused flag."
            ],
            "type": "bool"
          },
          {
            "name": "reservedSpace",
            "docs": [
              "Reserved space for future fields.",
              "Reduce accordingly when adding new fields to the struct."
            ],
            "type": {
              "array": [
                "u128",
                384
              ]
            }
          }
        ]
      }
    },
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marginRequirementInit",
            "type": "u128"
          },
          {
            "name": "marginRequirementMaint",
            "type": "u128"
          },
          {
            "name": "equity",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "UtpZoPlacePerpOrderIxArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isLong",
            "type": "bool"
          },
          {
            "name": "limitPrice",
            "type": "u64"
          },
          {
            "name": "maxBaseQuantity",
            "type": "u64"
          },
          {
            "name": "maxQuoteQuantity",
            "type": "u64"
          },
          {
            "name": "orderType",
            "type": {
              "defined": "OrderType"
            }
          },
          {
            "name": "limit",
            "type": "u16"
          },
          {
            "name": "clientId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UtpZoCancelPerpOrderIxArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": {
              "option": "u128"
            }
          },
          {
            "name": "isLong",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "clientId",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "WrappedI80F48",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bits",
            "type": "i128"
          }
        ]
      }
    },
    {
      "name": "AccountFlags",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "flags",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "MarginfiAccountConfigArg",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "depositLimit",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "UTPAccountConfig",
      "docs": [
        "Data about a UTP account owned by a marginfi account.",
        "- `address` is the address of the UTP user account (mango account, drift user account)",
        "- `authority_seed, authority_bump` are used to derive the PDA that controls the UTP user account.",
        "",
        "#### Security assumption:",
        "We cannot generate PDAs unique to UTP user accounts, because some UTPs use the signer (PDA) address as a seed for the user account.",
        "We also cannot use the marginfi account address as a PDA seed, because the UTP might change owners through liquidations.",
        "Alternatively, using a random oracle increases complexity with diminishing returns.",
        "",
        "Because of this we pessimistically assume that two marginfi accounts might share a PDA for a given UTP,",
        "and our security relies on making sure that the UTP can only be accessed by their owners, by checking the `UTPAccountConfig` instead of relying",
        "on the uniqueness of the PDA."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "authoritySeed",
            "type": "publicKey"
          },
          {
            "name": "authorityBump",
            "type": "u8"
          },
          {
            "name": "utpAddressBook",
            "docs": [
              "A cache of UTP addresses used for local security verification"
            ],
            "type": {
              "array": [
                "publicKey",
                4
              ]
            }
          },
          {
            "name": "reservedSpace",
            "type": {
              "array": [
                "u32",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "UTPConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "utpProgramId",
            "type": "publicKey"
          },
          {
            "name": "marginRequirementDepositBuffer",
            "type": {
              "defined": "WrappedI80F48"
            }
          }
        ]
      }
    },
    {
      "name": "GroupConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "bank",
            "type": {
              "option": {
                "defined": "BankConfig"
              }
            }
          },
          {
            "name": "paused",
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    },
    {
      "name": "BankConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scalingFactorC",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "fixedFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "interestFee",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "initMarginRatio",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maintMarginRatio",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "accountDepositLimit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "lpDepositLimit",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "Bank",
      "docs": [
        "A bank is a subset of a marginfi group, and one bank",
        "exists for each marginfi group. The bank's job is to",
        "set parameters for the marginfi group related to borrowing",
        "and lending portfolio-level collateral, and to store",
        "collateral funds to lend to marginfi accounts in the marginfi group",
        "in the bank vault `bank.vault`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scalingFactorC",
            "docs": [
              "`scaling_factor_c`, `fixed_fee`, and `interest_fee`",
              "are parameters in marginfi's interest rate calculation",
              "for lending and borrowing. The interest rate calculation",
              "can be observed in the bank's `calculate_interest_rate` fn."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "fixedFee",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "interestFee",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "depositAccumulator",
            "docs": [
              "Accumulators are time-dependent compound interest rate multipliers.",
              "Accumulators are determined in functions part of impl `Bank` and",
              "are calculated based on the appropriate interest rate",
              "(lending or borrowing) and how much time has passed since the",
              "last interest calculation, herein denoted as `time_delta`."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "borrowAccumulator",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "lastUpdate",
            "type": "i64"
          },
          {
            "name": "totalDepositsRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "totalBorrowsRecord",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "mint",
            "docs": [
              "The mint denotes the collateral type."
            ],
            "type": "publicKey"
          },
          {
            "name": "vault",
            "docs": [
              "The vault pubkey denotes the bank's vault,",
              "where liquidity is actually stored."
            ],
            "type": "publicKey"
          },
          {
            "name": "vaultAuthorityPdaBump",
            "docs": [
              "Bank authority pda bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "insuranceVault",
            "docs": [
              "Insurance vault address"
            ],
            "type": "publicKey"
          },
          {
            "name": "insuranceVaultAuthorityPdaBump",
            "type": "u8"
          },
          {
            "name": "insuranceVaultOutstandingTransfers",
            "docs": [
              "Outstanding balance to be transferred to the fee vault from the main liquidity vault."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "feeVault",
            "docs": [
              "Protocol fee vault address"
            ],
            "type": "publicKey"
          },
          {
            "name": "feeVaultAuthorityPdaBump",
            "type": "u8"
          },
          {
            "name": "feeVaultOutstandingTransfers",
            "docs": [
              "Outstanding balance to be transferred to the fee vault from the main liquidity vault."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "initMarginRatio",
            "docs": [
              "Today's marginfi groups in marginfi each have fixed",
              "initial and maintenance margin requirements, which",
              "are stored as attributes part of the Bank."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "maintMarginRatio",
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "accountDepositLimit",
            "docs": [
              "Account equity above which deposits are not allowed.",
              "If Decimal::ZERO, no limit is applied."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "lpDepositLimit",
            "docs": [
              "Balance of liquidity pool (LP) deposits above which deposits are not allowed.",
              "If Decimal::ZERO, no limit is applied."
            ],
            "type": {
              "defined": "WrappedI80F48"
            }
          },
          {
            "name": "reservedSpace",
            "docs": [
              "Reserved space for future fields.",
              "Reduce accordingly when adding new fields to the struct."
            ],
            "type": {
              "array": [
                "u128",
                31
              ]
            }
          }
        ]
      }
    },
    {
      "name": "AccountType",
      "docs": [
        "Type use when initializing a margin account.",
        "Type maps to specific account flags."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NormalAccount"
          },
          {
            "name": "LPAccount"
          }
        ]
      }
    },
    {
      "name": "MarginRequirement",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Init"
          },
          {
            "name": "PartialLiquidation"
          },
          {
            "name": "Maint"
          }
        ]
      }
    },
    {
      "name": "EquityType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitReqAdjusted"
          },
          {
            "name": "Total"
          }
        ]
      }
    },
    {
      "name": "BankVaultType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "LiquidityVault"
          },
          {
            "name": "InsuranceVault"
          },
          {
            "name": "ProtocolFeeVault"
          }
        ]
      }
    },
    {
      "name": "InternalTransferType",
      "docs": [
        "Possible internal transfers:",
        "- InsuranceFee - Fees collected and sent from the main liquidity vault to the insurance vault.",
        "- ProtocolFee - Fees collected and sent from the main liquidity vault to the protocol fee vault."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InsuranceFee"
          },
          {
            "name": "ProtocolFee"
          }
        ]
      }
    },
    {
      "name": "LendingSide",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Borrow"
          },
          {
            "name": "Deposit"
          }
        ]
      }
    },
    {
      "name": "OrderType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Limit"
          },
          {
            "name": "ImmediateOrCancel"
          },
          {
            "name": "PostOnly"
          },
          {
            "name": "ReduceOnlyIoc"
          },
          {
            "name": "ReduceOnlyLimit"
          },
          {
            "name": "FillOrKill"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "UpdateInterestAccumulatorEvent",
      "fields": [
        {
          "name": "currentTimestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "deltaCompoundingPeriods",
          "type": "u64",
          "index": false
        },
        {
          "name": "feesCollected",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        },
        {
          "name": "utilizationRate",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        },
        {
          "name": "interestRate",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "MarginRequirementCheck",
      "fields": [
        {
          "name": "init",
          "type": "bool",
          "index": false
        },
        {
          "name": "equity",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        },
        {
          "name": "marginRequirement",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "UptObservationFreeCollateral",
      "fields": [
        {
          "name": "utpIndex",
          "type": "u8",
          "index": false
        },
        {
          "name": "value",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "UptObservationNeedsRebalance",
      "fields": [
        {
          "name": "utpIndex",
          "type": "u8",
          "index": false
        },
        {
          "name": "netFreeCollateral",
          "type": {
            "defined": "WrappedI80F48"
          },
          "index": false
        }
      ]
    },
    {
      "name": "RiskEnginePermissionlessAction",
      "fields": []
    },
    {
      "name": "RiskEngineReduceOnly",
      "fields": []
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Signer not authorized to perform this action"
    },
    {
      "code": 6001,
      "name": "EmptyLendingPool",
      "msg": "Lending pool empty"
    },
    {
      "code": 6002,
      "name": "IllegalUtilizationRatio",
      "msg": "Illegal utilization ratio"
    },
    {
      "code": 6003,
      "name": "MathError",
      "msg": "very bad mafs"
    },
    {
      "code": 6004,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp"
    },
    {
      "code": 6005,
      "name": "MarginRequirementsNotMet",
      "msg": "Initialization margin requirements not met"
    },
    {
      "code": 6006,
      "name": "OnlyReduceAllowed",
      "msg": "Only reducing trades are allowed when under init margin requirements"
    },
    {
      "code": 6007,
      "name": "UtpInactive",
      "msg": "Inactive UTP"
    },
    {
      "code": 6008,
      "name": "UtpAlreadyActive",
      "msg": "Utp is already active"
    },
    {
      "code": 6009,
      "name": "InvalidAccountData",
      "msg": "Invalid Account Data"
    },
    {
      "code": 6010,
      "name": "LiquidatorHasActiveUtps",
      "msg": "Liquidator has active utps"
    },
    {
      "code": 6011,
      "name": "AccountHasActiveUtps",
      "msg": "Account has active utps"
    },
    {
      "code": 6012,
      "name": "AccountNotLiquidatable",
      "msg": "Marginfi account not liquidatable"
    },
    {
      "code": 6013,
      "name": "AccountNotBankrupt",
      "msg": "Marginfi account not bankrupt"
    },
    {
      "code": 6014,
      "name": "IllegalUtpDeactivation",
      "msg": "Utp account cannot be deactivated"
    },
    {
      "code": 6015,
      "name": "IllegalRebalance",
      "msg": "Rebalance not legal"
    },
    {
      "code": 6016,
      "name": "BorrowNotAllowed",
      "msg": "Borrow not allowed"
    },
    {
      "code": 6017,
      "name": "IllegalConfig",
      "msg": "Config value not legal"
    },
    {
      "code": 6018,
      "name": "OperationsPaused",
      "msg": "Operations paused"
    },
    {
      "code": 6019,
      "name": "InsufficientVaultBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6020,
      "name": "Forbidden",
      "msg": "This operation is forbidden"
    },
    {
      "code": 6021,
      "name": "InvalidUTPAccount",
      "msg": "Invalid account key"
    },
    {
      "code": 6022,
      "name": "AccountDepositLimit",
      "msg": "Deposit exceeds account cap"
    },
    {
      "code": 6023,
      "name": "GroupDepositLimit",
      "msg": "Deposit exceeds group cap"
    },
    {
      "code": 6024,
      "name": "InvalidObserveAccounts",
      "msg": "Missing accounts for UTP observation"
    },
    {
      "code": 6025,
      "name": "MangoError",
      "msg": "Mango error"
    },
    {
      "code": 6026,
      "name": "OperationDisabled",
      "msg": "Operation no longer supported"
    }
  ]
};
