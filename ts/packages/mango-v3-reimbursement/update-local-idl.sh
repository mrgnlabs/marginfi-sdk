#!/usr/bin/env bash

set -e pipefail
cargo run --manifest-path ../mango-v4/anchor/cli/Cargo.toml -- build
./idl-fixup.sh
cp -v ./target/types/mango_v3_reimbursement.ts ./ts/client/src/mango_v3_reimbursement.ts
yarn tsc
