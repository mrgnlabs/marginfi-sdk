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

### Initial setup

1. Spare yourself some pain and setup your default `python` command to point to 3.10+

2. Install [poetry](https://python-poetry.org/docs/#installation):

```shell
$ curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -
```
3. Install [nox-poetry](https://github.com/cjolowicz/nox-poetry):
```shell
$ pip install nox-poetry
```
4. Install project dependencies:

```shell
$ poetry install
```

### Adding/modifying dependencies

Run
```
$ poetry add <package_name>
```

or:

1. Make the necessary modifications in `pyproject.toml`
2. Run poetry update:
```shell
$ poetry lock
```

### Running tests

1. Activate virtual environment:
```shell
$ poetry shell
```

2. Run desired task:
   * all tests: `$ make test`
   * unit tests only: `$ make test-unit`
   * coverage: `$ make test-cov`
   * type check + lint: `$ make check`

Check the [Makefile](Makefile) for other actions available.
