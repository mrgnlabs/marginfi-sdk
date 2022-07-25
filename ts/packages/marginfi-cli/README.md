# Marginfi Cli

## Setup
```
yarn global add @mrgnlabs/marginfi-cli
```

## Usage
**IMPORTANT!**
The CLI is configured by ENV variables.
To use the CLI with you specific account do
```
export MARGINFI_ACCOUNT=<account-address>
```

To set your wallet path do
```
export WALLET=<wallet-path>
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
mfi account get
```

#### List
List marginfi accounts owned by the signer.
```
mfi account list
```

#### Deposit
Deposit collateral into the marginfi account
```
mfi account deposit <amount>
```

Example, deposit of $2
```
mfi account deposit 2
```

#### Withdraw
Withdraw collateral from marginfi account
```
mfi account withdraw <amount>
```

Example, withdraw $60
```
mfi account withdraw 60
```

### Mango Markets
Mango Markets Marginfi interface. CLI for now only supports activating and collateral management. Trading is supported through the SDK.

#### Activate
Create a new Mango account in your marginfi account.
```
mfi account mango activate
```

#### Deposit
Deposit collateral into the Mango Markets account form the Marginfi Account.
```
mfi account mango deposit <amount>
```

#### Withdraw
Withdraw collateral form the Mango Markets account to the Marginfi Account.
```
mfi account mango withdraw <amount>
```

### 01 Protocol

01 Protocol Marginfi interface. CLI for now only supports activating and collateral management. Trading is supported through the SDK.

#### Activate
Create a new 01 account in your marginfi account.
```
mfi account zo activate
```

#### Deposit
Deposit collateral into the 01 account form the Marginfi Account.
```
mfi account zo deposit <amount>
```

#### Withdraw
Withdraw collateral form the 01  account to the Marginfi Account.
```
mfi account zo withdraw <amount>
```



