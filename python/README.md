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

### General Usage

```py
import marginpy
```

## 👷‍♀️ Development

### Setup local development environment

1. Spare yourself some pain and setup your default `python` command to point to 3.10+

1. Install [poetry](https://python-poetry.org/docs/#installation): `$ curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -`
1. Install [nox-poetry](https://github.com/cjolowicz/nox-poetry): `$ pip install nox-poetry`
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
   * unit tests only: `$ make test-unit`
   * type check + lint: `$ make lint`



Feel free to check the [Makefile](Makefile) for other available actions.
