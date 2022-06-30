# Marginfi Cli

## Setup
```
yarn global add @mrgnlabs/marginfi-cli
```

## Usage
#### Flags
```
Options:
  -k, --keypair <KEYPAIR>          Path to keypair file (default: "~/.config/solana/id.json")
  -u, --url <URL>                  URL for Solana's JSON RPC (default: "https://marginfi.genesysgo.net/")
  -e, --environment <ENVIRONMENT>  Environment to use [mainnet-beta, devnet] (default: "mainnet-beta")
```

### Marginfi Account
Managing marginfi accounts

#### Create
Create a new marginfi account
```
mfi account create
```

#### Get
Get overview of a marginfi account
```
mfi account get <mfi_account_address>
```

#### List
List marginfi accounts owned by the signer.
```
mfi account list
```

#### Deposit
Deposit collateral into the marginfi account
```
mfi deposit <mfi_account_address> [amount]
```

Example, deposit of $2
```
mfi deposit HHS3XAt2UDSr2N6QWfEp5muML4VDggLwX5Tr8xqA6pf3 2
```

#### Withdraw
Withdraw collateral from marginfi account
```
mfi withdraw <mfi_account_address> [amount]
```

Example, withdraw $60
```
mfi withdraw HHS3XAt2UDSr2N6QWfEp5muML4VDggLwX5Tr8xqA6pf3 60
```

### Mango Markets
Mango Markets Marginfi interface. CLI for now only supports activating and collateral management. Trading is supported through the SDK.

#### Activate
Create a new Mango account in your marginfi account.
```
mfi account mango activate <mfi_account_address>
```

#### Deposit
Deposit collateral into the Mango Markets account form the Marginfi Account.
```
mfi account mango deposit <mfi_account_address> [amount]
```

#### Withdraw
Withdraw collateral form the Mango Markets account to the Marginfi Account.
```
mfi account mango withdraw <mfi_account_address> [amount]
```

### 01 Protocol

01 Protocol Marginfi interface. CLI for now only supports activating and collateral management. Trading is supported through the SDK.

#### Activate
Create a new 01 account in your marginfi account.
```
mfi account zo activate <mfi_account_address>
```

#### Deposit
Deposit collateral into the 01 account form the Marginfi Account.
```
mfi account zo deposit <mfi_account_address> [amount]
```

#### Withdraw
Withdraw collateral form the 01  account to the Marginfi Account.
```
mfi account zo withdraw <mfi_account_address> [amount]
```



