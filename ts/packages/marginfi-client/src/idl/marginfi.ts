export type Marginfi = {
  version: "0.1.0";
  name: "marginfi";
  instructions: [
    {
      name: "initMarginGroup";
      accounts: [
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "collateralMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bankVault";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bankAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "insuranceVault";
          isMut: false;
          isSigner: false;
        },
        {
          name: "insuranceVaultAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "feeVault";
          isMut: false;
          isSigner: false;
        },
        {
          name: "feeVaultAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bankAuthorityPdaBump";
          type: "u8";
        },
        {
          name: "insuranceVaultAuthorityPdaBump";
          type: "u8";
        },
        {
          name: "feeVaultAuthorityPdaBump";
          type: "u8";
        }
      ];
    },
    {
      name: "configureMarginGroup";
      accounts: [
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "admin";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "configArg";
          type: {
            defined: "GroupConfig";
          };
        }
      ];
    },
    {
      name: "bankFeeVaultWithdraw";
      accounts: [
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "admin";
          isMut: false;
          isSigner: true;
        },
        {
          name: "bankFeeVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankFeeVaultAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "recipientTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "initMarginAccount";
      accounts: [
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "marginGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "bankInsuranceVaultWithdraw";
      accounts: [
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "admin";
          isMut: false;
          isSigner: true;
        },
        {
          name: "insuranceVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "insuranceVaultAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "recipientTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "marginDepositCollateral";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "fundingAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "marginWithdrawCollateral";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "marginCollateralVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginBankAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "receivingTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "liquidate";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "marginAccountLiquidatee";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bankInsuranceVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "utpIndex";
          type: "u64";
        }
      ];
    },
    {
      name: "deactivateUtp";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "utpIndex";
          type: "u64";
        }
      ];
    },
    {
      name: "handleBankruptcy";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "insuranceVaultAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "insuranceVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "liquidityVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "updateInterestAccumulator";
      accounts: [
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bankFeeVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "utpMangoActivate";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "mangoAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "authoritySeed";
          type: "publicKey";
        },
        {
          name: "authorityBump";
          type: "u8";
        }
      ];
    },
    {
      name: "utpMangoDeposit";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "marginCollateralVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tempCollateralAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoCache";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoRootBank";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoNodeBank";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "utpMangoWithdraw";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "marginCollateralVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoCache";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoRootBank";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoNodeBank";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoVaultAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "utpMangoUsePlacePerpOrder";
      accounts: [
        {
          name: "marginAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "mangoAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoCache";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoPerpMarket";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoBids";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoAsks";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoEventQueue";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "args";
          type: {
            defined: "UtpMangoPlacePerpOrderArgs";
          };
        }
      ];
    },
    {
      name: "utpMangoUseCancelPerpOrder";
      accounts: [
        {
          name: "marginAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "mangoAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mangoPerpMarket";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoBids";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mangoAsks";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "orderId";
          type: "i128";
        },
        {
          name: "invalidIdOk";
          type: "bool";
        }
      ];
    },
    {
      name: "utpZoActivate";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "utpAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoState";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoMargin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoControl";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "authoritySeed";
          type: "publicKey";
        },
        {
          name: "authorityBump";
          type: "u8";
        },
        {
          name: "zoMarginNonce";
          type: "u8";
        }
      ];
    },
    {
      name: "utpZoDeposit";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "marginCollateralVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bankAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tempCollateralAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "utpAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoState";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoStateSigner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoCache";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoMargin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "utpZoWithdraw";
      accounts: [
        {
          name: "marginAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marginGroup";
          isMut: true;
          isSigner: false;
        },
        {
          name: "signer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "marginCollateralVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "utpAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoMargin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "zoState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoStateSigner";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoCache";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoControl";
          isMut: true;
          isSigner: false;
        },
        {
          name: "zoVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "utpZoCreatePerpOpenOrders";
      accounts: [
        {
          name: "header";
          accounts: [
            {
              name: "marginAccount";
              isMut: false;
              isSigner: false;
            },
            {
              name: "marginGroup";
              isMut: false;
              isSigner: false;
            },
            {
              name: "signer";
              isMut: true;
              isSigner: true;
            },
            {
              name: "utpAuthority";
              isMut: false;
              isSigner: false;
            }
          ];
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "state";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stateSigner";
          isMut: true;
          isSigner: false;
        },
        {
          name: "margin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "control";
          isMut: true;
          isSigner: false;
        },
        {
          name: "openOrders";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexMarket";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "utpZoPlacePerpOrder";
      accounts: [
        {
          name: "header";
          accounts: [
            {
              name: "marginAccount";
              isMut: false;
              isSigner: false;
            },
            {
              name: "marginGroup";
              isMut: false;
              isSigner: false;
            },
            {
              name: "signer";
              isMut: true;
              isSigner: true;
            },
            {
              name: "utpAuthority";
              isMut: false;
              isSigner: false;
            }
          ];
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "state";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stateSigner";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cache";
          isMut: true;
          isSigner: false;
        },
        {
          name: "margin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "control";
          isMut: true;
          isSigner: false;
        },
        {
          name: "openOrders";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexMarket";
          isMut: true;
          isSigner: false;
        },
        {
          name: "reqQ";
          isMut: true;
          isSigner: false;
        },
        {
          name: "eventQ";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marketBids";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marketAsks";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "args";
          type: {
            defined: "UtpZoPlacePerpOrderIxArgs";
          };
        }
      ];
    },
    {
      name: "utpZoCancelPerpOrder";
      accounts: [
        {
          name: "header";
          accounts: [
            {
              name: "marginAccount";
              isMut: false;
              isSigner: false;
            },
            {
              name: "marginGroup";
              isMut: false;
              isSigner: false;
            },
            {
              name: "signer";
              isMut: true;
              isSigner: true;
            },
            {
              name: "utpAuthority";
              isMut: false;
              isSigner: false;
            }
          ];
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "state";
          isMut: false;
          isSigner: false;
        },
        {
          name: "cache";
          isMut: true;
          isSigner: false;
        },
        {
          name: "margin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "control";
          isMut: true;
          isSigner: false;
        },
        {
          name: "openOrders";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexMarket";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marketBids";
          isMut: true;
          isSigner: false;
        },
        {
          name: "marketAsks";
          isMut: true;
          isSigner: false;
        },
        {
          name: "eventQ";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "orderId";
          type: {
            option: "u128";
          };
        },
        {
          name: "isLong";
          type: {
            option: "bool";
          };
        },
        {
          name: "clientId";
          type: {
            option: "u64";
          };
        }
      ];
    },
    {
      name: "utpZoSettleFunds";
      accounts: [
        {
          name: "header";
          accounts: [
            {
              name: "marginAccount";
              isMut: false;
              isSigner: false;
            },
            {
              name: "marginGroup";
              isMut: false;
              isSigner: false;
            },
            {
              name: "signer";
              isMut: true;
              isSigner: true;
            },
            {
              name: "utpAuthority";
              isMut: false;
              isSigner: false;
            }
          ];
        },
        {
          name: "zoProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "state";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stateSigner";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cache";
          isMut: true;
          isSigner: false;
        },
        {
          name: "margin";
          isMut: true;
          isSigner: false;
        },
        {
          name: "control";
          isMut: true;
          isSigner: false;
        },
        {
          name: "openOrders";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexMarket";
          isMut: true;
          isSigner: false;
        },
        {
          name: "dexProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "marginAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "marginGroup";
            type: "publicKey";
          },
          {
            name: "depositRecord";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "borrowRecord";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "activeUtps";
            type: {
              array: ["bool", 32];
            };
          },
          {
            name: "utpAccountConfig";
            type: {
              array: [
                {
                  defined: "UTPAccountConfig";
                },
                32
              ];
            };
          },
          {
            name: "reservedSpace";
            type: {
              array: ["u64", 32];
            };
          }
        ];
      };
    },
    {
      name: "marginGroup";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "publicKey";
          },
          {
            name: "bank";
            type: {
              defined: "Bank";
            };
          },
          {
            name: "paused";
            type: "bool";
          },
          {
            name: "reservedSpace";
            type: {
              array: ["u64", 32];
            };
          }
        ];
      };
    },
    {
      name: "state";
      type: {
        kind: "struct";
        fields: [
          {
            name: "totalCollateral";
            type: "u128";
          },
          {
            name: "freeCollateral";
            type: "u128";
          },
          {
            name: "marginRequirementInit";
            type: "u128";
          },
          {
            name: "marginRequirementMaint";
            type: "u128";
          },
          {
            name: "equity";
            type: "u128";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "UtpMangoPlacePerpOrderArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "side";
            type: {
              defined: "MangoSide";
            };
          },
          {
            name: "price";
            type: "i64";
          },
          {
            name: "maxBaseQuantity";
            type: "i64";
          },
          {
            name: "maxQuoteQuantity";
            type: "i64";
          },
          {
            name: "clientOrderId";
            type: "u64";
          },
          {
            name: "orderType";
            type: {
              defined: "MangoOrderType";
            };
          },
          {
            name: "reduceOnly";
            type: "bool";
          },
          {
            name: "expiryTimestamp";
            type: {
              option: "u64";
            };
          },
          {
            name: "limit";
            type: "u8";
          },
          {
            name: "expiryType";
            type: {
              defined: "MangoExpiryType";
            };
          }
        ];
      };
    },
    {
      name: "UtpZoPlacePerpOrderIxArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "isLong";
            type: "bool";
          },
          {
            name: "limitPrice";
            type: "u64";
          },
          {
            name: "maxBaseQuantity";
            type: "u64";
          },
          {
            name: "maxQuoteQuantity";
            type: "u64";
          },
          {
            name: "orderType";
            type: {
              defined: "OrderType";
            };
          },
          {
            name: "limit";
            type: "u16";
          },
          {
            name: "clientId";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "UtpZoCancelPerpOrderIxArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "orderId";
            type: {
              option: "u128";
            };
          },
          {
            name: "isLong";
            type: {
              option: "bool";
            };
          },
          {
            name: "clientId";
            type: {
              option: "u64";
            };
          }
        ];
      };
    },
    {
      name: "MDecimal";
      type: {
        kind: "struct";
        fields: [
          {
            name: "flags";
            type: "u32";
          },
          {
            name: "hi";
            type: "u32";
          },
          {
            name: "lo";
            type: "u32";
          },
          {
            name: "mid";
            type: "u32";
          }
        ];
      };
    },
    {
      name: "UTPAccountConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "address";
            type: "publicKey";
          },
          {
            name: "authoritySeed";
            type: "publicKey";
          },
          {
            name: "authorityBump";
            type: "u8";
          },
          {
            name: "utpAddressBook";
            type: {
              array: ["publicKey", 32];
            };
          }
        ];
      };
    },
    {
      name: "UTPConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "utpProgramId";
            type: "publicKey";
          },
          {
            name: "marginRequirementDepositBuffer";
            type: {
              defined: "MDecimal";
            };
          }
        ];
      };
    },
    {
      name: "GroupConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "bank";
            type: {
              option: {
                defined: "BankConfig";
              };
            };
          },
          {
            name: "paused";
            type: {
              option: "bool";
            };
          }
        ];
      };
    },
    {
      name: "BankConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "scalingFactorC";
            type: {
              option: "u64";
            };
          },
          {
            name: "fixedFee";
            type: {
              option: "u64";
            };
          },
          {
            name: "interestFee";
            type: {
              option: "u64";
            };
          },
          {
            name: "initMarginRatio";
            type: {
              option: "u64";
            };
          },
          {
            name: "maintMarginRatio";
            type: {
              option: "u64";
            };
          },
          {
            name: "accountDepositLimit";
            type: {
              option: "u64";
            };
          }
        ];
      };
    },
    {
      name: "Bank";
      type: {
        kind: "struct";
        fields: [
          {
            name: "scalingFactorC";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "fixedFee";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "interestFee";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "depositAccumulator";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "borrowAccumulator";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "lastUpdate";
            type: "i64";
          },
          {
            name: "nativeDepositBalance";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "nativeBorrowBalance";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "mint";
            type: "publicKey";
          },
          {
            name: "vault";
            type: "publicKey";
          },
          {
            name: "vaultAuthorityPdaBump";
            type: "u8";
          },
          {
            name: "insuranceVault";
            type: "publicKey";
          },
          {
            name: "insuranceVaultAuthorityPdaBump";
            type: "u8";
          },
          {
            name: "insuranceVaultOutstandingTransfers";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "feeVault";
            type: "publicKey";
          },
          {
            name: "feeVaultAuthorityPdaBump";
            type: "u8";
          },
          {
            name: "feeVaultOutstandingTransfers";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "initMarginRatio";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "maintMarginRatio";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "accountDepositLimit";
            type: {
              defined: "MDecimal";
            };
          },
          {
            name: "reservedSpace";
            type: {
              array: ["u64", 32];
            };
          }
        ];
      };
    },
    {
      name: "MangoOrderType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Limit";
          },
          {
            name: "ImmediateOrCancel";
          },
          {
            name: "PostOnly";
          },
          {
            name: "Market";
          },
          {
            name: "PostOnlySlide";
          }
        ];
      };
    },
    {
      name: "MangoSide";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Bid";
          },
          {
            name: "Ask";
          }
        ];
      };
    },
    {
      name: "MangoExpiryType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Absolute";
          },
          {
            name: "Relative";
          }
        ];
      };
    },
    {
      name: "MarginRequirement";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Init";
          },
          {
            name: "Maint";
          }
        ];
      };
    },
    {
      name: "BankVaultType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "LiquidityVault";
          },
          {
            name: "InsuranceVault";
          },
          {
            name: "ProtocolFeeVault";
          }
        ];
      };
    },
    {
      name: "InternalTransferType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "InsuranceFee";
          },
          {
            name: "ProtocolFee";
          }
        ];
      };
    },
    {
      name: "LendingSide";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Borrow";
          },
          {
            name: "Deposit";
          }
        ];
      };
    },
    {
      name: "OrderType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Limit";
          },
          {
            name: "ImmediateOrCancel";
          },
          {
            name: "PostOnly";
          },
          {
            name: "ReduceOnlyIoc";
          },
          {
            name: "ReduceOnlyLimit";
          },
          {
            name: "FillOrKill";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "EmptyLendingPool";
      msg: "Lending pool empty";
    },
    {
      code: 6001;
      name: "IllegalUtilizationRatio";
      msg: "Illegal utilization ratio";
    },
    {
      code: 6002;
      name: "MathError";
      msg: "very bad mafs";
    },
    {
      code: 6003;
      name: "InvalidTimestamp";
      msg: "Invalid timestamp";
    },
    {
      code: 6004;
      name: "MarginRequirementsNotMet";
      msg: "Initialization margin requirements not met";
    },
    {
      code: 6005;
      name: "UtpInactive";
      msg: "Inactive UTP";
    },
    {
      code: 6006;
      name: "UtpAlreadyActive";
      msg: "Utp is already active";
    },
    {
      code: 6007;
      name: "InvalidAccountData";
      msg: "Invalid Account Data";
    },
    {
      code: 6008;
      name: "LiquidatorHasActiveUtps";
      msg: "Liquidator has active utps";
    },
    {
      code: 6009;
      name: "AccountNotLiquidatable";
      msg: "Margin account not liquidatable";
    },
    {
      code: 6010;
      name: "AccountNotBankrupt";
      msg: "Margin account not bankrupt";
    },
    {
      code: 6011;
      name: "IllegalUtpDeactivation";
      msg: "Utp account cannot be deactivated";
    },
    {
      code: 6012;
      name: "IllegalRebalance";
      msg: "Rebalance not legal";
    },
    {
      code: 6013;
      name: "BorrowNotAllowed";
      msg: "Borrow not allowed";
    },
    {
      code: 6014;
      name: "IllegalConfig";
      msg: "Config value not legal";
    },
    {
      code: 6015;
      name: "OperationsPaused";
      msg: "Operations paused";
    },
    {
      code: 6016;
      name: "InsufficientVaultBalance";
      msg: "Insufficient balance";
    },
    {
      code: 6017;
      name: "Forbidden";
      msg: "This operation is forbidden";
    },
    {
      code: 6018;
      name: "InvalidUTPAccount";
      msg: "Invalid account key";
    },
    {
      code: 6019;
      name: "AccountDepositLimit";
      msg: "Account deposit too large";
    },
    {
      code: 6020;
      name: "InvalidObserveAccounts";
      msg: "Missing accounts for UTP observation";
    },
    {
      code: 6021;
      name: "MangoError";
      msg: "Mango error";
    }
  ];
};

