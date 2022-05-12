export type Marginfi = {
  version: '0.1.0';
  name: 'marginfi';
  instructions: [
    {
      name: 'initMarginGroup';
      accounts: [
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'admin';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'collateralMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'bankVault';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'clock';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'bankAuthorityPdaBump';
          type: 'u8';
        }
      ];
    },
    {
      name: 'configureMarginGroup';
      accounts: [
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: 'configArg';
          type: {
            defined: 'GroupConfig';
          };
        }
      ];
    },
    {
      name: 'bankFeeVaultWithdraw';
      accounts: [
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'bankVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'recipientTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'initMarginAccount';
      accounts: [
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'marginGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'fundInsuranceVault';
      accounts: [
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'signer';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'bankInsuranceVaultWithdraw';
      accounts: [
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'bankVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'recipientTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'marginDepositCollateral';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'signer';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'fundingAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'marginWithdrawCollateral';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'signer';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginBankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'receivingTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'liquidate';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'signer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'marginAccountLiquidatee';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'utpIndex';
          type: 'u64';
        }
      ];
    },
    {
      name: 'deactivateUtp';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'utpIndex';
          type: 'u64';
        }
      ];
    },
    {
      name: 'handleBankruptcy';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'admin';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'updateInterestAccumulator';
      accounts: [
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'clock';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'verifyMarginRequirements';
      accounts: [
        {
          name: 'marginAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'utpDriftActivate';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'driftAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftState';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'authoritySeed';
          type: 'publicKey';
        },
        {
          name: 'authorityBump';
          type: 'u8';
        }
      ];
    },
    {
      name: 'utpDriftDeposit';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tempCollateralAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftMarkets';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftDepositHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingPaymentHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'utpDriftDepositCrank';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tempCollateralAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftMarkets';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftDepositHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingPaymentHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'utpDriftWithdraw';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftCollateralVaultAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftInsuranceVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftInsuranceVaultAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftMarkets';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftDepositHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingPaymentHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemsProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'utpDriftObserve';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftMarkets';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'utpDriftUseOpenPosition';
      accounts: [
        {
          name: 'marginAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'driftAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftMarkets';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftTradeHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingPaymentHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingRateHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftOracle';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'UtpDriftOpenPositionIxArgs';
          };
        }
      ];
    },
    {
      name: 'utpDriftUseClosePosition';
      accounts: [
        {
          name: 'marginAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'driftAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftUser';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'driftState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftMarkets';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftUserPositions';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftTradeHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingPaymentHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftFundingRateHistory';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'driftOracle';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'UtpDriftClosePositionIxArgs';
          };
        }
      ];
    },
    {
      name: 'utpMangoActivate';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mangoAuthority';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'authoritySeed';
          type: 'publicKey';
        },
        {
          name: 'authorityBump';
          type: 'u8';
        }
      ];
    },
    {
      name: 'utpMangoDeposit';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tempCollateralAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoCache';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoRootBank';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoNodeBank';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'utpMangoDepositCrank';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bankAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tempCollateralAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoCache';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoRootBank';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoNodeBank';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'utpMangoWithdraw';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'marginGroup';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'marginCollateralVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoCache';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoRootBank';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoNodeBank';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoVault';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoVaultAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'utpMangoObserve';
      accounts: [
        {
          name: 'marginAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoCache';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'utpMangoUsePlacePerpOrder';
      accounts: [
        {
          name: 'marginAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mangoAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoCache';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoPerpMarket';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoBids';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAsks';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoEventQueue';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'UtpMangoPlacePerpOrderArgs';
          };
        }
      ];
    },
    {
      name: 'utpMangoUseCancelPerpOrder';
      accounts: [
        {
          name: 'marginAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mangoAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoGroup';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mangoPerpMarket';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoBids';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mangoAsks';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'instructionsSysvar';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'orderId';
          type: 'i128';
        },
        {
          name: 'invalidIdOk';
          type: 'bool';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'marginAccount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'publicKey';
          },
          {
            name: 'marginGroup';
            type: 'publicKey';
          },
          {
            name: 'depositRecord';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'borrowRecord';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'activeUtps';
            type: {
              array: ['bool', 32];
            };
          },
          {
            name: 'utpAccountConfig';
            type: {
              array: [
                {
                  defined: 'UTPAccountConfig';
                },
                32
              ];
            };
          },
          {
            name: 'utpCache';
            type: {
              array: [
                {
                  defined: 'UTPObservationCache';
                },
                32
              ];
            };
          },
          {
            name: 'reservedSpace';
            type: {
              array: ['u64', 32];
            };
          }
        ];
      };
    },
    {
      name: 'marginGroup';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: 'publicKey';
          },
          {
            name: 'bank';
            type: {
              defined: 'Bank';
            };
          },
          {
            name: 'paused';
            type: 'bool';
          },
          {
            name: 'reservedSpace';
            type: {
              array: ['u64', 32];
            };
          }
        ];
      };
    },
    {
      name: 'state';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'totalCollateral';
            type: 'u128';
          },
          {
            name: 'freeCollateral';
            type: 'u128';
          },
          {
            name: 'marginRequirementInit';
            type: 'u128';
          },
          {
            name: 'marginRequirementMaint';
            type: 'u128';
          }
        ];
      };
    }
  ];
  types: [
    {
      name: 'UtpDriftOpenPositionIxArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'direction';
            type: {
              defined: 'DriftPositionDirection';
            };
          },
          {
            name: 'quoteAssetAmount';
            type: 'u128';
          },
          {
            name: 'marketIndex';
            type: 'u64';
          },
          {
            name: 'limitPrice';
            type: 'u128';
          },
          {
            name: 'optionalAccounts';
            type: {
              defined: 'DriftManagePositionOptionalAccounts';
            };
          }
        ];
      };
    },
    {
      name: 'UtpDriftClosePositionIxArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'marketIndex';
            type: 'u64';
          },
          {
            name: 'optionalAccounts';
            type: {
              defined: 'DriftManagePositionOptionalAccounts';
            };
          }
        ];
      };
    },
    {
      name: 'UtpMangoPlacePerpOrderArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'side';
            type: {
              defined: 'MangoSide';
            };
          },
          {
            name: 'price';
            type: 'i64';
          },
          {
            name: 'maxBaseQuantity';
            type: 'i64';
          },
          {
            name: 'maxQuoteQuantity';
            type: 'i64';
          },
          {
            name: 'clientOrderId';
            type: 'u64';
          },
          {
            name: 'orderType';
            type: {
              defined: 'MangoOrderType';
            };
          },
          {
            name: 'reduceOnly';
            type: 'bool';
          },
          {
            name: 'expiryTimestamp';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'limit';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'MDecimal';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'flags';
            type: 'u32';
          },
          {
            name: 'hi';
            type: 'u32';
          },
          {
            name: 'lo';
            type: 'u32';
          },
          {
            name: 'mid';
            type: 'u32';
          }
        ];
      };
    },
    {
      name: 'DriftManagePositionOptionalAccounts';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'discountToken';
            type: 'bool';
          },
          {
            name: 'referrer';
            type: 'bool';
          }
        ];
      };
    },
    {
      name: 'UTPAccountConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'address';
            type: 'publicKey';
          },
          {
            name: 'authoritySeed';
            type: 'publicKey';
          },
          {
            name: 'authorityBump';
            type: 'u8';
          },
          {
            name: 'utpAddressBook';
            type: {
              array: ['publicKey', 32];
            };
          }
        ];
      };
    },
    {
      name: 'UTPConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'utpProgramId';
            type: 'publicKey';
          },
          {
            name: 'marginRequirementDepositBuffer';
            type: {
              defined: 'MDecimal';
            };
          }
        ];
      };
    },
    {
      name: 'GroupConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: {
              option: 'publicKey';
            };
          },
          {
            name: 'bank';
            type: {
              option: {
                defined: 'BankConfig';
              };
            };
          },
          {
            name: 'paused';
            type: {
              option: 'bool';
            };
          }
        ];
      };
    },
    {
      name: 'BankConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'scalingFactorC';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'fixedFee';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'interestFee';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'initMarginRatio';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'maintMarginRatio';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'accountDepositLimit';
            type: {
              option: 'u64';
            };
          }
        ];
      };
    },
    {
      name: 'Bank';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'scalingFactorC';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'fixedFee';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'interestFee';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'depositAccumulator';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'borrowAccumulator';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'lastUpdate';
            type: 'i64';
          },
          {
            name: 'nativeDepositBalance';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'nativeBorrowBalance';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'mint';
            type: 'publicKey';
          },
          {
            name: 'vault';
            type: 'publicKey';
          },
          {
            name: 'bankAuthorityBump';
            type: 'u8';
          },
          {
            name: 'insuranceVaultBalance';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'feeVaultBalance';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'initMarginRatio';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'maintMarginRatio';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'accountDepositLimit';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'reservedSpace';
            type: {
              array: ['u64', 32];
            };
          }
        ];
      };
    },
    {
      name: 'UTPObservationCache';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'totalCollateral';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'freeCollateral';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'marginRequirementInit';
            type: {
              defined: 'MDecimal';
            };
          },
          {
            name: 'marginRequirementMaint';
            type: {
              defined: 'MDecimal';
            };
          }
        ];
      };
    },
    {
      name: 'DriftPositionDirection';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Long';
          },
          {
            name: 'Short';
          }
        ];
      };
    },
    {
      name: 'MangoOrderType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Limit';
          },
          {
            name: 'ImmediateOrCancel';
          },
          {
            name: 'PostOnly';
          },
          {
            name: 'Market';
          },
          {
            name: 'PostOnlySlide';
          }
        ];
      };
    },
    {
      name: 'MangoSide';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Bid';
          },
          {
            name: 'Ask';
          }
        ];
      };
    },
    {
      name: 'MarginRequirementType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Init';
          },
          {
            name: 'Maint';
          }
        ];
      };
    },
    {
      name: 'LendingSide';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Borrow';
          },
          {
            name: 'Deposit';
          }
        ];
      };
    },
    {
      name: 'InstructionsLayout';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'ObserveBefore';
          },
          {
            name: 'ObserveAndCheckAfter';
          },
          {
            name: 'HalfSandwichObserveCheck';
            fields: [
              {
                defined: 'usize';
              }
            ];
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'EmptyLendingPool';
      msg: 'Lending pool empty';
    },
    {
      code: 6001;
      name: 'IllegalUtilizationRatio';
      msg: 'Illegal utilization ratio';
    },
    {
      code: 6002;
      name: 'MathError';
      msg: 'very bad mafs';
    },
    {
      code: 6003;
      name: 'InvalidTimestamp';
      msg: 'Invalid timestamp';
    },
    {
      code: 6004;
      name: 'InitMarginRequirementsNotMet';
      msg: 'Initialization margin requirements not met';
    },
    {
      code: 6005;
      name: 'UtpInactive';
      msg: 'Inactive UTP';
    },
    {
      code: 6006;
      name: 'UtpAlreadyActive';
      msg: 'Utp is already active';
    },
    {
      code: 6007;
      name: 'ISIInvalidProgramId';
      msg: 'ISI inspector: invalid program id';
    },
    {
      code: 6008;
      name: 'ISIInvalidSysvarId';
      msg: 'Tx inspector: invalid instructions sysvar';
    },
    {
      code: 6009;
      name: 'ISIInvalidIx';
      msg: 'Tx inspector: invalid instruction';
    },
    {
      code: 6010;
      name: 'ISIInvalidMarginAccount';
      msg: 'Tx inspector: invalid margin account';
    },
    {
      code: 6011;
      name: 'InvalidAccountData';
      msg: 'Invalid Account Data';
    },
    {
      code: 6012;
      name: 'LiquidatorHasActiveUtps';
      msg: 'Liquidator has active utps';
    },
    {
      code: 6013;
      name: 'AccountNotLiquidatable';
      msg: 'Margin account not liquidatable';
    },
    {
      code: 6014;
      name: 'AccountNotBankrupt';
      msg: 'Margin account not bankrupt';
    },
    {
      code: 6015;
      name: 'IllegalUtpDeactivation';
      msg: 'Utp account cannot be deactivated';
    },
    {
      code: 6016;
      name: 'DriftError';
      msg: 'Drift Error';
    },
    {
      code: 6017;
      name: 'IllegalRebalance';
      msg: 'Rebalance not legal';
    },
    {
      code: 6018;
      name: 'IllegalRebalanceAmount';
      msg: 'Illegal rebalance amount';
    },
    {
      code: 6019;
      name: 'BorrowNotAllowed';
      msg: 'Borrow not allowed';
    },
    {
      code: 6020;
      name: 'IllegalConfig';
      msg: 'Config value not legal';
    },
    {
      code: 6021;
      name: 'OperationsPaused';
      msg: 'Operations paused';
    },
    {
      code: 6022;
      name: 'InsufficientVaultBalance';
      msg: 'Insufficient balance';
    },
    {
      code: 6023;
      name: 'Forbidden';
      msg: 'This operation is forbidden';
    },
    {
      code: 6024;
      name: 'MangoError';
      msg: 'Mango error';
    },
    {
      code: 6025;
      name: 'InvalidUTPAccount';
      msg: 'Invalid account key';
    },
    {
      code: 6026;
      name: 'AccountDepositLimit';
      msg: 'Account has much deposits';
    }
  ];
};

