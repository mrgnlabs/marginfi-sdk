# Usage

1. Make sure the default `~/.config/solana/id.json` has enough devnet funds (~3 SOL for deployment only)
1. Build the program + generate a program keypair: `$ anchor build`
1. Display the corresponding program ID: `$ solana-keygen pubkey target/deploy/example_cpi-keypair.json`
1. Use that PID to update:
   - the `programs.devnet` entry in `Anchor.toml`, and
   - `declare_id` in `lib.rs`
1. Deploy the program to devnet: `$ anchor deploy` (automatically pointed towards mainnet through the `provider` entry in `Anchor.toml`)
1. Run the test suite: `$ anchor test --skip-deploy`
