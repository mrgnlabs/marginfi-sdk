# Development bootstrap

1. Install top-level NPM dependencies (basically installs Lerna): `yarn`
1. Install and link dependencies according to the packages' `package.json`: `yarn bootstrap`
1. Build all packages: `yarn buidl` (* cough *)

# Release process

There is no concept of individual release. Need for release is determined by Lerna via tags created during previous releases.

1. Check changes since previous release: `yarn changed`
1. Bump versions (will create tags for each package with unreleased commits and push them)
    * according to the new commits (inferred from conventional commit spec): `yarn bump`
    * manually: `yarn bump-manual`
1. Publish all unreleased packages (using the git tags as reference): `yarn release`

# Other useful commands

## Dependency management

* Install dependencies according to `package.json`s: `lerna bootstrap` <- Can (will) be run multiple times. No fear.
* Add a dependency to all packages: `lerna add @project-serum/anchor`
* Add a dev dependency to all packages: `lerna add @types/debug --dev`
* Add a dependency to a package/set of packages: `lerna add @project-serum/anchor packages/marginfi-client` | `lerna add @project-serum/anchor --scope @mrgnlabs/marginfi-*`
* `lerna add` is limited to a single dependency addition at a time. Instead, it is possible to add the dependency in the relevant `package.json`s and re-run `lerna bootstrap`

## Running scripts

* Build all packages: `lerna run build`
* Build a specific package: `lerna run build --scope @mrgnlabs/marginfi-client`
* Run a script on all packages: `lerna run <script name>`
* Ruin a script on a specific package: `lerna run <script name> --scope @mrgnlabs/marginfi-client`