export const IDL: Marginfi = {
  version: '0.1.0',
  name: 'marginfi',
  instructions: [
    {
      name: 'initMarginGroup',
      accounts: [
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'admin',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'collateralMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'bankVault',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'bankAuthorityPdaBump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'configureMarginGroup',
      accounts: [
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: 'configArg',
          type: {
            defined: 'GroupConfig',
          },
        },
      ],
    },
    {
      name: 'bankFeeVaultWithdraw',
      accounts: [
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'bankVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'recipientTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'initMarginAccount',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'marginGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'fundInsuranceVault',
      accounts: [
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'signer',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'bankInsuranceVaultWithdraw',
      accounts: [
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'bankVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'recipientTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'marginDepositCollateral',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'signer',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'fundingAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'marginWithdrawCollateral',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'signer',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginBankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'receivingTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'liquidate',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'signer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'marginAccountLiquidatee',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'utpIndex',
          type: 'u64',
        },
      ],
    },
    {
      name: 'deactivateUtp',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'utpIndex',
          type: 'u64',
        },
      ],
    },
    {
      name: 'handleBankruptcy',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'admin',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'updateInterestAccumulator',
      accounts: [
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'verifyMarginRequirements',
      accounts: [
        {
          name: 'marginAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'utpDriftActivate',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'driftAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftState',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'authoritySeed',
          type: 'publicKey',
        },
        {
          name: 'authorityBump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'utpDriftDeposit',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tempCollateralAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftMarkets',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftDepositHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingPaymentHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'utpDriftDepositCrank',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tempCollateralAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftMarkets',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftDepositHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingPaymentHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'utpDriftWithdraw',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftCollateralVaultAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftInsuranceVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftInsuranceVaultAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftMarkets',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftDepositHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingPaymentHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemsProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'utpDriftObserve',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftMarkets',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'utpDriftUseOpenPosition',
      accounts: [
        {
          name: 'marginAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'driftAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftMarkets',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftTradeHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingPaymentHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingRateHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftOracle',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UtpDriftOpenPositionIxArgs',
          },
        },
      ],
    },
    {
      name: 'utpDriftUseClosePosition',
      accounts: [
        {
          name: 'marginAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'driftAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftUser',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'driftState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftMarkets',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftUserPositions',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftTradeHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingPaymentHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftFundingRateHistory',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'driftOracle',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UtpDriftClosePositionIxArgs',
          },
        },
      ],
    },
    {
      name: 'utpMangoActivate',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mangoAuthority',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'authoritySeed',
          type: 'publicKey',
        },
        {
          name: 'authorityBump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'utpMangoDeposit',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tempCollateralAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoCache',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoRootBank',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoNodeBank',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'utpMangoDepositCrank',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bankAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tempCollateralAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoCache',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoRootBank',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoNodeBank',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'utpMangoWithdraw',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'marginGroup',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'marginCollateralVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoCache',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoRootBank',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoNodeBank',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoVault',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoVaultAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'utpMangoObserve',
      accounts: [
        {
          name: 'marginAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoCache',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'utpMangoUsePlacePerpOrder',
      accounts: [
        {
          name: 'marginAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mangoAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoCache',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoPerpMarket',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoBids',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAsks',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoEventQueue',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'UtpMangoPlacePerpOrderArgs',
          },
        },
      ],
    },
    {
      name: 'utpMangoUseCancelPerpOrder',
      accounts: [
        {
          name: 'marginAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mangoAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoGroup',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mangoPerpMarket',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoBids',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mangoAsks',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'instructionsSysvar',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'orderId',
          type: 'i128',
        },
        {
          name: 'invalidIdOk',
          type: 'bool',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'marginAccount',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authority',
            type: 'publicKey',
          },
          {
            name: 'marginGroup',
            type: 'publicKey',
          },
          {
            name: 'depositRecord',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'borrowRecord',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'activeUtps',
            type: {
              array: ['bool', 32],
            },
          },
          {
            name: 'utpAccountConfig',
            type: {
              array: [
                {
                  defined: 'UTPAccountConfig',
                },
                32,
              ],
            },
          },
          {
            name: 'utpCache',
            type: {
              array: [
                {
                  defined: 'UTPObservationCache',
                },
                32,
              ],
            },
          },
          {
            name: 'reservedSpace',
            type: {
              array: ['u64', 32],
            },
          },
        ],
      },
    },
    {
      name: 'marginGroup',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'admin',
            type: 'publicKey',
          },
          {
            name: 'bank',
            type: {
              defined: 'Bank',
            },
          },
          {
            name: 'paused',
            type: 'bool',
          },
          {
            name: 'reservedSpace',
            type: {
              array: ['u64', 32],
            },
          },
        ],
      },
    },
    {
      name: 'state',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'totalCollateral',
            type: 'u128',
          },
          {
            name: 'freeCollateral',
            type: 'u128',
          },
          {
            name: 'marginRequirementInit',
            type: 'u128',
          },
          {
            name: 'marginRequirementMaint',
            type: 'u128',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'UtpDriftOpenPositionIxArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'direction',
            type: {
              defined: 'DriftPositionDirection',
            },
          },
          {
            name: 'quoteAssetAmount',
            type: 'u128',
          },
          {
            name: 'marketIndex',
            type: 'u64',
          },
          {
            name: 'limitPrice',
            type: 'u128',
          },
          {
            name: 'optionalAccounts',
            type: {
              defined: 'DriftManagePositionOptionalAccounts',
            },
          },
        ],
      },
    },
    {
      name: 'UtpDriftClosePositionIxArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'marketIndex',
            type: 'u64',
          },
          {
            name: 'optionalAccounts',
            type: {
              defined: 'DriftManagePositionOptionalAccounts',
            },
          },
        ],
      },
    },
    {
      name: 'UtpMangoPlacePerpOrderArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'side',
            type: {
              defined: 'MangoSide',
            },
          },
          {
            name: 'price',
            type: 'i64',
          },
          {
            name: 'maxBaseQuantity',
            type: 'i64',
          },
          {
            name: 'maxQuoteQuantity',
            type: 'i64',
          },
          {
            name: 'clientOrderId',
            type: 'u64',
          },
          {
            name: 'orderType',
            type: {
              defined: 'MangoOrderType',
            },
          },
          {
            name: 'reduceOnly',
            type: 'bool',
          },
          {
            name: 'expiryTimestamp',
            type: {
              option: 'u64',
            },
          },
          {
            name: 'limit',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'MDecimal',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'flags',
            type: 'u32',
          },
          {
            name: 'hi',
            type: 'u32',
          },
          {
            name: 'lo',
            type: 'u32',
          },
          {
            name: 'mid',
            type: 'u32',
          },
        ],
      },
    },
    {
      name: 'DriftManagePositionOptionalAccounts',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'discountToken',
            type: 'bool',
          },
          {
            name: 'referrer',
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'UTPAccountConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'address',
            type: 'publicKey',
          },
          {
            name: 'authoritySeed',
            type: 'publicKey',
          },
          {
            name: 'authorityBump',
            type: 'u8',
          },
          {
            name: 'utpAddressBook',
            type: {
              array: ['publicKey', 32],
            },
          },
        ],
      },
    },
    {
      name: 'UTPConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'utpProgramId',
            type: 'publicKey',
          },
          {
            name: 'marginRequirementDepositBuffer',
            type: {
              defined: 'MDecimal',
            },
          },
        ],
      },
    },
    {
      name: 'GroupConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'admin',
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'bank',
            type: {
              option: {
                defined: 'BankConfig',
              },
            },
          },
          {
            name: 'paused',
            type: {
              option: 'bool',
            },
          },
        ],
      },
    },
    {
      name: 'BankConfig',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'scalingFactorC',
            type: {
              option: 'u64',
            },
          },
          {
            name: 'fixedFee',
            type: {
              option: 'u64',
            },
          },
          {
            name: 'interestFee',
            type: {
              option: 'u64',
            },
          },
          {
            name: 'initMarginRatio',
            type: {
              option: 'u64',
            },
          },
          {
            name: 'maintMarginRatio',
            type: {
              option: 'u64',
            },
          },
          {
            name: 'accountDepositLimit',
            type: {
              option: 'u64',
            },
          },
        ],
      },
    },
    {
      name: 'Bank',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'scalingFactorC',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'fixedFee',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'interestFee',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'depositAccumulator',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'borrowAccumulator',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'lastUpdate',
            type: 'i64',
          },
          {
            name: 'nativeDepositBalance',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'nativeBorrowBalance',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'mint',
            type: 'publicKey',
          },
          {
            name: 'vault',
            type: 'publicKey',
          },
          {
            name: 'bankAuthorityBump',
            type: 'u8',
          },
          {
            name: 'insuranceVaultBalance',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'feeVaultBalance',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'initMarginRatio',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'maintMarginRatio',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'accountDepositLimit',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'reservedSpace',
            type: {
              array: ['u64', 32],
            },
          },
        ],
      },
    },
    {
      name: 'UTPObservationCache',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'totalCollateral',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'freeCollateral',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'marginRequirementInit',
            type: {
              defined: 'MDecimal',
            },
          },
          {
            name: 'marginRequirementMaint',
            type: {
              defined: 'MDecimal',
            },
          },
        ],
      },
    },
    {
      name: 'DriftPositionDirection',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Long',
          },
          {
            name: 'Short',
          },
        ],
      },
    },
    {
      name: 'MangoOrderType',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Limit',
          },
          {
            name: 'ImmediateOrCancel',
          },
          {
            name: 'PostOnly',
          },
          {
            name: 'Market',
          },
          {
            name: 'PostOnlySlide',
          },
        ],
      },
    },
    {
      name: 'MangoSide',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Bid',
          },
          {
            name: 'Ask',
          },
        ],
      },
    },
    {
      name: 'MarginRequirementType',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Init',
          },
          {
            name: 'Maint',
          },
        ],
      },
    },
    {
      name: 'LendingSide',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Borrow',
          },
          {
            name: 'Deposit',
          },
        ],
      },
    },
    {
      name: 'InstructionsLayout',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'ObserveBefore',
          },
          {
            name: 'ObserveAndCheckAfter',
          },
          {
            name: 'HalfSandwichObserveCheck',
            fields: [
              {
                defined: 'usize',
              },
            ],
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'EmptyLendingPool',
      msg: 'Lending pool empty',
    },
    {
      code: 6001,
      name: 'IllegalUtilizationRatio',
      msg: 'Illegal utilization ratio',
    },
    {
      code: 6002,
      name: 'MathError',
      msg: 'very bad mafs',
    },
    {
      code: 6003,
      name: 'InvalidTimestamp',
      msg: 'Invalid timestamp',
    },
    {
      code: 6004,
      name: 'InitMarginRequirementsNotMet',
      msg: 'Initialization margin requirements not met',
    },
    {
      code: 6005,
      name: 'UtpInactive',
      msg: 'Inactive UTP',
    },
    {
      code: 6006,
      name: 'UtpAlreadyActive',
      msg: 'Utp is already active',
    },
    {
      code: 6007,
      name: 'ISIInvalidProgramId',
      msg: 'ISI inspector: invalid program id',
    },
    {
      code: 6008,
      name: 'ISIInvalidSysvarId',
      msg: 'Tx inspector: invalid instructions sysvar',
    },
    {
      code: 6009,
      name: 'ISIInvalidIx',
      msg: 'Tx inspector: invalid instruction',
    },
    {
      code: 6010,
      name: 'ISIInvalidMarginAccount',
      msg: 'Tx inspector: invalid margin account',
    },
    {
      code: 6011,
      name: 'InvalidAccountData',
      msg: 'Invalid Account Data',
    },
    {
      code: 6012,
      name: 'LiquidatorHasActiveUtps',
      msg: 'Liquidator has active utps',
    },
    {
      code: 6013,
      name: 'AccountNotLiquidatable',
      msg: 'Margin account not liquidatable',
    },
    {
      code: 6014,
      name: 'AccountNotBankrupt',
      msg: 'Margin account not bankrupt',
    },
    {
      code: 6015,
      name: 'IllegalUtpDeactivation',
      msg: 'Utp account cannot be deactivated',
    },
    {
      code: 6016,
      name: 'DriftError',
      msg: 'Drift Error',
    },
    {
      code: 6017,
      name: 'IllegalRebalance',
      msg: 'Rebalance not legal',
    },
    {
      code: 6018,
      name: 'IllegalRebalanceAmount',
      msg: 'Illegal rebalance amount',
    },
    {
      code: 6019,
      name: 'BorrowNotAllowed',
      msg: 'Borrow not allowed',
    },
    {
      code: 6020,
      name: 'IllegalConfig',
      msg: 'Config value not legal',
    },
    {
      code: 6021,
      name: 'OperationsPaused',
      msg: 'Operations paused',
    },
    {
      code: 6022,
      name: 'InsufficientVaultBalance',
      msg: 'Insufficient balance',
    },
    {
      code: 6023,
      name: 'Forbidden',
      msg: 'This operation is forbidden',
    },
    {
      code: 6024,
      name: 'MangoError',
      msg: 'Mango error',
    },
    {
      code: 6025,
      name: 'InvalidUTPAccount',
      msg: 'Invalid account key',
    },
    {
      code: 6026,
      name: 'AccountDepositLimit',
      msg: 'Account has much deposits',
    },
  ],
};