export const IDL: Marginfi = {
  version: "0.1.0",
  name: "marginfi",
  instructions: [
    {
      name: "initMarginGroup",
      accounts: [
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "collateralMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bankVault",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bankAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "insuranceVault",
          isMut: false,
          isSigner: false,
        },
        {
          name: "insuranceVaultAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeVault",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeVaultAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bankAuthorityPdaBump",
          type: "u8",
        },
        {
          name: "insuranceVaultAuthorityPdaBump",
          type: "u8",
        },
        {
          name: "feeVaultAuthorityPdaBump",
          type: "u8",
        },
      ],
    },
    {
      name: "configureMarginGroup",
      accounts: [
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "configArg",
          type: {
            defined: "GroupConfig",
          },
        },
      ],
    },
    {
      name: "bankFeeVaultWithdraw",
      accounts: [
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "bankFeeVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankFeeVaultAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "recipientTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "initMarginAccount",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "marginGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "bankInsuranceVaultWithdraw",
      accounts: [
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
        {
          name: "insuranceVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "insuranceVaultAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "recipientTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "marginDepositCollateral",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "fundingAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "marginWithdrawCollateral",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "marginCollateralVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginBankAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "receivingTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "liquidate",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "marginAccountLiquidatee",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bankInsuranceVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "utpIndex",
          type: "u64",
        },
      ],
    },
    {
      name: "deactivateUtp",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "utpIndex",
          type: "u64",
        },
      ],
    },
    {
      name: "handleBankruptcy",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "insuranceVaultAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "insuranceVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "liquidityVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "updateInterestAccumulator",
      accounts: [
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bankFeeVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "utpMangoActivate",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "mangoAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "authoritySeed",
          type: "publicKey",
        },
        {
          name: "authorityBump",
          type: "u8",
        },
      ],
    },
    {
      name: "utpMangoDeposit",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "marginCollateralVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tempCollateralAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoCache",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoRootBank",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoNodeBank",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "utpMangoWithdraw",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "marginCollateralVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoCache",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoRootBank",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoNodeBank",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoVaultAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "utpMangoUsePlacePerpOrder",
      accounts: [
        {
          name: "marginAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "mangoAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoCache",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoPerpMarket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoBids",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoAsks",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoEventQueue",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "UtpMangoPlacePerpOrderArgs",
          },
        },
      ],
    },
    {
      name: "utpMangoUseCancelPerpOrder",
      accounts: [
        {
          name: "marginAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "mangoAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mangoPerpMarket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoBids",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mangoAsks",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "orderId",
          type: "i128",
        },
        {
          name: "invalidIdOk",
          type: "bool",
        },
      ],
    },
    {
      name: "utpZoActivate",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "utpAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoMargin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoControl",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "authoritySeed",
          type: "publicKey",
        },
        {
          name: "authorityBump",
          type: "u8",
        },
        {
          name: "zoMarginNonce",
          type: "u8",
        },
      ],
    },
    {
      name: "utpZoDeposit",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "marginCollateralVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bankAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tempCollateralAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "utpAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoStateSigner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoCache",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoMargin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "utpZoWithdraw",
      accounts: [
        {
          name: "marginAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marginGroup",
          isMut: true,
          isSigner: false,
        },
        {
          name: "signer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "marginCollateralVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "utpAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoMargin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "zoState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoStateSigner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoCache",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoControl",
          isMut: true,
          isSigner: false,
        },
        {
          name: "zoVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "utpZoCreatePerpOpenOrders",
      accounts: [
        {
          name: "header",
          accounts: [
            {
              name: "marginAccount",
              isMut: false,
              isSigner: false,
            },
            {
              name: "marginGroup",
              isMut: false,
              isSigner: false,
            },
            {
              name: "signer",
              isMut: true,
              isSigner: true,
            },
            {
              name: "utpAuthority",
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "state",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stateSigner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "margin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "control",
          isMut: true,
          isSigner: false,
        },
        {
          name: "openOrders",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexMarket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "utpZoPlacePerpOrder",
      accounts: [
        {
          name: "header",
          accounts: [
            {
              name: "marginAccount",
              isMut: false,
              isSigner: false,
            },
            {
              name: "marginGroup",
              isMut: false,
              isSigner: false,
            },
            {
              name: "signer",
              isMut: true,
              isSigner: true,
            },
            {
              name: "utpAuthority",
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "state",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stateSigner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cache",
          isMut: true,
          isSigner: false,
        },
        {
          name: "margin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "control",
          isMut: true,
          isSigner: false,
        },
        {
          name: "openOrders",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexMarket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reqQ",
          isMut: true,
          isSigner: false,
        },
        {
          name: "eventQ",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marketBids",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marketAsks",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "UtpZoPlacePerpOrderIxArgs",
          },
        },
      ],
    },
    {
      name: "utpZoCancelPerpOrder",
      accounts: [
        {
          name: "header",
          accounts: [
            {
              name: "marginAccount",
              isMut: false,
              isSigner: false,
            },
            {
              name: "marginGroup",
              isMut: false,
              isSigner: false,
            },
            {
              name: "signer",
              isMut: true,
              isSigner: true,
            },
            {
              name: "utpAuthority",
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "state",
          isMut: false,
          isSigner: false,
        },
        {
          name: "cache",
          isMut: true,
          isSigner: false,
        },
        {
          name: "margin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "control",
          isMut: true,
          isSigner: false,
        },
        {
          name: "openOrders",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexMarket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marketBids",
          isMut: true,
          isSigner: false,
        },
        {
          name: "marketAsks",
          isMut: true,
          isSigner: false,
        },
        {
          name: "eventQ",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "orderId",
          type: {
            option: "u128",
          },
        },
        {
          name: "isLong",
          type: {
            option: "bool",
          },
        },
        {
          name: "clientId",
          type: {
            option: "u64",
          },
        },
      ],
    },
    {
      name: "utpZoSettleFunds",
      accounts: [
        {
          name: "header",
          accounts: [
            {
              name: "marginAccount",
              isMut: false,
              isSigner: false,
            },
            {
              name: "marginGroup",
              isMut: false,
              isSigner: false,
            },
            {
              name: "signer",
              isMut: true,
              isSigner: true,
            },
            {
              name: "utpAuthority",
              isMut: false,
              isSigner: false,
            },
          ],
        },
        {
          name: "zoProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "state",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stateSigner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cache",
          isMut: true,
          isSigner: false,
        },
        {
          name: "margin",
          isMut: true,
          isSigner: false,
        },
        {
          name: "control",
          isMut: true,
          isSigner: false,
        },
        {
          name: "openOrders",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexMarket",
          isMut: true,
          isSigner: false,
        },
        {
          name: "dexProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "marginAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "marginGroup",
            type: "publicKey",
          },
          {
            name: "depositRecord",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "borrowRecord",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "activeUtps",
            type: {
              array: ["bool", 32],
            },
          },
          {
            name: "utpAccountConfig",
            type: {
              array: [
                {
                  defined: "UTPAccountConfig",
                },
                32,
              ],
            },
          },
          {
            name: "reservedSpace",
            type: {
              array: ["u64", 32],
            },
          },
        ],
      },
    },
    {
      name: "marginGroup",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            type: "publicKey",
          },
          {
            name: "bank",
            type: {
              defined: "Bank",
            },
          },
          {
            name: "paused",
            type: "bool",
          },
          {
            name: "reservedSpace",
            type: {
              array: ["u64", 32],
            },
          },
        ],
      },
    },
    {
      name: "state",
      type: {
        kind: "struct",
        fields: [
          {
            name: "totalCollateral",
            type: "u128",
          },
          {
            name: "freeCollateral",
            type: "u128",
          },
          {
            name: "marginRequirementInit",
            type: "u128",
          },
          {
            name: "marginRequirementMaint",
            type: "u128",
          },
          {
            name: "equity",
            type: "u128",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "UtpMangoPlacePerpOrderArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "side",
            type: {
              defined: "MangoSide",
            },
          },
          {
            name: "price",
            type: "i64",
          },
          {
            name: "maxBaseQuantity",
            type: "i64",
          },
          {
            name: "maxQuoteQuantity",
            type: "i64",
          },
          {
            name: "clientOrderId",
            type: "u64",
          },
          {
            name: "orderType",
            type: {
              defined: "MangoOrderType",
            },
          },
          {
            name: "reduceOnly",
            type: "bool",
          },
          {
            name: "expiryTimestamp",
            type: {
              option: "u64",
            },
          },
          {
            name: "limit",
            type: "u8",
          },
          {
            name: "expiryType",
            type: {
              defined: "MangoExpiryType",
            },
          },
        ],
      },
    },
    {
      name: "UtpZoPlacePerpOrderIxArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "isLong",
            type: "bool",
          },
          {
            name: "limitPrice",
            type: "u64",
          },
          {
            name: "maxBaseQuantity",
            type: "u64",
          },
          {
            name: "maxQuoteQuantity",
            type: "u64",
          },
          {
            name: "orderType",
            type: {
              defined: "OrderType",
            },
          },
          {
            name: "limit",
            type: "u16",
          },
          {
            name: "clientId",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "UtpZoCancelPerpOrderIxArgs",
      type: {
        kind: "struct",
        fields: [
          {
            name: "orderId",
            type: {
              option: "u128",
            },
          },
          {
            name: "isLong",
            type: {
              option: "bool",
            },
          },
          {
            name: "clientId",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
    {
      name: "MDecimal",
      type: {
        kind: "struct",
        fields: [
          {
            name: "flags",
            type: "u32",
          },
          {
            name: "hi",
            type: "u32",
          },
          {
            name: "lo",
            type: "u32",
          },
          {
            name: "mid",
            type: "u32",
          },
        ],
      },
    },
    {
      name: "UTPAccountConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "publicKey",
          },
          {
            name: "authoritySeed",
            type: "publicKey",
          },
          {
            name: "authorityBump",
            type: "u8",
          },
          {
            name: "utpAddressBook",
            type: {
              array: ["publicKey", 32],
            },
          },
        ],
      },
    },
    {
      name: "UTPConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "utpProgramId",
            type: "publicKey",
          },
          {
            name: "marginRequirementDepositBuffer",
            type: {
              defined: "MDecimal",
            },
          },
        ],
      },
    },
    {
      name: "GroupConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "bank",
            type: {
              option: {
                defined: "BankConfig",
              },
            },
          },
          {
            name: "paused",
            type: {
              option: "bool",
            },
          },
        ],
      },
    },
    {
      name: "BankConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "scalingFactorC",
            type: {
              option: "u64",
            },
          },
          {
            name: "fixedFee",
            type: {
              option: "u64",
            },
          },
          {
            name: "interestFee",
            type: {
              option: "u64",
            },
          },
          {
            name: "initMarginRatio",
            type: {
              option: "u64",
            },
          },
          {
            name: "maintMarginRatio",
            type: {
              option: "u64",
            },
          },
          {
            name: "accountDepositLimit",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
    {
      name: "Bank",
      type: {
        kind: "struct",
        fields: [
          {
            name: "scalingFactorC",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "fixedFee",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "interestFee",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "depositAccumulator",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "borrowAccumulator",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "lastUpdate",
            type: "i64",
          },
          {
            name: "nativeDepositBalance",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "nativeBorrowBalance",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "vault",
            type: "publicKey",
          },
          {
            name: "vaultAuthorityPdaBump",
            type: "u8",
          },
          {
            name: "insuranceVault",
            type: "publicKey",
          },
          {
            name: "insuranceVaultAuthorityPdaBump",
            type: "u8",
          },
          {
            name: "insuranceVaultOutstandingTransfers",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "feeVault",
            type: "publicKey",
          },
          {
            name: "feeVaultAuthorityPdaBump",
            type: "u8",
          },
          {
            name: "feeVaultOutstandingTransfers",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "initMarginRatio",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "maintMarginRatio",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "accountDepositLimit",
            type: {
              defined: "MDecimal",
            },
          },
          {
            name: "reservedSpace",
            type: {
              array: ["u64", 32],
            },
          },
        ],
      },
    },
    {
      name: "MangoOrderType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Limit",
          },
          {
            name: "ImmediateOrCancel",
          },
          {
            name: "PostOnly",
          },
          {
            name: "Market",
          },
          {
            name: "PostOnlySlide",
          },
        ],
      },
    },
    {
      name: "MangoSide",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Bid",
          },
          {
            name: "Ask",
          },
        ],
      },
    },
    {
      name: "MangoExpiryType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Absolute",
          },
          {
            name: "Relative",
          },
        ],
      },
    },
    {
      name: "MarginRequirement",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Init",
          },
          {
            name: "Maint",
          },
        ],
      },
    },
    {
      name: "BankVaultType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "LiquidityVault",
          },
          {
            name: "InsuranceVault",
          },
          {
            name: "ProtocolFeeVault",
          },
        ],
      },
    },
    {
      name: "InternalTransferType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "InsuranceFee",
          },
          {
            name: "ProtocolFee",
          },
        ],
      },
    },
    {
      name: "LendingSide",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Borrow",
          },
          {
            name: "Deposit",
          },
        ],
      },
    },
    {
      name: "OrderType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Limit",
          },
          {
            name: "ImmediateOrCancel",
          },
          {
            name: "PostOnly",
          },
          {
            name: "ReduceOnlyIoc",
          },
          {
            name: "ReduceOnlyLimit",
          },
          {
            name: "FillOrKill",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "EmptyLendingPool",
      msg: "Lending pool empty",
    },
    {
      code: 6001,
      name: "IllegalUtilizationRatio",
      msg: "Illegal utilization ratio",
    },
    {
      code: 6002,
      name: "MathError",
      msg: "very bad mafs",
    },
    {
      code: 6003,
      name: "InvalidTimestamp",
      msg: "Invalid timestamp",
    },
    {
      code: 6004,
      name: "MarginRequirementsNotMet",
      msg: "Initialization margin requirements not met",
    },
    {
      code: 6005,
      name: "UtpInactive",
      msg: "Inactive UTP",
    },
    {
      code: 6006,
      name: "UtpAlreadyActive",
      msg: "Utp is already active",
    },
    {
      code: 6007,
      name: "InvalidAccountData",
      msg: "Invalid Account Data",
    },
    {
      code: 6008,
      name: "LiquidatorHasActiveUtps",
      msg: "Liquidator has active utps",
    },
    {
      code: 6009,
      name: "AccountNotLiquidatable",
      msg: "Margin account not liquidatable",
    },
    {
      code: 6010,
      name: "AccountNotBankrupt",
      msg: "Margin account not bankrupt",
    },
    {
      code: 6011,
      name: "IllegalUtpDeactivation",
      msg: "Utp account cannot be deactivated",
    },
    {
      code: 6012,
      name: "IllegalRebalance",
      msg: "Rebalance not legal",
    },
    {
      code: 6013,
      name: "BorrowNotAllowed",
      msg: "Borrow not allowed",
    },
    {
      code: 6014,
      name: "IllegalConfig",
      msg: "Config value not legal",
    },
    {
      code: 6015,
      name: "OperationsPaused",
      msg: "Operations paused",
    },
    {
      code: 6016,
      name: "InsufficientVaultBalance",
      msg: "Insufficient balance",
    },
    {
      code: 6017,
      name: "Forbidden",
      msg: "This operation is forbidden",
    },
    {
      code: 6018,
      name: "InvalidUTPAccount",
      msg: "Invalid account key",
    },
    {
      code: 6019,
      name: "AccountDepositLimit",
      msg: "Account deposit too large",
    },
    {
      code: 6020,
      name: "InvalidObserveAccounts",
      msg: "Missing accounts for UTP observation",
    },
    {
      code: 6021,
      name: "MangoError",
      msg: "Mango error",
    },
  ],
};
