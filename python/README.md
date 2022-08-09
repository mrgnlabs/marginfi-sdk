<div align="center">
  <img height="170" src="./docs/logo-python.png" />

  <h1>marginpy</h1>
  
   <!-- [![Actions Status](https://github.com/michaelhly/solanapy/workflows/CI/badge.svg)](https://github.com/michaelhly/solanapy/actions?query=workflow%3ACI) -->
   <!-- [![PyPI version](https://badge.fury.io/py/solana.svg)](https://badge.fury.io/py/solana) -->
   [![Codecov](https://codecov.io/gh/michaelhly/solana-py/branch/master/graph/badge.svg)](https://codecov.io/gh/michaelhly/solana-py/branch/master)
   <a href=""><img alt="License" src="https://img.shields.io/github/license/mrgnlabs/marginfi-sdk?style=flat-square&color=ffff00"/></a>
   [![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
</div>

**◼️ The marginfi Python SDK ◼️**

marginpy is the python library for interacting with [marginfi](marginfi.com), the decentralized portfolio margin protocol on Solana.

## 🏎 Quickstart

### Installation

```sh
pip install marginpy
```

### Running `marginpy` in a Github Codespace

`marginpy` is installed out-of-the-box in the [.devcontainer/Dockerfile](Python SDK Codespace).

Enable Github Codespaces for your Github user or organization account and spin up a machine for a no-hassle way to get started!

### Installing on an M1

If you are using an M1, you need to install `marginpy` through a Rosetta-enabled x86_64 version of python. If starting from scratch:

1. Install brew into `/usr/local/`

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Open a terminal instance with Rosetta enabled

3. Install python3.10 or greater with brew from `/usr/local/`:

```shell
$ /usr/local/bin/brew install python@3.10
```

4. Create a new virtualenv using newly installed python:

```shell
/usr/local/opt/python@3.10/bin/python3 -m venv .env
```

5. Activate new env

```shell
source .env/bin/activate
```

6. Install `marginpy` with pip from env:

```shell
pip install marginpy
```

### General Usage

```py
import marginpy
```

Check out the [examples](examples) for more details.

## 👷‍♀️ Development

### Setup local development environment

1. Spare yourself some pain and setup your default `python` command to point to 3.10+

1. Install [poetry](https://python-poetry.org/docs/#installation): `$ curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -`
1. Install [nox-poetry](https://github.com/cjolowicz/nox-poetry): `$ pip install nox-poetry`
1. Initialize Python 3.10 virtual environment: `$ poetry env use 3.10`
1. Install project dependencies: `$ poetry install`
1. Activate virtual environment: `$ poetry shell`
1. Build the rust crate and install it locally: `$ maturin develop`

### Running tests

As of writing, only a small subset of tests can be run by the user, due to initially private dependencies. They can be run like so:

1. Activate virtual environment:

```shell
$ poetry shell
```

2. Run desired task:
   - unit tests only: `$ make test-unit`
   - type check + lint: `$ make lint`

Feel free to check the [Makefile](Makefile) for other available actions.
