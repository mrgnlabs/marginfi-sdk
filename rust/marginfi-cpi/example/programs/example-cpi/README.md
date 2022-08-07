## ⚠ Warning

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Usage

1. Make sure the default `~/.config/solana/id.json` has enough devnet funds (~3 SOL for deployment only)
1. Build the program + generate a program keypair: `$ anchor build`
1. Display the corresponding program ID: `$ solana-keygen pubkey target/deploy/example_cpi-keypair.json`
1. Use that PID to update:
   - the `programs.devnet` entry in `Anchor.toml`, and
   - `declare_id` in `lib.rs`
1. Deploy the program to devnet: `$ anchor deploy` (automatically pointed towards mainnet through the `provider` entry in `Anchor.toml`)
1. Run the test suite: `$ anchor test --skip-deploy`
