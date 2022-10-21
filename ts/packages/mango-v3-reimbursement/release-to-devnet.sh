#!/usr/bin/env bash

set -ex pipefail

WALLET_WITH_FUNDS=~/.config/solana/mango-devnet.json
PROGRAM_ID=m3roABq4Ta3sGyFRLdY4LH1KN16zBtg586gJ3UxoBzb
anchor build
./idl-fixup.sh
cp -v ./target/types/mango_v3_reimbursement.ts ./ts/client/src/mango_v3_reimbursement.ts
yarn tsc
solana --url https://mango.devnet.rpcpool.com program deploy --program-id $PROGRAM_ID -k $WALLET_WITH_FUNDS target/deploy/mango_v3_reimbursement.so --skip-fee-check
anchor idl upgrade --provider.cluster https://mango.devnet.rpcpool.com --provider.wallet $WALLET_WITH_FUNDS --filepath target/idl/mango_v3_reimbursement.json $PROGRAM_ID
