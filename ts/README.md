Dependency management:
* Install dependencies according to `package.json`s: `lerna bootstrap` <- Can (will) be run multiple times. No fear.
* Add a dependency to all packages: `lerna add @project-serum/anchor`
* Add a dev dependency to all packages: `lerna add @types/debug --dev`
* Add a dependency to a package/set of packages: `lerna add @project-serum/anchor packages/marginfi-client` | `lerna add @project-serum/anchor --scope @mrgnlabs/marginfi-*`
* `lerna add` is limited to a single dependency addition at a time. Instead, it is possible to add the dependency in the relevant `package.json`s and re-run `lerna bootstrap`

Running scripts:
* Build all packages: `lerna run build`
* Build a specific package: `lerna run build --scope @mrgnlabs/marginfi-client`
* Run a script on all packages: `lerna run <script name>`
* Ruin a script on a specific package: `lerna run <script name> --scope @mrgnlabs/marginfi-client`
