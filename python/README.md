# Develop
## Initial setup
1. Spare yourself some pain and setup your default `python` command to point to 3.9+
2. Install [poetry](https://python-poetry.org/docs/#installation): `$ curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -`
3. Install [nox-poetry](https://github.com/cjolowicz/nox-poetry): `$ pip install nox-poetry`
4. Install project dependencies: `$ poetry install`

## Adding/modifying dependencies
`$ poetry add <package_name>`, or:
1. Make the necessary modifications in `pyproject.toml`
2. Run poetry update: `poetry lock`

## Running tests
1. Activate virtual environment: `$ poetry shell`
2. Run desired task:
   * all tests: `$ make test`
   * unit tests only: `$ make test-unit`
   * coverage: `$ make test-cov`
   * type check + lint: `$ make check`

Check the Makefile for other actions available.
