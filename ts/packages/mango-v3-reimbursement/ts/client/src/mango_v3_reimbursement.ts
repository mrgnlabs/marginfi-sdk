export type MangoV3Reimbursement = {
  "version": "0.1.0",
  "name": "mango_v3_reimbursement",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Group"
              },
              {
                "kind": "arg",
                "type": "u32",
                "path": "group_num"
              }
            ]
          }
        },
        {
          "name": "table",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "groupNum",
          "type": "u32"
        },
        {
          "name": "claimTransferDestination",
          "type": "publicKey"
        },
        {
          "name": "testing",
          "type": "u8"
        }
      ]
    },
    {
      "name": "editGroup",
      "accounts": [
        {
          "name": "group",
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
          "name": "table",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeGroupAuthority",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "table",
          "isMut": false,
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
          "name": "newAuthority",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createVault",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimTransferTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimTransferDestination",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "claimMint",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "group"
              },
              {
                "kind": "arg",
                "type": "u64",
                "path": "token_index"
              }
            ]
          }
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
          "name": "tokenIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawToAuthority",
      "accounts": [
        {
          "name": "group",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorityTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createReimbursementAccount",
      "accounts": [
        {
          "name": "group",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reimbursementAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "ReimbursementAccount"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "group"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "mango_account_owner"
              }
            ]
          }
        },
        {
          "name": "mangoAccountOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startReimbursement",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "reimburse",
      "accounts": [
        {
          "name": "group",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reimbursementAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "ReimbursementAccount"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "group"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "mango_account_owner"
              }
            ]
          }
        },
        {
          "name": "mangoAccountOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "claimMintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "table",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenIndex",
          "type": "u64"
        },
        {
          "name": "indexIntoTable",
          "type": "u64"
        },
        {
          "name": "transferClaim",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "group",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupNum",
            "type": "u32"
          },
          {
            "name": "table",
            "type": "publicKey"
          },
          {
            "name": "claimTransferDestination",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "vaults",
            "type": {
              "array": [
                "publicKey",
                16
              ]
            }
          },
          {
            "name": "claimMints",
            "type": {
              "array": [
                "publicKey",
                16
              ]
            }
          },
          {
            "name": "mints",
            "type": {
              "array": [
                "publicKey",
                16
              ]
            }
          },
          {
            "name": "reimbursementStarted",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "testing",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          }
        ]
      }
    },
    {
      "name": "reimbursementAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reimbursed",
            "type": "u16"
          },
          {
            "name": "claimTransferred",
            "type": "u16"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Row",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "balances",
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SomeError"
    },
    {
      "code": 6001,
      "name": "ReimbursementAlreadyStarted"
    },
    {
      "code": 6002,
      "name": "ReimbursementNotStarted"
    },
    {
      "code": 6003,
      "name": "TokenAccountNotOwnedByMangoAccountOwner"
    },
    {
      "code": 6004,
      "name": "AlreadyReimbursed"
    },
    {
      "code": 6005,
      "name": "BadSigner"
    },
    {
      "code": 6006,
      "name": "TestingOnly"
    },
    {
      "code": 6007,
      "name": "TableRowHasWrongOwner"
    }
  ]
};

export const IDL: MangoV3Reimbursement = {
  "version": "0.1.0",
  "name": "mango_v3_reimbursement",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Group"
              },
              {
                "kind": "arg",
                "type": "u32",
                "path": "group_num"
              }
            ]
          }
        },
        {
          "name": "table",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "groupNum",
          "type": "u32"
        },
        {
          "name": "claimTransferDestination",
          "type": "publicKey"
        },
        {
          "name": "testing",
          "type": "u8"
        }
      ]
    },
    {
      "name": "editGroup",
      "accounts": [
        {
          "name": "group",
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
          "name": "table",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "changeGroupAuthority",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "table",
          "isMut": false,
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
          "name": "newAuthority",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createVault",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimTransferTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimTransferDestination",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "claimMint",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Mint"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "group"
              },
              {
                "kind": "arg",
                "type": "u64",
                "path": "token_index"
              }
            ]
          }
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
          "name": "tokenIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawToAuthority",
      "accounts": [
        {
          "name": "group",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorityTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createReimbursementAccount",
      "accounts": [
        {
          "name": "group",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reimbursementAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "ReimbursementAccount"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "group"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "mango_account_owner"
              }
            ]
          }
        },
        {
          "name": "mangoAccountOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startReimbursement",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "reimburse",
      "accounts": [
        {
          "name": "group",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reimbursementAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "ReimbursementAccount"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "group"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "mango_account_owner"
              }
            ]
          }
        },
        {
          "name": "mangoAccountOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "claimMintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "table",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenIndex",
          "type": "u64"
        },
        {
          "name": "indexIntoTable",
          "type": "u64"
        },
        {
          "name": "transferClaim",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "group",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupNum",
            "type": "u32"
          },
          {
            "name": "table",
            "type": "publicKey"
          },
          {
            "name": "claimTransferDestination",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "vaults",
            "type": {
              "array": [
                "publicKey",
                16
              ]
            }
          },
          {
            "name": "claimMints",
            "type": {
              "array": [
                "publicKey",
                16
              ]
            }
          },
          {
            "name": "mints",
            "type": {
              "array": [
                "publicKey",
                16
              ]
            }
          },
          {
            "name": "reimbursementStarted",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "testing",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          }
        ]
      }
    },
    {
      "name": "reimbursementAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reimbursed",
            "type": "u16"
          },
          {
            "name": "claimTransferred",
            "type": "u16"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Row",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "balances",
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SomeError"
    },
    {
      "code": 6001,
      "name": "ReimbursementAlreadyStarted"
    },
    {
      "code": 6002,
      "name": "ReimbursementNotStarted"
    },
    {
      "code": 6003,
      "name": "TokenAccountNotOwnedByMangoAccountOwner"
    },
    {
      "code": 6004,
      "name": "AlreadyReimbursed"
    },
    {
      "code": 6005,
      "name": "BadSigner"
    },
    {
      "code": 6006,
      "name": "TestingOnly"
    },
    {
      "code": 6007,
      "name": "TableRowHasWrongOwner"
    }
  ]
};
